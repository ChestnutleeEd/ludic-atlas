import assert from "node:assert/strict";
import test from "node:test";
import { createSafeViewport } from "../src/lib/safeViewport.ts";
import {
  applySafeViewportBias,
  getCountryFocusAltitude
} from "../src/lib/globeNavigation.ts";

test("safe viewport reports the remaining center after a right panel obstruction", () => {
  const viewport = createSafeViewport({ height: 800, rightInset: 390, width: 1400 });
  assert.deepEqual(viewport, {
    availableHeight: 800,
    availableWidth: 1010,
    bottom: 800,
    centerX: 505,
    centerY: 400,
    height: 800,
    left: 0,
    right: 1010,
    top: 0,
    width: 1400
  });
  const biased = applySafeViewportBias({ altitude: 0.25, lat: 48, lng: 5 }, viewport);
  assert.ok(biased.lng > 5);
});

test("country bounds produce stable bounded altitude for large and tiny countries", () => {
  const viewport = createSafeViewport({ height: 800, width: 1400 });
  const tiny = getCountryFocusAltitude(
    { maxLat: 50.2, maxLng: 4.8, minLat: 49.8, minLng: 4.2 },
    viewport,
    0.26
  );
  const large = getCountryFocusAltitude(
    { maxLat: 55, maxLng: 15, minLat: 42, minLng: -5 },
    viewport,
    0.26
  );
  assert.equal(tiny, getCountryFocusAltitude(
    { maxLat: 50.2, maxLng: 4.8, minLat: 49.8, minLng: 4.2 },
    viewport,
    0.26
  ));
  assert.ok(tiny >= 0.14 && tiny < large);
  assert.ok(large <= 0.68);
});
