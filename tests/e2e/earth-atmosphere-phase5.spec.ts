import { expect, test } from "playwright/test";
import { enterEarthExplorer } from "./earth-fixture";

const ATMOSPHERE_SELECTOR = "[data-earth-atmosphere='archive-material']";

test("Earth atmosphere is scoped and selects the responsive source", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 1280 });
  await page.goto("/");
  await expect(page.locator(ATMOSPHERE_SELECTOR)).toHaveCount(0);

  await enterEarthExplorer(page);
  const atmosphere = page.locator(ATMOSPHERE_SELECTOR);
  const image = atmosphere.locator("img");

  await expect(atmosphere).toHaveAttribute("aria-hidden", "true");
  await expect(image).toHaveAttribute("alt", "");
  await expect(image).toHaveAttribute("width", "1672");
  await expect(image).toHaveAttribute("height", "941");
  await expect(atmosphere).toHaveCSS("position", "absolute");
  await expect(atmosphere).toHaveCSS("opacity", "1");
  await expect(image).toHaveCSS("object-position", "48% 50%");
  await expect(image).toHaveCSS("opacity", "0.64");
  await expect(image).toHaveCSS("filter", "saturate(0.9) brightness(0.96) contrast(1.08)");
  await expect(image).toHaveCSS("mask-image", /radial-gradient/);
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(1280);
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain(
    "/images/earth/earth-atmosphere-archive-1280.webp"
  );

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(ATMOSPHERE_SELECTOR)).toHaveCount(0);
});

test("wide Earth view loads the approved full atmosphere asset", async ({ page }) => {
  await page.setViewportSize({ height: 1080, width: 1920 });
  await enterEarthExplorer(page);

  const image = page.locator(`${ATMOSPHERE_SELECTOR} img`);
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(1672);
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain(
    "/images/earth/earth-atmosphere-archive-1672.webp"
  );
  await expect(page.locator("[data-earth-renderer='globe'] canvas")).toHaveCount(1);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(overflow.scrollWidth).toBe(overflow.clientWidth);
});

test("blocked atmosphere requests retain the CSS composition and Globe interaction", async ({ page }) => {
  await page.route("**/images/earth/**", (route) => route.abort());
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);

  const atmosphere = page.locator(ATMOSPHERE_SELECTOR);
  const image = atmosphere.locator("img");
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete)).toBe(true);
  expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(0);
  await expect(image).toBeHidden();

  const fallback = await atmosphere.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(fallback).toContain("radial-gradient");

  const stage = page.locator(".real-globe-stage");
  const before = await stage.boundingBox();
  await page.getByRole("button", { name: "放大地球镜头" }).click();
  await expect(page.locator("[data-earth-renderer='globe'] canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "返回游戏星图" })).toBeVisible();
  await expect(page.getByRole("button", { name: "打开或收起国家目录" })).toBeVisible();
  const after = await stage.boundingBox();

  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
});
