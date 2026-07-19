import type { CountryGeoJsonFeature, GlobeCoordinates } from "./geo.ts";
import type { Country } from "../types/game.ts";

export type GeographyLod = "global" | "region" | "country";

export type GeographicBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type NormalizedGeographicComponent = {
  area: number;
  bounds: GeographicBounds;
  containsCatalogAnchor: boolean;
  id: string;
  interiorAnchor: GlobeCoordinates;
  rings: number[][][];
  score: number;
};

export type NormalizedGeographicFeature = {
  components: NormalizedGeographicComponent[];
  coordinateCount: number;
  countryCode: string;
  id: string;
  mainComponentId: string | null;
  source: { bundle: string; lod: GeographyLod };
};

export function normalizeGeographicFeature(
  feature: CountryGeoJsonFeature,
  country: Pick<Country, "code" | "latitude" | "longitude">,
  source: NormalizedGeographicFeature["source"]
): NormalizedGeographicFeature {
  const polygons = getRawPolygons(feature);
  const rawComponents = polygons.map((polygon, index) => {
    const rings = normalizeRings(polygon, country.longitude);
    const bounds = getBounds(rings);
    const area = Math.max(0, polygonArea(rings));
    const anchorPoint = { lat: country.latitude, lng: unwrap(country.longitude, country.longitude) };
    const containsCatalogAnchor = Boolean(bounds && pointInPolygon(anchorPoint, rings));
    const interiorAnchor = findInteriorAnchor(rings, bounds, containsCatalogAnchor ? anchorPoint : null);
    const distance = coordinateDistance(interiorAnchor, anchorPoint);
    return { area, bounds, containsCatalogAnchor, distance, id: `${country.code}:${index}`, interiorAnchor, rings };
  }).filter((component) => component.bounds !== null);
  const maxArea = Math.max(1e-9, ...rawComponents.map((component) => component.area));
  const maxDistance = Math.max(1, ...rawComponents.map((component) => component.distance));
  const components = rawComponents.map((component) => ({
    area: component.area,
    bounds: component.bounds!,
    containsCatalogAnchor: component.containsCatalogAnchor,
    id: component.id,
    interiorAnchor: { lat: component.interiorAnchor.lat, lng: wrap(component.interiorAnchor.lng) },
    rings: component.rings,
    score:
      (component.area / maxArea) * 0.65 +
      (component.containsCatalogAnchor ? 0.25 : 0) +
      (1 - component.distance / maxDistance) * 0.1
  })).sort((a, b) => b.score - a.score || b.area - a.area || a.id.localeCompare(b.id));

  return {
    components,
    coordinateCount: components.reduce((total, component) => total + component.rings.flat().length, 0),
    countryCode: country.code,
    id: country.code,
    mainComponentId: components[0]?.id ?? null,
    source
  };
}

export function allocateComponentMarkerBudget(
  feature: NormalizedGeographicFeature,
  budget: number
) {
  const allocations = new Map<string, number>();
  if (budget <= 0 || feature.components.length === 0) return allocations;
  const main = feature.components[0];
  const territoryBudget = Math.min(2, Math.max(0, Math.floor(budget * 0.15)), feature.components.length - 1);
  allocations.set(main.id, budget - territoryBudget);
  for (const component of feature.components.slice(1, 1 + territoryBudget)) allocations.set(component.id, 1);
  return allocations;
}

export function getComponentAwareMarkerSlots(
  feature: NormalizedGeographicFeature,
  capacity: number,
  candidateLimit = capacity
): GlobeCoordinates[] {
  const allocations = allocateComponentMarkerBudget(feature, capacity);
  return feature.components.flatMap((component) =>
    selectInteriorCandidates(
      component,
      allocations.get(component.id) ?? 0,
      candidateLimit
    )
  ).slice(0, capacity);
}

function selectInteriorCandidates(
  component: NormalizedGeographicComponent,
  count: number,
  candidateLimit: number
) {
  if (count <= 0) return [];
  const { bounds, rings } = component;
  const grid = Math.min(
    64,
    Math.max(14, Math.ceil(Math.sqrt(Math.max(count, candidateLimit) * 18)))
  );
  const candidates: Array<GlobeCoordinates & { clearance: number }> = [];
  for (let row = 0; row < grid; row += 1) {
    const lat = bounds.minLat + ((row + 0.5) / grid) * Math.max(1e-6, bounds.maxLat - bounds.minLat);
    for (let column = 0; column < grid; column += 1) {
      const lng = bounds.minLng + ((column + 0.5) / grid) * Math.max(1e-6, bounds.maxLng - bounds.minLng);
      const point = { lat, lng };
      if (pointInPolygon(point, rings)) candidates.push({ ...point, clearance: boundaryDistance(point, rings) });
    }
  }
  if (candidates.length === 0) return [component.interiorAnchor].slice(0, count);
  candidates.sort((a, b) => b.clearance - a.clearance || a.lat - b.lat || a.lng - b.lng);
  const selected = [candidates[0]];
  while (selected.length < Math.min(count, candidates.length)) {
    let best = candidates[0];
    let bestScore = -1;
    for (const candidate of candidates) {
      if (selected.includes(candidate)) continue;
      const separation = Math.min(...selected.map((slot) => coordinateDistance(slot, candidate)));
      const score = separation + candidate.clearance * 0.35;
      if (score > bestScore) { best = candidate; bestScore = score; }
    }
    selected.push(best);
  }
  return selected.map(({ lat, lng }) => ({ lat, lng: wrap(lng) }));
}

function getRawPolygons(feature: CountryGeoJsonFeature): unknown[] {
  const coordinates = feature.geometry.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return feature.geometry.type === "Polygon" ? [coordinates] : feature.geometry.type === "MultiPolygon" ? coordinates : [];
}

function normalizeRings(value: unknown, reference: number): number[][][] {
  if (!Array.isArray(value)) return [];
  return value.map((ring) => {
    if (!Array.isArray(ring)) return [];
    let previous = reference;
    const normalized = ring.flatMap((point) => {
      if (!Array.isArray(point) || typeof point[0] !== "number" || typeof point[1] !== "number") return [];
      const lng = unwrap(point[0], previous); previous = lng; return [[lng, point[1]]];
    });
    if (normalized.length >= 3 && (normalized[0][0] !== normalized.at(-1)?.[0] || normalized[0][1] !== normalized.at(-1)?.[1])) normalized.push([...normalized[0]]);
    return normalized;
  }).filter((ring) => ring.length >= 4);
}

function getBounds(rings: number[][][]): GeographicBounds | null {
  const points = rings.flat();
  if (points.length === 0) return null;
  return points.reduce((bounds, point) => ({
    minLng: Math.min(bounds.minLng, point[0]), maxLng: Math.max(bounds.maxLng, point[0]),
    minLat: Math.min(bounds.minLat, point[1]), maxLat: Math.max(bounds.maxLat, point[1])
  }), { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity });
}

function polygonArea(rings: number[][][]) {
  return rings.reduce((total, ring, index) => total + (index === 0 ? 1 : -1) * Math.abs(ringArea(ring)), 0);
}

function ringArea(ring: number[][]) {
  const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / Math.max(1, ring.length);
  const scale = Math.max(0.15, Math.cos(meanLat * Math.PI / 180));
  let area = 0;
  for (let index = 1; index < ring.length; index += 1) area += (ring[index - 1][0] * ring[index][1] - ring[index][0] * ring[index - 1][1]) * scale;
  return area / 2;
}

function findInteriorAnchor(rings: number[][][], bounds: GeographicBounds | null, preferred: GlobeCoordinates | null) {
  if (preferred && pointInPolygon(preferred, rings)) return preferred;
  if (!bounds) return { lat: 0, lng: 0 };
  let best = { lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 };
  let clearance = pointInPolygon(best, rings) ? boundaryDistance(best, rings) : -1;
  for (let row = 0; row < 20; row += 1) for (let column = 0; column < 20; column += 1) {
    const point = { lat: bounds.minLat + ((row + 0.5) / 20) * (bounds.maxLat - bounds.minLat), lng: bounds.minLng + ((column + 0.5) / 20) * (bounds.maxLng - bounds.minLng) };
    if (!pointInPolygon(point, rings)) continue;
    const next = boundaryDistance(point, rings);
    if (next > clearance) { best = point; clearance = next; }
  }
  return best;
}

function pointInPolygon(point: GlobeCoordinates, rings: number[][][]) {
  return rings.length > 0 && pointInRing(point, rings[0]) && !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function pointInRing(point: GlobeCoordinates, ring: number[][]) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const a = ring[current], b = ring[previous];
    if ((a[1] > point.lat) !== (b[1] > point.lat) && point.lng < ((b[0] - a[0]) * (point.lat - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function boundaryDistance(point: GlobeCoordinates, rings: number[][][]) {
  let minimum = Infinity;
  const scale = Math.max(0.25, Math.cos(point.lat * Math.PI / 180));
  for (const ring of rings) for (let index = 1; index < ring.length; index += 1) {
    const a = ring[index - 1], b = ring[index];
    const px = point.lng * scale, py = point.lat, ax = a[0] * scale, ay = a[1], bx = b[0] * scale, by = b[1];
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const ratio = length === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / length));
    minimum = Math.min(minimum, Math.hypot(px - ax - ratio * dx, py - ay - ratio * dy));
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

function coordinateDistance(a: GlobeCoordinates, b: GlobeCoordinates) {
  const scale = Math.max(0.25, Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180));
  return Math.hypot((a.lng - b.lng) * scale, a.lat - b.lat);
}

function unwrap(value: number, reference: number) { let result = value; while (result - reference > 180) result -= 360; while (result - reference < -180) result += 360; return result; }
function wrap(value: number) { let result = value; while (result > 180) result -= 360; while (result < -180) result += 360; return result; }
