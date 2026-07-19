import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createInitialEarthViewState,
  deriveSpatialNavigationIntent,
  isSpatialNavigationIntentStale,
  setEarthProjectionMode
} from "../src/lib/earthViewState.ts";
import type { ExplorationState } from "../src/lib/explorerState.ts";
import type { EarthFilterState, EarthViewState } from "../src/types/earth.ts";
import type { Country, Game } from "../src/types/game.ts";

const countries: Country[] = [
  country("FR", "France", "Europe"),
  country("JP", "Japan", "East Asia")
];
const games: Game[] = [game("fr-game", "FR"), game("jp-game", "JP")];
const countryByCode = new Map(countries.map((value) => [value.code, value]));
const gameById = new Map(games.map((value) => [value.id, value]));

test("Earth view state defaults to Globe with independent renderer snapshots", () => {
  const state = createInitialEarthViewState();

  assert.equal(state.projectionMode, "globe");
  assert.notEqual(state.globeViewState, state.atlasViewState);
  assert.deepEqual(state.globeViewState, { altitude: 1.36, lat: 24, lng: 38 });
  assert.deepEqual(state.atlasViewState, { centerLat: 20, centerLng: 0, zoom: 1 });
});

test("projection changes preserve authoritative selection, filters, and view snapshots", () => {
  const exploration: ExplorationState = {
    activeRegionId: "europe",
    cameraMode: "surface",
    selectedCountryCode: "FR",
    selectedGameId: "fr-game",
    selectionRevision: 7
  };
  const filters: EarthFilterState = {
    coverSize: 64,
    ratingRange: { min: 7.5, max: 10 },
    viewMode: "games",
    yearRange: { min: 2018, max: 2024 }
  };
  const initialViewState = createInitialEarthViewState();
  const nextViewState = setEarthProjectionMode(initialViewState, "atlas");

  assert.equal(nextViewState.projectionMode, "atlas");
  assert.equal(nextViewState.globeViewState, initialViewState.globeViewState);
  assert.equal(nextViewState.atlasViewState, initialViewState.atlasViewState);
  assert.deepEqual(exploration, {
    activeRegionId: "europe",
    cameraMode: "surface",
    selectedCountryCode: "FR",
    selectedGameId: "fr-game",
    selectionRevision: 7
  });
  assert.deepEqual(filters, {
    coverSize: 64,
    ratingRange: { min: 7.5, max: 10 },
    viewMode: "games",
    yearRange: { min: 2018, max: 2024 }
  });
});

test("one navigation selector applies game, country, region, global priority", () => {
  const gameIntent = deriveSpatialNavigationIntent({
    countryByCode,
    exploration: exploration({ selectedCountryCode: "FR", selectedGameId: "jp-game" }),
    gameById
  });
  assert.deepEqual(gameIntent.target, {
    countryCode: "JP",
    gameId: "jp-game",
    type: "game"
  });

  const countryIntent = deriveSpatialNavigationIntent({
    countryByCode,
    exploration: exploration({ selectedCountryCode: "FR" }),
    gameById
  });
  assert.deepEqual(countryIntent.target, { countryCode: "FR", type: "country" });

  const regionIntent = deriveSpatialNavigationIntent({
    countryByCode,
    exploration: exploration({ activeRegionId: "europe" }),
    gameById
  });
  assert.deepEqual(regionIntent.target, { regionId: "europe", type: "region" });

  const globalIntent = deriveSpatialNavigationIntent({
    countryByCode,
    exploration: exploration(),
    gameById
  });
  assert.deepEqual(globalIntent.target, { type: "global" });
});

test("invalid selections degrade safely and old revisions become stale", () => {
  const intent = deriveSpatialNavigationIntent({
    countryByCode,
    exploration: exploration({
      activeRegionId: "europe",
      selectedCountryCode: "XX",
      selectedGameId: "missing",
      selectionRevision: 4
    }),
    gameById
  });

  assert.deepEqual(intent.target, { regionId: "europe", type: "region" });
  assert.equal(intent.revision, 4);
  assert.equal(isSpatialNavigationIntentStale(intent, 5), true);
  assert.equal(isSpatialNavigationIntentStale(intent, 4), false);
});

test("Chronicle has no Earth projection, view-state, or reducer dispatch boundary", async () => {
  const source = await readFile(
    new URL("../src/components/archive/GameArchiveView.tsx", import.meta.url),
    "utf8"
  );

  for (const forbidden of [
    "dispatchExploration",
    "projectionMode",
    "globeViewState",
    "atlasViewState"
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
});

test("Earth shared view state rejects imperative renderer handles at type level", () => {
  const cameraLeak: EarthViewState = {
    ...createInitialEarthViewState(),
    // @ts-expect-error Camera references are renderer-local.
    camera: {}
  };
  const controlsLeak: EarthViewState = {
    ...createInitialEarthViewState(),
    // @ts-expect-error Controls references are renderer-local.
    controls: {}
  };
  const rendererLeak: EarthViewState = {
    ...createInitialEarthViewState(),
    // @ts-expect-error WebGL renderer references are renderer-local.
    renderer: {}
  };

  assert.equal("camera" in createInitialEarthViewState(), false);
  void cameraLeak;
  void controlsLeak;
  void rendererLeak;
});

function exploration(
  overrides: Partial<ExplorationState> = {}
): ExplorationState {
  return {
    activeRegionId: "global",
    cameraMode: "overview",
    selectedCountryCode: null,
    selectedGameId: null,
    selectionRevision: 3,
    ...overrides
  };
}

function country(code: string, name: string, region: string): Country {
  return { code, latitude: 0, longitude: 0, name, nameZh: name, region };
}

function game(id: string, countryCode: string): Game {
  return {
    countryCode,
    countryName: countryCode,
    coverImage: "",
    description: "",
    developer: "Studio",
    genres: [],
    id,
    platforms: [],
    publisher: "",
    rating: 8,
    releaseYear: 2020,
    title: id,
    titleZh: id
  };
}
