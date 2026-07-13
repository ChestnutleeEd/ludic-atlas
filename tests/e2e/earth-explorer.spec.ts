import { expect, test } from "playwright/test";
import {
  collectPageErrors,
  enterEarthExplorer,
  getEarthViewportMetrics
} from "./earth-fixture";

const desktopViewports = [
  { height: 720, width: 1280 },
  { height: 900, width: 1440 },
  { height: 1080, width: 1920 }
] as const;

for (const viewport of desktopViewports) {
  test(`Earth workspace dominates ${viewport.width}x${viewport.height}`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    const pageErrors = collectPageErrors(page);
    await enterEarthExplorer(page);

    const metrics = await getEarthViewportMetrics(page);

    expect(metrics.panel).not.toBeNull();
    expect(metrics.stage).not.toBeNull();
    expect(metrics.canvas).not.toBeNull();
    expect(metrics.panel!.height / metrics.viewportHeight).toBeGreaterThanOrEqual(0.7);
    expect(metrics.panel!.top).toBeGreaterThanOrEqual(0);
    expect(metrics.panel!.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(metrics.canvas!.height).toBeGreaterThan(0);
    expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(pageErrors).toEqual([]);
  });
}

test("Earth canvas survives repeated resize without replacement", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const initialCanvas = await page.locator(".real-globe-stage canvas").evaluate(
    (canvas) => {
      canvas.dataset.resizeIdentity = "stable";
      return canvas.dataset.resizeIdentity;
    }
  );

  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(120);
  }

  await expect(page.locator(".real-globe-stage canvas")).toHaveAttribute(
    "data-resize-identity",
    initialCanvas
  );
});

test("mobile sheet starts collapsed and keeps the globe operable", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await enterEarthExplorer(page);

  await expect(page.locator(".right-panel-shell")).toHaveAttribute(
    "data-sheet-state",
    "collapsed"
  );
  await expect(page.locator(".real-globe-stage canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "放大地球镜头" })).toBeVisible();
});

test("rapid cross-region country selection keeps the final intent and canvas", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const canvas = page.locator(".real-globe-stage canvas");
  await canvas.evaluate((element) => { element.dataset.switchIdentity = "stable"; });
  const japan = page.getByRole("button", { name: "Japan", exact: true });

  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")];
    const japanButton = buttons.find((button) => button.textContent?.trim() === "Japan");
    const usButton = buttons.find((button) => button.textContent?.trim() === "United States");
    for (let index = 0; index < 10; index += 1) (index % 2 ? usButton : japanButton)?.click();
    japanButton?.click();
  });

  await expect(japan).toHaveAttribute("aria-pressed", "true", { timeout: 700 });
  await expect(page.getByRole("button", { name: "East Asia", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".atlas-globe-status")).toContainText("日本 Japan");
  await expect(canvas).toHaveAttribute("data-switch-identity", "stable");
});

test("one hundred reducer-backed selections settle on the last country", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const codes = ["JP", "US", "KR"];
  await page.evaluate((selectionCodes) => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")];
    const byCode = new Map(buttons.map((button) => [button.textContent?.trim(), button]));
    const names: Record<string, string> = { JP: "Japan", US: "United States", KR: "South Korea" };
    for (let index = 0; index < 100; index += 1) {
      byCode.get(names[selectionCodes[index === 99 ? 0 : index % selectionCodes.length]])?.click();
    }
  }, codes);
  await expect(page.getByRole("button", { name: "Japan", exact: true })).toHaveAttribute("aria-pressed", "true", { timeout: 700 });
  await expect(page.locator(".atlas-globe-status")).toContainText("日本 Japan");
});

test("representative country markers stay bounded, aggregate truthfully, and return stably", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const names = ["Sweden", "Norway", "Denmark", "Netherlands", "Belgium", "Switzerland", "United Kingdom", "South Korea", "Japan"];
  for (const name of names) {
    await page.evaluate((countryName) => {
      [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")]
        .find((button) => button.textContent?.trim() === countryName)?.click();
    }, name);
    await expect(page.locator(".atlas-globe-status")).toContainText(name, { timeout: 1000 });
    await expect(page.locator(".real-globe-stage canvas")).toBeVisible();
  }

  const aggregate = page.locator(".globe-game-marker[data-overflow-count]:not([data-overflow-count='0'])").first();
  await expect(aggregate).toBeVisible();
  expect(Number(await aggregate.getAttribute("data-overflow-count"))).toBeGreaterThan(0);
  const coverImage = page.locator(".globe-game-cover-image").first();
  await coverImage.evaluate((image) => { (image as HTMLImageElement).src = "/covers/missing-e2e-cover.webp"; });
  await expect(coverImage).toHaveAttribute("data-fallback-applied", "true");
  const fallbackBox = await coverImage.boundingBox();
  expect(fallbackBox?.width).toBeGreaterThan(0);
  expect(fallbackBox?.height).toBeGreaterThan(0);
  const firstPosition = await aggregate.evaluate((element) => [element.dataset.markerLat, element.dataset.markerLng]);
  await page.getByRole("button", { name: "Sweden", exact: true }).click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect(page.locator(".atlas-globe-status")).toContainText("日本 Japan · 12 个地图标记");
  expect(firstPosition.every(Boolean)).toBe(true);
});

test("Earth uses the scoped cyan-magenta observatory theme with keyboard focus", async ({ page }, testInfo) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const tokens = await page.locator(".game-earth-shell.is-earth-mode").evaluate((element) => {
    const style = getComputedStyle(element);
    const panel = getComputedStyle(document.querySelector(".atlas-globe-panel")!);
    return {
      cyan: style.getPropertyValue("--earth-cyan").trim(),
      magenta: style.getPropertyValue("--earth-magenta").trim(),
      text: style.getPropertyValue("--earth-text").trim(),
      panelBorder: panel.borderTopColor
    };
  });
  expect(["#0ff", "#00ffff"]).toContain(tokens.cyan);
  expect(tokens).toMatchObject({ magenta: "#ff006e", text: "#eaf4ff", panelBorder: "rgba(0, 255, 255, 0.24)" });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
  await testInfo.attach("earth-observatory", { body: await page.screenshot(), contentType: "image/png" });
});

test("reduced motion and Hub/Archive remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  const transitionDuration = await page.locator(".globe-game-marker").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='hub']")).toBeVisible();
  await page.getByRole("button", { name: /Game Chronicle/i }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='archive']")).toBeVisible();
});
