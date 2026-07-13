import type { Game } from "../types/game";

const selectionCache = new WeakMap<Game[], Map<string, Game[]>>();

export function selectStableMarkerGames(games: Game[], limit: number, selectedGameId: string | null) {
  const key = `${limit}:${selectedGameId ?? ""}`;
  const cached = selectionCache.get(games)?.get(key);
  if (cached) return cached;

  const sorted = [...games].sort(compareMarkerGames);
  let selected = sorted.slice(0, Math.max(0, limit));
  if (selectedGameId && !selected.some((game) => game.id === selectedGameId)) {
    const chosen = sorted.find((game) => game.id === selectedGameId);
    if (chosen && limit > 0) selected = [...selected.slice(0, limit - 1), chosen];
  }
  let cache = selectionCache.get(games);
  if (!cache) {
    cache = new Map();
    selectionCache.set(games, cache);
  }
  cache.set(key, selected);
  return selected;
}

function compareMarkerGames(a: Game, b: Game) {
  return b.rating - a.rating || b.releaseYear - a.releaseYear || a.id.localeCompare(b.id);
}
