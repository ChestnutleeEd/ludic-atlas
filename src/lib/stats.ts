import type { Country, CountryStats, Game, TotalStats } from "@/types/game";

export function getCountryStats(
  country: Country,
  gameList: Game[]
): CountryStats {
  const countryGames = gameList.filter((game) => game.countryCode === country.code);
  const genreCounts = new Map<string, number>();

  for (const game of countryGames) {
    for (const genre of game.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  const topGenre =
    [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const averageRating =
    countryGames.length === 0
      ? 0
      : countryGames.reduce((sum, game) => sum + game.rating, 0) /
        countryGames.length;

  return {
    countryCode: country.code,
    gameCount: countryGames.length,
    averageRating: Number(averageRating.toFixed(1)),
    topGenre
  };
}

export function getTotalStats(
  countries: Country[],
  gameList: Game[]
): TotalStats {
  const releaseYears = gameList.map((game) => game.releaseYear);

  return {
    totalGames: gameList.length,
    totalCountries: countries.length,
    minReleaseYear: Math.min(...releaseYears),
    maxReleaseYear: Math.max(...releaseYears)
  };
}
