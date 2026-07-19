import { expect, test, type Page } from "playwright/test";
import { collectPageErrors, enterEarthExplorer } from "./earth-fixture";

test("Country boundaries use independent geodesic segments at every focused LOD", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  for (const label of ["法国 France", "波兰 Poland", "中国 China", "俄罗斯 Russia", "日本 Japan"]) {
    await selectCountryFromDirectory(page, label);
    await expect(stage).toHaveAttribute("data-selected-geography-lod", "country");
    expect(Number(await stage.getAttribute("data-world-boundary-max-arc-degrees"))).toBeLessThanOrEqual(0.751);
  }
  expect(errors).toEqual([]);
});

test("game detail selection preserves every unselected cover node and loaded image", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const coverRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/covers/")) coverRequests.push(request.url());
  });
  await enterEarthExplorer(page);
  await selectCountryFromDirectory(page, "法国 France");
  const markers = page.locator(".globe-game-marker");
  await expect.poll(() => markers.count()).toBeGreaterThanOrEqual(10);
  await page.waitForTimeout(500);

  const before = await markers.evaluateAll((items) => items.map((item, index) => {
    const marker = item as HTMLElement;
    const image = marker.querySelector<HTMLImageElement>("img");
    marker.dataset.repairNodeProbe = `marker-${index}`;
    if (image) image.dataset.repairNodeProbe = `image-${index}`;
    return {
      gameId: marker.dataset.gameId,
      layoutId: marker.dataset.markerLayoutId,
      markerProbe: marker.dataset.repairNodeProbe,
      imageProbe: image?.dataset.repairNodeProbe,
      src: image?.currentSrc || image?.src
    };
  }));
  const initialRequestCount = coverRequests.length;

  for (let index = 0; index < Math.min(5, before.length); index += 1) {
    await markers.nth(index).evaluate((element: HTMLElement) => element.click());
    await expect(page.getByRole("dialog", { name: /游戏详情/ })).toBeVisible();
    await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false");
    await expect.poll(() => markers.evaluateAll((items) =>
      items.filter((item) => item.classList.contains("is-selected")).length
    )).toBe(1);
  }

  const after = await markers.evaluateAll((items) => items.map((item) => {
    const marker = item as HTMLElement;
    const image = marker.querySelector<HTMLImageElement>("img");
    return {
      gameId: marker.dataset.gameId,
      layoutId: marker.dataset.markerLayoutId,
      markerProbe: marker.dataset.repairNodeProbe,
      imageProbe: image?.dataset.repairNodeProbe,
      src: image?.currentSrc || image?.src
    };
  }));
  expect(after).toEqual(before);
  expect(await markers.evaluateAll((items) => items.filter((item) => item.classList.contains("is-selected")).length)).toBe(1);
  expect(coverRequests.length).toBe(initialRequestCount);
});

test("focused marker density is high only where space permits and detail does not relayout it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);

  const france = await measureCountry(page, "法国 France");
  expect(france.visible).toBeGreaterThanOrEqual(10);
  expect(france.visible).toBeLessThanOrEqual(24);
  expect(france.overflow).toBe(35 - france.visible);
  const beforeDetail = await markerLayout(page);
  await page.locator(".globe-game-marker").first().evaluate((element: HTMLElement) => element.click());
  await expect(page.getByRole("dialog", { name: /游戏详情/ })).toBeVisible();
  expect(await markerLayout(page)).toEqual(beforeDetail);

  const poland = await measureCountry(page, "波兰 Poland");
  expect(poland.visible).toBeGreaterThanOrEqual(6);
  expect(poland.visible).toBeLessThanOrEqual(14);
  expect(poland.overflow).toBe(14 - poland.visible);

  const belgium = await measureCountry(page, "比利时 Belgium");
  expect(belgium.visible).toBe(1);
  await expect(page.locator(".globe-game-marker").first()).toHaveAttribute("data-cluster-state", "collapsed");

  const japan = await measureCountry(page, "日本 Japan");
  expect(japan.visible).toBeGreaterThanOrEqual(5);
  expect(japan.visible).toBeLessThanOrEqual(24);
});

test("repair keeps a bounded 1440px rendering baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  const global = await sampleFrames(page);
  await selectCountryFromDirectory(page, "法国 France");
  const france = await sampleFrames(page);
  await selectCountryFromDirectory(page, "波兰 Poland");
  const poland = await sampleFrames(page);
  for (const metric of [global, france, poland]) {
    expect(Number.isFinite(metric.fps)).toBe(true);
    expect(metric.fps).toBeGreaterThan(1);
    expect(Number.isFinite(metric.maxFrameMs)).toBe(true);
  }
});

async function selectCountryFromDirectory(page: Page, label: string) {
  if (await page.getByRole("dialog", { name: /游戏详情/ }).count()) {
    await page.keyboard.press("Escape");
  }
  const selectedCountry = await page.locator(".game-earth-shell").getAttribute("data-earth-country");
  if (selectedCountry) {
    await page.getByRole("button", { name: "重置为全球视角" }).click();
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "");
  }
  const directory = page.getByRole("button", { name: "打开或收起国家目录" });
  if (await directory.getAttribute("aria-expanded") !== "true") await directory.click();
  await page.getByRole("button", { name: new RegExp(`选择 ${label}`) }).click();
  await expect(page.locator(".real-globe-stage")).toHaveAttribute("data-camera-travelling", "false", { timeout: 6_000 });
  await page.waitForTimeout(350);
}

async function measureCountry(page: Page, label: string) {
  await selectCountryFromDirectory(page, label);
  const markers = page.locator(".globe-game-marker");
  await expect.poll(() => markers.count()).toBeGreaterThan(0);
  return {
    visible: await markers.count(),
    overflow: await markers.evaluateAll((items) => Math.max(0, ...items.map((item) => Number((item as HTMLElement).dataset.overflowCount))))
  };
}

async function markerLayout(page: Page) {
  return page.locator(".globe-game-marker").evaluateAll((items) => items.map((item) => {
    const marker = item as HTMLElement;
    return [marker.dataset.gameId, marker.dataset.markerLat, marker.dataset.markerLng];
  }));
}

async function sampleFrames(page: Page) {
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
      if (timestamp - startedAt < 1_200) {
        requestAnimationFrame(frame);
        return;
      }
      observer?.disconnect();
      const sorted = [...frameTimes].sort((a, b) => a - b);
      resolve({
        fps: frameTimes.length * 1_000 / (timestamp - startedAt),
        longTaskCount: longTasks.length,
        maxFrameMs: Math.max(...frameTimes),
        p95FrameMs: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      });
    };
    requestAnimationFrame(frame);
  }));
}
