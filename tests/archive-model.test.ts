import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { generatedGames as games } from "../src/data/games.generated.ts";
import {
  UNKNOWN_ARCHIVE_YEAR_KEY,
  deriveArchiveModel,
  getArchiveYearKey
} from "../src/lib/archiveModel.ts";
import type { Game } from "../src/types/game.ts";

const emptySelection = new Set<string>();

test("current catalog produces a chronological archive and selects every game by id", () => {
  const base = deriveArchiveModel({
    games,
    openYearKey: null,
    query: "",
    selectedArchiveGameId: null,
    selectedGenres: emptySelection,
    selectedPlatforms: emptySelection,
    sortMode: "year-desc"
  });

  assert.equal(games.length, 992);
  assert.equal(base.yearGroups.filter((group) => group.year !== null).length, 17);
  assert.deepEqual(
    base.yearGroups.filter((group) => group.year !== null).map((group) => group.year),
    [...base.yearGroups]
      .filter((group) => group.year !== null)
      .map((group) => group.year)
      .sort((a, b) => (b ?? 0) - (a ?? 0))
  );

  for (const game of games) {
    const model = deriveArchiveModel({
      games,
      openYearKey: getArchiveYearKey(game),
      query: "",
      selectedArchiveGameId: game.id,
      selectedGenres: emptySelection,
      selectedPlatforms: emptySelection,
      sortMode: "year-desc"
    });

    assert.equal(model.selectedGame?.id, game.id);
  }

  const unknownGames = games.filter((game) => game.countryCode === "UNKNOWN");
  assert.equal(unknownGames.length, 200);
  assert.ok(unknownGames.every((game) => {
    const model = deriveArchiveModel({
      games,
      openYearKey: getArchiveYearKey(game),
      query: "",
      selectedArchiveGameId: game.id,
      selectedGenres: emptySelection,
      selectedPlatforms: emptySelection,
      sortMode: "year-desc"
    });
    return model.selectedGame?.id === game.id;
  }));
});

test("search and filters use title metadata and OR-within AND-across semantics", () => {
  const fixtures = [
    createGame({
      developer: "Paper Studio",
      genres: ["Action", "RPG"],
      id: "paper",
      platforms: ["PC"],
      publisher: "Brass Press",
      title: "Paper Atlas"
    }),
    createGame({
      genres: ["Strategy"],
      id: "strategy",
      platforms: ["Switch"],
      title: "Quiet Index"
    })
  ];
  const model = deriveArchiveModel({
    games: fixtures,
    openYearKey: 2024,
    query: "brass press",
    selectedArchiveGameId: null,
    selectedGenres: new Set(["Action", "Adventure"]),
    selectedPlatforms: new Set(["PC", "PlayStation 5"]),
    sortMode: "year-desc"
  });

  assert.deepEqual(model.filteredGames.map((game) => game.id), ["paper"]);
});

test("rating priority reorders games without changing chronological year order", () => {
  const fixtures = [
    createGame({ id: "a", rating: 7, releaseYear: 2023, title: "Alpha" }),
    createGame({ id: "b", rating: 9, releaseYear: 2023, title: "Beta" }),
    createGame({ id: "c", rating: 10, releaseYear: 2022, title: "Gamma" }),
    createGame({ id: "unknown", rating: 11, releaseYear: 0, title: "Unknown" })
  ];
  const model = deriveArchiveModel({
    games: fixtures,
    openYearKey: 2023,
    query: "",
    selectedArchiveGameId: null,
    selectedGenres: emptySelection,
    selectedPlatforms: emptySelection,
    sortMode: "rating-desc"
  });

  assert.deepEqual(model.yearGroups.map((group) => group.key), [
    2023,
    2022,
    UNKNOWN_ARCHIVE_YEAR_KEY
  ]);
  assert.deepEqual(model.activeGroup?.games.map((game) => game.id), ["b", "a"]);
});

test("every catalog year derives a distinct three-cover annual visual signature", () => {
  const model = deriveArchiveModel({
    games,
    openYearKey: null,
    query: "",
    selectedArchiveGameId: null,
    selectedGenres: emptySelection,
    selectedPlatforms: emptySelection,
    sortMode: "year-desc"
  });
  const datedGroups = model.yearGroups.filter((group) => group.year !== null);

  assert.equal(datedGroups.length, 17);
  assert.equal(new Set(datedGroups.map((group) => group.coverSignature)).size, 17);
  assert.ok(datedGroups.every((group) => group.featureGames.length === 3));
  assert.ok(datedGroups.every((group) => group.featureGames[0]?.id === group.representativeGame?.id));
  assert.ok(datedGroups.every((group) => group.yearVariant >= 0 && group.yearVariant <= 3));
});

test("invalid year and selected game resolve to the latest valid group without stale detail", () => {
  const fixtures = [
    createGame({ id: "latest", releaseYear: 2024, title: "Latest" }),
    createGame({ id: "older", releaseYear: 2020 })
  ];
  const model = deriveArchiveModel({
    games: fixtures,
    openYearKey: 1999,
    query: "latest",
    selectedArchiveGameId: "older",
    selectedGenres: emptySelection,
    selectedPlatforms: emptySelection,
    sortMode: "year-desc"
  });

  assert.equal(model.activeYearKey, 2024);
  assert.equal(model.selectedGame, null);
});

test("archive styles stay module-scoped and the generated hero stays within budget", () => {
  const css = readFileSync(
    new URL("../src/components/archive/GameArchiveView.module.css", import.meta.url),
    "utf8"
  );
  const hero = statSync(
    new URL("../public/images/archive/chronicle-reading-room.webp", import.meta.url)
  );

  assert.match(css, /^\.root\s*\{/m);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /^\s*(button|h1|img|\.card|\.panel)\s*[,\{]/m);
  assert.ok(hero.size > 0);
  assert.ok(hero.size <= 350 * 1024);
  assert.ok(
    games.every((game) =>
      existsSync(
        new URL(`../public/covers/rawg/${encodeURIComponent(game.id)}.webp`, import.meta.url)
      )
    )
  );
});

function createGame(overrides: Partial<Game>): Game {
  return {
    countryCode: "UNKNOWN",
    countryName: "Global",
    coverImage: "/covers/fallback-game-cover.svg",
    description: "Fixture description",
    developer: "Fixture Studio",
    genres: ["Action"],
    id: "fixture",
    platforms: ["PC"],
    publisher: "Fixture Publisher",
    rating: 8,
    releaseYear: 2024,
    title: "Fixture",
    titleZh: "",
    ...overrides
  };
}
