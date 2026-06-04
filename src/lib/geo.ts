import type { Country } from "@/types/game";

export function getCountryCoordinates(country: Country) {
  return {
    latitude: country.latitude,
    longitude: country.longitude
  };
}

export function getMarkerPosition(country: Country) {
  return {
    x: ((country.longitude + 180) / 360) * 100,
    y: ((90 - country.latitude) / 180) * 100
  };
}
