import assert from "node:assert/strict";
import test from "node:test";
import { selectStableMarkerGames } from "../src/lib/globeMarkerModel.ts";
import type { Game } from "../src/types/game.ts";

const games = Array.from({ length: 20 }, (_, index) => createGame(index));

test("marker selection is capped, stable, and independent from hover", () => {
  const first = selectStableMarkerGames(games, 12, null);
  const reordered = selectStableMarkerGames([...games].reverse(), 12, null);
  assert.equal(first.length, 12);
  assert.deepEqual(first.map((game) => game.id), reordered.map((game) => game.id));
  assert.equal(first, selectStableMarkerGames(games, 12, null));
});

test("selected game remains visible without changing the cap", () => {
  const selected = selectStableMarkerGames(games, 4, "game-19");
  assert.equal(selected.length, 4);
  assert.ok(selected.some((game) => game.id === "game-19"));
});

function createGame(index: number): Game {
  return { id: `game-${index}`, countryCode: "SE", countryName: "Sweden", coverImage: `/cover-${index}.webp`, description: "", developer: "Studio", genres: [], platforms: [], publisher: "", rating: index % 5, releaseYear: 2020 + (index % 3), title: `Game ${index}`, titleZh: `游戏 ${index}` };
}
