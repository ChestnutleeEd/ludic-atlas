import { expect, test } from "playwright/test";
import {
  collectPageErrors,
  enterEarthExplorer,
  getEarthViewportMetrics
} from "./earth-fixture";

const desktopViewports = [
  { height: 720, width: 1280 },
  { height: 768, width: 1366 },
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

test("Earth canvas follows a shrinking and growing layout without replacement", async ({ page }) => {
  await page.setViewportSize({ height: 1080, width: 1920 });
  await enterEarthExplorer(page);
  const initialCanvas = await page.locator(".real-globe-stage canvas").evaluate(
    (canvas) => {
      canvas.dataset.resizeIdentity = "stable";
      return canvas.dataset.resizeIdentity;
    }
  );

  const resizeSequence = [
    { height: 720, width: 1280 },
    { height: 1080, width: 1920 },
    { height: 900, width: 1440 },
    { height: 768, width: 1366 }
  ] as const;

  for (const viewport of resizeSequence) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => readResponsiveGlobeBounds(page)).toMatchObject({
      canvasCount: 1,
      viewportWidth: viewport.width
    });
    const bounds = await readResponsiveGlobeBounds(page);
    expect(bounds.canvasWidth).toBeLessThanOrEqual(viewport.width);
    expect(bounds.headerWidth).toBeLessThanOrEqual(viewport.width);
    expect(bounds.stageWidth).toBeLessThanOrEqual(viewport.width);
    expect(bounds.documentWidth).toBeLessThanOrEqual(viewport.width);
  }

  await expect(page.locator(".real-globe-stage canvas")).toHaveAttribute(
    "data-resize-identity",
    initialCanvas
  );
});

test("production Earth exposes Globe only while preserving one business state", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const shell = page.locator(".game-earth-shell");

  await expect(shell).toHaveAttribute("data-earth-projection", "globe");
  await expect(page.getByRole("combobox", { name: "投影模式" })).toHaveCount(0);
  await expect(page.locator("[data-earth-renderer='atlas-placeholder']")).toHaveCount(0);
  await expect(page.locator("[data-earth-renderer='globe']")).toHaveCount(1);
  await expect(page.locator(".real-globe-stage canvas")).toHaveCount(1);
  await expect(page.locator(".real-globe-stage canvas")).toBeVisible();

  await page.getByRole("button", { name: /查看国家：法国 France/ }).click();
  await page.getByRole("button", { name: /^选择游戏：/ }).first().click();
  await expect(shell).not.toHaveAttribute("data-earth-game", "");
  expect((await readEarthContractState(page)).projection).toBe("globe");
});

test("Globe unmounts for Hub and Chronicle and remounts once on return", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  await expect(page.locator("canvas")).toHaveCount(1);

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='hub']")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
  await expect(page.locator(".real-globe-stage canvas")).toHaveCount(1);

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await page.getByRole("button", { name: /Game Chronicle/i }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='archive']")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
  await expect(page.locator(".real-globe-stage canvas")).toHaveCount(1);
});

test("mobile sheet starts collapsed and keeps the globe operable", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await enterEarthExplorer(page);

  await expect(page.locator(".right-panel-shell")).toHaveAttribute(
    "data-sheet-state",
    "collapsed"
  );
  const mobileBounds = await page.evaluate(() => ({
    panelHeight: document.querySelector<HTMLElement>(".right-panel-shell")!.getBoundingClientRect().height,
    stageWidth: document.querySelector<HTMLElement>(".real-globe-stage")!.getBoundingClientRect().width,
    viewportWidth: window.innerWidth
  }));
  expect(mobileBounds.panelHeight).toBeLessThanOrEqual(70);
  expect(mobileBounds.stageWidth).toBeLessThanOrEqual(mobileBounds.viewportWidth);
  await expect(page.locator(".real-globe-stage canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "放大地球镜头" })).toBeVisible();
  await expect(page.getByRole("button", { name: "打开或收起国家目录" })).toBeVisible();
});

test("initial desktop view keeps secondary UI collapsed around a dominant globe", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);

  const panel = page.locator(".right-panel-shell");
  const filters = page.locator(".atlas-bottom-controls");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(filters).not.toHaveAttribute("open", "");
  await expect(page.locator(".earth-command-bar")).toBeVisible();
  await expect(page.locator(".earth-camera-readout")).toBeVisible();
  await expect(page.locator(".earth-map-tools")).toBeVisible();
  await expect(page.locator(".real-globe-stage canvas")).toBeVisible();
});

test("country selection keeps regional context in a close surface focus", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();

  await expect(page.locator(".earth-camera-readout")).toContainText("深度聚焦");
  await expect(page.locator(".earth-camera-readout")).toContainText("日本 Japan");
  await expect(page.locator(".right-panel-shell")).not.toHaveAttribute("inert", "");
  await expect(page.locator(".real-globe-stage")).toHaveAttribute(
    "data-camera-travelling",
    "false",
    { timeout: 5_000 }
  );
  const altitude = Number(
    await page.locator(".real-globe-stage").getAttribute("data-camera-altitude")
  );
  expect(altitude).toBeGreaterThanOrEqual(0.2);
  expect(altitude).toBeLessThanOrEqual(0.5);
});

test("world boundary layer keeps detailed geometry for all countries", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  await expect.poll(async () => Number(await stage.getAttribute("data-world-country-count"))).toBeGreaterThan(230);
  await expect(stage).toHaveAttribute("data-runtime-boundary-sampling", "false");
  const segmentCount = Number(
    await stage.getAttribute("data-world-boundary-segment-count")
  );
  expect(segmentCount).toBeGreaterThan(8_000);
});

test("country outlines remain visible throughout country focus travel", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();

  await expect(stage).toHaveAttribute("data-world-boundaries-visible", "true");
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", {
    timeout: 5_000
  });
  await expect(stage).toHaveAttribute("data-world-boundaries-visible", "true");
});

test("country focus does not block the main thread when detail rendering settles", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  await page.evaluate(() => {
    document.addEventListener(
      "pointerdown",
      () => {
        const startedAt = performance.now();
        window.setTimeout(() => {
          const globeStage = document.querySelector<HTMLElement>(".real-globe-stage");
          if (globeStage) {
            globeStage.dataset.postFocusTimerDrift = String(
              performance.now() - startedAt - 1_100
            );
          }
        }, 1_100);
      },
      { capture: true, once: true }
    );
  });

  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect(stage).toHaveAttribute("data-post-focus-timer-drift", /.+/, {
    timeout: 5_000
  });

  const timerDrift = Number(
    await stage.getAttribute("data-post-focus-timer-drift")
  );
  expect(timerDrift).toBeLessThan(250);
});

test("surface coordinate picking resolves a country without polygon meshes", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect(stage).toHaveAttribute("data-camera-travelling", "false", {
    timeout: 5_000
  });
  await expect(stage).toHaveAttribute("data-country-focus-x", /.+/);
  await expect(stage).toHaveAttribute("data-country-focus-y", /.+/);

  const focusX = Number(await stage.getAttribute("data-country-focus-x"));
  const focusY = Number(await stage.getAttribute("data-country-focus-y"));
  const canvasBounds = await stage.locator("canvas").boundingBox();
  expect(canvasBounds).not.toBeNull();
  await page.locator(".globe-game-marker").evaluateAll((markers) => {
    for (const marker of markers) {
      (marker as HTMLElement).style.pointerEvents = "none";
    }
  });
  const origins = [
    { x: focusX, y: focusY },
    { x: canvasBounds!.x + focusX, y: canvasBounds!.y + focusY }
  ];
  let resolvedCountry: string | null = null;

  for (const origin of origins) {
    for (const offsetY of [-60, 0, 60]) {
      for (const offsetX of [-60, 0, 60]) {
        await page.mouse.click(origin.x + offsetX, origin.y + offsetY);
        resolvedCountry = await stage.getAttribute("data-last-surface-country");
        if (resolvedCountry) break;
      }
      if (resolvedCountry) break;
    }
    if (resolvedCountry) break;
  }

  expect(resolvedCountry).toMatch(/^[A-Z]{2}$/);
});

test("wheel zoom settles without a main-thread restore stall", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const stage = page.locator(".real-globe-stage");

  await page.evaluate(() => {
    document.addEventListener(
      "wheel",
      () => {
        const startedAt = performance.now();
        window.setTimeout(() => {
          const globeStage = document.querySelector<HTMLElement>(".real-globe-stage");
          if (globeStage) {
            globeStage.dataset.postZoomTimerDrift = String(
              performance.now() - startedAt - 350
            );
          }
        }, 350);
      },
      { capture: true, once: true }
    );
  });

  const canvasBounds = await stage.locator("canvas").boundingBox();
  expect(canvasBounds).not.toBeNull();
  await page.mouse.move(
    canvasBounds!.x + canvasBounds!.width / 2,
    canvasBounds!.y + canvasBounds!.height / 2
  );
  await page.mouse.wheel(0, -280);
  await expect(stage).toHaveAttribute("data-post-zoom-timer-drift", /.+/);
  expect(Number(await stage.getAttribute("data-post-zoom-timer-drift"))).toBeLessThan(
    250
  );
});

test("rapid cross-region country selection keeps the final intent and canvas", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const canvas = page.locator(".real-globe-stage canvas");
  await canvas.evaluate((element) => { element.dataset.switchIdentity = "stable"; });
  const japan = page.locator(".focus-preset-group button").filter({ hasText: /^Japan$/ });

  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")];
    const japanButton = buttons.find((button) => button.textContent?.trim() === "Japan");
    const usButton = buttons.find((button) => button.textContent?.trim() === "United States");
    for (let index = 0; index < 10; index += 1) (index % 2 ? usButton : japanButton)?.click();
    japanButton?.click();
  });

  await expect(japan).toHaveAttribute("aria-pressed", "true", { timeout: 700 });
  await expect(page.locator(".region-preset-group button").filter({ hasText: /^East Asia$/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".earth-current-context")).toContainText("日本 Japan");
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
  await expect(page.locator(".focus-preset-group button").filter({ hasText: /^Japan$/ })).toHaveAttribute("aria-pressed", "true", { timeout: 700 });
  await expect(page.locator(".earth-current-context")).toContainText("日本 Japan");
});

test("representative country markers stay bounded, aggregate truthfully, and return stably", async ({ page }) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const names = ["Sweden", "Norway", "Netherlands", "Belgium", "Japan"];
  for (const name of names) {
    await page.evaluate((countryName) => {
      [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")]
        .find((button) => button.textContent?.trim() === countryName)?.click();
    }, name);
    await expect(page.locator(".earth-current-context")).toContainText(name, { timeout: 3000 });
    await expect(page.locator(".real-globe-stage canvas")).toBeVisible();
  }

  const aggregate = page.locator(".globe-game-marker[data-overflow-count]:not([data-overflow-count='0'])").first();
  await expect(aggregate).toBeVisible();
  await expect(page.locator(".real-globe-stage")).toHaveAttribute(
    "data-camera-travelling",
    "false",
    { timeout: 5_000 }
  );
  expect(Number(await aggregate.getAttribute("data-overflow-count"))).toBeGreaterThan(0);
  const coverImage = page.locator(".globe-game-cover-image").first();
  await coverImage.evaluate((image) => {
    (image as HTMLImageElement).src = "/covers/missing-e2e-cover.webp";
    image.dispatchEvent(new Event("error"));
  });
  await expect(coverImage).toHaveAttribute("data-fallback-applied", "true");
  const fallbackBox = await coverImage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { height: bounds.height, width: bounds.width };
  });
  expect(fallbackBox.width).toBeGreaterThan(0);
  expect(fallbackBox.height).toBeGreaterThan(0);
  const firstPosition = await aggregate.evaluate((element) => [element.dataset.markerLat, element.dataset.markerLng]);
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".focus-preset-group button")];
    buttons.find((button) => button.textContent?.trim() === "Sweden")?.click();
    buttons.find((button) => button.textContent?.trim() === "Japan")?.click();
  });
  await expect(page.locator(".earth-camera-readout")).toContainText("日本 Japan");
  expect(firstPosition.every(Boolean)).toBe(true);
});

test("Earth uses the archival observatory theme with keyboard focus", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await enterEarthExplorer(page);
  const tokens = await page.locator(".game-earth-shell.is-earth-mode").evaluate((element) => {
    const style = getComputedStyle(element);
    const commandBar = getComputedStyle(document.querySelector(".earth-command-bar")!);
    return {
      agedGold: style.getPropertyValue("--earth-aged-gold").trim(),
      brass: style.getPropertyValue("--earth-brass").trim(),
      charcoal: style.getPropertyValue("--earth-charcoal").trim(),
      oxblood: style.getPropertyValue("--earth-oxblood").trim(),
      spatial: style.getPropertyValue("--earth-spatial-feedback").trim(),
      warmWhite: style.getPropertyValue("--earth-warm-white").trim(),
      commandRadius: commandBar.borderTopLeftRadius
    };
  });
  expect(tokens).toEqual({
    agedGold: "#c3a46a",
    brass: "#a77b42",
    charcoal: "#0b0d0c",
    commandRadius: "5px",
    oxblood: "#6f2928",
    spatial: "#6d9a92",
    warmWhite: "#eee7d8"
  });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("reduced motion and Hub/Archive remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterEarthExplorer(page);
  await page.locator(".earth-location-picker > summary").click();
  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect.poll(() => page.locator(".globe-game-marker").count()).toBeGreaterThan(0);
  const transitionDuration = await page.locator(".globe-game-marker").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);
  await page.getByRole("button", { name: "返回游戏星图" }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='hub']")).toBeVisible();
  await page.getByRole("button", { name: /Game Chronicle/i }).click();
  await expect(page.locator(".game-earth-shell[data-main-view='archive']")).toBeVisible();
});

async function readEarthContractState(page: import("playwright/test").Page) {
  return page.locator(".game-earth-shell").evaluate((element) => ({
    country: element.getAttribute("data-earth-country"),
    coverSize: element.getAttribute("data-earth-cover-size"),
    game: element.getAttribute("data-earth-game"),
    markerView: element.getAttribute("data-earth-marker-view"),
    projection: element.getAttribute("data-earth-projection"),
    ratingRange: element.getAttribute("data-earth-rating-range"),
    region: element.getAttribute("data-earth-region"),
    revision: element.getAttribute("data-earth-selection-revision"),
    yearRange: element.getAttribute("data-earth-year-range")
  }));
}

async function readResponsiveGlobeBounds(page: import("playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(".real-globe-stage canvas");
    const header = document.querySelector<HTMLElement>(".earth-command-bar");
    const stage = document.querySelector<HTMLElement>(".real-globe-stage");
    return {
      canvasCount: document.querySelectorAll(".real-globe-stage canvas").length,
      canvasWidth: canvas?.getBoundingClientRect().width ?? 0,
      documentWidth: document.documentElement.scrollWidth,
      headerWidth: header?.getBoundingClientRect().width ?? 0,
      stageWidth: stage?.getBoundingClientRect().width ?? 0,
      viewportWidth: window.innerWidth
    };
  });
}
