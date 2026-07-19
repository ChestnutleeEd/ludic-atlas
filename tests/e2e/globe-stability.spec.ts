import { expect, test, type Page } from "playwright/test";
import { collectPageErrors, enterEarthExplorer } from "./earth-fixture";

test("dynamic viewport changes keep one responsive canvas and matching header", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterEarthExplorer(page);
  await page.locator(".real-globe-stage canvas").evaluate((canvas) => {
    canvas.dataset.phaseTwoIdentity = "stable";
  });
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 }
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => responsiveMetrics(page)).toMatchObject({
      canvasCount: 1,
      viewportWidth: viewport.width
    });
    const metrics = await responsiveMetrics(page);
    expect(metrics.canvasWidth).toBeLessThanOrEqual(metrics.stageWidth + 1);
    expect(metrics.stageWidth).toBeLessThanOrEqual(viewport.width);
    expect(metrics.headerWidth).toBeLessThanOrEqual(viewport.width);
    expect(metrics.documentWidth).toBeLessThanOrEqual(viewport.width);
    await expect(page.locator(".real-globe-stage canvas")).toHaveAttribute(
      "data-phase-two-identity",
      "stable"
    );
  }
});

test("France, Poland, and Belgium settle inside the open-panel safe viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  for (const country of ["法国 France", "波兰 Poland", "比利时 Belgium"]) {
    await page.getByRole("button", { name: new RegExp(`查看国家：${country}`) }).first().click();
    const stage = page.locator(".real-globe-stage");
    await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
    await expect(stage).toHaveAttribute("data-country-focus-x", /.+/);
    const focusX = Number(await stage.getAttribute("data-country-focus-x"));
    const safeLeft = Number(await stage.getAttribute("data-safe-viewport-left"));
    const safeRight = Number(await stage.getAttribute("data-safe-viewport-right"));
    expect(focusX).toBeGreaterThan(safeLeft + 30);
    expect(focusX).toBeLessThan(safeRight - 30);
    await page.getByRole("button", { name: "重置为全球视角" }).click();
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "");
  }
});

test("France to Global to Poland leaves only the newest camera intent", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await expect(page.getByRole("button", { name: /查看国家：法国 France/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /查看国家：波兰 Poland/ })).toBeVisible();
  await page.getByRole("button", { name: /查看国家：法国 France/ }).first().click();
  await page.getByRole("button", { name: "重置为全球视角" }).click();
  await page.getByRole("button", { name: /查看国家：波兰 Poland/ }).first().click();
  const stage = page.locator(".real-globe-stage");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  expect(Number(await stage.getAttribute("data-camera-lat"))).toBeGreaterThan(45);
  expect(Number(await stage.getAttribute("data-camera-lng"))).toBeGreaterThan(10);
  await page.waitForTimeout(1_000);
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
  await expect(stage).toHaveAttribute("data-camera-controller-state", "settled");
});

test("pointer control cancels a running programmatic camera task", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");
  const canvas = await stage.locator("canvas").boundingBox();
  expect(canvas).not.toBeNull();
  await page.getByRole("button", { name: /查看国家：法国 France/ }).click();
  await page.mouse.move(canvas!.x + canvas!.width * 0.48, canvas!.y + canvas!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + canvas!.width * 0.58, canvas!.y + canvas!.height * 0.55, { steps: 4 });
  await expect(stage).toHaveAttribute("data-camera-controller-state", "user-controlled");
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-camera-controller-state", "settled");
  await page.waitForTimeout(1_100);
  await expect(stage).toHaveAttribute("data-camera-controller-state", "settled");
  await expect(stage).toHaveAttribute("data-camera-raf-active", "false");
});

test("five Hub and Chronicle round trips never accumulate Globe resources", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await enterEarthExplorer(page);
  await expect(page.getByRole("combobox", { name: "投影模式" })).toHaveCount(0);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "返回游戏星图" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
    await assertOneSettledGlobe(page);
  }
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "返回游戏星图" }).click();
    await page.getByRole("button", { name: /Game Chronicle/i }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "返回游戏星图" }).click();
    await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
    await assertOneSettledGlobe(page);
  }
  expect(errors).toEqual([]);
});

test("Globe view snapshot restores after a Hub round trip", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterEarthExplorer(page);
  await page.getByRole("button", { name: /查看国家：波兰 Poland/ }).click();
  const stage = page.locator(".real-globe-stage");
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 5_000 });
  const before = await cameraSnapshot(stage);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
  await assertOneSettledGlobe(page);
  const after = await cameraSnapshot(page.locator(".real-globe-stage"));
  expect(Math.abs(after.lat - before.lat)).toBeLessThan(0.02);
  expect(Math.abs(after.lng - before.lng)).toBeLessThan(0.02);
  expect(Math.abs(after.altitude - before.altitude)).toBeLessThan(0.02);
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
});

test("WebGL initialization failure keeps a usable return action", async ({ page }) => {
  await page.addInitScript(() => {
    window.__forceEarthGlobeFallback = true;
  });
  await page.goto("/");
  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: "地球渲染器暂不可用" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='hub']")).toBeVisible();
});

async function assertOneSettledGlobe(page: Page) {
  const stage = page.locator(".real-globe-stage");
  await expect(stage.locator("canvas")).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-control-listener-count", "2");
  await expect(stage).toHaveAttribute("data-camera-controller-count", "1");
  await expect(stage).toHaveAttribute("data-resize-observer-count", "1");
  await expect(stage).toHaveAttribute("data-camera-raf-active", "false");
}

async function responsiveMetrics(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(".real-globe-stage canvas")!;
    const stage = document.querySelector<HTMLElement>(".real-globe-stage")!;
    const header = document.querySelector<HTMLElement>(".earth-command-bar")!;
    return {
      canvasCount: document.querySelectorAll(".real-globe-stage canvas").length,
      canvasHeight: canvas.getBoundingClientRect().height,
      canvasWidth: canvas.getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
      headerWidth: header.getBoundingClientRect().width,
      stageHeight: stage.getBoundingClientRect().height,
      stageWidth: stage.getBoundingClientRect().width,
      viewportWidth: innerWidth
    };
  });
}

async function cameraSnapshot(stage: import("playwright/test").Locator) {
  return {
    altitude: Number(await stage.getAttribute("data-camera-altitude")),
    lat: Number(await stage.getAttribute("data-camera-lat")),
    lng: Number(await stage.getAttribute("data-camera-lng"))
  };
}
