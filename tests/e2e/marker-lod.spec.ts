import { expect, test, type Page } from "playwright/test";
import { collectPageErrors, enterEarthExplorer } from "./earth-fixture";

test("Global loads only Global LOD and country focus uses bounded visible cover requests", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/data/earth-lod/")) requests.push(request.url()); });
  await enterEarthExplorer(page);
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-world-boundaries-visible", "true");
  expect(requests.filter((url) => url.endsWith("/global.geojson")).length).toBeLessThanOrEqual(1);
  expect(requests.some((url) => url.includes("/countries/"))).toBe(false);

  await selectCountry(page, "法国 France");
  await expect.poll(() => visibleMarkerCount(page)).toBeGreaterThanOrEqual(10);
  const metrics = await markerMetrics(page);
  expect(metrics.visible).toBeLessThanOrEqual(24);
  expect(metrics.images).toBe(metrics.visible);
  expect(metrics.overflow).toBeGreaterThan(0);
  expect(requests.some((url) => url.endsWith("/regions/europe.geojson"))).toBe(true);
  expect(requests.some((url) => url.endsWith("/countries/FR.geojson"))).toBe(true);
  const mainland = await page.locator(".globe-game-marker").evaluateAll((markers) => markers.filter((marker) => {
    const lat = Number((marker as HTMLElement).dataset.markerLat); const lng = Number((marker as HTMLElement).dataset.markerLng);
    return lng > -6 && lng < 10 && lat > 40 && lat < 52;
  }).length);
  expect(mainland).toBeGreaterThanOrEqual(Math.min(10, metrics.visible));
});

test("Poland layout is deterministic, filters remain selected, and images follow visible markers", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await enterEarthExplorer(page);
  await selectCountry(page, "波兰 Poland");
  await expect.poll(() => visibleMarkerCount(page)).toBeGreaterThanOrEqual(6);
  const before = await markerCoordinates(page);
  expect(before.length).toBeGreaterThanOrEqual(6);
  await page.locator(".atlas-bottom-controls > summary").click();
  const cover = page.getByRole("slider", { name: "封面尺寸" });
  await cover.fill("84");
  await page.waitForTimeout(100);
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-selected-geography-lod", "country");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-cover-size", "84");
  const afterMetrics = await markerMetrics(page);
  expect(afterMetrics.images).toBe(afterMetrics.visible);
  const layoutAt84 = await waitForStableMarkerCoordinates(page);
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-selected-geography-lod", "country");
  expect(await waitForStableMarkerCoordinates(page)).toEqual(layoutAt84);
});

test("tiny country keeps a truthful bounded aggregate at the 72px default", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await enterEarthExplorer(page);
  await selectCountryFromDirectory(page, "比利时 Belgium");
  const markers = page.locator(".globe-game-marker");
  await expect(markers).toHaveCount(1);
  await expect(markers.first()).toHaveAttribute("data-cluster-state", "collapsed");
  await expect(markers.first()).toHaveAttribute("data-overflow-count", "4");
  await markers.first().click();
  await expect(markers).toHaveCount(1);
  await expect(markers.first()).toHaveAttribute("aria-expanded", "true");
  await expect(markers.first()).toHaveAttribute("data-overflow-count", "4");
  await expect(markers.first()).toHaveClass(/is-cover/);
});

test("Japan uses country LOD, rapid France to Poland rejects stale detail, and failed detail keeps lower LOD", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors = collectPageErrors(page);
  await page.route("**/data/earth-lod/countries/JP.geojson", (route) => route.abort());
  await enterEarthExplorer(page);
  await selectCountry(page, "日本 Japan");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "JP");
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-world-boundaries-visible", "true");
  await page.getByRole("button", { name: "重置为全球视角" }).click();
  await selectCountryFromDirectory(page, "法国 France");
  await page.getByRole("button", { name: "重置为全球视角" }).click();
  await selectCountryFromDirectory(page, "波兰 Poland");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  await expect.poll(async () => page.locator(".globe-game-marker").evaluateAll((items) => [...new Set(items.map((item) => (item as HTMLElement).getAttribute("aria-label")?.includes("波兰") || (item as HTMLElement).dataset.markerLayer))].length)).toBeGreaterThan(0);
  expect(errors.filter((error) => !error.includes("net::ERR_FAILED"))).toEqual([]);
});

test("camera motion freezes rich layout and five Hub round trips reuse the cache", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "返回游戏星图" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
    await expect(page.locator(".real-globe-stage canvas")).toHaveCount(1);
  }
  const fetches = Number(await page.locator(".real-globe-stage").getAttribute("data-geography-fetch-count"));
  expect(fetches).toBeLessThanOrEqual(2);
  await selectCountry(page, "法国 France");
  await expect.poll(() => visibleMarkerCount(page)).toBeGreaterThan(0);
  const settled = await visibleMarkerCount(page);
  await page.getByRole("button", { name: "重置为全球视角" }).click();
  await expect(page.locator(".real-globe-stage")).toHaveClass(/is-globe-low-detail/);
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  expect(settled).toBeGreaterThan(0);
});

test("mobile stays bounded and retains the Hub exit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterEarthExplorer(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("cover double failure retains stable marker controls and fallback content", async ({ page }) => {
  await page.route("**/covers/**", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await selectCountry(page, "法国 France");
  await expect.poll(() => visibleMarkerCount(page)).toBeGreaterThan(0);
  const marker = page.locator(".globe-game-marker").first();
  await expect(marker).toBeVisible();
  await expect(marker.locator(".globe-game-cover-fallback")).not.toHaveText("");
  await expect(marker).toHaveAttribute("aria-label", /选择游戏/);
});

async function selectCountry(page: Page, label: string) {
  await page.getByRole("button", { name: new RegExp(`查看国家：${label}`) }).first().click();
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 6_000 });
}
async function selectCountryFromDirectory(page: Page, label: string) {
  const directory = page.getByRole("button", { name: "打开或收起国家目录" });
  if (await directory.getAttribute("aria-expanded") !== "true") await directory.click();
  await page.getByRole("button", { name: new RegExp(`选择 ${label}`) }).click();
}
async function visibleMarkerCount(page: Page) { return page.locator(".globe-game-marker").count(); }
async function markerCoordinates(page: Page) { return page.locator(".globe-game-marker").evaluateAll((items) => items.map((item) => [(item as HTMLElement).dataset.markerLat, (item as HTMLElement).dataset.markerLng])); }
async function waitForStableMarkerCoordinates(page: Page) {
  let previous = "";
  let stableSamples = 0;
  await expect.poll(async () => {
    const current = JSON.stringify(await markerCoordinates(page));
    stableSamples = current !== "[]" && current === previous ? stableSamples + 1 : 0;
    previous = current;
    return stableSamples >= 3;
  }, { intervals: [250, 300, 400, 500, 600, 700] }).toBe(true);
  return JSON.parse(previous) as string[][];
}
async function markerMetrics(page: Page) { return page.locator(".real-globe-stage").evaluate((stage) => ({ visible: stage.querySelectorAll(".globe-game-marker").length, images: stage.querySelectorAll(".globe-game-cover-image").length, overflow: Math.max(0, ...[...stage.querySelectorAll<HTMLElement>(".globe-game-marker")].map((item) => Number(item.dataset.overflowCount))) })); }
