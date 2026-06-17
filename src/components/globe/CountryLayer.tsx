import {
  getCountryCodeFromFeature,
  getCountryFeatureKey,
  getCountryNameFromFeature,
  type CountryDotPoint,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import { getCountryDisplayName } from "@/lib/localization";
import type { Country } from "@/types/game";
import type { GlobeProps } from "react-globe.gl";

type CountryLayerOptions = {
  activeRegionCountryCodes: Set<string>;
  countries: Country[];
  countryDots: CountryDotPoint[];
  countryFeatures: CountryGeoJsonFeature[];
  gameCountryCodes: Set<string>;
  hoveredCountryCode: string | null;
  selectedCountryCode: string | null;
  onHoverCountry: (countryCode: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
};

export function getCountryLayerProps({
  activeRegionCountryCodes,
  countries,
  countryDots,
  countryFeatures,
  gameCountryCodes,
  hoveredCountryCode,
  selectedCountryCode,
  onHoverCountry,
  onSelectCountry
}: CountryLayerOptions): Pick<
  GlobeProps,
  | "polygonsData"
  | "polygonAltitude"
  | "polygonCapColor"
  | "polygonGeoJsonGeometry"
  | "polygonLabel"
  | "polygonSideColor"
  | "polygonStrokeColor"
  | "polygonsTransitionDuration"
  | "pointsData"
  | "pointAltitude"
  | "pointColor"
  | "pointLabel"
  | "pointLat"
  | "pointLng"
  | "pointRadius"
  | "pointResolution"
  | "pointsMerge"
  | "pointsTransitionDuration"
  | "onPointClick"
  | "onPointHover"
  | "onPolygonClick"
  | "onPolygonHover"
> {
  const supportedCountryCodes = new Set(countries.map((country) => country.code));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const countryFeatureKeyByFeature = new Map(
    countryFeatures.map((feature) => [feature, getCountryFeatureKey(feature)])
  );
  const getFeatureKey = (feature: CountryGeoJsonFeature) =>
    countryFeatureKeyByFeature.get(feature) ?? null;

  return {
    pointsData: countryDots,
    pointAltitude: (point) =>
      (point as CountryDotPoint).countryCode === selectedCountryCode ? 0.0025 : 0.0012,
    pointColor: (point) => {
      const countryCode = (point as CountryDotPoint).countryCode;

      if (countryCode === selectedCountryCode) {
        return "rgba(240, 182, 90, 0.96)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(217, 154, 50, 0.86)";
      }

      return gameCountryCodes.has(countryCode)
        ? "rgba(217, 154, 50, 0.38)"
        : "rgba(169, 157, 139, 0.22)";
    },
    pointLabel: (point) => {
      const country = countryByCode.get((point as CountryDotPoint).countryCode);

      return country
        ? `<div class="globe-country-tooltip">${getCountryDisplayName(country)}</div>`
        : "";
    },
    pointLat: (point) => (point as CountryDotPoint).lat,
    pointLng: (point) => (point as CountryDotPoint).lng,
    pointRadius: (point) => {
      const countryCode = (point as CountryDotPoint).countryCode;

      if (countryCode === selectedCountryCode) {
        return 0.052;
      }

      if (countryCode === hoveredCountryCode) {
        return 0.048;
      }

      return gameCountryCodes.has(countryCode) ? 0.036 : 0.028;
    },
    pointResolution: 12,
    pointsMerge: false,
    pointsTransitionDuration: 0,
    onPointClick: (point) => {
      const countryCode = (point as CountryDotPoint).countryCode;

      if (supportedCountryCodes.has(countryCode)) {
        onSelectCountry(countryCode);
      }
    },
    onPointHover: (point) => {
      onHoverCountry(point ? (point as CountryDotPoint).countryCode : null);
    },
    polygonsData: countryFeatures,
    polygonAltitude: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const countryCode = getFeatureKey(feature);

      if (countryCode === selectedCountryCode) {
        return 0.004;
      }

      if (countryCode === hoveredCountryCode) {
        return 0.003;
      }

      return 0.001;
    },
    polygonCapColor: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const countryCode = getFeatureKey(feature);

      if (countryCode === selectedCountryCode) {
        return "rgba(217, 154, 50, 0.048)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(240, 182, 90, 0.044)";
      }

      if (countryCode && gameCountryCodes.has(countryCode)) {
        return activeRegionCountryCodes.has(countryCode)
          ? "rgba(122, 90, 42, 0.024)"
          : "rgba(58, 44, 24, 0.012)";
      }

      return "rgba(42, 36, 24, 0.006)";
    },
    polygonGeoJsonGeometry: (polygon) =>
      (polygon as CountryGeoJsonFeature).geometry as never,
    polygonLabel: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const mockCountryCode = getCountryCodeFromFeature(feature);
      const country = mockCountryCode ? countryByCode.get(mockCountryCode) : null;
      const label = country
        ? getCountryDisplayName(country)
        : getCountryNameFromFeature(feature);

      return label ? `<div class="globe-country-tooltip">${label}</div>` : "";
    },
    polygonSideColor: () => "rgba(217, 154, 50, 0.006)",
    polygonStrokeColor: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const countryCode = getFeatureKey(feature);

      if (countryCode === selectedCountryCode) {
        return "rgba(240, 182, 90, 0.72)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(217, 154, 50, 0.62)";
      }

      if (countryCode && gameCountryCodes.has(countryCode)) {
        return activeRegionCountryCodes.has(countryCode)
          ? "rgba(122, 90, 42, 0.42)"
          : "rgba(122, 90, 42, 0.26)";
      }

      return "rgba(58, 44, 24, 0.32)";
    },
    polygonsTransitionDuration: 0,
    onPolygonClick: (polygon) => {
      const countryCode = getFeatureKey(polygon as CountryGeoJsonFeature);

      if (countryCode) {
        onSelectCountry(countryCode);
      }
    },
    onPolygonHover: (polygon) => {
      if (!polygon) {
        onHoverCountry(null);
        return;
      }

      const countryCode = getFeatureKey(polygon as CountryGeoJsonFeature);

      onHoverCountry(countryCode);
    }
  };
}
