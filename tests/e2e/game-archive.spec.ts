import { expect, test, type Page } from "playwright/test";
import { enterEarthExplorer } from "./earth-fixture";

async function openArchive(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /进入游戏编年馆|Game Chronicle/i }).click();
  await expect(page.locator("[data-testid='archive-reading-room']")).toBeVisible();
}

test("archive entry, return, and UNKNOWN dossier stay on the local pathname", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await openArchive(page);
  const pathname = new URL(page.url()).pathname;
  await page.getByRole("searchbox", { name: "搜索游戏、开发者或发行商" }).fill("Prune");
  await page
    .locator("[data-archive-region='collection']")
    .getByRole("button", { name: "打开 Prune 详情" })
    .click();

  const dialog = page.getByRole("dialog", { name: "游戏档案" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-game-id='prune']")).toBeVisible();
  await expect(dialog).toContainText("地区待归档");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-main-view", "hub");
  expect(new URL(page.url()).pathname).toBe(pathname);
  expect(errors).toEqual([]);
});

test("archive browsing does not replace Earth country or camera context", async ({ page }) => {
  await enterEarthExplorer(page);
  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect(page.locator(".earth-current-context")).toContainText("日本 Japan");
  const before = await page.locator(".earth-current-context").textContent();

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await page.getByRole("button", { name: /进入游戏编年馆|Game Chronicle/i }).click();
  await page.getByRole("searchbox", { name: "搜索游戏、开发者或发行商" }).fill("Prune");
  await page
    .locator("[data-archive-region='collection']")
    .getByRole("button", { name: "打开 Prune 详情" })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();

  await expect(page.locator(".earth-current-context")).toHaveText(before ?? "");
  await expect(page.locator(".focus-preset-group button").filter({ hasText: /^Japan$/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("year index supports roving focus, boundaries, activation, and current state", async ({ page }) => {
  await openArchive(page);
  const yearNavigation = page.getByRole("navigation", { name: "年份索引" });
  const current = yearNavigation.locator("button[aria-current='true']");
  await expect(current).toHaveCount(1);

  await current.focus();
  await current.press("End");
  const focusedAtEnd = page.locator(":focus");
  await expect(focusedAtEnd).not.toHaveAttribute("aria-current", "true");
  await focusedAtEnd.press("Enter");
  await expect(focusedAtEnd).toHaveAttribute("aria-current", "true");

  await focusedAtEnd.press("Home");
  await page.locator(":focus").press("Space");
  await expect(yearNavigation.locator("button[aria-current='true']")).toHaveCount(1);
});

test("search, filter, rating priority, clear, and empty state remain operable", async ({ page }) => {
  await openArchive(page);
  const search = page.getByRole("searchbox", { name: "搜索游戏、开发者或发行商" });
  await page.getByLabel("排序").selectOption("rating-desc");
  await expect(page.getByLabel("排序")).toHaveValue("rating-desc");

  await page.getByRole("button", { name: "类型与平台" }).click();
  await expect(page.locator("#archive-filter-panel")).toBeVisible();
  const firstGenre = page.locator("#archive-filter-panel fieldset").first().getByRole("button").first();
  await firstGenre.click();
  await expect(firstGenre).toHaveAttribute("aria-pressed", "true");

  await search.fill("no-game-has-this-title-archive-e2e");
  await expect(page.getByText("没有符合当前条件的馆藏。")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).last().click();
  await expect(page.getByRole("heading", { name: "年度馆藏" })).toBeVisible();
});

test("dossier traps focus, closes with Escape, and restores the game trigger", async ({ page }) => {
  await openArchive(page);
  const trigger = page
    .locator("[data-archive-region='collection']")
    .getByRole("button", { name: /^打开 .+ 详情$/ })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "游戏档案" });
  const close = dialog.getByRole("button", { name: "关闭游戏档案" });
  await expect(close).toBeFocused();

  const firstGameId = await dialog.locator("[data-game-id]").getAttribute("data-game-id");
  const next = dialog.getByRole("button", { name: "下一份" });
  await next.click();
  await expect(next).toBeFocused();
  await expect(dialog.locator("[data-game-id]")).not.toHaveAttribute("data-game-id", firstGameId ?? "");

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "上一份" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("image failure keeps geometry and reduced motion disables drawer animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openArchive(page);
  const hero = page.getByTestId("archive-hero-visual");
  await hero.getByRole("img", { name: "复古游戏文化档案阅览桌" }).evaluate((image) => {
    image.removeAttribute("srcset");
    image.setAttribute("src", "/images/archive/missing-e2e.webp");
  });
  await expect(hero).toHaveAttribute("data-image-state", "error");

  await page.getByRole("button", { name: /^打开 .+ 详情$/ }).first().click();
  const drawerDuration = await page.locator("[data-archive-region='dossier']").evaluate(
    (element) => getComputedStyle(element).animationDuration
  );
  expect(Number.parseFloat(drawerDuration)).toBeLessThanOrEqual(0.001);
});

test("390x844 uses a sticky year rail and has no document horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await openArchive(page);

  const metrics = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>("[data-archive-region='timeline']")!;
    const collection = document.querySelector<HTMLElement>("[data-archive-region='collection']")!;
    return {
      clientWidth: document.documentElement.clientWidth,
      collectionWidth: collection.getBoundingClientRect().width,
      railPosition: getComputedStyle(rail).position,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.collectionWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.viewportHeight);
  expect(metrics.railPosition).toBe("sticky");

  await page
    .getByRole("navigation", { name: "年份索引" })
    .getByRole("button", { name: /2016 101/ })
    .click();
  const mobileCollectionCovers = page.locator(
    "[data-archive-region='collection'] [data-archive-cover-id]"
  );
  await expect(mobileCollectionCovers).toHaveCount(8);
  await page.locator("[data-archive-region='collection']").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(mobileCollectionCovers).toHaveCount(16);

  await page.getByRole("button", { name: /^打开 .+ 详情$/ }).first().click();
  const drawer = page.locator("[data-archive-region='dossier']");
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("width", "390px");
});

test("annual visuals differ and the collection mounts bounded cover batches", async ({ page }) => {
  await openArchive(page);
  const yearNavigation = page.getByRole("navigation", { name: "年份索引" });
  const visual = page.getByTestId("archive-hero-visual");
  const firstSignature = await visual.getAttribute("data-cover-signature");

  await yearNavigation.getByRole("button", { name: /2016 101/ }).click();
  await expect(visual).not.toHaveAttribute("data-cover-signature", firstSignature ?? "");

  const collection = page.locator("[data-archive-region='collection']");
  const initialCovers = collection.locator("[data-archive-cover-id]");
  await expect(initialCovers).toHaveCount(8);
  await expect(collection.getByRole("button", { name: /继续载入馆藏/ })).toBeVisible();
  await collection.getByRole("button", { name: /继续载入馆藏/ }).click();
  await expect(initialCovers).toHaveCount(16);

  await yearNavigation.getByRole("button", { name: /2017 100/ }).click();
  await expect(collection.locator("[data-archive-cover-id]")).toHaveCount(8);
});

test("ArchiveCover exposes skeleton geometry and a branded failure state", async ({ page }) => {
  await page.route("**/_next/image?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 180));
    await route.continue();
  });
  await openArchive(page);

  const firstCover = page.locator("[data-archive-region='collection'] [data-archive-cover-id]").first();
  await expect(firstCover).toHaveCSS("aspect-ratio", "2 / 3");
  const image = firstCover.locator("img");
  await image.evaluate((element) => {
    element.removeAttribute("srcset");
    element.setAttribute("src", "/images/archive/missing-cover-e2e.webp");
  });
  await expect(firstCover).toHaveAttribute("data-image-state", "error");
  await expect(firstCover.getByText("封面待归档")).toBeVisible();
});
