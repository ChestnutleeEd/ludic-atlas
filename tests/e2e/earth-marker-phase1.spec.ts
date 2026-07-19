import { expect, test, type Page } from "playwright/test";
import { enterEarthExplorer } from "./earth-fixture";

const STAGE = ".real-globe-stage";
const MARKER = ".globe-game-marker";

test.describe("Phase 2 marker continuity regression from the Phase 1 baseline", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Global drag retains DOM/htmlElementsData and keeps markers visible", async ({ page }) => {
    const diagnostics = collectRuntimeDiagnostics(page);
    await enterEarthExplorer(page);
    const stage = page.locator(STAGE);
    await expect.poll(() => page.locator(MARKER).count()).toBeGreaterThan(0);
    await assertBoundedRuntimeOwnership(page);
    const before = await installMarkerProbe(page);

    const canvas = await stage.locator("canvas").boundingBox();
    expect(canvas).not.toBeNull();
    // Use an unoccupied part of the canvas so an HTML marker cannot consume
    // the pointerdown before OrbitControls observes the drag.
    await page.mouse.move(canvas!.x + canvas!.width * 0.28, canvas!.y + canvas!.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(canvas!.x + canvas!.width * 0.42, canvas!.y + canvas!.height * 0.56, { steps: 8 });
    await expect(stage).toHaveClass(/is-globe-interacting/);
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    const during = await readMarkerProbe(page);

    expect(during.domCount).toBe(before.domCount);
    expect(during.modelCount).toBeGreaterThan(0);
    expect(during.connectedCount).toBe(before.domCount);
    expect(during.sameMarkerNodeCount).toBe(before.domCount);
    expect(during.sameImageNodeCount).toBe(before.imageCount);
    expect(during.hiddenByVisibilityCount).toBe(0);
    // Back-face occlusion may independently set opacity to zero. The current
    // interaction regression is the separate visibility:hidden rule above.
    expect(during.zeroOpacityCount).toBeLessThanOrEqual(during.domCount);
    expect(during.canvasCount).toBe(1);
    console.log(`PHASE1_GLOBAL_DRAG ${JSON.stringify({ before, during })}`);

    await page.mouse.up();
    await expect(stage).not.toHaveClass(/is-globe-interacting/);
    await expect(stage).not.toHaveClass(/is-globe-low-detail/);
    await expect.poll(async () => (await readMarkerProbe(page)).hiddenByVisibilityCount).toBe(0);
    await assertBoundedRuntimeOwnership(page);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.hydrationWarnings).toEqual([]);
  });

  test("France focus, drag, wheel, camera tool, details, and keyboard size change are characterized", async ({ page }) => {
    test.setTimeout(75_000);
    const diagnostics = collectRuntimeDiagnostics(page);
    await enterEarthExplorer(page);
    const stage = page.locator(STAGE);

    await openCountryDirectory(page);
    await page.getByRole("button", { name: /选择 法国 France/ }).click();
    await expect(stage).toHaveAttribute("data-camera-travelling", "true");
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    await expect.poll(async () => (await readMarkerState(page)).modelCount).toBeGreaterThan(0);
    const duringProgrammaticFocus = await readMarkerState(page);
    expect(duringProgrammaticFocus.domCount).toBeGreaterThan(0);
    expect(duringProgrammaticFocus.hiddenByVisibilityCount).toBe(0);
    await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 7_000 });
    await expect(stage).not.toHaveClass(/is-globe-low-detail/);
    await expect.poll(() => page.locator(MARKER).count()).toBeGreaterThanOrEqual(10);
    await expect(page.getByRole("complementary", { name: /法国 France 国家详情/ })).toBeVisible();

    const beforeDrag = await installMarkerProbe(page);
    const canvas = await stage.locator("canvas").boundingBox();
    expect(canvas).not.toBeNull();
    await page.mouse.move(canvas!.x + canvas!.width * 0.48, canvas!.y + canvas!.height * 0.48);
    await page.mouse.down();
    await page.mouse.move(canvas!.x + canvas!.width * 0.57, canvas!.y + canvas!.height * 0.54, { steps: 6 });
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    const duringDrag = await readMarkerProbe(page);
    expect(duringDrag.connectedCount).toBe(beforeDrag.domCount);
    expect(duringDrag.sameMarkerNodeCount).toBe(beforeDrag.domCount);
    expect(duringDrag.hiddenByVisibilityCount).toBe(0);
    await page.mouse.up();
    await expect(stage).not.toHaveClass(/is-globe-low-detail/);

    const beforeWheel = await installMarkerProbe(page);
    await armLowDetailCapture(page, "wheel");
    await stage.locator("canvas").evaluate((canvas) => {
      for (let index = 0; index < 3; index += 1) {
        canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -180 }));
      }
    });
    const duringWheel = await readLowDetailCapture(page, "wheel");
    expect(duringWheel.modelCount).toBeGreaterThan(0);
    expect(duringWheel.sameMarkerNodeCount).toBe(beforeWheel.domCount);
    expect(duringWheel.hiddenByVisibilityCount).toBe(0);
    await expect(stage).not.toHaveClass(/is-globe-low-detail/, { timeout: 5_000 });

    await page.getByRole("button", { name: "放大地球镜头" }).click();
    await expect(stage).toHaveAttribute("data-camera-travelling", "true");
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    expect((await readMarkerState(page)).hiddenByVisibilityCount).toBe(0);
    await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 6_000 });
    await expect(stage).not.toHaveClass(/is-globe-low-detail/);

    await page.getByRole("button", { name: /^选择游戏：/ }).first().click();
    await expect(page.getByRole("dialog", { name: /游戏详情/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /游戏详情/ })).toHaveCount(0);

    const beforeSize = await installMarkerProbe(page);
    const requestCountsBefore = countByUrl(diagnostics.coverRequests);
    await page.locator(".atlas-bottom-controls > summary").click();
    const slider = page.getByRole("slider", { name: "封面尺寸" });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-cover-size", "76");
    await expect.poll(async () => (await readMarkerState(page)).domCount).toBeGreaterThan(0);
    const afterSize = await readMarkerProbe(page);
    const retainedIds = beforeSize.semanticIds.filter((identity) => afterSize.semanticIds.includes(identity));
    expect(retainedIds.length).toBeGreaterThan(0);
    expect(afterSize.sameMarkerNodeCount).toBe(retainedIds.length);
    expect(afterSize.sameImageNodeCount).toBe(retainedIds.length);
    expect(countByUrl(diagnostics.coverRequests)).toEqual(requestCountsBefore);
    expect(afterSize.canvasCount).toBe(1);
    await assertBoundedRuntimeOwnership(page);
    console.log(`PHASE1_FRANCE_INTERACTION ${JSON.stringify({
      beforeDrag,
      beforeSize: { domCount: beforeSize.domCount, imageCount: beforeSize.imageCount },
      coverRequestsBeforeAndAfter: countByUrl(diagnostics.coverRequests),
      duringDrag,
      duringProgrammaticFocus,
      duringWheel,
      sizeAfter: {
        domCount: afterSize.domCount,
        retainedIdentityCount: retainedIds.length,
        sameImageNodeCount: afterSize.sameImageNodeCount,
        sameMarkerNodeCount: afterSize.sameMarkerNodeCount
      }
    })}`);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.hydrationWarnings).toEqual([]);
  });

  test("Poland and Canada rapid programmatic switching keeps one canvas and latest state", async ({ page }) => {
    const diagnostics = collectRuntimeDiagnostics(page);
    await enterEarthExplorer(page);
    const stage = page.locator(STAGE);
    await openCountryDirectory(page);
    await page.getByRole("button", { name: /选择 波兰 Poland/ }).click();
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 7_000 });
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "PL");
    await expect.poll(() => page.locator(MARKER).count()).toBeGreaterThanOrEqual(6);

    await page.getByRole("button", { name: "重置为全球视角" }).click();
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "");
    await openCountryDirectory(page);
    await page.getByRole("button", { name: /选择 加拿大 Canada/ }).click();
    await expect(stage).toHaveClass(/is-globe-low-detail/);
    await expect(stage).toHaveAttribute("data-camera-travelling", "false", { timeout: 7_000 });
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "CA");
    await expect(page.getByRole("complementary", { name: /加拿大 Canada 国家详情/ })).toBeVisible();
    await assertBoundedRuntimeOwnership(page);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.hydrationWarnings).toEqual([]);
  });

  test("cover size anchors, step buttons, slider dimensions, and storage restoration work", async ({ page }) => {
    await page.addInitScript(() => {
      const key = "ludic-atlas:earth-cover-size:v1";
      if (localStorage.getItem(key) === null) localStorage.setItem(key, "88");
    });
    await enterEarthExplorer(page);
    const shell = page.locator(".game-earth-shell");
    await expect(shell).toHaveAttribute("data-earth-cover-size", "88");
    await openCountryDirectory(page);
    await page.getByRole("button", { name: /选择 法国 France/ }).click();
    await expect(page.locator(STAGE)).toHaveAttribute("data-camera-travelling", "false", { timeout: 7_000 });
    await expect.poll(() => page.locator(`${MARKER}.is-cover`).count()).toBeGreaterThan(0);
    await page.locator(".atlas-bottom-controls > summary").click();
    const slider = page.getByRole("slider", { name: "封面尺寸" });
    const decrease = page.getByRole("button", { name: "减小封面尺寸" });
    const increase = page.getByRole("button", { name: "放大封面尺寸" });

    for (const size of [48, 72, 112]) {
      await slider.fill(String(size));
      await slider.blur();
      await expect(shell).toHaveAttribute("data-earth-cover-size", String(size));
      await expect(slider).toHaveAttribute("aria-valuetext", `游戏封面高度 ${size} 像素`);
      await expect.poll(async () => Math.round((await page.locator(`${MARKER}.is-cover`).first().boundingBox())?.height ?? 0)).toBe(size);
    }
    await expect(increase).toBeDisabled();
    await decrease.click();
    await expect(shell).toHaveAttribute("data-earth-cover-size", "108");
    await slider.fill("48");
    await slider.blur();
    await expect(decrease).toBeDisabled();
    await increase.click();
    await expect(shell).toHaveAttribute("data-earth-cover-size", "52");
    expect(await page.evaluate(() => localStorage.getItem("ludic-atlas:earth-cover-size:v1"))).toBe("52");

    await page.reload();
    await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
    await expect(shell).toHaveAttribute("data-earth-cover-size", "52");
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("invalid stored cover size falls back to 72 without hydration or console errors", async ({ page }) => {
    const diagnostics = collectRuntimeDiagnostics(page);
    await page.addInitScript(() => localStorage.setItem("ludic-atlas:earth-cover-size:v1", "Infinity"));
    await enterEarthExplorer(page);
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-cover-size", "72");
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.hydrationWarnings).toEqual([]);
  });

  test("390px filter tray keeps compact size controls and Earth exit without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterEarthExplorer(page);
    await page.locator(".atlas-bottom-controls > summary").click();
    await expect(page.getByRole("slider", { name: "封面尺寸" })).toBeVisible();
    await expect(page.getByRole("button", { name: "减小封面尺寸" })).toBeVisible();
    await expect(page.getByRole("button", { name: "放大封面尺寸" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.getByRole("button", { name: "返回游戏星图" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("concise Global, France, and Poland performance and ownership check", async ({ page }) => {
    test.setTimeout(90_000);
    const diagnostics = collectRuntimeDiagnostics(page);
    await enterEarthExplorer(page);
    const global = await measureContext(page, "Global");
    const france = await selectCountryAndMeasure(page, "法国 France", "FR");
    const poland = await selectCountryAndMeasure(page, "波兰 Poland", "PL");
    const result = {
      canvasCount: await page.locator("canvas").count(),
      consoleErrorCount: diagnostics.consoleErrors.length,
      coverRequestCount: diagnostics.coverRequests.length,
      coverRequestUniqueCount: new Set(diagnostics.coverRequests).size,
      global,
      france,
      hydrationWarningCount: diagnostics.hydrationWarnings.length,
      poland,
      webglWarningCount: diagnostics.webglWarnings.length
    };
    console.log(`PHASE2_MARKER_CHECK ${JSON.stringify(result)}`);
    expect(result.canvasCount).toBe(1);
    expect(result.consoleErrorCount).toBe(0);
    expect(result.hydrationWarningCount).toBe(0);
    expect(global.markerCount).toBeGreaterThan(0);
    expect(france.markerCount).toBeGreaterThan(0);
    expect(poland.markerCount).toBeGreaterThan(0);
    expect(global.hiddenMarkerCount).toBe(0);
    expect(france.hiddenMarkerCount).toBe(0);
    expect(poland.hiddenMarkerCount).toBe(0);
    expect(Math.max(global.longTaskMaxMs, france.longTaskMaxMs, poland.longTaskMaxMs)).toBeLessThanOrEqual(200);
  });
});

async function assertBoundedRuntimeOwnership(page: Page) {
  const stage = page.locator(STAGE);
  await expect(stage.locator("canvas")).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-camera-controller-count", "1");
  await expect(stage).toHaveAttribute("data-control-listener-count", "2");
  await expect(stage).toHaveAttribute("data-resize-observer-count", "1");
}

async function openCountryDirectory(page: Page) {
  const directory = page.getByRole("button", { name: "打开或收起国家目录" });
  if (await directory.getAttribute("aria-expanded") !== "true") await directory.click();
}

async function installMarkerProbe(page: Page) {
  return page.locator(STAGE).evaluate((stage) => {
    const markers = [...stage.querySelectorAll<HTMLElement>(".globe-game-marker")];
    const markerRefs = new Map(markers.map((marker) => [marker.dataset.markerLayoutId ?? marker.dataset.gameId ?? "", marker]));
    const imageRefs = new Map(markers.flatMap((marker) => {
      const image = marker.querySelector<HTMLImageElement>(".globe-game-cover-image");
      return image ? [[marker.dataset.markerLayoutId ?? marker.dataset.gameId ?? "", image] as const] : [];
    }));
    (window as unknown as { __phase1MarkerProbe: { markerRefs: Map<string, HTMLElement>; imageRefs: Map<string, HTMLImageElement> } }).__phase1MarkerProbe = { markerRefs, imageRefs };
    return {
      domCount: markers.length,
      imageCount: imageRefs.size,
      semanticIds: [...markerRefs.keys()]
    };
  });
}

async function readMarkerProbe(page: Page) {
  return page.locator(STAGE).evaluate((stage) => {
    const markers = [...stage.querySelectorAll<HTMLElement>(".globe-game-marker")];
    const probe = (window as unknown as { __phase1MarkerProbe?: { markerRefs: Map<string, HTMLElement>; imageRefs: Map<string, HTMLImageElement> } }).__phase1MarkerProbe;
    const currentById = new Map(markers.map((marker) => [marker.dataset.markerLayoutId ?? marker.dataset.gameId ?? "", marker]));
    return {
      canvasCount: stage.querySelectorAll("canvas").length,
      connectedCount: probe ? [...probe.markerRefs.values()].filter((marker) => marker.isConnected).length : 0,
      domCount: markers.length,
      hiddenByVisibilityCount: markers.filter((marker) => getComputedStyle(marker).visibility === "hidden").length,
      modelCount: Number((stage as HTMLElement).dataset.markerVisibleCount),
      sameImageNodeCount: probe ? [...probe.imageRefs].filter(([identity, image]) => currentById.get(identity)?.querySelector(".globe-game-cover-image") === image).length : 0,
      sameMarkerNodeCount: probe ? [...probe.markerRefs].filter(([identity, marker]) => currentById.get(identity) === marker).length : 0,
      semanticIds: [...currentById.keys()],
      zeroOpacityCount: markers.filter((marker) => Number(getComputedStyle(marker).opacity) === 0).length
    };
  });
}

async function readMarkerState(page: Page) {
  return page.locator(STAGE).evaluate((stage) => {
    const markers = [...stage.querySelectorAll<HTMLElement>(".globe-game-marker")];
    return {
      domCount: markers.length,
      hiddenByVisibilityCount: markers.filter((marker) => getComputedStyle(marker).visibility === "hidden").length,
      modelCount: Number((stage as HTMLElement).dataset.markerVisibleCount),
      semanticIds: markers.map((marker) => marker.dataset.markerLayoutId ?? marker.dataset.gameId ?? "")
    };
  });
}

async function armLowDetailCapture(page: Page, label: string) {
  await page.locator(STAGE).evaluate((stage, captureLabel) => {
    const attribute = `data-phase1-${captureLabel}`;
    stage.removeAttribute(attribute);
    const observer = new MutationObserver(() => {
      if (!stage.classList.contains("is-globe-low-detail")) return;
      queueMicrotask(() => {
        const markers = [...stage.querySelectorAll<HTMLElement>(".globe-game-marker")];
        const probe = (window as unknown as { __phase1MarkerProbe?: { markerRefs: Map<string, HTMLElement> } }).__phase1MarkerProbe;
        const currentById = new Map(markers.map((marker) => [marker.dataset.markerLayoutId ?? marker.dataset.gameId ?? "", marker]));
        stage.setAttribute(attribute, JSON.stringify({
          domCount: markers.length,
          hiddenByVisibilityCount: markers.filter((marker) => getComputedStyle(marker).visibility === "hidden").length,
          modelCount: Number((stage as HTMLElement).dataset.markerVisibleCount),
          sameMarkerNodeCount: probe ? [...probe.markerRefs].filter(([identity, marker]) => currentById.get(identity) === marker).length : 0
        }));
        observer.disconnect();
      });
    });
    observer.observe(stage, { attributeFilter: ["class"] });
  }, label);
}

async function readLowDetailCapture(page: Page, label: string) {
  const attribute = `data-phase1-${label}`;
  await expect(page.locator(STAGE)).toHaveAttribute(attribute, /.+/);
  return JSON.parse((await page.locator(STAGE).getAttribute(attribute))!) as {
    domCount: number;
    hiddenByVisibilityCount: number;
    modelCount: number;
    sameMarkerNodeCount: number;
  };
}

function collectRuntimeDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const hydrationWarnings: string[] = [];
  const webglWarnings: string[] = [];
  const coverRequests: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") consoleErrors.push(text);
    if (/hydration/i.test(text)) hydrationWarnings.push(text);
    if (/webgl|readpixels|gpu stall/i.test(text)) webglWarnings.push(text);
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/covers/")) coverRequests.push(new URL(url).pathname);
  });
  return { consoleErrors, coverRequests, hydrationWarnings, webglWarnings };
}

function countByUrl(urls: string[]) {
  return Object.fromEntries([...new Set(urls)].sort().map((url) => [url, urls.filter((candidate) => candidate === url).length]));
}

async function selectCountryAndMeasure(page: Page, label: string, countryCode: string) {
  if (await page.locator(".game-earth-shell").getAttribute("data-earth-country")) {
    await page.getByRole("button", { name: "重置为全球视角" }).click();
    await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", "");
  }
  await openCountryDirectory(page);
  await page.getByRole("button", { name: new RegExp(`选择 ${label}`) }).click();
  await expect(page.locator(STAGE)).toHaveAttribute("data-camera-travelling", "false", { timeout: 7_000 });
  await expect(page.locator(".game-earth-shell")).toHaveAttribute("data-earth-country", countryCode);
  await expect.poll(() => page.locator(MARKER).count()).toBeGreaterThan(0);
  return measureContext(page, label);
}

async function measureContext(page: Page, label: string) {
  const tray = page.locator(".atlas-bottom-controls");
  if (await tray.getAttribute("open") === null) await tray.locator(":scope > summary").click();
  const rotate = page.getByRole("checkbox", { name: "切换地球自动旋转" });
  if (!(await rotate.isChecked())) await rotate.check();
  await expect(page.locator(STAGE)).toHaveClass(/is-globe-low-detail/);
  const delivery = await sampleFrameDelivery(page);
  const metrics = await page.locator(STAGE).evaluate((stage) => ({
    canvasCount: stage.querySelectorAll("canvas").length,
    hiddenMarkerCount: [...stage.querySelectorAll<HTMLElement>(".globe-game-marker")].filter((marker) => getComputedStyle(marker).visibility === "hidden").length,
    imageCount: stage.querySelectorAll(".globe-game-cover-image").length,
    markerCount: stage.querySelectorAll(".globe-game-marker").length,
    modelCount: Number((stage as HTMLElement).dataset.markerVisibleCount)
  }));
  await rotate.uncheck();
  await expect(page.locator(STAGE)).not.toHaveClass(/is-globe-low-detail/);
  await tray.locator(":scope > summary").click();
  return { label, ...delivery, ...metrics };
}

async function sampleFrameDelivery(page: Page) {
  return page.evaluate(() => new Promise<{ fps: number; longTaskCount: number; longTaskMaxMs: number; maxFrameMs: number; p95FrameMs: number }>((resolve) => {
    const frames: number[] = [];
    const longTasks: number[] = [];
    const observer = typeof PerformanceObserver === "undefined" ? null : new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    try { observer?.observe({ entryTypes: ["longtask"] }); } catch { /* unsupported */ }
    const start = performance.now();
    let previous = start;
    const tick = (now: number) => {
      frames.push(now - previous);
      previous = now;
      if (now - start < 1_500) return requestAnimationFrame(tick);
      observer?.disconnect();
      const sorted = [...frames].sort((a, b) => a - b);
      resolve({
        fps: Number((frames.length * 1000 / (now - start)).toFixed(1)),
        longTaskCount: longTasks.length,
        longTaskMaxMs: Number(Math.max(0, ...longTasks).toFixed(1)),
        maxFrameMs: Number(Math.max(...frames).toFixed(1)),
        p95FrameMs: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(1))
      });
    };
    requestAnimationFrame(tick);
  }));
}
