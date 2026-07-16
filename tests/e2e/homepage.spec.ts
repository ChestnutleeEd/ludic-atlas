import { expect, test, type Page } from "playwright/test";

const desktopViewports = [
  { height: 768, width: 1366 },
  { height: 900, width: 1440 },
  { height: 1080, width: 1920 }
] as const;

async function openHomepage(page: Page) {
  await page.goto("/");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute(
    "data-main-view",
    "hub"
  );
  await expect(page.locator(".ludic-atlas-hub")).toBeVisible();
}

async function getHomepageMetrics(page: Page) {
  return page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return rect
        ? {
            bottom: rect.bottom,
            height: rect.height,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            width: rect.width
          }
        : null;
    };

    return {
      chronicle: bounds(".portal-card-chronicle"),
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      earth: bounds(".portal-card-earth"),
      grid: bounds(".hub-portal-grid"),
      masthead: bounds(".hub-masthead"),
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
}

for (const viewport of desktopViewports) {
  test(`homepage fits ${viewport.width}x${viewport.height} without scrolling`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await openHomepage(page);

    await expect(page.getByRole("heading", { name: /Ludic Atlas.*游戏星图/i })).toBeVisible();
    await expect(page.getByText("馆藏游戏", { exact: true })).toBeVisible();
    await expect(page.getByText("馆藏年份", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /进入地球探索/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /进入游戏编年馆/ })).toBeVisible();

    const metrics = await getHomepageMetrics(page);
    expect(metrics.masthead).not.toBeNull();
    expect(metrics.grid).not.toBeNull();
    expect(metrics.earth).not.toBeNull();
    expect(metrics.chronicle).not.toBeNull();
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

    for (const region of [metrics.masthead!, metrics.earth!, metrics.chronicle!]) {
      expect(region.top).toBeGreaterThanOrEqual(0);
      expect(region.left).toBeGreaterThanOrEqual(0);
      expect(region.right).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(region.bottom).toBeLessThanOrEqual(metrics.clientHeight + 1);
    }

    const earthShare = metrics.earth!.width /
      (metrics.earth!.width + metrics.chronicle!.width);
    expect(earthShare).toBeGreaterThanOrEqual(0.56);
    expect(earthShare).toBeLessThanOrEqual(0.6);

    if (viewport.width === 1920) {
      expect(metrics.grid!.width).toBeGreaterThan(viewport.width * 0.95);
    }
  });
}

test("both full entrance buttons preserve local view switching and pathname", async ({
  page
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openHomepage(page);
  const initialPathname = new URL(page.url()).pathname;

  await page.getByRole("button", { name: /进入地球探索/ }).click();
  await expect(page.locator(".game-earth-shell")).toHaveAttribute(
    "data-main-view",
    "earth"
  );
  await expect(page.locator(".earth-command-bar")).toBeVisible();
  await expect(page.locator(".ludic-atlas-hub")).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe(initialPathname);

  await page.goto("/");
  await page.getByRole("button", { name: /进入游戏编年馆/ }).click();
  await expect(page.locator(".game-earth-shell")).toHaveAttribute(
    "data-main-view",
    "archive"
  );
  await expect(page.locator(".archive-v2")).toBeVisible();
  await expect(page.locator(".ludic-atlas-hub")).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe(initialPathname);
});

test("responsive hero images load with correct crops and one lead preload", async ({
  page
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await openHomepage(page);

  const imageState = await page.locator(".portal-image").evaluateAll((images) =>
    images.map((image) => {
      const element = image as HTMLImageElement;
      const style = getComputedStyle(element);
      return {
        complete: element.complete,
        currentSrc: element.currentSrc,
        naturalHeight: element.naturalHeight,
        naturalWidth: element.naturalWidth,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        sizes: element.sizes
      };
    })
  );

  expect(imageState).toHaveLength(2);
  for (const image of imageState) {
    expect(image.complete).toBe(true);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.naturalHeight).toBeGreaterThan(0);
    expect(image.objectFit).toBe("cover");
    expect(image.currentSrc).toContain("/_next/image?");
    expect(image.currentSrc).not.toContain("w=3840");
    expect(image.sizes).toContain("max-width: 900px");
  }

  const preloads = await page.locator("link[rel='preload'][as='image']").evaluateAll(
    (links) => links.map((link) => link.getAttribute("imagesrcset") || "")
  );
  expect(preloads).toHaveLength(1);
  expect(preloads[0]).toContain("earth-explorer-archive.webp");
});

test("mobile homepage stacks naturally without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await openHomepage(page);

  const metrics = await getHomepageMetrics(page);
  expect(metrics.earth).not.toBeNull();
  expect(metrics.chronicle).not.toBeNull();
  expect(metrics.earth!.top).toBeLessThan(metrics.chronicle!.top);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.earth!.width).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.chronicle!.width).toBeLessThanOrEqual(metrics.clientWidth);

  const positions = await page.locator(".portal-image").evaluateAll((images) =>
    images.map((image) => getComputedStyle(image).objectPosition)
  );
  expect(positions).toEqual(["66% 42%", "69% 44%"]);

  await page.locator(".portal-card-chronicle").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: /进入游戏编年馆/ })).toBeVisible();
});

test("image failure keeps copy, focus treatment, and activation available", async ({
  page
}) => {
  await page.setViewportSize({ height: 768, width: 1366 });
  await openHomepage(page);

  const earthButton = page.getByRole("button", { name: /进入地球探索/ });
  await earthButton.locator("img").evaluate((image) => {
    const element = image as HTMLImageElement;
    element.removeAttribute("srcset");
    element.src = "/images/home/missing-e2e.webp";
  });

  await expect(earthButton).toHaveAttribute("data-image-state", "error");
  await expect(earthButton.getByText("地球探索", { exact: true })).toBeVisible();
  await earthButton.focus();
  await expect(earthButton).toBeFocused();
  await earthButton.press("Enter");
  await expect(page.locator(".game-earth-shell")).toHaveAttribute(
    "data-main-view",
    "earth"
  );
});

test("reduced motion disables decorative movement but preserves focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 768, width: 1366 });
  await openHomepage(page);

  const earthButton = page.getByRole("button", { name: /进入地球探索/ });
  await page.keyboard.press("Tab");
  await expect(earthButton).toBeFocused();

  const styles = await earthButton.evaluate((button) => {
    const image = button.querySelector<HTMLElement>(".portal-image")!;
    const buttonStyle = getComputedStyle(button);
    const imageStyle = getComputedStyle(image);
    return {
      imageTransitionDuration: imageStyle.transitionDuration,
      outlineStyle: buttonStyle.outlineStyle,
      outlineWidth: buttonStyle.outlineWidth
    };
  });

  expect(parseFloat(styles.imageTransitionDuration)).toBeLessThan(0.001);
  expect(styles.outlineStyle).not.toBe("none");
  expect(parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(3);
});
