# 00_PROJECT_INDEX.md

## Project Name

Game Earth

## Product Positioning

Game Earth is a global game culture discovery product.

Users explore representative games by country or region through a 3D earth / world map interface. The first MVP uses local mock data and maps games to countries based on the developer or studio's country or region.

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

## Current Core Directories

| Path                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `src/app/`                 | Next.js App Router page routes, layout, and global styles |
| `src/components/`          | Main product shell and shared UI components               |
| `src/components/globe/`    | 3D earth, country layer, game cover markers               |
| `src/components/panels/`   | Country list, country detail, game detail panels          |
| `src/components/controls/` | Bottom controls, year slider, cover size slider           |
| `src/data/`                | Local mock data for countries and games                   |
| `src/lib/`                 | Filtering, statistics, country mapping, utility functions |
| `src/types/`               | TypeScript data types                                     |
| `public/`                  | Static assets, including game cover images if needed      |
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
| Global styles        | `src/app/globals.css`             |
| Mock game data       | `src/data/games.ts`               |
| Mock country data    | `src/data/countries.ts`           |
| Shared types         | `src/types/game.ts`               |
| Filtering logic      | `src/lib/filterGames.ts`          |
| Statistics logic     | `src/lib/stats.ts`                |

## Current Main Entry Files

| Feature                   | Current File                                   |
| ------------------------- | ---------------------------------------------- |
| Home page                 | `src/app/page.tsx`                             |
| Root layout               | `src/app/layout.tsx`                           |
| Global styles             | `src/app/globals.css`                          |
| Main product shell        | `src/components/GameEarthApp.tsx`              |
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
| Game mock data            | `src/data/games.ts`                            |
| Country mock data         | `src/data/countries.ts`                        |
| Data types                | `src/types/game.ts`                            |
| Filtering logic           | `src/lib/filterGames.ts`                       |
| Statistics logic          | `src/lib/stats.ts`                             |
| Geographic helpers        | `src/lib/geo.ts`                               |
| Search logic              | `src/lib/search.ts`                            |
