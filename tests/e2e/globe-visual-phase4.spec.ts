import { expect, test, type Page } from "playwright/test";
import { collectPageErrors, enterEarthExplorer } from "./earth-fixture";

test("Archive Orbital Globe is the only production Earth surface", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await enterEarthExplorer(page);

  await expect(page.getByRole("heading", { name: /Ludic Atlas.*地球探索/ })).toBeVisible();
  await expect(page.getByText("ARCHIVE ORBITAL GLOBE")).toBeVisible();
  await expect(page.getByRole("button", { name: "进入游戏编年馆" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "投影模式" })).toHaveCount(0);
  await expect(page.locator("[data-earth-renderer='atlas-placeholder']")).toHaveCount(0);
  await expect(page.locator("[data-earth-renderer='globe'] canvas")).toHaveCount(1);

  const tokens = await page.locator(".game-earth-shell").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      agedGold: style.getPropertyValue("--earth-aged-gold").trim(),
      charcoal: style.getPropertyValue("--earth-charcoal").trim(),
      inkGreen: style.getPropertyValue("--earth-ink-green").trim(),
      oxblood: style.getPropertyValue("--earth-oxblood").trim(),
      spatial: style.getPropertyValue("--earth-spatial-feedback").trim(),
      warmWhite: style.getPropertyValue("--earth-warm-white").trim()
    };
  });
  expect(tokens).toEqual({
    agedGold: "#c3a46a",
    charcoal: "#0b0d0c",
    inkGreen: "#101b17",
    oxblood: "#6f2928",
    spatial: "#6d9a92",
    warmWhite: "#eee7d8"
  });
  expect(errors).toEqual([]);
});

test("filters form one accessible tray and preserve country selection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: /查看国家：法国 France/ }).first().click();
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "FR");

  await page.locator(".atlas-filter-tray-summary").click();
  const controls = page.getByRole("region", { name: "地球探索筛选与视图控制" });
  await expect(controls).toBeVisible();
  await expect(page.getByRole("slider", { name: "最低评分" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "最高评分" })).toBeVisible();
  await page.getByRole("slider", { name: "最低评分" }).fill("6");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-rating-range", "6:10");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "FR");
  await expect(page.getByRole("button", { name: /显示游戏 marker/ })).toHaveAttribute("aria-pressed", "false");
});

test("France and Poland details follow only the latest selection revision", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  const shell = page.locator(".game-earth-shell");
  const panel = page.locator(".right-panel-shell");

  await page.getByRole("button", { name: /查看国家：法国 France/ }).first().click();
  const franceRevision = Number(await shell.getAttribute("data-earth-selection-revision"));
  await expect(panel).toContainText("法国 France");
  await expect(panel).toContainText(/显示 \d+\/35 款/);

  await page.getByRole("button", { name: "重置为全球视角" }).click();
  await page.getByRole("button", { name: /查看国家：波兰 Poland/ }).first().click();
  const polandRevision = Number(await shell.getAttribute("data-earth-selection-revision"));
  expect(polandRevision).toBeGreaterThan(franceRevision);
  await expect(shell).toHaveAttribute("data-earth-country", "PL");
  await expect(panel).toHaveAttribute("data-selection-revision", String(polandRevision));
  await expect(panel).toContainText("波兰 Poland");
  await expect(panel).not.toContainText("法国 France");
});

test("Escape closes game detail first and then the country panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: /查看国家：法国 France/ }).first().click();
  await page.getByRole("button", { name: /^选择游戏：/ }).first().click();
  const dialog = page.getByRole("dialog", { name: /游戏详情/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /关闭.*游戏简介/ })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".right-panel-shell")).toHaveClass(/is-desktop-open/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".right-panel-shell")).not.toHaveClass(/is-desktop-open/);
});

test("country directory exposes keyboard focus and a stable empty state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: "打开或收起国家目录" }).click();
  const search = page.getByRole("searchbox", { name: "搜索国家" });
  await search.focus();
  await expect(search).toBeFocused();
  const focusStyle = await search.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).not.toBe("0px");
  await search.fill("__no_country_matches__");
  await expect(page.getByText("未找到匹配国家")).toBeVisible();
});

test("cover failures retain stable marker and panel geometry", async ({ page }) => {
  await page.route("**/covers/**", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: /查看国家：法国 France/ }).first().click();
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });

  const marker = page.locator(".globe-game-marker.is-cover").first();
  await expect(marker).toBeVisible();
  const markerBox = await marker.boundingBox();
  expect(markerBox?.width).toBeGreaterThan(30);
  expect(markerBox?.height).toBeGreaterThan(40);

  const panelCover = page.locator(".country-game-cover").first();
  await expect(panelCover).toBeVisible();
  const panelBox = await panelCover.boundingBox();
  expect(panelBox?.width).toBeGreaterThan(50);
  expect(panelBox?.height).toBeGreaterThan(70);
});

test("reduced motion keeps navigation immediate and essential state visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: /查看国家：波兰 Poland/ }).first().click();
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false");
  const animationName = await page.locator(".earth-shell-content").evaluate(
    (element) => getComputedStyle(element).animationName
  );
  expect(animationName).toBe("none");
});

test("header Chronicle action preserves the local pathname and releases the Globe", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  const pathname = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "进入游戏编年馆" }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='archive']")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe(pathname);
});

async function readSafeFocus(page: Page) {
  const stage = page.locator(".real-globe-stage");
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  return {
    focusX: Number(await stage.getAttribute("data-country-focus-x")),
    safeLeft: Number(await stage.getAttribute("data-safe-viewport-left")),
    safeRight: Number(await stage.getAttribute("data-safe-viewport-right"))
  };
}

test("redesigned instruments preserve the selected focus inside safe space", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await enterEarthExplorer(page);
  for (const label of ["法国 France", "波兰 Poland", "比利时 Belgium"]) {
    await page.getByRole("button", { name: new RegExp(`查看国家：${label}`) }).first().click();
    const focus = await readSafeFocus(page);
    expect(focus.focusX).toBeGreaterThan(focus.safeLeft + 24);
    expect(focus.focusX).toBeLessThan(focus.safeRight - 24);
    await page.getByRole("button", { name: "重置为全球视角" }).click();
  }
});
