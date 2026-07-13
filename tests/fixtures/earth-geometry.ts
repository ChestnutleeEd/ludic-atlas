import type { Country, Game } from "../../src/types/game.ts";
import type { CountryGeoJsonFeature } from "../../src/lib/geo.ts";

export const fixtureCountry: Country = {
  code: "FX",
  latitude: 5,
  longitude: 5,
  name: "Fixtureland",
  nameZh: "测试国",
  region: "Fixture Region"
};

export const polygonFeature: CountryGeoJsonFeature = {
  geometry: {
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
    type: "Polygon"
  },
  properties: {
    "ISO3166-1-Alpha-2": "FX",
    name: "Fixtureland"
  },
  type: "Feature"
};

export const polygonWithHoleFeature: CountryGeoJsonFeature = {
  ...polygonFeature,
  geometry: {
    coordinates: [
      [[0, 0], [12, 0], [12, 12], [0, 12], [0, 0]],
      [[4, 4], [8, 4], [8, 8], [4, 8], [4, 4]]
    ],
    type: "Polygon"
  }
};

export const multiPolygonFeature: CountryGeoJsonFeature = {
  ...polygonFeature,
  geometry: {
    coordinates: [
      [[[0, 0], [8, 0], [8, 8], [0, 8], [0, 0]]],
      [[[20, 0], [24, 0], [24, 4], [20, 4], [20, 0]]]
    ],
    type: "MultiPolygon"
  }
};

export const dateLineFeature: CountryGeoJsonFeature = {
  ...polygonFeature,
  geometry: {
    coordinates: [[[170, -8], [-170, -8], [-170, 8], [170, 8], [170, -8]]],
    type: "Polygon"
  }
};

export function createFixtureGame(id: string, overrides: Partial<Game> = {}): Game {
  return {
    countryCode: fixtureCountry.code,
    countryName: fixtureCountry.name,
    coverImage: `/covers/${id}.webp`,
    description: "Fixture game",
    developer: "Fixture Studio",
    genres: ["Action"],
    id,
    platforms: ["PC"],
    publisher: "Fixture Publisher",
    rating: 8,
    releaseYear: 2020,
    title: `Fixture ${id}`,
    titleZh: `测试 ${id}`,
    ...overrides
  };
}
