import { expect, test, type Page } from "playwright/test";
import { collectPageErrors, enterEarthExplorer } from "./earth-fixture";

const desktopViewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
] as const;

for (const viewport of desktopViewports) {
  test(`Phase 6 fresh Globe acceptance at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = collectPageErrors(page);
    await enterEarthExplorer(page);
    const stage = page.locator(".real-globe-stage");
    const atmosphere = page.locator(".earth-atmosphere-image");
    await expect(stage).toHaveAttribute("data-world-boundaries-visible", "true");
    await expect.poll(async () => Number(await stage.getAttribute("data-world-country-count"))).toBeGreaterThan(200);
    await expect.poll(() => atmosphere.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(".real-globe-stage canvas")!;
      const stage = document.querySelector<HTMLElement>(".real-globe-stage")!;
      const header = document.querySelector<HTMLElement>(".earth-command-bar")!;
      const atmosphere = document.querySelector<HTMLImageElement>(".earth-atmosphere-image");
      const canvasBounds = canvas.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      return {
        atmosphereLoaded: Boolean(atmosphere?.complete && atmosphere.naturalWidth > 0),
        canvasBottom: canvasBounds.bottom,
        canvasCount: document.querySelectorAll("canvas").length,
        canvasHeight: canvasBounds.height,
        canvasWidth: canvasBounds.width,
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        drawingBufferHeight: canvas.height,
        drawingBufferWidth: canvas.width,
        headerBottom: headerBounds.bottom,
        headerWidth: headerBounds.width,
        stageBottom: stageBounds.bottom,
        stageHeight: stageBounds.height,
        stageWidth: stageBounds.width,
        worldCountryCount: Number(stage.dataset.worldCountryCount),
        worldVisible: stage.dataset.worldBoundariesVisible
      };
    });

    expect(metrics.canvasCount).toBe(1);
    expect(metrics.canvasHeight).toBeGreaterThan(0);
    expect(metrics.canvasWidth).toBeLessThanOrEqual(metrics.stageWidth + 1);
    expect(metrics.drawingBufferHeight).toBeGreaterThan(0);
    expect(metrics.drawingBufferWidth).toBeGreaterThan(0);
    expect(metrics.headerWidth).toBeLessThanOrEqual(viewport.width);
    expect(metrics.stageWidth).toBeLessThanOrEqual(viewport.width);
    expect(metrics.documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(metrics.documentHeight).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.canvasBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.stageBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.headerBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.worldCountryCount).toBeGreaterThan(200);
    expect(metrics.worldVisible).toBe("true");
    expect(metrics.atmosphereLoaded).toBe(true);
    await expect(page.getByRole("button", { name: "返回游戏星图" })).toBeVisible();
    await expect(page.getByRole("button", { name: "打开或收起国家目录" })).toBeVisible();
    await expect(page.getByRole("button", { name: "放大地球镜头" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("Phase 6 mobile safety remains bounded and escapable at 390x844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectPageErrors(page);
  await enterEarthExplorer(page);
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(".real-globe-stage canvas")!;
    const stage = document.querySelector<HTMLElement>(".real-globe-stage")!;
    return {
      canvasCount: document.querySelectorAll("canvas").length,
      canvasHeight: canvas.getBoundingClientRect().height,
      canvasWidth: canvas.getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
      stageWidth: stage.getBoundingClientRect().width
    };
  });
  expect(metrics.canvasCount).toBe(1);
  expect(metrics.canvasHeight).toBeGreaterThan(0);
  expect(metrics.canvasWidth).toBeLessThanOrEqual(390);
  expect(metrics.stageWidth).toBeLessThanOrEqual(390);
  expect(metrics.documentWidth).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".game-earth-shell[data-main-view='hub']")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Phase 6 production diagnostics report Global, France, and Poland delivery", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const coverRequests: string[] = [];
  const geographyRequests: string[] = [];
  const atmosphereRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/covers/")) coverRequests.push(url);
    if (url.includes("/data/earth-lod/")) geographyRequests.push(url);
    if (url.includes("/images/earth/earth-atmosphere-")) atmosphereRequests.push(url);
  });

  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");
  const global = await sampleFrameDelivery(page);
  const globalDelivery = await stage.evaluate((element) => ({
    imageCount: element.querySelectorAll(".globe-game-cover-image").length,
    markerCount: element.querySelectorAll(".globe-country-marker, .globe-game-marker").length,
    markerCandidateCount: Number(element.dataset.markerCandidateCount)
  }));
  const france = await selectAndMeasureCountry(page, "法国 France", 18);
  const franceFrames = await sampleFrameDelivery(page);
  const poland = await selectAndMeasureCountry(page, "波兰 Poland", 12);
  const polandFrames = await sampleFrameDelivery(page);
  const diagnostics = {
    atmosphereRequestCount: atmosphereRequests.length,
    canvasCount: await page.locator("canvas").count(),
    consoleErrorCount: consoleErrors.length,
    coverRequestCount: coverRequests.length,
    france,
    frameDelivery: { global, france: franceFrames, poland: polandFrames },
    global: globalDelivery,
    geographyFetchCount: Number(await stage.getAttribute("data-geography-fetch-count")),
    geographyParseCount: Number(await stage.getAttribute("data-geography-parse-count")),
    geographyRequestCount: geographyRequests.length,
    geographyRequestUrls: [...new Set(geographyRequests)].map((url) => new URL(url).pathname),
    hydrationWarningCount: consoleWarnings.filter((message) => /hydration/i.test(message)).length,
    poland,
    webglWarningCount: consoleWarnings.filter((message) => /webgl|readpixels|gpu stall/i.test(message)).length,
    webglWarnings: consoleWarnings.filter((message) => /webgl|readpixels|gpu stall/i.test(message))
  };

  console.log(`PHASE6_PRODUCTION_METRICS ${JSON.stringify(diagnostics)}`);
  expect(diagnostics.canvasCount).toBe(1);
  expect(diagnostics.consoleErrorCount).toBe(0);
  expect(diagnostics.hydrationWarningCount).toBe(0);
  expect(diagnostics.atmosphereRequestCount).toBe(1);
  expect(france.markerCount).toBeGreaterThanOrEqual(18);
  expect(france.markerCount).toBeLessThanOrEqual(24);
  expect(poland.markerCount).toBeGreaterThanOrEqual(12);
  expect(poland.markerCount).toBeLessThanOrEqual(14);
  expect(geographyRequests.some((url) => url.endsWith("/global.geojson"))).toBe(true);
  expect(geographyRequests.some((url) => url.endsWith("/countries/FR.geojson"))).toBe(true);
  expect(geographyRequests.some((url) => url.endsWith("/countries/PL.geojson"))).toBe(true);
});

async function selectAndMeasureCountry(page: Page, label: string, minimumMarkers: number) {
  if (await page.getByRole("dialog", { name: /游戏详情/ }).count()) await page.keyboard.press("Escape");
  if (await page.locator(".game-earth-shell").getAttribute("data-earth-country")) {
    await page.getByRole("button", { name: "重置为全球视角" }).click();
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "");
  }
  const directory = page.getByRole("button", { name: "打开或收起国家目录" });
  if (await directory.getAttribute("aria-expanded") !== "true") await directory.click();
  await page.getByRole("button", { name: new RegExp(`选择 ${label}`) }).click();
  const stage = page.locator(".real-globe-stage");
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 6_000 });
  await expect(stage).toHaveAttribute("data-selected-geography-lod", "country");
  await expect.poll(() => page.locator(".globe-game-marker").count()).toBeGreaterThanOrEqual(minimumMarkers);
  await page.waitForTimeout(350);
  return stage.evaluate((element) => ({
    imageCount: element.querySelectorAll(".globe-game-cover-image").length,
    markerCount: element.querySelectorAll(".globe-game-marker").length,
    overflow: Math.max(0, ...[...element.querySelectorAll<HTMLElement>(".globe-game-marker")].map((item) => Number(item.dataset.overflowCount)))
  }));
}

async function sampleFrameDelivery(page: Page) {
  return page.evaluate(() => new Promise<{
    fps: number;
    longTaskCount: number;
    maxFrameMs: number;
    p95FrameMs: number;
  }>((resolve) => {
    const frameTimes: number[] = [];
    const longTasks: number[] = [];
    const observer = typeof PerformanceObserver === "undefined"
      ? null
      : new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        });
    try { observer?.observe({ entryTypes: ["longtask"] }); } catch { /* unsupported browser */ }
    const startedAt = performance.now();
    let previous = startedAt;
    const frame = (timestamp: number) => {
      frameTimes.push(timestamp - previous);
      previous = timestamp;
      if (timestamp - startedAt < 1_500) {
        requestAnimationFrame(frame);
        return;
      }
      observer?.disconnect();
      const sorted = [...frameTimes].sort((a, b) => a - b);
      resolve({
        fps: Number((frameTimes.length * 1_000 / (timestamp - startedAt)).toFixed(1)),
        longTaskCount: longTasks.length,
        maxFrameMs: Number(Math.max(...frameTimes).toFixed(1)),
        p95FrameMs: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(1))
      });
    };
    requestAnimationFrame(frame);
  }));
}
