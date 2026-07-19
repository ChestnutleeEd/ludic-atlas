import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildGlobeBoundaryPositions,
  getIndependentBoundaryRings
} from "../src/lib/globeBoundary.ts";
import type { CountryGeoJsonFeature } from "../src/lib/geo.ts";

test("Polygon holes and MultiPolygon components produce independent geodesic segments", () => {
  const feature: CountryGeoJsonFeature = {
    type: "Feature",
    properties: { "ISO3166-1-Alpha-2": "FX" },
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [
          [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
          [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]
        ],
        [[[120, -4], [124, -4], [124, 0], [120, 0], [120, -4]]]
      ]
    }
  };

  assert.equal(getIndependentBoundaryRings(feature).length, 3);
  const boundary = buildGlobeBoundaryPositions([feature], 0.002, 180);
  assert.equal(boundary.ringCount, 3);
  assert.equal(boundary.segmentCount, 12);
  assert.equal(boundary.positions.length, 12 * 6);
  assert.ok(boundary.maxSourceArcDegrees < 5);
});

test("long and antimeridian edges are subdivided onto the sphere", () => {
  const feature: CountryGeoJsonFeature = {
    type: "Feature",
    properties: { "ISO3166-1-Alpha-2": "DL" },
    geometry: {
      type: "Polygon",
      coordinates: [[[170, 8], [-170, 8], [-170, -8], [170, -8], [170, 8]]]
    }
  };
  const boundary = buildGlobeBoundaryPositions([feature], 0.002, 0.75);
  assert.ok(boundary.maxSourceArcDegrees > 15);
  assert.ok(boundary.maxRenderedArcDegrees <= 0.751);
  assert.ok(boundary.segmentCount > 80);
  for (let index = 0; index < boundary.positions.length; index += 3) {
    const radius = Math.hypot(
      boundary.positions[index],
      boundary.positions[index + 1],
      boundary.positions[index + 2]
    );
    assert.ok(Math.abs(radius - 100.2) < 0.001);
  }
});

test("representative Country LODs retain detailed coordinates and bounded rendered arcs", async () => {
  for (const code of ["FR", "PL", "CN", "RU", "JP", "ID"]) {
    const data = JSON.parse(await readFile(
      new URL(`../public/data/earth-lod/countries/${code}.geojson`, import.meta.url),
      "utf8"
    )) as { features: CountryGeoJsonFeature[] };
    const boundary = buildGlobeBoundaryPositions(data.features, 0.0045);
    assert.ok(boundary.ringCount > 0, `${code} has rings`);
    assert.ok(boundary.segmentCount > 100, `${code} retains country detail`);
    assert.ok(boundary.maxRenderedArcDegrees <= 0.751, `${code} has no long rendered chord`);
  }
});
