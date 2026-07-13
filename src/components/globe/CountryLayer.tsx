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
        return "rgba(255, 0, 110, 0.98)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(234, 244, 255, 0.96)";
      }

      return gameCountryCodes.has(countryCode)
        ? "rgba(0, 255, 255, 0.48)"
        : "rgba(140, 163, 184, 0.2)";
    },
    pointLabel: () => "",
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
    pointResolution: 5,
    pointsMerge: true,
    pointsTransitionDuration: 0,
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
        return "rgba(255, 0, 110, 0.14)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(234, 244, 255, 0.12)";
      }

      if (countryCode && gameCountryCodes.has(countryCode)) {
        return activeRegionCountryCodes.has(countryCode)
          ? "rgba(0, 255, 255, 0.055)"
          : "rgba(25, 58, 78, 0.022)";
      }

      return "rgba(6, 19, 36, 0.012)";
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
    polygonSideColor: () => "rgba(0, 255, 255, 0.012)",
    polygonStrokeColor: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const countryCode = getFeatureKey(feature);

      if (countryCode === selectedCountryCode) {
        return "rgba(255, 0, 110, 0.96)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(234, 244, 255, 0.9)";
      }

      if (countryCode && gameCountryCodes.has(countryCode)) {
        return activeRegionCountryCodes.has(countryCode)
          ? "rgba(0, 255, 255, 0.56)"
          : "rgba(0, 180, 210, 0.25)";
      }

      return "rgba(68, 96, 120, 0.3)";
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
