# 00_PROJECT_INDEX.md

## Project Name

Ludic Atlas / 游戏星图

## Product Positioning

Ludic Atlas / 游戏星图 is a global game culture discovery product with two primary entrances: Earth Explorer for spatial country-based exploration and Game Chronicle for timeline-based game archive browsing.

Users explore representative games by country or region through a 3D earth interface, or browse generated global game records through a horizontal chronology archive. The first MVP uses local mock / generated data and maps Earth Explorer games to countries based on the developer or studio's country or region.

## Current MVP Direction

- Product type: game culture discovery / recommendation product
- Priority: build a runnable MVP quickly
- Data source: local mock data first
- Country mapping rule: based on developer / studio country or region
- Visual reference: Movie Globe's functional structure, not necessarily its exact visual style

## Required Reading Order for Codex

Before any code change, read:

1. `AGENTS.md`
2. `docs/00_PROJECT_INDEX.md`
3. `docs/02_FEATURE_MAP.md`

If the task involves data structure, read:

4. `docs/04_DATA_SCHEMA.md`

If the task involves product scope, read:

5. `docs/01_PRODUCT_SPEC.md`

## Current Documentation Files

| File                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `AGENTS.md`                | Codex working rules and living documentation rules |
| `README.md`                | Project overview, setup commands, source entrypoints |
| `docs/00_PROJECT_INDEX.md` | Project overview and navigation index              |
| `docs/01_PRODUCT_SPEC.md`  | Product positioning, users, scenarios, MVP scope   |
| `docs/02_FEATURE_MAP.md`   | Feature-to-file mapping for fast modification      |
| `docs/03_ARCHITECTURE.md`  | Technical architecture and rendering strategy      |
| `docs/04_DATA_SCHEMA.md`   | Game, country, genre, and filter data structures   |
| `docs/05_TASK_LOG.md`      | Iteration log and major change history             |
| `docs/06_CODEX_RULES.md`   | Detailed execution rules for Codex                 |
| `docs/assets/preview.png`  | README project preview image for GitHub            |

## Current Core Directories

| Path                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `src/app/`                 | Next.js App Router page routes, layout, and global styles |
| `src/components/`          | Main product shell and shared UI components               |
| `src/components/home/`     | Ludic Atlas landing hub and product entrance components   |
| `src/components/archive/`  | Game Chronicle timeline browsing components               |
| `src/components/globe/`    | 3D earth, country layer, game cover markers               |
| `src/components/panels/`   | Country list, country detail, game detail panels          |
| `src/components/controls/` | Bottom controls, year slider, cover size slider           |
| `src/data/`                | Local country data, generated game data entrypoint, and stable mock fallback data |
| `src/lib/`                 | Filtering, statistics, country mapping, utility functions |
| `src/types/`               | TypeScript data types                                     |
| `public/`                  | Static assets, including lightweight world / MVP GeoJSON country borders under `public/data/`, Game Chronicle SVG textures under `public/textures/`, Game Chronicle generated background imagery under `public/images/archive/`, RAWG cached covers under `public/covers/rawg/`, the shared fallback cover at `public/covers/fallback-game-cover.svg`, and future game cover images under `public/covers/` |
| `scripts/`                 | Local data generation scripts, including RAWG static data generation and RAWG cover caching |
| `docs/`                    | Project planning and architecture documents               |

## Project Setup Files

| File                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `package.json`       | Next.js project metadata, scripts, deps      |
| `package-lock.json`  | Installed dependency lockfile                |
| `next.config.ts`     | Next.js configuration                        |
| `tsconfig.json`      | TypeScript configuration                     |
| `postcss.config.mjs` | Tailwind CSS PostCSS configuration           |
| `eslint.config.mjs`  | ESLint flat config for Next.js and TypeScript |
| `.gitignore`         | Generated and dependency file ignore rules   |
| `.git/`              | Local Git repository metadata; do not edit manually |

## Git Engineering

The project is managed as a local Git repository.

Ignored by default:

- `node_modules/`
- `.next/`
- `out/`
- `dist/`
- `.vercel/`
- `.turbo/`
- `coverage/`
- `.env` and `.env.*`, except `.env.example`
- `screenshots/`
- `transcript_raw.txt`
- video reference files such as `*.mp4`, `*.MP4`, `*.mov`, `*.MOV`, `*.m4v`, and `*.M4V`
- log files

Do not push to a remote repository unless the user explicitly requests it.

## Local Page Access

Start the local dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Core Source Entrypoints

| Purpose              | File                              |
| -------------------- | --------------------------------- |
| Page entry           | `src/app/page.tsx`                |
| App shell            | `src/components/GameEarthApp.tsx` |
| Landing hub          | `src/components/home/LandingHub.tsx` |
| Global styles        | `src/app/globals.css`             |
| Game data export     | `src/data/games.ts`               |
| Generated RAWG game data | `src/data/games.generated.ts` |
| Stable mock game fallback | `src/data/games.mock.ts` |
| RAWG seed list       | `scripts/rawg-seeds.mjs`          |
| RAWG generation script | `scripts/fetch-rawg-games.mjs`   |
| RAWG cover cache script | `scripts/cache-rawg-covers.mjs` |
| Country inference apply script | `scripts/apply-country-inference.mjs` |
| Mock country data    | `src/data/countries.ts`           |
| Future cover assets  | `public/covers/README.md`         |
| Cached RAWG cover assets | `public/covers/rawg/`         |
| Fallback game cover  | `public/covers/fallback-game-cover.svg` |
| Browser favicon      | `public/favicon.svg`              |
| Game Chronicle wood texture | `public/textures/archive-wood.svg` |
| Game Chronicle noise texture | `public/textures/archive-noise.svg` |
| Game Chronicle grid texture | `public/textures/archive-grid.svg` |
| Game Chronicle walnut texture | `public/textures/walnut-wood.svg` |
| Game Chronicle paper texture | `public/textures/archive-paper.svg` |
| Game Chronicle brass texture | `public/textures/brass-noise.svg` |
| Game Chronicle generated archive hall background | `public/images/archive/archive-hall-bg-v1.png` |
| MVP country border data | `public/data/mock-countries.geojson` |
| Lightweight world country border data | `public/data/world-countries-lite.geojson` |
| Full source country border data | `public/data/countries.geojson` |
| README preview image | `docs/assets/preview.png` |
| Shared types         | `src/types/game.ts`               |
| Game cover helper    | `src/lib/gameCover.ts`            |
| Filtering logic      | `src/lib/filterGames.ts`          |
| Statistics logic     | `src/lib/stats.ts`                |

## Current Main Entry Files

| Feature                   | Current File                                   |
| ------------------------- | ---------------------------------------------- |
| Home page                 | `src/app/page.tsx`                             |
| Root layout               | `src/app/layout.tsx`                           |
| Global styles             | `src/app/globals.css`                          |
| Main product shell        | `src/components/GameEarthApp.tsx`              |
| Landing hub               | `src/components/home/LandingHub.tsx`           |
| Game Chronicle view       | `src/components/archive/GameArchiveView.tsx`   |
| Archive scroll exhibition timeline | `src/components/archive/ArchiveTimeline.tsx`   |
| Archive year dossier drawer | `src/components/archive/ArchiveYearModal.tsx` |
| Archive active year drawer | `src/components/archive/ArchiveYearDrawer.tsx` |
| Archive dossier panel     | `src/components/archive/ArchiveDossier.tsx`    |
| Legacy 2.5D earth map view | `src/components/globe/GameGlobe2D.tsx`        |
| 3D earth view             | `src/components/globe/GameGlobe.tsx`           |
| Game cover markers        | `src/components/globe/GameMarkers.tsx`         |
| Country interaction layer | `src/components/globe/CountryLayer.tsx`        |
| Game hover tooltip        | `src/components/globe/GameTooltip.tsx`         |
| Right panel wrapper       | `src/components/panels/RightPanel.tsx`         |
| Country list panel        | `src/components/panels/CountryPanel.tsx`       |
| Country detail panel      | `src/components/panels/CountryDetailPanel.tsx` |
| Game detail card          | `src/components/panels/GameDetailCard.tsx`     |
| Bottom control bar        | `src/components/controls/BottomControls.tsx`   |
| Year filter               | `src/components/controls/YearSlider.tsx`       |
| Cover size control        | `src/components/controls/CoverSizeSlider.tsx`  |
| View mode toggle          | `src/components/controls/ViewModeToggle.tsx`   |
| Game data export          | `src/data/games.ts`                            |
| Generated RAWG game data  | `src/data/games.generated.ts`                  |
| RAWG cover cache script   | `scripts/cache-rawg-covers.mjs`                |
| Stable mock game fallback | `src/data/games.mock.ts`                       |
| Country mock data         | `src/data/countries.ts`                        |
| Data types                | `src/types/game.ts`                            |
| Filtering logic           | `src/lib/filterGames.ts`                       |
| Statistics logic          | `src/lib/stats.ts`                             |
| Geographic helpers        | `src/lib/geo.ts`                               |
| Search logic              | `src/lib/search.ts`                            |
