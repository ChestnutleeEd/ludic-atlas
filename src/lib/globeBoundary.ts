import type { CountryGeoJsonFeature } from "./geo.ts";

export type BoundaryBuildResult = {
  maxRenderedArcDegrees: number;
  maxSourceArcDegrees: number;
  positions: number[];
  ringCount: number;
  segmentCount: number;
};

type UnitVector = { x: number; y: number; z: number };

/** Builds paired LineSegments vertices without ever joining separate GeoJSON rings. */
export function buildGlobeBoundaryPositions(
  features: CountryGeoJsonFeature[],
  altitude: number,
  maxArcDegrees = 0.75,
  globeRadius = 100
): BoundaryBuildResult {
  const positions: number[] = [];
  let maxRenderedArcDegrees = 0;
  let maxSourceArcDegrees = 0;
  let ringCount = 0;
  let segmentCount = 0;

  for (const feature of features) {
    for (const ring of getIndependentBoundaryRings(feature)) {
      if (ring.length < 2) continue;
      ringCount += 1;

      for (let index = 1; index < ring.length; index += 1) {
        const start = coordinateToUnitVector(ring[index - 1]);
        const end = coordinateToUnitVector(ring[index]);
        if (!start || !end) continue;
        const sourceArc = angularDistanceDegrees(start, end);
        if (!Number.isFinite(sourceArc) || sourceArc === 0) continue;
        maxSourceArcDegrees = Math.max(maxSourceArcDegrees, sourceArc);
        const subdivisions = Math.max(1, Math.ceil(sourceArc / maxArcDegrees));
        let previous = start;

        for (let step = 1; step <= subdivisions; step += 1) {
          const current = slerpUnitVectors(start, end, step / subdivisions);
          appendLineSegment(positions, previous, current, globeRadius * (1 + altitude));
          maxRenderedArcDegrees = Math.max(
            maxRenderedArcDegrees,
            angularDistanceDegrees(previous, current)
          );
          segmentCount += 1;
          previous = current;
        }
      }
    }
  }

  return { maxRenderedArcDegrees, maxSourceArcDegrees, positions, ringCount, segmentCount };
}

export function getIndependentBoundaryRings(
  feature: CountryGeoJsonFeature
): number[][][] {
  const coordinates = feature.geometry.coordinates;
  if (feature.geometry.type === "Polygon" && isPolygonCoordinates(coordinates)) {
    return coordinates;
  }
  if (feature.geometry.type === "MultiPolygon" && Array.isArray(coordinates)) {
    return coordinates.flatMap((polygon) =>
      isPolygonCoordinates(polygon) ? polygon : []
    );
  }
  return [];
}

function isPolygonCoordinates(value: unknown): value is number[][][] {
  return Array.isArray(value) && value.every(
    (ring) => Array.isArray(ring) && ring.every(
      (position) => Array.isArray(position) &&
        position.length >= 2 &&
        position.slice(0, 2).every((coordinate) =>
          typeof coordinate === "number" && Number.isFinite(coordinate)
        )
    )
  );
}

function coordinateToUnitVector(coordinate: number[]): UnitVector | null {
  const [lng, lat] = coordinate;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const phiSin = Math.sin(phi);
  return {
    x: phiSin * Math.cos(theta),
    y: Math.cos(phi),
    z: phiSin * Math.sin(theta)
  };
}

function slerpUnitVectors(start: UnitVector, end: UnitVector, ratio: number): UnitVector {
  const dot = clamp(start.x * end.x + start.y * end.y + start.z * end.z, -1, 1);
  const angle = Math.acos(dot);
  if (angle < 1e-7) return start;
  const sinAngle = Math.sin(angle);
  if (Math.abs(sinAngle) < 1e-7) {
    return normalize({
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
      z: start.z + (end.z - start.z) * ratio
    });
  }
  const startWeight = Math.sin((1 - ratio) * angle) / sinAngle;
  const endWeight = Math.sin(ratio * angle) / sinAngle;
  return normalize({
    x: start.x * startWeight + end.x * endWeight,
    y: start.y * startWeight + end.y * endWeight,
    z: start.z * startWeight + end.z * endWeight
  });
}

function angularDistanceDegrees(start: UnitVector, end: UnitVector) {
  return Math.acos(clamp(start.x * end.x + start.y * end.y + start.z * end.z, -1, 1)) * 180 / Math.PI;
}

function appendLineSegment(positions: number[], start: UnitVector, end: UnitVector, radius: number) {
  positions.push(
    start.x * radius, start.y * radius, start.z * radius,
    end.x * radius, end.y * radius, end.z * radius
  );
}

function normalize(vector: UnitVector): UnitVector {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
