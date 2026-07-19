import type { RatingRange } from "@/types/earth";
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
  return gameList.filter((game) => isGameInYearRange(game, yearRange));
}

export function isGameInYearRange(game: Game, yearRange: YearRange): boolean {
  return game.releaseYear >= yearRange.min && game.releaseYear <= yearRange.max;
}

export function filterGamesByRatingRange(
  gameList: Game[],
  ratingRange: RatingRange
): Game[] {
  return gameList.filter((game) => isGameInRatingRange(game, ratingRange));
}

export function isGameInRatingRange(game: Game, ratingRange: RatingRange) {
  return game.rating >= ratingRange.min && game.rating <= ratingRange.max;
}
