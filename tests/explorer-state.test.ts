import assert from "node:assert/strict";
import test from "node:test";
import {
  createExplorationReducer,
  initialExplorationState
} from "../src/lib/explorerState.ts";
import type { Country, Game } from "../src/types/game.ts";

const countries: Country[] = [
  { code: "SE", latitude: 62, longitude: 15, name: "Sweden", nameZh: "瑞典", region: "Europe" },
  { code: "JP", latitude: 36, longitude: 138, name: "Japan", nameZh: "日本", region: "East Asia" }
];
const games = [game("se-game", "SE"), game("jp-game", "JP")];
const reduce = createExplorationReducer(countries, games);

test("country and game actions atomically synchronize their region", () => {
  const sweden = reduce(initialExplorationState, { type: "selectCountry", countryCode: "SE" });
  assert.deepEqual(
    [sweden.activeRegionId, sweden.cameraMode, sweden.selectedCountryCode, sweden.selectedGameId],
    ["europe", "surface", "SE", null]
  );

  const japan = reduce(sweden, { type: "selectGame", gameId: "jp-game" });
  assert.deepEqual(
    [japan.activeRegionId, japan.cameraMode, japan.selectedCountryCode, japan.selectedGameId],
    ["eastAsia", "surface", "JP", "jp-game"]
  );
});

test("invalid ids are idempotent and reset is complete", () => {
  assert.equal(reduce(initialExplorationState, { type: "selectCountry", countryCode: "XX" }), initialExplorationState);
  assert.equal(reduce(initialExplorationState, { type: "selectGame", gameId: "missing" }), initialExplorationState);
  const selected = reduce(initialExplorationState, { type: "selectGame", gameId: "se-game" });
  assert.deepEqual(reduce(selected, { type: "reset" }), initialExplorationState);
});

test("one hundred rapid selections preserve the final intent", () => {
  let state = initialExplorationState;
  for (let index = 0; index < 100; index += 1) {
    state = reduce(state, { type: "selectCountry", countryCode: index === 99 ? "JP" : index % 2 ? "SE" : "JP" });
  }
  assert.equal(state.selectedCountryCode, "JP");
  assert.equal(state.activeRegionId, "eastAsia");
  assert.equal(state.selectionRevision, 100);
});

function game(id: string, countryCode: string): Game {
  return { id, countryCode, countryName: countryCode, coverImage: "", description: "", developer: "Studio", genres: [], platforms: [], publisher: "", rating: 8, releaseYear: 2020, title: id, titleZh: id };
}
