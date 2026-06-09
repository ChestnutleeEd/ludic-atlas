# 04_DATA_SCHEMA.md
## Purpose
This document defines the data structures for Game Earth.
The first MVP uses local static data. RAWG can be used by a local generation script, but the browser app reads generated files only and does not request external APIs at runtime.
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
  titleZh: string;
  countryCode: string;
  countryName: string;
  developer: string;
  publisher: string;
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

Current mock data includes ten countries / regions:

- Japan
- United States
- China
- South Korea
- Poland
- Sweden
- Finland
- France
- Canada
- United Kingdom

## Game Data Export

File: `src/data/games.ts`

`src/data/games.ts` is the stable frontend import. It exports `generatedGames` from `src/data/games.generated.ts`.

The original stable mock dataset is preserved in:

```text
src/data/games.mock.ts
```

## RAWG Generated Data

Generated file:

```text
src/data/games.generated.ts
```

Generation command:

```bash
npm run data:rawg
```

Batch generation mode:

```bash
RAWG_FETCH_MODE=batch npm run data:rawg
```

Batch mode uses the RAWG `/api/games` list endpoint and does not read `scripts/rawg-seeds.mjs`. It fetches paginated results with these defaults, each of which can be overridden through environment variables:

| Environment variable | Default |
| -------------------- | ------- |
| `RAWG_START_DATE` | `2010-01-01` |
| `RAWG_END_DATE` | `2026-12-31` |
| `RAWG_MIN_METACRITIC` | `80` |
| `RAWG_MAX_METACRITIC` | `100` |
| `RAWG_ORDERING` | `-metacritic` |
| `RAWG_PAGE_SIZE` | `40` |
| `RAWG_MAX_GAMES` | `100` |

Batch mode keeps only records with `background_image`, filters obvious non-primary content names such as DLC / expansion / soundtrack / demo / beta / bundle / pack / collection, and deduplicates by RAWG id plus same title / release date where possible. RAWG list results do not include reliable developer country data, so batch generated records use `countryCode: "UNKNOWN"` and `countryName: "Global"` until a separate country enrichment step exists.

Batch mode can optionally add a recent-game supplement pool so 2024-2026 games whose `metacritic` is still empty can enter the generated Archive timeline. Enable it with:

```bash
RAWG_FETCH_MODE=batch RAWG_INCLUDE_RECENT=true npm run data:rawg
```

Recent supplement defaults:

| Environment variable | Default |
| -------------------- | ------- |
| `RAWG_INCLUDE_RECENT` | `false` |
| `RAWG_RECENT_START_DATE` | `2024-01-01` |
| `RAWG_RECENT_END_DATE` | `2026-12-31` |
| `RAWG_RECENT_ORDERING` | `-rating` |
| `RAWG_RECENT_MAX_GAMES` | `100` |
| `RAWG_RECENT_MIN_RATING` | `4.0` |
| `RAWG_RECENT_MIN_RATINGS_COUNT` | `20` |
| `RAWG_RECENT_MAX_PAGES` | `25` |
| `RAWG_REQUEST_TIMEOUT_MS` | `8000` |

When `RAWG_INCLUDE_RECENT=true`, the script fetches the main classic pool first, then fetches the recent pool from RAWG `/api/games` with `dates`, `ordering`, `page_size=40`, and no `metacritic` parameter. Recent results are filtered locally by `background_image`, RAWG 0-5 `rating`, `ratings_count`, and the same non-primary content keywords. The main pool target is reduced by `RAWG_RECENT_MAX_GAMES` so the final merged data stays within `RAWG_MAX_GAMES`; final merging keeps main-pool games first, appends recent games, deduplicates by RAWG id or normalized title plus release year, and writes at most `RAWG_MAX_GAMES` records.

Seed file:

```text
scripts/rawg-seeds.mjs
```

The seed list is manually maintained because RAWG does not reliably provide a developer country field. Each seed maps a RAWG slug or search keyword to a project `countryCode` and `countryName` based on the game developer / studio country or region.

Seed fields:

```ts
{
  slug?: string;
  search?: string;
  countryCode: string;
  countryName: string;
  titleZh?: string;
  developer?: string;
  publisher?: string;
}
```

RAWG field mapping:

| Game field | Source |
| ---------- | ------ |
| `id` | Batch: RAWG `slug`, falling back to normalized title / RAWG id. Seed: seed slug, RAWG slug, or normalized search/title |
| `title` | RAWG `name` |
| `titleZh` | Batch: RAWG `name`. Seed: seed `titleZh`, falling back to RAWG `name` |
| `countryCode` | Batch: `UNKNOWN`. Seed: seed `countryCode` |
| `countryName` | Batch: `Global`. Seed: seed `countryName` |
| `developer` | Batch: `Unknown`. Seed: first RAWG developer, falling back to seed `developer`, then `Unknown` |
| `publisher` | Batch: `Unknown`. Seed: first RAWG publisher, falling back to seed `publisher`, then `Unknown` |
| `releaseYear` | Year parsed from RAWG `released`, falling back to `0` |
| `genres` | RAWG `genres[].name`, falling back to `Unknown` |
| `platforms` | RAWG `platforms[].platform.name`, falling back to `Unknown` |
| `rating` | RAWG 0-5 rating converted to the existing 0-10 display scale |
| `coverImage` | RAWG `background_image` remote URL |
| `description` | Batch: short generated RAWG / Metacritic / release summary. Seed: RAWG `description_raw`, falling back to a short generated sentence |

The checked-in default `games.generated.ts` may point to `mockGames` so the app remains runnable before a RAWG API key is configured. Running `RAWG_FETCH_MODE=batch npm run data:rawg` overwrites it with static generated RAWG records. Non-batch mode preserves the legacy manually maintained seed flow.

## Stable Mock Data

File: `src/data/games.mock.ts`

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

Current mock fallback data includes 50 games across the ten countries / regions.

Country coverage:

- Japan: 8 games
- United States: 8 games
- China: 5 games
- South Korea: 5 games
- Poland: 4 games
- Sweden: 4 games
- Finland: 4 games
- France: 4 games
- Canada: 4 games
- United Kingdom: 4 games

### Cover Image Usage

For mock fallback data, `coverImage` is a future-ready static asset path. For RAWG generated data, `coverImage` is the remote RAWG `background_image` URL.

Path format:

```text
/covers/{game-id}.jpg
```

The file should live at:

```text
public/covers/{game-id}.jpg
```

Rendering rules:

* If `coverImage` points to an existing local static image, marker and detail card components display that image.
* If the image path is missing in `public/` or fails to load, the UI falls back to a blue-purple gradient cover placeholder.
* The fallback cover displays the Chinese-first game title, release year, and rating where the available marker size allows.
* Every mock game should use `/covers/{game-id}.jpg`, where `{game-id}` exactly matches the `id` field.
* RAWG generated records may use remote `background_image` URLs.
* Do not download RAWG images into the repository in the current MVP.
* If a remote image fails to load, existing fallback cover UI should keep the page usable.

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
7. If the data source changes from local generated files to browser runtime API calls, update this document and docs/03_ARCHITECTURE.md.

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
