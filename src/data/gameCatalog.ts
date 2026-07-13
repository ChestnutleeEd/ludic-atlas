import { countries } from "@/data/countries";
import { games } from "@/data/games";
import { getTotalStats } from "@/lib/stats";
import type { Country, Game, TotalStats } from "@/types/game";

export type GameCatalog = {
  countries: Country[];
  countryByCode: ReadonlyMap<string, Country>;
  gameById: ReadonlyMap<string, Game>;
  games: Game[];
  gamesByCountry: ReadonlyMap<string, readonly Game[]>;
  recognizedCountryCount: number;
  recognizedGameCount: number;
  totalStats: TotalStats;
};

const countryByCode = new Map(
  countries.map((country) => [country.code, country])
);
const gameById = new Map<string, Game>();
const gamesByCountry = new Map<string, Game[]>();
const recognizedCountryCodes = new Set<string>();
let recognizedGameCount = 0;

for (const game of games) {
  gameById.set(game.id, game);

  if (!countryByCode.has(game.countryCode)) {
    continue;
  }

  recognizedGameCount += 1;
  recognizedCountryCodes.add(game.countryCode);

  const countryGames = gamesByCountry.get(game.countryCode);
  if (countryGames) {
    countryGames.push(game);
  } else {
    gamesByCountry.set(game.countryCode, [game]);
  }
}

export const gameCatalog: GameCatalog = Object.freeze({
  countries,
  countryByCode,
  gameById,
  games,
  gamesByCountry,
  recognizedCountryCount: recognizedCountryCodes.size,
  recognizedGameCount,
  totalStats: getTotalStats(countries, games)
});
