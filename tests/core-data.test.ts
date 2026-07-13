import assert from "node:assert/strict";
import test from "node:test";
import {
  filterGamesByCountry,
  filterGamesByYearRange,
  isGameInYearRange
} from "../src/lib/filterGames.ts";
import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage
} from "../src/lib/gameCover.ts";
import {
  getCountryStatsByCode,
  getTotalStats
} from "../src/lib/stats.ts";
import type { Country, Game } from "../src/types/game.ts";

const countries: Country[] = [
  {
    code: "JP",
    latitude: 36,
    longitude: 138,
    name: "Japan",
    nameZh: "日本",
    region: "East Asia"
  },
  {
    code: "US",
    latitude: 38,
    longitude: -97,
    name: "United States",
    nameZh: "美国",
    region: "North America"
  }
];

const games: Game[] = [
  createGame({ id: "jp-action", countryCode: "JP", releaseYear: 2018, rating: 9, genres: ["Action"] }),
  createGame({ id: "jp-rpg", countryCode: "JP", releaseYear: 2020, rating: 7, genres: ["RPG", "Action"] }),
  createGame({ id: "us-rpg", countryCode: "US", releaseYear: 2022, rating: 8, genres: ["RPG"] }),
  createGame({ id: "unknown", countryCode: "UNKNOWN", releaseYear: 0, rating: 10 })
];

test("country statistics scan mapped games once and ignore unknown countries", () => {
  const stats = getCountryStatsByCode(countries, games);

  assert.deepEqual(stats.get("JP"), {
    averageRating: 8,
    countryCode: "JP",
    gameCount: 2,
    topGenre: "Action"
  });
  assert.deepEqual(stats.get("US"), {
    averageRating: 8,
    countryCode: "US",
    gameCount: 1,
    topGenre: "RPG"
  });
});

test("total statistics ignore invalid years and handle an empty catalog", () => {
  assert.deepEqual(getTotalStats(countries, games), {
    maxReleaseYear: 2022,
    minReleaseYear: 2018,
    totalCountries: 2,
    totalGames: 4
  });
  assert.deepEqual(getTotalStats([], []), {
    maxReleaseYear: 0,
    minReleaseYear: 0,
    totalCountries: 0,
    totalGames: 0
  });
});

test("country and year filters preserve catalog order", () => {
  assert.deepEqual(
    filterGamesByCountry(games, "JP").map((game) => game.id),
    ["jp-action", "jp-rpg"]
  );
  assert.deepEqual(
    filterGamesByYearRange(games, { min: 2020, max: 2022 }).map(
      (game) => game.id
    ),
    ["jp-rpg", "us-rpg"]
  );
  assert.equal(
    isGameInYearRange(games[0], { min: 2019, max: 2022 }),
    false
  );
});

test("cover selection uses the first valid source and falls back safely", () => {
  const withAlternateCover = createGame({
    backgroundImage: "/covers/alternate.webp",
    coverImage: "undefined",
    id: "alternate"
  });
  const withoutCover = createGame({ coverImage: "#", id: "fallback" });

  assert.equal(getGameCoverImage(withAlternateCover), "/covers/alternate.webp");
  assert.equal(getGameCoverImage(withoutCover), FALLBACK_GAME_COVER_IMAGE);
});

function createGame(overrides: Partial<Game>): Game {
  return {
    countryCode: "JP",
    countryName: "Japan",
    coverImage: "/covers/game.webp",
    description: "Fixture game",
    developer: "Fixture Studio",
    genres: ["Action"],
    id: "fixture",
    platforms: ["PC"],
    publisher: "Fixture Publisher",
    rating: 8,
    releaseYear: 2020,
    title: "Fixture",
    titleZh: "测试游戏",
    ...overrides
  };
}
