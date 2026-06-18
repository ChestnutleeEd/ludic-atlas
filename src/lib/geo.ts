import type { CameraMode, Country } from "@/types/game";

export type MapPosition = {
  x: number;
  y: number;
};

export type SvgPosition = {
  x: number;
  y: number;
};

export type GlobeCoordinates = {
  lat: number;
  lng: number;
};

export type GlobePointOfView = GlobeCoordinates & {
  altitude: number;
};

export type CountryDotPoint = GlobeCoordinates & {
  countryCode: string;
  id: string;
};

export type CountryGeoJsonFeature = {
  type: "Feature";
  properties: {
    name?: string;
    "ISO3166-1-Alpha-2"?: string;
    "ISO3166-1-Alpha-3"?: string;
  };
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

export type CountryGeoJson = {
  type: "FeatureCollection";
  features: CountryGeoJsonFeature[];
};

export type Globe2DViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const GLOBE_2D_WIDTH = 1000;
export const GLOBE_2D_HEIGHT = 560;

export function getCountryCoordinates(country: Country) {
  return {
    latitude: country.latitude,
    longitude: country.longitude
  };
}

export function projectLatLngToPanel(latitude: number, longitude: number): MapPosition {
  const x = ((longitude + 180) / 360) * 100;
  const y = ((90 - latitude) / 180) * 100;

  return {
    x: clamp(x, 6, 94),
    y: clamp(y, 10, 88)
  };
}

export function getCountryMapPosition(country: Country): MapPosition {
  return projectLatLngToPanel(country.latitude, country.longitude);
}

export function getMarkerPosition(country: Country) {
  const position = getCountryMapPosition(country);
  const offset = markerAnchorOffsets[country.code] ?? { x: 0, y: 0 };

  return {
    x: clamp(position.x + offset.x, 6, 94),
    y: clamp(position.y + offset.y, 10, 88)
  };
}

export function getClusteredMarkerOffset(index: number, total: number) {
  if (total <= 1) {
    return { x: 0, y: 0 };
  }

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = total <= 3 ? 20 : total <= 5 ? 42 : total <= 8 ? 50 : 58;

  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius)
  };
}

export function getClusteredGlobeCoordinates(
  country: Country,
  index: number,
  total: number
): GlobeCoordinates {
  if (total <= 1) {
    return {
      lat: country.latitude,
      lng: country.longitude
    };
  }

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = total <= 3 ? 2.8 : total <= 5 ? 4.2 : total <= 8 ? 6.4 : 7.2;

  return {
    lat: clamp(country.latitude + Math.sin(angle) * radius, -70, 78),
    lng: wrapLongitude(country.longitude + Math.cos(angle) * radius)
  };
}

export function getDistributedGlobeCoordinates({
  country,
  gameId,
  index,
  mode,
  total
}: {
  country: Country;
  gameId: string;
  index: number;
  mode: "global" | "region" | "country";
  total: number;
}): GlobeCoordinates {
  if (total <= 1) {
    return {
      lat: country.latitude,
      lng: country.longitude
    };
  }

  const profile = countryMarkerSpreadProfiles[country.code] ?? defaultCountryMarkerSpreadProfile;
  const modeScale = markerSpreadModeScales[mode];
  const countScale = clamp(0.86 + Math.sqrt(total) * 0.1, 0.92, 1.28);
  const stableSeed = hashString(`${country.code}:${gameId}`);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle =
    index * goldenAngle +
    (stableSeed % 41) * (Math.PI / 180);
  const normalizedStep = (index + 0.5) / Math.max(total, 1);
  const radiusScale = Math.sqrt(normalizedStep);
  const jitter = ((stableSeed % 97) / 97 - 0.5) * 0.08;
  const radius = profile.base * modeScale * countScale * (radiusScale + jitter);
  const rawLatOffset = Math.sin(angle) * radius * profile.latScale;
  const rawLngOffset =
    (Math.cos(angle) * radius * profile.lngScale) /
    Math.max(Math.cos((country.latitude * Math.PI) / 180), 0.35);
  const rotatedOffsets = rotateMarkerOffsets(
    rawLatOffset,
    rawLngOffset,
    profile.rotationDeg ?? 0
  );
  const latOffset = clamp(
    rotatedOffsets.lat,
    -profile.maxLatOffset,
    profile.maxLatOffset
  );
  const lngOffset = clamp(
    rotatedOffsets.lng,
    -profile.maxLngOffset,
    profile.maxLngOffset
  );

  return {
    lat: clamp(
      country.latitude + latOffset,
      -70,
      78
    ),
    lng: wrapLongitude(country.longitude + lngOffset)
  };
}

export function projectLatLngToGlobe2D(
  latitude: number,
  longitude: number
): SvgPosition {
  return {
    x: ((longitude + 180) / 360) * GLOBE_2D_WIDTH,
    y: ((90 - latitude) / 180) * GLOBE_2D_HEIGHT
  };
}

export function getClusteredGlobe2DPosition(
  country: Country,
  index: number,
  total: number
): SvgPosition {
  const coordinates = getClusteredGlobeCoordinates(country, index, total);

  return projectLatLngToGlobe2D(coordinates.lat, coordinates.lng);
}

export function getGeoJsonFeaturePath(feature: CountryGeoJsonFeature) {
  if (feature.geometry.type === "Polygon") {
    return polygonToPath(feature.geometry.coordinates);
  }

  if (feature.geometry.type === "MultiPolygon") {
    return (feature.geometry.coordinates as unknown[][][])
      .map((polygon) => polygonToPath(polygon))
      .join(" ");
  }

  return "";
}

export function getGlobal2DViewBox(): Globe2DViewBox {
  return {
    height: GLOBE_2D_HEIGHT,
    width: GLOBE_2D_WIDTH,
    x: 0,
    y: 0
  };
}

export function getCountry2DViewBox(country: Country): Globe2DViewBox {
  const focus = country2DFocusOverrides[country.code];
  const center = projectLatLngToGlobe2D(
    focus?.lat ?? country.latitude,
    focus?.lng ?? country.longitude
  );
  const width = focus?.width ?? 320;
  const height = focus?.height ?? 220;

  return {
    height,
    width,
    x: clamp(center.x - width / 2, 0, GLOBE_2D_WIDTH - width),
    y: clamp(center.y - height / 2, 0, GLOBE_2D_HEIGHT - height)
  };
}

export function getCountryFocusPointOfView(
  country: Country,
  cameraMode: CameraMode = "surface"
): GlobePointOfView {
  const focus = countryFocusOverrides[country.code];
  // Keep focus altitude above the surface HTML / polygon layers. The close
  // values make small countries usable, while OrbitControls minDistance still
  // prevents camera penetration during wheel or pinch zoom.
  const altitude =
    cameraMode === "surface"
      ? focus?.surfaceAltitude ?? 0.5
      : focus?.overviewAltitude ?? 1.02;

  return {
    altitude,
    lat: focus?.lat ?? country.latitude,
    lng: focus?.lng ?? country.longitude
  };
}

export function getGlobalPointOfView(): GlobePointOfView {
  return {
    altitude: 1.36,
    lat: 23,
    lng: 18
  };
}

export function getCountryCodeFromFeature(
  feature: CountryGeoJsonFeature
): string | null {
  const alpha2 = feature.properties["ISO3166-1-Alpha-2"];

  if (alpha2 && alpha2 !== "-99") {
    return alpha2;
  }

  const countryName = feature.properties.name;

  if (!countryName) {
    return null;
  }

  return countryNameToCode[countryName] ?? null;
}

export function getCountryFeatureKey(feature: CountryGeoJsonFeature): string | null {
  return (
    getCountryCodeFromFeature(feature) ??
    feature.properties["ISO3166-1-Alpha-3"] ??
    getCountryNameFromFeature(feature)
  );
}

export function getCountryNameFromFeature(feature: CountryGeoJsonFeature) {
  return feature.properties.name ?? null;
}

export function isMockCountryFeature(
  feature: CountryGeoJsonFeature,
  supportedCountryCodes: Set<string>
) {
  const countryCode = getCountryCodeFromFeature(feature);

  return Boolean(countryCode && supportedCountryCodes.has(countryCode));
}

export function buildCountryDotMatrix(
  features: CountryGeoJsonFeature[],
  countries: Country[]
): CountryDotPoint[] {
  const supportedCountryCodes = new Set(countries.map((country) => country.code));

  return features.flatMap((feature) => {
    const countryCode = getCountryCodeFromFeature(feature);

    if (!countryCode || !supportedCountryCodes.has(countryCode)) {
      return [];
    }

    const polygons = getFeaturePolygons(feature);
    const bounds = getPolygonBounds(polygons);

    if (!bounds) {
      return [];
    }

    const targetCount = countryDotTargetCounts[countryCode] ?? 72;
    const latSpan = Math.max(1, bounds.maxLat - bounds.minLat);
    const lngSpan = Math.max(1, bounds.maxLng - bounds.minLng);
    const step = Math.sqrt((latSpan * lngSpan) / targetCount);
    const latStep = clamp(step * 0.82, 0.55, 4.8);
    const lngStep = clamp(step * 1.1, 0.65, 5.6);
    const points: CountryDotPoint[] = [];
    let index = 0;

    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += latStep) {
      for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += lngStep) {
        const jitter = getDeterministicJitter(countryCode, index);
        const candidate = {
          lat: clamp(lat + jitter.lat * latStep, -82, 82),
          lng: wrapLongitude(lng + jitter.lng * lngStep)
        };

        if (isCoordinateInFeaturePolygons(candidate.lng, candidate.lat, polygons)) {
          points.push({
            countryCode,
            id: `${countryCode}-${index}`,
            lat: candidate.lat,
            lng: candidate.lng
          });
        }

        index += 1;
      }
    }

    if (points.length <= targetCount) {
      return points;
    }

    const stride = points.length / targetCount;

    return Array.from({ length: targetCount }, (_, pointIndex) => {
      const source = points[Math.floor(pointIndex * stride)];

      return {
        ...source,
        id: `${countryCode}-${pointIndex}`
      };
    });
  });
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

type GeoJsonRing = number[][];
type GeoJsonPolygon = GeoJsonRing[];

function getFeaturePolygons(feature: CountryGeoJsonFeature): GeoJsonPolygon[] {
  const coordinates = feature.geometry.coordinates;

  if (feature.geometry.type === "Polygon" && Array.isArray(coordinates)) {
    return normalizePolygon(coordinates);
  }

  if (feature.geometry.type === "MultiPolygon" && Array.isArray(coordinates)) {
    return coordinates.flatMap((polygon) => normalizePolygon(polygon));
  }

  return [];
}

function normalizePolygon(value: unknown): GeoJsonPolygon[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rings = value
    .map((ring) => {
      if (!Array.isArray(ring)) {
        return [];
      }

      return ring.filter(
        (coordinate): coordinate is number[] =>
          Array.isArray(coordinate) &&
          typeof coordinate[0] === "number" &&
          typeof coordinate[1] === "number"
      );
    })
    .filter((ring) => ring.length >= 4);

  return rings.length > 0 ? [rings] : [];
}

function getPolygonBounds(polygons: GeoJsonPolygon[]) {
  const coordinates = polygons.flat(2);

  if (coordinates.length === 0) {
    return null;
  }

  return coordinates.reduce(
    (bounds, coordinate) => ({
      maxLat: Math.max(bounds.maxLat, coordinate[1]),
      maxLng: Math.max(bounds.maxLng, coordinate[0]),
      minLat: Math.min(bounds.minLat, coordinate[1]),
      minLng: Math.min(bounds.minLng, coordinate[0])
    }),
    {
      maxLat: -Infinity,
      maxLng: -Infinity,
      minLat: Infinity,
      minLng: Infinity
    }
  );
}

function isCoordinateInFeaturePolygons(
  longitude: number,
  latitude: number,
  polygons: GeoJsonPolygon[]
) {
  return polygons.some((polygon) => {
    const [outerRing, ...holes] = polygon;

    if (!outerRing || !isCoordinateInRing(longitude, latitude, outerRing)) {
      return false;
    }

    return !holes.some((hole) => isCoordinateInRing(longitude, latitude, hole));
  });
}

function isCoordinateInRing(longitude: number, latitude: number, ring: GeoJsonRing) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi || 1) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function getDeterministicJitter(countryCode: string, index: number) {
  const seed =
    countryCode.charCodeAt(0) * 31 + countryCode.charCodeAt(1) * 17 + index * 13;

  return {
    lat: (((seed * 17) % 100) / 100 - 0.5) * 0.62,
    lng: (((seed * 29) % 100) / 100 - 0.5) * 0.62
  };
}

function rotateMarkerOffsets(latOffset: number, lngOffset: number, rotationDeg: number) {
  if (rotationDeg === 0) {
    return {
      lat: latOffset,
      lng: lngOffset
    };
  }

  const rotation = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    lat: latOffset * cos - lngOffset * sin,
    lng: latOffset * sin + lngOffset * cos
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function polygonToPath(polygon: unknown) {
  if (!Array.isArray(polygon)) {
    return "";
  }

  return polygon
    .map((ring) => {
      if (!Array.isArray(ring)) {
        return "";
      }

      const points = ring
        .map((coordinate) => {
          if (
            !Array.isArray(coordinate) ||
            typeof coordinate[0] !== "number" ||
            typeof coordinate[1] !== "number"
          ) {
            return null;
          }

          return projectLatLngToGlobe2D(coordinate[1], coordinate[0]);
        })
        .filter((point): point is SvgPosition => Boolean(point));

      if (points.length === 0) {
        return "";
      }

      const [firstPoint, ...remainingPoints] = points;
      const lineCommands = remainingPoints
        .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(" ");

      return `M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)} ${lineCommands} Z`;
    })
    .filter(Boolean)
    .join(" ");
}

const markerAnchorOffsets: Record<string, MapPosition> = {
  CA: { x: -7, y: -3 },
  CN: { x: -11, y: 9 },
  FI: { x: 6, y: -6 },
  FR: { x: -4, y: 7 },
  GB: { x: -7, y: 1 },
  JP: { x: 12, y: -5 },
  KR: { x: 8, y: -4 },
  PL: { x: 5, y: 6 },
  SE: { x: -1, y: -6 },
  US: { x: 4, y: 4 }
};

const countryNameToCode: Record<string, string> = {
  Canada: "CA",
  China: "CN",
  Finland: "FI",
  France: "FR",
  Japan: "JP",
  Poland: "PL",
  "South Korea": "KR",
  Sweden: "SE",
  "United Kingdom": "GB",
  "United States of America": "US"
};

const countryDotTargetCounts: Record<string, number> = {
  CA: 96,
  CN: 132,
  FI: 54,
  FR: 66,
  GB: 58,
  JP: 64,
  KR: 34,
  PL: 44,
  SE: 62,
  US: 138
};

type CountryMarkerSpreadProfile = {
  base: number;
  latScale: number;
  lngScale: number;
  maxLatOffset: number;
  maxLngOffset: number;
  rotationDeg?: number;
};

const markerSpreadModeScales: Record<"global" | "region" | "country", number> = {
  country: 1,
  global: 0.34,
  region: 0.68
};

const defaultCountryMarkerSpreadProfile: CountryMarkerSpreadProfile = {
  base: 2.6,
  latScale: 0.92,
  lngScale: 0.92,
  maxLatOffset: 3.1,
  maxLngOffset: 3.4
};

const countryMarkerSpreadProfiles: Record<string, CountryMarkerSpreadProfile> = {
  AU: {
    base: 6.4,
    latScale: 0.75,
    lngScale: 1.2,
    maxLatOffset: 5.4,
    maxLngOffset: 9.8
  },
  BR: {
    base: 6.2,
    latScale: 1,
    lngScale: 1,
    maxLatOffset: 7.2,
    maxLngOffset: 7.8
  },
  CA: {
    base: 8,
    latScale: 0.65,
    lngScale: 1.35,
    maxLatOffset: 6.8,
    maxLngOffset: 15.5
  },
  CN: {
    base: 6.8,
    latScale: 0.8,
    lngScale: 1.15,
    maxLatOffset: 6.5,
    maxLngOffset: 10.8
  },
  DE: {
    base: 2,
    latScale: 1,
    lngScale: 0.8,
    maxLatOffset: 2.5,
    maxLngOffset: 2.5
  },
  FR: {
    base: 2.3,
    latScale: 1,
    lngScale: 0.9,
    maxLatOffset: 2.9,
    maxLngOffset: 3
  },
  GB: {
    base: 2.4,
    latScale: 1.3,
    lngScale: 0.65,
    maxLatOffset: 3.6,
    maxLngOffset: 2.1,
    rotationDeg: -12
  },
  IN: {
    base: 4.2,
    latScale: 1,
    lngScale: 0.85,
    maxLatOffset: 5.2,
    maxLngOffset: 4.8
  },
  IT: {
    base: 2.5,
    latScale: 1.35,
    lngScale: 0.6,
    maxLatOffset: 3.5,
    maxLngOffset: 2.2,
    rotationDeg: 18
  },
  JP: {
    base: 2.8,
    latScale: 1.45,
    lngScale: 0.65,
    maxLatOffset: 4.4,
    maxLngOffset: 2.9,
    rotationDeg: -35
  },
  KR: {
    base: 1.8,
    latScale: 1,
    lngScale: 0.75,
    maxLatOffset: 2.2,
    maxLngOffset: 1.6
  },
  RU: {
    base: 9,
    latScale: 0.55,
    lngScale: 1.6,
    maxLatOffset: 6.4,
    maxLngOffset: 20
  },
  SE: {
    base: 3.1,
    latScale: 1.35,
    lngScale: 0.7,
    maxLatOffset: 4.2,
    maxLngOffset: 2.5
  },
  US: {
    base: 7.5,
    latScale: 0.75,
    lngScale: 1.25,
    maxLatOffset: 6.3,
    maxLngOffset: 13.2
  }
};

const countryFocusOverrides: Record<
  string,
  Partial<GlobeCoordinates> & {
    overviewAltitude?: number;
    surfaceAltitude?: number;
  }
> = {
  CA: { overviewAltitude: 1.16, surfaceAltitude: 0.62, lat: 54, lng: -96 },
  BE: { overviewAltitude: 0.82, surfaceAltitude: 0.38, lat: 50.8, lng: 4.7 },
  CN: { overviewAltitude: 0.96, surfaceAltitude: 0.48, lat: 34, lng: 105 },
  CZ: { overviewAltitude: 0.84, surfaceAltitude: 0.38, lat: 49.9, lng: 15.4 },
  DE: { overviewAltitude: 0.88, surfaceAltitude: 0.4, lat: 51, lng: 10 },
  DK: { overviewAltitude: 0.86, surfaceAltitude: 0.4, lat: 56, lng: 10 },
  FI: { overviewAltitude: 0.92, surfaceAltitude: 0.44, lat: 60, lng: 24 },
  FR: { overviewAltitude: 0.92, surfaceAltitude: 0.44, lat: 48, lng: 5 },
  GB: { overviewAltitude: 0.9, surfaceAltitude: 0.44, lat: 53, lng: -2 },
  JP: { overviewAltitude: 0.86, surfaceAltitude: 0.4, lat: 36, lng: 138 },
  KR: { overviewAltitude: 0.84, surfaceAltitude: 0.38, lat: 36, lng: 128 },
  NL: { overviewAltitude: 0.82, surfaceAltitude: 0.38, lat: 52.2, lng: 5.3 },
  NZ: { overviewAltitude: 0.98, surfaceAltitude: 0.48, lat: -41, lng: 174 },
  PL: { overviewAltitude: 0.9, surfaceAltitude: 0.42, lat: 52, lng: 19 },
  SE: { overviewAltitude: 0.94, surfaceAltitude: 0.46, lat: 59, lng: 18 },
  UA: { overviewAltitude: 0.92, surfaceAltitude: 0.44, lat: 49, lng: 31 },
  US: { overviewAltitude: 1.04, surfaceAltitude: 0.54, lat: 38, lng: -97 }
};

const country2DFocusOverrides: Record<
  string,
  Partial<GlobeCoordinates> & Pick<Globe2DViewBox, "height" | "width">
> = {
  CA: { height: 230, lat: 55, lng: -104, width: 410 },
  CN: { height: 230, lat: 35, lng: 104, width: 390 },
  FI: { height: 210, lat: 57, lng: 20, width: 330 },
  FR: { height: 210, lat: 50, lng: 8, width: 330 },
  GB: { height: 210, lat: 53, lng: -2, width: 330 },
  JP: { height: 210, lat: 35, lng: 137, width: 320 },
  KR: { height: 210, lat: 36, lng: 128, width: 320 },
  PL: { height: 210, lat: 52, lng: 17, width: 330 },
  SE: { height: 220, lat: 58, lng: 18, width: 340 },
  US: { height: 245, lat: 39, lng: -98, width: 430 }
};
