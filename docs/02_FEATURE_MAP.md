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
| Root layout          | Provides App Router document shell, metadata, and global CSS          | `src/app/layout.tsx`                           | `src/app/globals.css`                                                                                                                 | Keep layout minimal                                |
| Main product shell   | Overall layout, top-level state, data flow                            | `src/components/GameEarthApp.tsx`              | `src/data/games.ts`, `src/data/countries.ts`, `src/lib/filterGames.ts`, `src/lib/stats.ts`                                             | Owns selected country, selected game, hovered game, filters, cover size, and view mode |
| 3D earth / map view  | User sees the main earth or world map                                 | `src/components/globe/GameGlobe.tsx`           | `src/components/globe/GameMarkers.tsx`, `src/components/globe/CountryLayer.tsx`                                                       | Current MVP uses an interactive 2D placeholder panel |
| Game cover markers   | Game covers appear on countries / regions                             | `src/components/globe/GameMarkers.tsx`         | `src/lib/geo.ts`, `src/data/games.ts`, `src/data/countries.ts`                                                                        | Marker position uses country coordinates and responds to cover size / view mode |
| Country layer        | Countries can be hovered or clicked                                   | `src/components/globe/CountryLayer.tsx`        | `src/types/game.ts`, `src/lib/geo.ts`                                                                                                 | MVP may use country points instead of full borders |
| Game hover tooltip   | User hovers over a game and sees title, rating, year, genre           | `src/components/globe/GameTooltip.tsx`         | `src/types/game.ts`                                                                                                                   | Tooltip should receive data from props             |
| Right panel wrapper  | Right side displays country list, country detail, and game detail     | `src/components/panels/RightPanel.tsx`         | `src/components/panels/CountryPanel.tsx`, `src/components/panels/CountryDetailPanel.tsx`, `src/components/panels/GameDetailCard.tsx`  | Receives selection state and passes callbacks      |
| Country list panel   | User sees countries, game count, average rating, top genre            | `src/components/panels/CountryPanel.tsx`       | `src/lib/stats.ts`, `src/data/games.ts`, `src/data/countries.ts`                                                                      | Statistics are derived from the filtered game list |
| Country detail panel | User clicks a country and sees its games                              | `src/components/panels/CountryDetailPanel.tsx` | `src/lib/filterGames.ts`, `src/components/panels/GameDetailCard.tsx`                                                                  | Uses selected country, year range, and selected game state |
| Game detail card     | User clicks a game and sees description, developer, platforms, genres | `src/components/panels/GameDetailCard.tsx`     | `src/types/game.ts`                                                                                                                   | Shows full reusable game details                   |
| Bottom controls      | User controls filters and display options                             | `src/components/controls/BottomControls.tsx`   | `src/components/controls/YearSlider.tsx`, `src/components/controls/CoverSizeSlider.tsx`, `src/components/controls/ViewModeToggle.tsx` | Passes native input/button updates to GameEarthApp |
| Year filter          | User filters games by release year                                    | `src/components/controls/YearSlider.tsx`       | `src/lib/filterGames.ts`, `src/components/GameEarthApp.tsx`                                                                           | Uses native range inputs; state owned by GameEarthApp |
| Cover size control   | User changes marker / cover size                                      | `src/components/controls/CoverSizeSlider.tsx`  | `src/components/globe/GameMarkers.tsx`, `src/components/GameEarthApp.tsx`                                                             | Uses native range input                            |
| View mode toggle     | User switches marker display mode                                     | `src/components/controls/ViewModeToggle.tsx`   | `src/components/globe/GameMarkers.tsx`, `src/components/GameEarthApp.tsx`                                                             | Supports countries and games modes                 |
| Game mock data       | Stores representative game records                                    | `src/data/games.ts`                            | `src/types/game.ts`, `docs/04_DATA_SCHEMA.md`                                                                                         | Update schema doc if fields change                 |
| Country mock data    | Stores country coordinates and metadata                               | `src/data/countries.ts`                        | `src/types/game.ts`, `docs/04_DATA_SCHEMA.md`                                                                                         | Country code must match games                      |
| Filtering logic      | Filters games by country, year, genre                                 | `src/lib/filterGames.ts`                       | `src/types/game.ts`                                                                                                                   | Keep pure functions                                |
| Statistics logic     | Computes counts, averages, top genres                                 | `src/lib/stats.ts`                             | `src/data/games.ts`, `src/types/game.ts`                                                                                              | Keep pure functions                                |
| Geographic helpers   | Converts coordinates or maps countries to positions                   | `src/lib/geo.ts`                               | `src/data/countries.ts`                                                                                                               | Keep rendering-independent where possible          |
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
