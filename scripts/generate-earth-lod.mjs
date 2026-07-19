import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const sourcePath = new URL("../public/data/countries.geojson", import.meta.url);
const outputRoot = new URL("../public/data/earth-lod/", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const parameters = { global: 0.7, region: 0.065, country: 0.012 };
const outputs = [];
const countryNameToCode = { France: "FR", Norway: "NO", "United States of America": "US", "United Kingdom": "GB", "South Korea": "KR", Russia: "RU", China: "CN", Czechia: "CZ" };

const globalCollection = collection(source.features.map((feature) => simplifyFeature(feature, parameters.global)));
await emit("global.geojson", globalCollection, "global", parameters.global);

const regions = new Map();
for (const feature of source.features) {
  const id = classifyRegion(feature);
  const entries = regions.get(id) ?? [];
  entries.push(simplifyFeature(feature, parameters.region));
  regions.set(id, entries);
  const alpha2 = feature.properties?.["ISO3166-1-Alpha-2"];
  const code = alpha2 && alpha2 !== "-99" ? alpha2 : countryNameToCode[feature.properties?.name];
  if (typeof code === "string" && code !== "-99") await emit(`countries/${code}.geojson`, collection([simplifyFeature(feature, parameters.country)]), "country", parameters.country);
}
for (const [region, features] of [...regions].sort(([a], [b]) => a.localeCompare(b))) await emit(`regions/${region}.geojson`, collection(features), "region", parameters.region);

const sourceBytes = (await readFile(sourcePath)).byteLength;
const manifest = {
  generatedBy: "scripts/generate-earth-lod.mjs",
  parameters,
  source: { bytes: sourceBytes, coordinateCount: countCoordinates(source), path: "public/data/countries.geojson", sha256: createHash("sha256").update(await readFile(sourcePath)).digest("hex") },
  outputs: outputs.sort((a, b) => a.path.localeCompare(b.path))
};
await emitRaw("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ files: outputs.length + 1, sourceBytes, outputs }, null, 2)}\n`);

function collection(features) { return { type: "FeatureCollection", features }; }

function simplifyFeature(feature, tolerance) {
  const geometry = feature.geometry;
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return feature;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const simplified = polygons.map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)).filter((ring) => ring.length >= 4)).filter((polygon) => polygon.length > 0);
  return { ...feature, geometry: { ...geometry, coordinates: geometry.type === "Polygon" ? simplified[0] ?? [] : simplified } };
}

function simplifyRing(ring, tolerance) {
  if (!Array.isArray(ring) || ring.length < 5) return ring;
  const closed = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1];
  const points = closed ? ring.slice(0, -1) : ring;
  let split = 1, maxDistance = -1;
  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.hypot(points[index][0] - points[0][0], points[index][1] - points[0][1]);
    if (distance > maxDistance) { maxDistance = distance; split = index; }
  }
  const firstArc = rdp(points.slice(0, split + 1), tolerance);
  const secondArc = rdp([...points.slice(split), points[0]], tolerance);
  const result = [...firstArc.slice(0, -1), ...secondArc];
  if (result.length < 4) {
    const triangle = [points[0], points[Math.floor(points.length / 3)], points[Math.floor(points.length * 2 / 3)]];
    return [...triangle, [...triangle[0]]];
  }
  if (result[0][0] !== result.at(-1)[0] || result[0][1] !== result.at(-1)[1]) result.push([...result[0]]);
  return result;
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points;
  const first = points[0], last = points.at(-1); let max = -1, split = -1;
  for (let index = 1; index < points.length - 1; index += 1) { const distance = segmentDistance(points[index], first, last); if (distance > max) { max = distance; split = index; } }
  if (max <= tolerance || split < 0) return [first, last];
  return [...rdp(points.slice(0, split + 1), tolerance).slice(0, -1), ...rdp(points.slice(split), tolerance)];
}

function segmentDistance(point, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1], length = dx * dx + dy * dy;
  const ratio = length === 0 ? 0 : Math.min(1, Math.max(0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length));
  return Math.hypot(point[0] - start[0] - ratio * dx, point[1] - start[1] - ratio * dy);
}

function classifyRegion(feature) {
  const [lng, lat] = featureCenter(feature);
  if (lat < -10 && lng > 105) return "oceania";
  if (lng < -30) return lat < 12 ? "latinAmerica" : "northAmerica";
  if (lng >= -25 && lng < 45 && lat >= 34) return "europe";
  if (lng >= 100) return "eastAsia";
  if (lng >= 60 && lng < 100) return "southAsia";
  if (lng >= 25 && lng < 60 && lat >= 12) return "middleEast";
  return "global";
}

function featureCenter(feature) {
  const points = flattenCoordinates(feature.geometry?.coordinates).filter((point) => Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number");
  if (points.length === 0) return [0, 0];
  return [points.reduce((sum, p) => sum + p[0], 0) / points.length, points.reduce((sum, p) => sum + p[1], 0) / points.length];
}

function flattenCoordinates(value) { return Array.isArray(value) && typeof value[0] === "number" ? [value] : Array.isArray(value) ? value.flatMap(flattenCoordinates) : []; }
function countCoordinates(value) {
  if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") return 1;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countCoordinates(item), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((total, item) => total + countCoordinates(item), 0);
  return 0;
}

async function emit(path, value, lod, tolerance) {
  const text = `${JSON.stringify(value)}\n`;
  await emitRaw(path, text);
  outputs.push({ bytes: Buffer.byteLength(text), coordinateCount: countCoordinates(value), featureCount: value.features.length, lod, path, sha256: createHash("sha256").update(text).digest("hex"), tolerance });
}

async function emitRaw(path, text) { const target = join(outputRoot.pathname, path); await mkdir(dirname(target), { recursive: true }); await writeFile(target, text); }
