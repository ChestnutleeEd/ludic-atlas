import { expect, type Page } from "playwright/test";

export async function enterEarthExplorer(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /进入地球探索|Earth Explorer/i }).click();
  await waitForEarthGlobe(page);
}

export async function waitForEarthGlobe(page: Page) {
  const shell = page.locator(".game-earth-shell[data-main-view='earth']");
  const stage = page.locator(".real-globe-stage");

  await expect(shell).toBeVisible();
  await expect(stage).toBeVisible();
  await expect(stage.locator("canvas")).toBeVisible({ timeout: 20_000 });
}

export async function getEarthViewportMetrics(page: Page) {
  return page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".atlas-globe-panel");
    const stage = document.querySelector<HTMLElement>(".real-globe-stage");
    const canvas = stage?.querySelector<HTMLCanvasElement>("canvas");
    const panelRect = panel?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();

    return {
      canvas: canvasRect
        ? { bottom: canvasRect.bottom, height: canvasRect.height, top: canvasRect.top }
        : null,
      documentHeight: document.documentElement.scrollHeight,
      panel: panelRect
        ? { bottom: panelRect.bottom, height: panelRect.height, top: panelRect.top }
        : null,
      stage: stageRect
        ? { bottom: stageRect.bottom, height: stageRect.height, top: stageRect.top }
        : null,
      viewportHeight: window.innerHeight
    };
  });
}

export function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}
