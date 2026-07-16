import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getBoundaryDistance,
  getCountryFocusPointOfView,
  getCountrySafeMarkerSlots,
  indexCountryFeatures,
  isCoordinateInsideFeature,
  type CountryGeoJson
} from "../src/lib/geo.ts";
import { dateLineFeature, fixtureCountry, multiPolygonFeature, polygonWithHoleFeature } from "./fixtures/earth-geometry.ts";
import type { Country } from "../src/types/game.ts";

const world = JSON.parse(readFileSync(new URL("../public/data/world-countries-lite.geojson", import.meta.url), "utf8")) as CountryGeoJson;
const featureIndex = indexCountryFeatures(world.features);
const countryCodes = ["SE", "NO", "DK", "NL", "BE", "CH", "JP", "GB", "KR"];

test("nine representative countries produce deterministic interior slots", () => {
  for (const code of countryCodes) {
    const feature = featureIndex.get(code);
    assert.ok(feature, `${code} feature exists`);
    const country = countryFromFeature(code);
    const first = getCountrySafeMarkerSlots(feature, country, 12);
    const second = getCountrySafeMarkerSlots(feature, country, 12);
    assert.deepEqual(first, second);
    assert.ok(first.length > 0, `${code} has slots`);
    for (const slot of first) {
      assert.equal(isCoordinateInsideFeature(feature, slot), true, `${code} slot is inside`);
      assert.ok(getBoundaryDistance(feature, slot) > 0, `${code} slot clears boundary`);
    }
  }
});

test("surface country focus balances detail with surrounding country context", () => {
  for (const code of countryCodes) {
    const country = countryFromFeature(code);
    const surface = getCountryFocusPointOfView(country, "surface");
    const overview = getCountryFocusPointOfView(country, "overview");
    assert.ok(surface.altitude >= 0.26, `${code} keeps regional context`);
    assert.ok(surface.altitude <= 0.38, `${code} surface focus stays close`);
    assert.ok(surface.altitude < overview.altitude * 0.5, `${code} surface focus is distinct`);
  }
});

test("holes, multipolygons and date-line polygons remain valid", () => {
  for (const [feature, country] of [
    [polygonWithHoleFeature, fixtureCountry],
    [multiPolygonFeature, fixtureCountry],
    [dateLineFeature, { ...fixtureCountry, longitude: 179, latitude: 0 }]
  ] as const) {
    const slots = getCountrySafeMarkerSlots(feature, country, 10);
    assert.ok(slots.length > 0);
    assert.ok(slots.every((slot) => isCoordinateInsideFeature(feature, slot)));
  }
});

function countryFromFeature(code: string): Country {
  const seeds: Record<string, [number, number]> = {
    SE: [62, 15], NO: [62, 10], DK: [56, 10], NL: [52.2, 5.3], BE: [50.8, 4.5], CH: [46.8, 8.2], JP: [36, 138], GB: [54, -2], KR: [36, 128]
  };
  const [latitude, longitude] = seeds[code];
  return { code, latitude, longitude, name: code, nameZh: code, region: "" };
}
