import type { Country, Game } from "@/types/game";

export function searchGames(gameList: Game[], keyword: string): Game[] {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return gameList;
  }

  return gameList.filter((game) =>
    [game.title, game.titleZh, game.developer, game.countryName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedKeyword))
  );
}

export function searchCountries(countries: Country[], keyword: string): Country[] {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return countries;
  }

  return countries.filter((country) =>
    [country.name, country.nameZh, country.region]
      .some((value) => value.toLowerCase().includes(normalizedKeyword))
  );
}
