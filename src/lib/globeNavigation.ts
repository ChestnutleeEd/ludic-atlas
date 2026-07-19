import {
  getCountryFocusBounds,
  getCountryFocusPointOfView,
  type CountryGeoJsonFeature,
  type GlobePointOfView
} from "./geo.ts";
import { getRegionPointOfView } from "./regions.ts";
import type { CameraMode, Country } from "../types/game.ts";
import type { SafeViewport, SpatialNavigationIntent } from "../types/earth.ts";

type ResolveInput = {
  cameraMode: CameraMode;
  countryByCode: ReadonlyMap<string, Country>;
  featureByCode: ReadonlyMap<string, CountryGeoJsonFeature>;
  intent: SpatialNavigationIntent;
  markerFootprintPx: number;
  safeViewport: SafeViewport;
};

export function resolveGlobeNavigationPoint({
  cameraMode,
  countryByCode,
  featureByCode,
  intent,
  markerFootprintPx,
  safeViewport
}: ResolveInput): GlobePointOfView {
  if (intent.target.type === "global") {
    return applySafeViewportBias(
      getRegionPointOfView("global", cameraMode),
      safeViewport
    );
  }
  if (intent.target.type === "region") {
    return applySafeViewportBias(
      getRegionPointOfView(intent.target.regionId, cameraMode),
      safeViewport
    );
  }
  const country = countryByCode.get(intent.target.countryCode);
  if (!country) {
    return applySafeViewportBias(
      getRegionPointOfView("global", cameraMode),
      safeViewport
    );
  }
  const base = getCountryFocusPointOfView(country, cameraMode);
  if (cameraMode !== "surface") return applySafeViewportBias(base, safeViewport);
  const bounds = getCountryFocusBounds(featureByCode.get(country.code), country);
  return applySafeViewportBias(
    {
      ...base,
      altitude: getCountryFocusAltitude(
        bounds,
        safeViewport,
        base.altitude,
        markerFootprintPx
      )
    },
    safeViewport
  );
}

export function getCountryFocusAltitude(
  bounds: ReturnType<typeof getCountryFocusBounds>,
  safeViewport: SafeViewport,
  fallbackAltitude: number,
  markerFootprintPx = 0
) {
  if (!bounds) return clamp(fallbackAltitude, 0.14, 0.68);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const lngSpan = (bounds.maxLng - bounds.minLng) * Math.max(0.3, Math.cos(centerLat * Math.PI / 180));
  const angularSpan = Math.max(bounds.maxLat - bounds.minLat, lngSpan, 0.1);
  const usableWidth = Math.max(1, safeViewport.availableWidth - markerFootprintPx * 2);
  const usableHeight = Math.max(1, safeViewport.availableHeight - markerFootprintPx * 2);
  const fitScale = Math.max(
    0.42,
    Math.min(
      usableWidth / safeViewport.width,
      usableHeight / safeViewport.height
    )
  );
  const fitted = (0.1 + Math.sqrt(angularSpan) * 0.05) / Math.sqrt(fitScale);
  return clamp(fitted, 0.14, 0.68);
}

export function applySafeViewportBias(
  point: GlobePointOfView,
  safeViewport: SafeViewport
): GlobePointOfView {
  const horizontalOffset = (safeViewport.centerX - safeViewport.width / 2) / safeViewport.width;
  const verticalOffset = (safeViewport.centerY - safeViewport.height / 2) / safeViewport.height;
  const angularWindow = 38 * (0.55 + point.altitude);
  return {
    ...point,
    lat: clamp(point.lat + verticalOffset * angularWindow, -78, 78),
    lng: wrapLongitude(point.lng - horizontalOffset * angularWindow)
  };
}

function wrapLongitude(value: number) {
  return ((value + 540) % 360) - 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
