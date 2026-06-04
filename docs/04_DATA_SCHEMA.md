# 04_DATA_SCHEMA.md
## Purpose
This document defines the data structures for Game Earth.
The first MVP uses local mock data only. The data structure should be simple, stable, and easy to replace with an external API later.
## Country Mapping Rule
In the MVP, each game is mapped to the country or region of its main developer / studio.
Each game has one primary `countryCode`.
## Country Type

File: `src/types/game.ts`

```ts
export type Country = {
  code: string;
  name: string;
  nameZh: string;
  region: string;
  latitude: number;
  longitude: number;
};
```

## Game Type

File: `src/types/game.ts`

```ts
export type Game = {
  id: string;
  title: string;
  titleZh?: string;
  countryCode: string;
  countryName: string;
  developer: string;
  publisher?: string;
  releaseYear: number;
  genres: string[];
  platforms: string[];
  rating: number;
  coverImage: string;
  description: string;
};
```

## UI State Types

File: `src/types/game.ts`

```ts
export type ViewMode = "countries" | "games";

export type YearRange = {
  min: number;
  max: number;
};
```

## Derived Statistics Types

File: `src/types/game.ts`

```ts
export type CountryStats = {
  countryCode: string;
  gameCount: number;
  averageRating: number;
  topGenre: string | null;
};

export type TotalStats = {
  totalGames: number;
  totalCountries: number;
  minReleaseYear: number;
  maxReleaseYear: number;
};
```

## Country Mock Data

File: `src/data/countries.ts`

Example:

```ts
export const countries = [
  {
    code: "JP",
    name: "Japan",
    nameZh: "日本",
    region: "East Asia",
    latitude: 36.2048,
    longitude: 138.2529
  },
  {
    code: "US",
    name: "United States",
    nameZh: "美国",
    region: "North America",
    latitude: 37.0902,
    longitude: -95.7129
  }
];
```

Initial setup includes three countries:

- Japan
- United States
- Poland

## Game Mock Data

File: `src/data/games.ts`

Example:

```ts
export const games = [
  {
    id: "zelda-botw",
    title: "The Legend of Zelda: Breath of the Wild",
    titleZh: "塞尔达传说：旷野之息",
    countryCode: "JP",
    countryName: "Japan",
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseYear: 2017,
    genres: ["Action Adventure", "Open World"],
    platforms: ["Nintendo Switch", "Wii U"],
    rating: 9.7,
    coverImage: "/covers/zelda-botw.jpg",
    description: "An open-world action-adventure game known for its systemic gameplay and exploration freedom."
  }
];
```

Initial setup includes six games, two per country.

## Derived Statistics

Statistics should be calculated from games, not manually duplicated.

File: `src/lib/stats.ts`

Needed statistics:

* game count by country
* average rating by country
* top genre by country
* total game count
* total country count
* release year range

Implemented functions:

- `getCountryStats`
- `getTotalStats`

## Filtering Logic

File: `src/lib/filterGames.ts`

Required filters:

* filter games by countryCode
* filter games by year range
* filter games by genre, optional later
* filter countries by search keyword, optional later

Implemented functions:

- `filterGamesByCountry`
- `filterGamesByYearRange`

## Data Design Rules

1. Do not hardcode statistics inside UI components.
2. Do not duplicate country statistics in mock data.
3. Keep raw data in src/data/.
4. Keep TypeScript types in src/types/.
5. Keep filtering and statistics logic in src/lib/.
6. If new fields are added to Game or Country, update this document.
7. If the data source changes from mock data to API, update this document and docs/03_ARCHITECTURE.md.

Initial MVP Data Size

For the first version, prepare approximately:

* 8 to 12 countries
* 5 to 10 games per major country
* 50 to 80 games in total

Priority countries:

* Japan
* United States
* China
* South Korea
* Poland
* Sweden
* Finland
* France
* Canada
* United Kingdom
