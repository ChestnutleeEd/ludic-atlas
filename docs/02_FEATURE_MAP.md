# 02_FEATURE_MAP.md

## Purpose

This document maps each product feature to its responsible files.

Codex must read this file before modifying any feature. The goal is to avoid unnecessary full-project search and quickly locate the correct files.

## How Codex Should Use This File

Before modifying a feature:

1. Find the feature in the table below.
2. Read only the listed main file and related files.
3. Modify the smallest necessary file set.
4. If a feature or file path changes, update this document.

If the requested feature is not listed here, Codex may inspect the project structure and then add the new mapping to this file.

## Feature-to-File Mapping

| Feature              | User-Facing Behavior                                                  | Main File                                      | Related Files                                                                                                                         | Notes                                              |
| -------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Project setup        | App can be installed, linted, type checked, and run locally           | `package.json`                                 | `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `package-lock.json`, `.gitignore`                       | Next.js + TypeScript + Tailwind + ESLint baseline  |
| Project documentation | User and Codex can find setup, source entrypoints, and verification rules | `README.md`                                    | `docs/00_PROJECT_INDEX.md`, `docs/06_CODEX_RULES.md`, `.codex_task_template.md`, `docs/05_TASK_LOG.md`                                | Keep source location and page acceptance guidance current |
| Home page            | User opens the app and sees Game Earth                                | `src/app/page.tsx`                             | `src/components/GameEarthApp.tsx`                                                                                                     | Keep page entry simple                             |
| Root layout          | Provides App Router document shell, metadata, favicon, and global CSS          | `src/app/layout.tsx`                           | `src/app/globals.css`, `public/favicon.svg`                                                                                           | Keep layout minimal                                |
| Main product shell   | Overall layout, top-level state, data flow                            | `src/components/GameEarthApp.tsx`              | `src/data/games.ts`, `src/data/countries.ts`, `src/lib/filterGames.ts`, `src/lib/stats.ts`, `src/lib/localization.ts`, `src/components/globe/GameGlobe2D.tsx`, `src/components/globe/GameGlobe.tsx` | Owns selected country, selected game, hovered game, filters, cover size, marker view mode, and globe render mode. Defaults to the real 3D globe with no country selected so the first screen shows a global overview and the right panel shows compact country search / rows |
| 2.5D earth map view  | User can switch to a smoother SVG 2.5D sci-fi planet map with clear country outlines and cover markers | `src/components/globe/GameGlobe2D.tsx`         | `src/lib/geo.ts`, `src/components/globe/GameTooltip.tsx`, `src/app/globals.css`, `public/data/mock-countries.geojson`, `src/data/countries.ts`, `src/data/games.ts` | Fallback globe mode. Loads simplified local mock GeoJSON, renders SVG country paths, focuses selected countries through SVG viewBox, provides global / focus buttons, shows selected-country games as full-title cover placeholders, and keeps other country games as lightweight dots |
| 3D earth / map view  | User sees, zooms, manually rotates, hovers, and focuses a real interactive 3D earth with full world country outlines | `src/components/globe/GameGlobe.tsx`           | `src/components/globe/GameMarkers.tsx`, `src/components/globe/CountryLayer.tsx`, `src/lib/geo.ts`, `src/app/globals.css`, `public/data/world-countries-lite.geojson`, `public/data/mock-countries.geojson`, `public/data/countries.geojson` | Default 3D mode uses `react-globe.gl` with dynamic client loading, high-contrast black / white sci-fi material, lightweight full-world polygon outlines, mock-country dot-matrix points, manual orbit controls with damping, selected-country focus, global / focus buttons, no default country labels, representative game cards, and drag-time marker downgrading; auto-rotate is disabled and renderer pixel ratio is capped |
| Game cover markers   | Game covers / dots appear on countries / regions                       | `src/components/globe/GameMarkers.tsx`         | `src/lib/geo.ts`, `src/data/games.ts`, `src/data/countries.ts`, `src/components/globe/GameTooltip.tsx`, `src/lib/localization.ts`, `public/covers/README.md` | Builds mixed globe HTML markers for country labels and games. With no country selected, the 3D globe shows one representative cover marker per mock country; after country selection, it shows all current-year games for that country. During drag / zoom, cover cards downgrade to lightweight dots and country labels are hidden |
| Country layer        | Countries can be hovered or clicked                                   | `src/components/globe/CountryLayer.tsx`        | `src/types/game.ts`, `src/lib/geo.ts`, `src/components/GameEarthApp.tsx`, `public/data/world-countries-lite.geojson`, `public/data/mock-countries.geojson` | Provides lightweight `react-globe.gl` polygon props for all world countries plus mock-country dot-matrix point props. Hover / selected states brighten only the matching country polygon / points; ocean / blank hover clears highlight. Mock country clicks update the right panel, while non-mock country clicks only highlight the globe polygon |
| Game hover tooltip   | User hovers over a game and sees title, rating, year, genre           | `src/components/globe/GameTooltip.tsx`         | `src/types/game.ts`, `src/components/globe/GameMarkers.tsx`, `src/lib/localization.ts`                                                | Tooltip receives hovered game data from props and displays Chinese-first copy |
| Right panel wrapper  | Right side switches between country overview and selected-country detail | `src/components/panels/RightPanel.tsx`         | `src/components/panels/CountryPanel.tsx`, `src/components/panels/CountryDetailPanel.tsx`, `src/components/panels/GameDetailCard.tsx`  | Shows compact searchable country overview when no country is selected; shows the selected-country detail mode after selection; exposes clear-country and game-selection callbacks; keeps long detail content inside a bounded scroll area |
| Country list panel   | User sees compact searchable country rows with game count, average rating, and top genre | `src/components/panels/CountryPanel.tsx`       | `src/lib/stats.ts`, `src/lib/localization.ts`, `src/data/games.ts`, `src/data/countries.ts`                                           | Statistics are memoized from the filtered game list and displayed in Chinese-first compact rows. Search supports Chinese names, English names, and country codes; row clicks update selected country and trigger globe focus through app state |
| Country detail panel | User clicks a country and sees a vertical country detail panel with stats and game cards | `src/components/panels/CountryDetailPanel.tsx` | `src/lib/filterGames.ts`, `src/lib/stats.ts`, `src/lib/localization.ts`, `src/components/panels/GameDetailCard.tsx`                   | Uses selected country, current year-filtered games, selected game state, and Chinese-first labels. Includes return-to-overview, country stats, current-year game card flow, and a sticky bottom game summary dock |
| Game detail card     | User clicks a game and sees a closable compact description card        | `src/components/panels/GameDetailCard.tsx`     | `src/types/game.ts`, `src/lib/localization.ts`, `src/data/games.ts`                                                                   | Shows reusable compact game details with Chinese-first labels, black / cyan HUD fallback cover presentation, developer / publisher / year / genre / platform / rating / description, and optional close action |
| Bottom controls      | User controls filters and display options                             | `src/components/controls/BottomControls.tsx`   | `src/components/controls/YearSlider.tsx`, `src/components/controls/CoverSizeSlider.tsx`, `src/components/controls/ViewModeToggle.tsx` | Passes native input/button updates to GameEarthApp |
| Year filter          | User filters games by release year                                    | `src/components/controls/YearSlider.tsx`       | `src/lib/filterGames.ts`, `src/components/GameEarthApp.tsx`                                                                           | Uses native range inputs; state owned by GameEarthApp |
| Cover size control   | User changes marker / cover size                                      | `src/components/controls/CoverSizeSlider.tsx`  | `src/components/globe/GameMarkers.tsx`, `src/components/GameEarthApp.tsx`                                                             | Uses native range input                            |
| View mode toggle     | User switches marker display mode                                     | `src/components/controls/ViewModeToggle.tsx`   | `src/components/globe/GameMarkers.tsx`, `src/components/GameEarthApp.tsx`                                                             | Supports countries and games modes                 |
| Game data export     | Provides representative game records to the frontend from local static modules | `src/data/games.ts`                            | `src/data/games.generated.ts`, `src/data/games.mock.ts`, `src/types/game.ts`, `src/lib/localization.ts`, `public/covers/README.md`, `docs/04_DATA_SCHEMA.md` | `games.ts` is the stable frontend import. Generated RAWG data is preferred through `games.generated.ts`; `games.mock.ts` preserves the original stable mock dataset |
| RAWG data generation | Local script fetches RAWG data and writes a static generated game data module | `scripts/fetch-rawg-games.mjs`                 | `scripts/rawg-seeds.mjs`, `src/data/games.generated.ts`, `src/data/games.ts`, `package.json`, `.env.local`, `README.md`, `docs/03_ARCHITECTURE.md`, `docs/04_DATA_SCHEMA.md` | Browser components must not call RAWG. The script reads `RAWG_API_KEY` from `.env.local`, fetches seeded games, maps them to `Game`, and overwrites `src/data/games.generated.ts` |
| Country mock data    | Stores country coordinates and metadata                               | `src/data/countries.ts`                        | `src/types/game.ts`, `src/lib/localization.ts`, `docs/04_DATA_SCHEMA.md`                                                              | Country code must match games; current MVP covers 10 countries / regions |
| Cover asset directory | Documents where future local cover images should be placed            | `public/covers/README.md`                      | `src/data/games.ts`, `src/components/globe/GameMarkers.tsx`, `src/components/panels/GameDetailCard.tsx`                                | Do not download real covers automatically; missing files fall back to gradient placeholders |
| Filtering logic      | Filters games by country, year, genre                                 | `src/lib/filterGames.ts`                       | `src/types/game.ts`                                                                                                                   | Keep pure functions                                |
| Statistics logic     | Computes counts, averages, top genres                                 | `src/lib/stats.ts`                             | `src/data/games.ts`, `src/types/game.ts`                                                                                              | Keep pure functions                                |
| Geographic helpers   | Converts coordinates, maps GeoJSON countries, provides dot-matrix samples, and provides globe camera / 2.5D map views | `src/lib/geo.ts`                               | `src/data/countries.ts`, `src/components/globe/GameMarkers.tsx`, `src/components/globe/CountryLayer.tsx`, `src/components/globe/GameGlobe2D.tsx` | Keeps legacy 2D projection helpers, 2.5D SVG projection / GeoJSON path helpers / viewBox focus helpers, globe marker clustering, GeoJSON Alpha-2 / Alpha-3 / name fallback mapping, country polygon dot-matrix sampling, global camera view, and country focus camera views for current mock countries |
| Localization helpers | Maps UI display labels for countries, games, genres, and view modes   | `src/lib/localization.ts`                      | `src/types/game.ts`, `src/components/GameEarthApp.tsx`, `src/components/globe/`, `src/components/panels/`, `src/components/controls/` | Keeps Chinese-first product language mapping outside raw data structures |
| Search logic         | Searches countries or games                                           | `src/lib/search.ts`                            | `src/types/game.ts`                                                                                                                   | Optional in MVP                                    |
| Shared types         | Defines Game, Country, filters, view modes                            | `src/types/game.ts`                            | `docs/04_DATA_SCHEMA.md`                                                                                                              | Update schema doc if changed                       |

## Documentation Maintenance Rule

When Codex adds a new feature, it must add a new row to this file.

When Codex moves, renames, deletes, or splits a file, it must update the relevant row.

When Codex changes a feature's responsibility, it must update the `Main File`, `Related Files`, and `Notes` columns.

## Current MVP Feature Priority

Build in this order:

1. Project setup and base layout
2. Mock data and TypeScript types
3. Main app shell
4. Country list panel
5. Map / globe view
6. Game markers
7. Country detail panel
8. Game detail card
9. Year filter
10. Cover size control
11. Visual polish
