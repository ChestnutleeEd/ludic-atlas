import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage,
  hasRealGameCover
} from "@/lib/gameCover";
import { getCountryRegionId, type RegionConfig } from "@/lib/regions";
import type { Country, Game, RegionId } from "@/types/game";

export type EarthProPresetId =
  | "global"
  | "europe"
  | "eastAsia"
  | "northAmerica"
  | "JP"
  | "CN"
  | "US"
  | "KR";

export type EarthProLayoutKind = "grid" | "radial" | "spiral";

export type EarthProCameraView = {
  bearing: number;
  center: [number, number];
  pitch: number;
  zoom: number;
};

export type EarthProPreset = {
  camera: EarthProCameraView;
  countryCodes?: string[];
  id: EarthProPresetId;
  kind: "global" | "region" | "country";
  label: string;
  labelZh: string;
  layout: EarthProLayoutKind;
  maxCoverMarkers: number;
  maxMarkers: number;
  maxPerCountry: number;
  minPerCountry: number;
  regionId?: RegionId;
};

export type EarthProCountryMarker = {
  averageRating: number;
  country: Country;
  gameCount: number;
  id: string;
  position: [number, number];
  topGame: Game | null;
};

export type EarthProGameMarker = {
  country: Country;
  countryRank: number;
  game: Game;
  hasCover: boolean;
  id: string;
  markerStyle: "cover" | "dot";
  normalizedRating: number;
  position: [number, number];
  rank: number;
};

export type EarthProMarkerData = {
  countryMarkers: EarthProCountryMarker[];
  gameMarkers: EarthProGameMarker[];
  scopedCountries: Country[];
  scopedGames: Game[];
};

export const EARTH_PRO_PRESETS: EarthProPreset[] = [
  {
    camera: { bearing: -12, center: [18, 18], pitch: 34, zoom: 1.02 },
    id: "global",
    kind: "global",
    label: "Global",
    labelZh: "全球",
    layout: "grid",
    maxCoverMarkers: 16,
    maxMarkers: 28,
    maxPerCountry: 2,
    minPerCountry: 1
  },
  {
    camera: { bearing: -11, center: [12, 51], pitch: 58, zoom: 4.05 },
    id: "europe",
    kind: "region",
    label: "Europe",
    labelZh: "欧洲",
    layout: "grid",
    maxCoverMarkers: 24,
    maxMarkers: 42,
    maxPerCountry: 5,
    minPerCountry: 1,
    regionId: "europe"
  },
  {
    camera: { bearing: -28, center: [127, 36], pitch: 58, zoom: 4.15 },
    countryCodes: ["JP", "CN", "KR"],
    id: "eastAsia",
    kind: "region",
    label: "East Asia",
    labelZh: "东亚",
    layout: "spiral",
    maxCoverMarkers: 24,
    maxMarkers: 42,
    maxPerCountry: 9,
    minPerCountry: 2,
    regionId: "eastAsia"
  },
  {
    camera: { bearing: 18, center: [-98, 43], pitch: 56, zoom: 3.35 },
    countryCodes: ["US", "CA"],
    id: "northAmerica",
    kind: "region",
    label: "North America",
    labelZh: "北美",
    layout: "grid",
    maxCoverMarkers: 20,
    maxMarkers: 34,
    maxPerCountry: 12,
    minPerCountry: 2,
    regionId: "northAmerica"
  },
  {
    camera: { bearing: -26, center: [138.2, 36.4], pitch: 58, zoom: 5.45 },
    countryCodes: ["JP"],
    id: "JP",
    kind: "country",
    label: "Japan",
    labelZh: "日本",
    layout: "spiral",
    maxCoverMarkers: 18,
    maxMarkers: 24,
    maxPerCountry: 24,
    minPerCountry: 1
  },
  {
    camera: { bearing: -16, center: [104.3, 35.2], pitch: 57, zoom: 4.35 },
    countryCodes: ["CN"],
    id: "CN",
    kind: "country",
    label: "China",
    labelZh: "中国",
    layout: "grid",
    maxCoverMarkers: 18,
    maxMarkers: 24,
    maxPerCountry: 24,
    minPerCountry: 1
  },
  {
    camera: { bearing: 21, center: [-96.8, 38.4], pitch: 57, zoom: 4.15 },
    countryCodes: ["US"],
    id: "US",
    kind: "country",
    label: "United States",
    labelZh: "美国",
    layout: "grid",
    maxCoverMarkers: 18,
    maxMarkers: 24,
    maxPerCountry: 24,
    minPerCountry: 1
  },
  {
    camera: { bearing: -25, center: [127.8, 36.2], pitch: 58, zoom: 6.15 },
    countryCodes: ["KR"],
    id: "KR",
    kind: "country",
    label: "South Korea",
    labelZh: "韩国",
    layout: "radial",
    maxCoverMarkers: 16,
    maxMarkers: 20,
    maxPerCountry: 20,
    minPerCountry: 1
  }
];

export function getEarthProPreset(presetId: EarthProPresetId) {
  return (
    EARTH_PRO_PRESETS.find((preset) => preset.id === presetId) ??
    EARTH_PRO_PRESETS[0]
  );
}

export function getEarthProPresetForCountry(
  countryCode: string
): EarthProPreset | null {
  return EARTH_PRO_PRESETS.find((preset) => preset.id === countryCode) ?? null;
}

export function getEarthProCameraViewForCountry(
  country: Country
): EarthProCameraView {
  const preset = getEarthProPresetForCountry(country.code);

  if (preset) {
    return preset.camera;
  }

  const override = countryCameraOverrides[country.code];

  if (override) {
    return {
      bearing: override.bearing ?? -16,
      center: override.center ?? [country.longitude, country.latitude],
      pitch: override.pitch ?? 58,
      zoom: override.zoom
    };
  }

  const wideCountryCodes = new Set(["AU", "CA", "CN", "RU", "US"]);
  const compactCountryCodes = new Set([
    "BE",
    "CH",
    "CZ",
    "DK",
    "GB",
    "KR",
    "NL",
    "NO",
    "NZ"
  ]);

  return {
    bearing: -14,
    center: [country.longitude, country.latitude],
    pitch: 58,
    zoom: wideCountryCodes.has(country.code)
      ? 3.75
      : compactCountryCodes.has(country.code)
        ? 5.35
        : 4.75
  };
}

export function buildEarthProMarkerData({
  countries,
  games,
  preset,
  selectedCountryCode,
  selectedGameId
}: {
  countries: Country[];
  games: Game[];
  preset: EarthProPreset;
  selectedCountryCode: string | null;
  selectedGameId: string | null;
}): EarthProMarkerData {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const scopedCountries = getScopedCountries(countries, preset, selectedCountryCode);
  const scopedCountryCodes = new Set(scopedCountries.map((country) => country.code));
  const scopedGames = games.filter((game) => scopedCountryCodes.has(game.countryCode));
  const gamesByCountry = groupGamesByCountry(scopedGames, countryByCode);
  const countryMarkers = scopedCountries
    .map((country) => {
      const countryGames = sortRepresentativeGames(gamesByCountry.get(country.code) ?? []);

      return {
        averageRating: getAverageRating(countryGames),
        country,
        gameCount: countryGames.length,
        id: `earth-pro-country-${country.code}`,
        position: [country.longitude, country.latitude] as [number, number],
        topGame: countryGames[0] ?? null
      };
    })
    .filter((marker) => marker.gameCount > 0);

  const selectedPreset =
    selectedCountryCode && countryByCode.has(selectedCountryCode)
      ? {
          ...preset,
          countryCodes: [selectedCountryCode],
          kind: "country" as const,
          layout: getCountryLayout(selectedCountryCode, preset.layout),
          maxCoverMarkers: Math.max(preset.maxCoverMarkers, 18),
          maxMarkers: Math.max(preset.maxMarkers, 24),
          maxPerCountry: Math.max(preset.maxPerCountry, 24),
          minPerCountry: 1
        }
      : preset;
  const rankedGames = capRepresentativeGames({
    gamesByCountry,
    preset: selectedPreset,
    selectedGameId
  });
  const gameMarkers = rankedGames.map((entry, index) => {
    const country = countryByCode.get(entry.game.countryCode) as Country;
    const sameCountryTotal = rankedGames.filter(
      (item) => item.game.countryCode === entry.game.countryCode
    ).length;
    const layout = getCountryLayout(country.code, selectedPreset.layout);
    const position = getEarthProLayoutPosition({
      country,
      gameId: entry.game.id,
      index: entry.countryRank,
      layout,
      total: sameCountryTotal
    });

    const markerStyle: EarthProGameMarker["markerStyle"] =
        index < selectedPreset.maxCoverMarkers && hasLocalEarthProCover(entry.game)
        ? "cover"
        : "dot";

    return {
      country,
      countryRank: entry.countryRank,
      game: entry.game,
      hasCover: hasRealGameCover(entry.game),
      id: `earth-pro-game-${entry.game.id}`,
      markerStyle,
      normalizedRating: normalizeRating(entry.game.rating),
      position,
      rank: index
    };
  });

  return {
    countryMarkers,
    gameMarkers,
    scopedCountries,
    scopedGames
  };
}

export function getEarthProCoverUrl(marker: EarthProGameMarker) {
  return getEarthProDisplayCoverImage(marker.game);
}

export function getEarthProDisplayCoverImage(game: Game) {
  const coverImage = getGameCoverImage(game);

  return coverImage.startsWith("/") ? coverImage : FALLBACK_GAME_COVER_IMAGE;
}

export function normalizeRating(rating: number) {
  return rating <= 5 ? rating * 2 : rating;
}

function getScopedCountries(
  countries: Country[],
  preset: EarthProPreset,
  selectedCountryCode: string | null
) {
  if (selectedCountryCode) {
    return countries.filter((country) => country.code === selectedCountryCode);
  }

  if (preset.countryCodes) {
    const presetCountryCodes = new Set(preset.countryCodes);
    return countries.filter((country) => presetCountryCodes.has(country.code));
  }

  if (preset.regionId) {
    return countries.filter((country) => getCountryRegionId(country) === preset.regionId);
  }

  return countries;
}

function groupGamesByCountry(
  games: Game[],
  countryByCode: Map<string, Country>
) {
  return games.reduce<Map<string, Game[]>>((acc, game) => {
    if (!countryByCode.has(game.countryCode)) {
      return acc;
    }

    const countryGames = acc.get(game.countryCode);
    if (countryGames) {
      countryGames.push(game);
    } else {
      acc.set(game.countryCode, [game]);
    }

    return acc;
  }, new Map());
}

function capRepresentativeGames({
  gamesByCountry,
  preset,
  selectedGameId
}: {
  gamesByCountry: Map<string, Game[]>;
  preset: EarthProPreset;
  selectedGameId: string | null;
}) {
  const guaranteed: { countryRank: number; game: Game }[] = [];
  const candidates: { countryRank: number; game: Game }[] = [];

  for (const countryGames of gamesByCountry.values()) {
    const sortedGames = sortRepresentativeGames(countryGames).slice(0, preset.maxPerCountry);

    sortedGames.forEach((game, index) => {
      const entry = { countryRank: index, game };

      if (index < preset.minPerCountry) {
        guaranteed.push(entry);
      } else {
        candidates.push(entry);
      }
    });
  }

  const ranked = [...guaranteed, ...sortRepresentativeEntries(candidates)].slice(
    0,
    preset.maxMarkers
  );

  if (selectedGameId && !ranked.some((entry) => entry.game.id === selectedGameId)) {
    const selectedEntry = [...guaranteed, ...candidates].find(
      (entry) => entry.game.id === selectedGameId
    );

    if (selectedEntry) {
      ranked[Math.max(0, ranked.length - 1)] = selectedEntry;
    }
  }

  return sortRepresentativeEntries(ranked);
}

function sortRepresentativeEntries(
  entries: { countryRank: number; game: Game }[]
) {
  return [...entries].sort((a, b) => compareRepresentativeGames(a.game, b.game));
}

function sortRepresentativeGames(games: Game[]) {
  return [...games].sort(compareRepresentativeGames);
}

function compareRepresentativeGames(a: Game, b: Game) {
  return (
    normalizeRating(b.rating) - normalizeRating(a.rating) ||
    b.releaseYear - a.releaseYear ||
    a.title.localeCompare(b.title)
  );
}

function getAverageRating(games: Game[]) {
  if (games.length === 0) {
    return 0;
  }

  const totalRating = games.reduce((sum, game) => sum + normalizeRating(game.rating), 0);

  return totalRating / games.length;
}

function getCountryLayout(
  countryCode: string,
  fallbackLayout: EarthProLayoutKind
): EarthProLayoutKind {
  if (countryCode === "JP" || countryCode === "KR") {
    return countryCode === "KR" ? "radial" : "spiral";
  }

  if (countryCode === "US" || countryCode === "CN" || countryCode === "CA") {
    return "grid";
  }

  return fallbackLayout;
}

function hasLocalEarthProCover(game: Game) {
  return hasRealGameCover(game) && getGameCoverImage(game).startsWith("/");
}

function getEarthProLayoutPosition({
  country,
  gameId,
  index,
  layout,
  total
}: {
  country: Country;
  gameId: string;
  index: number;
  layout: EarthProLayoutKind;
  total: number;
}): [number, number] {
  if (total <= 1) {
    return [country.longitude, country.latitude];
  }

  const profile = countryLayoutProfiles[country.code] ?? defaultLayoutProfile;
  const seed = hashString(`${country.code}:${gameId}`);
  const jitter = ((seed % 101) / 101 - 0.5) * profile.jitter;
  const offset = getLayoutOffset({
    index,
    layout,
    profile,
    total
  });
  const rotation = ((profile.rotationDeg ?? 0) * Math.PI) / 180;
  const latOffset = offset.lat * Math.cos(rotation) - offset.lng * Math.sin(rotation);
  const lngOffset = offset.lat * Math.sin(rotation) + offset.lng * Math.cos(rotation);

  return [
    wrapLongitude(country.longitude + clamp(lngOffset + jitter, -profile.maxLng, profile.maxLng)),
    clamp(country.latitude + clamp(latOffset - jitter, -profile.maxLat, profile.maxLat), -72, 78)
  ];
}

function getLayoutOffset({
  index,
  layout,
  profile,
  total
}: {
  index: number;
  layout: EarthProLayoutKind;
  profile: EarthProLayoutProfile;
  total: number;
}) {
  if (layout === "grid") {
    const columns = Math.ceil(Math.sqrt(total * profile.aspect));
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rows = Math.ceil(total / columns);

    return {
      lat: (row - (rows - 1) / 2) * profile.spacing * profile.latScale,
      lng: (column - (columns - 1) / 2) * profile.spacing * profile.lngScale
    };
  }

  if (layout === "spiral") {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const radius = profile.spacing * Math.sqrt(index);
    const angle = index * goldenAngle;

    return {
      lat: Math.sin(angle) * radius * profile.latScale,
      lng: Math.cos(angle) * radius * profile.lngScale
    };
  }

  if (index === 0) {
    return { lat: 0, lng: 0 };
  }

  const ringIndex = index - 1;
  const angle = (ringIndex / Math.max(1, total - 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = profile.spacing * (0.7 + Math.ceil(index / 6) * 0.44);

  return {
    lat: Math.sin(angle) * radius * profile.latScale,
    lng: Math.cos(angle) * radius * profile.lngScale
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapLongitude(longitude: number) {
  if (longitude > 180) {
    return longitude - 360;
  }

  if (longitude < -180) {
    return longitude + 360;
  }

  return longitude;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

type EarthProLayoutProfile = {
  aspect: number;
  jitter: number;
  latScale: number;
  lngScale: number;
  maxLat: number;
  maxLng: number;
  rotationDeg?: number;
  spacing: number;
};

const defaultLayoutProfile: EarthProLayoutProfile = {
  aspect: 1.5,
  jitter: 0.08,
  latScale: 0.92,
  lngScale: 1,
  maxLat: 3.1,
  maxLng: 3.4,
  spacing: 1.15
};

const countryLayoutProfiles: Record<string, EarthProLayoutProfile> = {
  BE: { ...defaultLayoutProfile, jitter: 0.03, maxLat: 0.7, maxLng: 0.8, spacing: 0.38 },
  CA: { ...defaultLayoutProfile, aspect: 2.8, maxLat: 5.6, maxLng: 13, spacing: 2.1 },
  CH: { ...defaultLayoutProfile, jitter: 0.04, maxLat: 1, maxLng: 1.1, spacing: 0.52 },
  CN: { ...defaultLayoutProfile, aspect: 2.2, maxLat: 5.8, maxLng: 9.4, spacing: 1.85 },
  DE: { ...defaultLayoutProfile, maxLat: 2.1, maxLng: 2.2, spacing: 0.82 },
  DK: { ...defaultLayoutProfile, jitter: 0.04, maxLat: 1, maxLng: 1.1, spacing: 0.5 },
  GB: { ...defaultLayoutProfile, maxLat: 1.9, maxLng: 1.5, rotationDeg: -18, spacing: 0.7 },
  JP: { ...defaultLayoutProfile, maxLat: 3.5, maxLng: 2.1, rotationDeg: -28, spacing: 0.72 },
  KR: { ...defaultLayoutProfile, jitter: 0.04, maxLat: 1.2, maxLng: 1.1, spacing: 0.48 },
  NL: { ...defaultLayoutProfile, jitter: 0.03, maxLat: 0.9, maxLng: 0.9, spacing: 0.42 },
  NO: { ...defaultLayoutProfile, maxLat: 3, maxLng: 2.4, rotationDeg: -20, spacing: 0.82 },
  PL: { ...defaultLayoutProfile, maxLat: 1.8, maxLng: 2, spacing: 0.72 },
  SE: { ...defaultLayoutProfile, maxLat: 3.1, maxLng: 2.3, rotationDeg: -16, spacing: 0.82 },
  US: { ...defaultLayoutProfile, aspect: 2.5, maxLat: 5.2, maxLng: 12.4, spacing: 1.95 }
};

const countryCameraOverrides: Record<
  string,
  Partial<Omit<EarthProCameraView, "zoom">> & Pick<EarthProCameraView, "zoom">
> = {
  AU: { bearing: 17, center: [134, -25], pitch: 56, zoom: 3.65 },
  BE: { bearing: -18, center: [4.7, 50.7], pitch: 58, zoom: 5.8 },
  CA: { bearing: 19, center: [-102, 55], pitch: 60, zoom: 3.45 },
  CH: { bearing: -12, center: [8.2, 46.9], pitch: 58, zoom: 5.75 },
  CZ: { bearing: -12, center: [15.4, 49.9], pitch: 58, zoom: 5.45 },
  DE: { bearing: -12, center: [10.5, 51.2], pitch: 57, zoom: 5.0 },
  DK: { bearing: -10, center: [9.9, 56.1], pitch: 58, zoom: 5.45 },
  FI: { bearing: -17, center: [26, 62.2], pitch: 57, zoom: 4.65 },
  FR: { bearing: -12, center: [2.4, 46.5], pitch: 57, zoom: 4.85 },
  GB: { bearing: -17, center: [-3.2, 55], pitch: 58, zoom: 4.85 },
  NL: { bearing: -12, center: [5.4, 52.2], pitch: 58, zoom: 5.65 },
  NO: { bearing: -18, center: [10.5, 62.2], pitch: 57, zoom: 4.4 },
  NZ: { bearing: 18, center: [172.8, -41], pitch: 57, zoom: 4.7 },
  PL: { bearing: -13, center: [19.4, 52], pitch: 57, zoom: 5.05 },
  RU: { bearing: 10, center: [92, 60], pitch: 55, zoom: 2.75 },
  SE: { bearing: -17, center: [17.5, 61.1], pitch: 57, zoom: 4.55 },
  UA: { bearing: -10, center: [31, 49], pitch: 57, zoom: 4.75 }
};

export function getRegionPresetId(regionId: RegionConfig["id"]): EarthProPresetId {
  if (regionId === "europe" || regionId === "eastAsia" || regionId === "northAmerica") {
    return regionId;
  }

  return "global";
}
