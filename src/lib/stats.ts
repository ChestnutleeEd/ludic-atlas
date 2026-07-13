import type { Country, CountryStats, Game, TotalStats } from "@/types/game";

export function getCountryStats(
  country: Country,
  gameList: Game[]
): CountryStats {
  return (
    getCountryStatsByCode([country], gameList).get(country.code) ??
    createEmptyCountryStats(country.code)
  );
}

export function getCountryStatsByCode(
  countries: Country[],
  gameList: Game[]
): Map<string, CountryStats> {
  const accumulators = new Map(
    countries.map((country) => [
      country.code,
      {
        gameCount: 0,
        genreCounts: new Map<string, number>(),
        ratingTotal: 0
      }
    ])
  );

  for (const game of gameList) {
    const accumulator = accumulators.get(game.countryCode);

    if (!accumulator) {
      continue;
    }

    accumulator.gameCount += 1;
    accumulator.ratingTotal += Number.isFinite(game.rating) ? game.rating : 0;
    for (const genre of game.genres) {
      accumulator.genreCounts.set(
        genre,
        (accumulator.genreCounts.get(genre) ?? 0) + 1
      );
    }
  }

  return new Map(
    countries.map((country) => {
      const accumulator = accumulators.get(country.code);

      if (!accumulator || accumulator.gameCount === 0) {
        return [country.code, createEmptyCountryStats(country.code)];
      }

      let topGenre: string | null = null;
      let topGenreCount = 0;

      for (const [genre, count] of accumulator.genreCounts) {
        if (count > topGenreCount) {
          topGenre = genre;
          topGenreCount = count;
        }
      }

      return [
        country.code,
        {
          countryCode: country.code,
          gameCount: accumulator.gameCount,
          averageRating: Number(
            (accumulator.ratingTotal / accumulator.gameCount).toFixed(1)
          ),
          topGenre
        }
      ];
    })
  );
}

function createEmptyCountryStats(countryCode: string): CountryStats {
  return {
    countryCode,
    gameCount: 0,
    averageRating: 0,
    topGenre: null
  };
}

export function getTotalStats(
  countries: Country[],
  gameList: Game[]
): TotalStats {
  let minReleaseYear = Number.POSITIVE_INFINITY;
  let maxReleaseYear = Number.NEGATIVE_INFINITY;

  for (const game of gameList) {
    if (!Number.isFinite(game.releaseYear) || game.releaseYear <= 0) {
      continue;
    }

    minReleaseYear = Math.min(minReleaseYear, game.releaseYear);
    maxReleaseYear = Math.max(maxReleaseYear, game.releaseYear);
  }

  return {
    totalGames: gameList.length,
    totalCountries: countries.length,
    minReleaseYear: Number.isFinite(minReleaseYear) ? minReleaseYear : 0,
    maxReleaseYear: Number.isFinite(maxReleaseYear) ? maxReleaseYear : 0
  };
}
