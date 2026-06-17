import type { CameraMode, Country, Game, RegionId } from "@/types/game";

export type CameraPreset = {
  altitude: Record<CameraMode, number>;
  lat: number;
  lng: number;
};

export type CameraModeConfig = {
  defaultAltitude: number;
  label: string;
  labelZh: string;
  maxAltitude: number;
  maxDistance: number;
  minAltitude: number;
  minDistance: number;
  rotateSpeed: number;
  zoomSpeed: number;
};

export type RegionConfig = {
  camera: CameraPreset;
  id: RegionId;
  label: string;
  labelZh: string;
};

export const CAMERA_MODE_CONFIGS: Record<CameraMode, CameraModeConfig> = {
  overview: {
    defaultAltitude: 1.55,
    label: "Overview",
    labelZh: "总览",
    maxAltitude: 2.3,
    maxDistance: 430,
    minAltitude: 1.16,
    minDistance: 176,
    rotateSpeed: 0.42,
    zoomSpeed: 0.45
  },
  surface: {
    defaultAltitude: 0.72,
    label: "Surface",
    labelZh: "近地",
    maxAltitude: 0.96,
    maxDistance: 212,
    minAltitude: 0.54,
    minDistance: 136,
    rotateSpeed: 0.25,
    zoomSpeed: 0.22
  }
};

export const CAMERA_PRESETS: Record<RegionId, CameraPreset> = {
  global: { altitude: { overview: 1.48, surface: 0.76 }, lat: 24, lng: 38 },
  europe: { altitude: { overview: 1.32, surface: 0.7 }, lat: 50, lng: 15 },
  eastAsia: { altitude: { overview: 1.28, surface: 0.68 }, lat: 35, lng: 118 },
  northAmerica: { altitude: { overview: 1.34, surface: 0.74 }, lat: 42, lng: -100 },
  latinAmerica: { altitude: { overview: 1.4, surface: 0.78 }, lat: -12, lng: -62 },
  middleEast: { altitude: { overview: 1.28, surface: 0.68 }, lat: 29, lng: 44 },
  southAsia: { altitude: { overview: 1.28, surface: 0.68 }, lat: 22, lng: 78 },
  oceania: { altitude: { overview: 1.34, surface: 0.72 }, lat: -25, lng: 142 }
};

export const REGION_CONFIGS: RegionConfig[] = [
  {
    camera: CAMERA_PRESETS.global,
    id: "global",
    label: "Global",
    labelZh: "全球"
  },
  {
    camera: CAMERA_PRESETS.europe,
    id: "europe",
    label: "Europe",
    labelZh: "欧洲"
  },
  {
    camera: CAMERA_PRESETS.eastAsia,
    id: "eastAsia",
    label: "East Asia",
    labelZh: "东亚"
  },
  {
    camera: CAMERA_PRESETS.northAmerica,
    id: "northAmerica",
    label: "North America",
    labelZh: "北美"
  },
  {
    camera: CAMERA_PRESETS.latinAmerica,
    id: "latinAmerica",
    label: "Latin America",
    labelZh: "拉丁美洲"
  },
  {
    camera: CAMERA_PRESETS.middleEast,
    id: "middleEast",
    label: "Middle East",
    labelZh: "中东"
  },
  {
    camera: CAMERA_PRESETS.southAsia,
    id: "southAsia",
    label: "South Asia",
    labelZh: "南亚"
  },
  {
    camera: CAMERA_PRESETS.oceania,
    id: "oceania",
    label: "Oceania",
    labelZh: "大洋洲"
  }
];

const COUNTRY_REGION_OVERRIDES: Record<string, RegionId> = {
  JP: "eastAsia",
  CN: "eastAsia",
  KR: "eastAsia",
  US: "northAmerica",
  CA: "northAmerica",
  MX: "latinAmerica",
  BR: "latinAmerica",
  AR: "latinAmerica",
  CL: "latinAmerica",
  AE: "middleEast",
  IL: "middleEast",
  IR: "middleEast",
  SA: "middleEast",
  TR: "middleEast",
  IN: "southAsia",
  PK: "southAsia",
  BD: "southAsia",
  LK: "southAsia",
  AU: "oceania",
  NZ: "oceania"
};

export function getRegionConfig(regionId: RegionId) {
  return (
    REGION_CONFIGS.find((regionConfig) => regionConfig.id === regionId) ??
    REGION_CONFIGS[0]
  );
}

export function getCameraModeLabel(cameraMode: CameraMode) {
  const config = CAMERA_MODE_CONFIGS[cameraMode];

  return `${config.labelZh} ${config.label}`;
}

export function getRegionPointOfView(
  regionId: RegionId,
  cameraMode: CameraMode
) {
  const preset = CAMERA_PRESETS[regionId];

  return {
    altitude: preset.altitude[cameraMode],
    lat: preset.lat,
    lng: preset.lng
  };
}

export function getCountryRegionId(country: Country): RegionId {
  const override = COUNTRY_REGION_OVERRIDES[country.code];

  if (override) {
    return override;
  }

  if (country.region.toLocaleLowerCase().includes("europe")) {
    return "europe";
  }

  return "global";
}

export function isCountryInRegion(country: Country, regionId: RegionId) {
  return regionId === "global" || getCountryRegionId(country) === regionId;
}

export function filterCountriesByRegion(countries: Country[], regionId: RegionId) {
  return countries.filter((country) => isCountryInRegion(country, regionId));
}

export function filterGamesByRegion(
  games: Game[],
  countries: Country[],
  regionId: RegionId
) {
  if (regionId === "global") {
    return games;
  }

  const countryCodes = new Set(
    filterCountriesByRegion(countries, regionId).map((country) => country.code)
  );

  return games.filter((game) => countryCodes.has(game.countryCode));
}

export function getRegionLabel(regionId: RegionId) {
  const regionConfig = getRegionConfig(regionId);

  return `${regionConfig.labelZh} ${regionConfig.label}`;
}
