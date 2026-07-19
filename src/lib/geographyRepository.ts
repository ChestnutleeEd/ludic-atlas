import { normalizeGeographicFeature, type GeographyLod, type NormalizedGeographicFeature } from "./geography.ts";
import { getCountryCodeFromFeature, type CountryGeoJson, type CountryGeoJsonFeature } from "./geo.ts";
import type { Country } from "../types/game.ts";

export type GeographyResource = {
  features: CountryGeoJsonFeature[];
  key: string;
  lod: GeographyLod;
  normalized: Map<string, NormalizedGeographicFeature>;
};

type FetchJson = (path: string) => Promise<CountryGeoJson>;
type Disposable = { dispose: () => void };

export class GeographyRepository {
  private promises = new Map<string, Promise<GeographyResource>>();
  private resources = new Map<string, GeographyResource>();
  private geometry = new Map<string, Disposable>();
  private stats = { fetches: 0, geometryHits: 0, normalizedHits: 0, parses: 0 };
  private readonly fetchJson: FetchJson;
  private readonly maxResources: number;
  private readonly maxGeometry: number;

  constructor(fetchJson: FetchJson = defaultFetchJson, maxResources = 24, maxGeometry = 12) {
    this.fetchJson = fetchJson;
    this.maxResources = maxResources;
    this.maxGeometry = maxGeometry;
  }

  load(lod: GeographyLod, key: string, countries: Country[]) {
    const cacheKey = `${lod}:${key}`;
    const cached = this.resources.get(cacheKey);
    if (cached) { this.resources.delete(cacheKey); this.resources.set(cacheKey, cached); this.stats.normalizedHits += 1; return Promise.resolve(cached); }
    const pending = this.promises.get(cacheKey);
    if (pending) { this.stats.normalizedHits += 1; return pending; }
    const countryByCode = new Map(countries.map((country) => [country.code, country]));
    const promise = this.fetchJson(getGeographyPath(lod, key)).then((json) => {
      this.stats.fetches += 1; this.stats.parses += 1;
      const normalized = new Map<string, NormalizedGeographicFeature>();
      for (const feature of json.features) {
        const code = getCountryCodeFromFeature(feature); const country = code ? countryByCode.get(code) : null;
        if (code && country) normalized.set(code, normalizeGeographicFeature(feature, country, { bundle: key, lod }));
      }
      const resource = { features: json.features, key, lod, normalized };
      this.resources.set(cacheKey, resource); this.evictResources(); return resource;
    }).catch((error) => { this.promises.delete(cacheKey); throw error; });
    this.promises.set(cacheKey, promise);
    void promise.finally(() => this.promises.delete(cacheKey)).catch(() => undefined);
    return promise;
  }

  async loadWithFallback(lod: GeographyLod, key: string, countries: Country[], fallback: GeographyResource) {
    try { return await this.load(lod, key, countries); } catch { return fallback; }
  }

  getOrCreateGeometry<T extends Disposable>(key: string, create: () => T): T {
    const cached = this.geometry.get(key) as T | undefined;
    if (cached) { this.geometry.delete(key); this.geometry.set(key, cached); this.stats.geometryHits += 1; return cached; }
    const value = create(); this.geometry.set(key, value);
    while (this.geometry.size > this.maxGeometry) { const oldest = this.geometry.keys().next().value as string | undefined; if (!oldest) break; this.geometry.get(oldest)?.dispose(); this.geometry.delete(oldest); }
    return value;
  }

  getDiagnostics() { return { ...this.stats, geometryEntries: this.geometry.size, resourceEntries: this.resources.size }; }
  clear() { for (const value of this.geometry.values()) value.dispose(); this.geometry.clear(); this.promises.clear(); this.resources.clear(); }
  private evictResources() { while (this.resources.size > this.maxResources) { const oldest = this.resources.keys().next().value as string | undefined; if (!oldest) break; this.resources.delete(oldest); } }
}

export function getGeographyPath(lod: GeographyLod, key: string) {
  return lod === "global" ? "/data/earth-lod/global.geojson" : lod === "region" ? `/data/earth-lod/regions/${key}.geojson` : `/data/earth-lod/countries/${key}.geojson`;
}

async function defaultFetchJson(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Geography request failed: ${response.status}`);
  return response.json() as Promise<CountryGeoJson>;
}

export const geographyRepository = new GeographyRepository();
