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
  countries: Country[];
  countryDots: CountryDotPoint[];
  countryFeatures: CountryGeoJsonFeature[];
  hoveredCountryCode: string | null;
  selectedCountryCode: string | null;
  onHoverCountry: (countryCode: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
};

export function getCountryLayerProps({
  countries,
  countryDots,
  countryFeatures,
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
      (point as CountryDotPoint).countryCode === selectedCountryCode ? 0.012 : 0.007,
    pointColor: (point) => {
      const countryCode = (point as CountryDotPoint).countryCode;

      if (countryCode === selectedCountryCode) {
        return "rgba(245, 250, 255, 0.98)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(190, 245, 255, 0.94)";
      }

      return "rgba(220, 225, 230, 0.46)";
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
        return 0.14;
      }

      if (countryCode === hoveredCountryCode) {
        return 0.12;
      }

      return 0.075;
    },
    pointResolution: 3,
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
        return "rgba(245, 250, 255, 0.052)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(190, 245, 255, 0.045)";
      }

      if (countryCode && supportedCountryCodes.has(countryCode)) {
        return "rgba(230, 236, 242, 0.016)";
      }

      return "rgba(230, 236, 242, 0.006)";
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
    polygonSideColor: () => "rgba(245, 250, 255, 0.004)",
    polygonStrokeColor: (polygon) => {
      const feature = polygon as CountryGeoJsonFeature;
      const countryCode = getFeatureKey(feature);

      if (countryCode === selectedCountryCode) {
        return "rgba(250, 253, 255, 0.98)";
      }

      if (countryCode === hoveredCountryCode) {
        return "rgba(190, 245, 255, 0.94)";
      }

      if (countryCode && supportedCountryCodes.has(countryCode)) {
        return "rgba(225, 231, 238, 0.68)";
      }

      return "rgba(225, 231, 238, 0.34)";
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
