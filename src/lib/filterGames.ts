import type { Game, YearRange } from "@/types/game";

export function filterGamesByCountry(
  gameList: Game[],
  countryCode: string
): Game[] {
  return gameList.filter((game) => game.countryCode === countryCode);
}

export function filterGamesByYearRange(
  gameList: Game[],
  yearRange: YearRange
): Game[] {
  return gameList.filter(
    (game) =>
      game.releaseYear >= yearRange.min && game.releaseYear <= yearRange.max
  );
}
