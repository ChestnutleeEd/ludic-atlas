import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeGeographicFeature, getComponentAwareMarkerSlots, allocateComponentMarkerBudget } from "../src/lib/geography.ts";
import { GeographyRepository } from "../src/lib/geographyRepository.ts";
import { applyScreenSpaceCollision, calculateMarkerBudget, quantizeSettledView, stabilizeMarkerBudget } from "../src/lib/markerLayout.ts";
import { getCountryCodeFromFeature, isCoordinateInsideFeature, type CountryGeoJson, type CountryGeoJsonFeature } from "../src/lib/geo.ts";
import type { Country } from "../src/types/game.ts";

const safeViewport = { availableHeight: 680, availableWidth: 1100, bottom: 700, centerX: 570, centerY: 360, height: 720, left: 20, right: 1120, top: 20, width: 1280 };

test("dynamic budgets cover global, large, medium and tiny bands with truthful overflow", () => {
  const common = { altitude: 0.3, coverSize: 72, filteredGameCount: 35, performanceTier: "high" as const, projectionMode: "globe" as const, settled: true };
  assert.equal(calculateMarkerBudget({ ...common, explorationLevel: "global", projectedAreaPx: 200_000 }).budget, 2);
  const large = calculateMarkerBudget({ ...common, explorationLevel: "country", projectedAreaPx: 120_000 });
  const medium = calculateMarkerBudget({ ...common, explorationLevel: "country", projectedAreaPx: 30_000 });
  const tiny = calculateMarkerBudget({ ...common, explorationLevel: "country", projectedAreaPx: 2_000 });
  assert.ok(large.budget >= 18 && large.budget <= 24);
  assert.ok(medium.budget >= 10 && medium.budget <= 16);
  assert.ok(tiny.budget >= 1 && tiny.budget <= 4);
  assert.equal(calculateMarkerBudget({ ...common, explorationLevel: "country", geographicArea: 3, projectedAreaPx: 200_000 }).sizeClass, "tiny");
  assert.equal(large.overflowCount, 35 - large.budget);
  assert.ok(calculateMarkerBudget({ ...common, coverSize: 120, explorationLevel: "country", projectedAreaPx: 30_000 }).budget <= medium.budget);
  assert.ok(calculateMarkerBudget({ ...common, explorationLevel: "country", filteredGameCount: 1000, projectedAreaPx: 1_000_000 }).budget <= 24);
});

test("France mainland, Poland and Japan normalize into stable component-aware slots", async () => {
  const source = JSON.parse(await readFile(new URL("../public/data/countries.geojson", import.meta.url), "utf8")) as CountryGeoJson;
  const catalog: Record<string, Country> = {
    FR: { code: "FR", name: "France", nameZh: "法国", region: "Europe", latitude: 46.23, longitude: 2.21 },
    PL: { code: "PL", name: "Poland", nameZh: "波兰", region: "Europe", latitude: 51.92, longitude: 19.15 },
    JP: { code: "JP", name: "Japan", nameZh: "日本", region: "East Asia", latitude: 36.2, longitude: 138.25 }
  };
  for (const code of Object.keys(catalog)) {
    const raw = source.features.find((feature) => getCountryCodeFromFeature(feature) === code)!;
    const normalized = normalizeGeographicFeature(raw, catalog[code], { bundle: code, lod: "country" });
    const slots = getComponentAwareMarkerSlots(normalized, code === "FR" ? 14 : 8);
    assert.ok(normalized.components.length >= 1);
    assert.ok(slots.length >= (code === "FR" ? 10 : 5));
    assert.deepEqual(slots, getComponentAwareMarkerSlots(normalized, code === "FR" ? 14 : 8));
    assert.ok(slots.every((slot) => isCoordinateInsideFeature(raw, slot)));
    if (code === "FR") {
      const mainland = normalized.components.find((component) => component.id === normalized.mainComponentId)!;
      assert.equal(mainland.containsCatalogAnchor, true);
      assert.ok(allocateComponentMarkerBudget(normalized, 14).get(mainland.id)! >= 12);
      assert.ok(slots.filter((slot) => slot.lng > -6 && slot.lng < 10 && slot.lat > 40 && slot.lat < 52).length >= 10);
    }
  }
});

test("holes, remote components, tiny fallback and date-line rings remain valid", () => {
  const country = { code: "FX", name: "Fixture", nameZh: "测试", region: "Fixture", latitude: 5, longitude: 5 };
  const feature: CountryGeoJsonFeature = { type: "Feature", properties: { "ISO3166-1-Alpha-2": "FX" }, geometry: { type: "MultiPolygon", coordinates: [
    [[[0,0],[12,0],[12,12],[0,12],[0,0]],[[4,4],[8,4],[8,8],[4,8],[4,4]]],
    [[[150,-2],[151,-2],[151,-1],[150,-1],[150,-2]]]
  ] } };
  const normalized = normalizeGeographicFeature(feature, country, { bundle: "fixture", lod: "country" });
  assert.equal(normalized.mainComponentId, "FX:0");
  assert.ok(getComponentAwareMarkerSlots(normalized, 8).every((slot) => isCoordinateInsideFeature(feature, slot)));
  const dateLine: CountryGeoJsonFeature = { ...feature, geometry: { type: "Polygon", coordinates: [[[170,-8],[-170,-8],[-170,8],[170,8],[170,-8]]] } };
  const dateNormalized = normalizeGeographicFeature(dateLine, { ...country, longitude: 179, latitude: 0 }, { bundle: "date", lod: "country" });
  assert.ok(dateNormalized.components[0].bounds.maxLng - dateNormalized.components[0].bounds.minLng <= 20);
});

test("grid hash collision honors safe viewport and deterministic overflow", () => {
  const candidates = [0, 1, 2].map((id) => ({ id: String(id), payload: id, x: id < 2 ? 100 : 500, y: 100, width: 80, height: 100 }));
  const first = applyScreenSpaceCollision({ candidates, safeViewport, protectedRects: [{ left: 450, right: 550, top: 40, bottom: 160 }] });
  const second = applyScreenSpaceCollision({ candidates, safeViewport, protectedRects: [{ left: 450, right: 550, top: 40, bottom: 160 }] });
  assert.deepEqual(first, second);
  assert.deepEqual(first.visible.map((item) => item.id), ["0"]);
  assert.equal(first.overflow.length, 2);
});

test("settled quantization and hysteresis reject insignificant zoom changes", () => {
  assert.deepEqual(quantizeSettledView({ altitude: 0.301, coverSize: 71, height: 713, width: 1281 }), quantizeSettledView({ altitude: 0.309, coverSize: 72, height: 715, width: 1279 }));
  assert.equal(stabilizeMarkerBudget(10, 11), 10);
  assert.equal(stabilizeMarkerBudget(10, 13), 13);
});

test("repository deduplicates requests, bounds geometry, retries failures and preserves fallback", async () => {
  const feature: CountryGeoJsonFeature = { type: "Feature", properties: { "ISO3166-1-Alpha-2": "FX" }, geometry: { type: "Polygon", coordinates: [[[0,0],[2,0],[2,2],[0,2],[0,0]]] } };
  let requests = 0;
  const repository = new GeographyRepository(async () => { requests += 1; return { type: "FeatureCollection", features: [feature] }; }, 2, 1);
  const countries = [{ code: "FX", name: "Fixture", nameZh: "测试", region: "Fixture", latitude: 1, longitude: 1 }];
  const [one, two] = await Promise.all([repository.load("global", "global", countries), repository.load("global", "global", countries)]);
  assert.equal(one, two); assert.equal(requests, 1);
  let disposed = 0;
  repository.getOrCreateGeometry("one", () => ({ dispose: () => { disposed += 1; } }));
  repository.getOrCreateGeometry("two", () => ({ dispose: () => { disposed += 1; } }));
  assert.equal(disposed, 1);
  const failing = new GeographyRepository(async () => { throw new Error("offline"); });
  assert.equal(await failing.loadWithFallback("country", "FX", countries, one), one);
  await assert.rejects(failing.load("country", "FX", countries));
});

test("generated LOD artifacts are closed, ordered by detail and avoid runtime index sampling", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/data/earth-lod/manifest.json", import.meta.url), "utf8"));
  const global = manifest.outputs.find((entry: { path: string }) => entry.path === "global.geojson");
  const country = manifest.outputs.find((entry: { path: string }) => entry.path === "countries/FR.geojson");
  assert.ok(global.bytes < manifest.source.bytes);
  assert.ok(country.coordinateCount > 0 && global.coordinateCount > 0);
  const source = await readFile(new URL("../src/components/globe/GameGlobe.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sampleBoundaryRing|maxPointsPerRing/);
});
