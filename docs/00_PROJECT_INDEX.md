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
| `README.md`                | Product-level introduction, setup commands, screenshots, data pipeline overview |
| `docs/00_PROJECT_INDEX.md` | Project overview and navigation index              |
| `docs/01_PRODUCT_SPEC.md`  | Product positioning, users, scenarios, MVP scope   |
| `docs/02_FEATURE_MAP.md`   | Feature-to-file mapping for fast modification      |
| `docs/03_ARCHITECTURE.md`  | Technical architecture and rendering strategy      |
| `docs/04_DATA_SCHEMA.md`   | Game, country, genre, and filter data structures   |
| `docs/05_TASK_LOG.md`      | Iteration log and major change history             |
| `docs/06_CODEX_RULES.md`   | Detailed execution rules for Codex                 |
| `docs/DEFERRED_ATLAS_MAP_PLAN.md` | Complete deferred 2D/2.5D Atlas product, architecture, requirements, tasks, and resumption handoff |
| `docs/EARTH_EXPLORER_VALIDATION.md` | Earth functional, viewport, marker-continuity, cover-size, production performance, accessibility, lifecycle, and verification evidence |
| `docs/agents/`             | Engineering-skill issue tracker, triage, and domain-doc configuration |
| `docs/releases/`           | Versioned GitHub release notes and release documentation |
| `docs/assets/landing-hub.png` | Course release Landing Hub screenshot           |
| `docs/assets/earth-global.png` | Course release Earth Explorer global screenshot |
| `docs/assets/earth-country-detail.png` | Course release Earth country-detail screenshot |
| `docs/assets/game-chronicle.png` | Course release Game Chronicle screenshot       |

## Current Core Directories

| Path                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `src/app/`                 | Next.js App Router page routes, layout, and global styles |
| `src/components/`          | Main product shell and shared UI components               |
| `src/components/home/`     | Ludic Atlas landing hub and product entrance components   |
| `src/components/archive/`  | Game Chronicle timeline browsing components               |
| `src/components/earth/`    | Globe-default active renderer boundary and inert future-Atlas compatibility placeholder |
| `src/components/globe/`    | 3D earth, country layer, game cover markers               |
| `src/components/panels/`   | Country list, country detail, game detail panels          |
| `src/components/controls/` | Bottom controls, year slider, cover size slider           |
| `src/data/`                | Local country data, generated game data entrypoint, and stable mock fallback data |
| `src/lib/`                 | Filtering, statistics, country mapping, region / camera presets, utility functions |
| `src/types/`               | TypeScript data types                                     |
| `public/`                  | Static assets, including deterministic Global/Region/Country geography LOD under `public/data/earth-lod/`, retained source/MVP GeoJSON under `public/data/`, homepage/archive imagery and RAWG/fallback covers |
| `scripts/`                 | Local data generation scripts, including RAWG static data generation and RAWG cover caching |
| `docs/`                    | Project planning and architecture documents               |
| `tests/`                   | Node-native state / geometry / camera tests plus Playwright homepage and Earth Explorer browser tests under `tests/e2e/` |
| `docs/archive/spec-kit/`   | Archived Spec Kit requirements, plans, research, tasks, and acceptance records retained for historical reference |

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
| `start-macos.command` | macOS course-package helper for Node 20 checks, first-run `npm ci`, build, start, and browser launch |
| `start-windows.cmd` | Windows course-package helper for Node 20 checks, first-run `npm ci`, build, start, and browser launch |
| `scripts/create-course-release.mjs` | Creates the whitelisted course ZIP and SHA-256 checksum file |
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
| Homepage entrance assets | `public/images/home/` |
| Homepage browser tests | `tests/e2e/homepage.spec.ts` |
| Global styles        | `src/app/globals.css`             |
| Game data export     | `src/data/games.ts`               |
| Indexed game catalog | `src/data/gameCatalog.ts`         |
| Generated RAWG game data | `src/data/games.generated.ts` |
| Stable mock game fallback | `src/data/games.mock.ts` |
| RAWG seed list       | `scripts/rawg-seeds.mjs`          |
| RAWG generation script | `scripts/fetch-rawg-games.mjs`   |
| RAWG cover cache script | `scripts/cache-rawg-covers.mjs` |
| RAWG cover compression script | `scripts/compress-rawg-covers.mjs` |
| Country inference apply script | `scripts/apply-country-inference.mjs` |
| macOS course start helper | `start-macos.command`          |
| Windows course start helper | `start-windows.cmd`          |
| Course release packager | `scripts/create-course-release.mjs` |
| Mock country data    | `src/data/countries.ts`           |
| v0.1.0 release notes | `docs/releases/v0.1.0.md`         |
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
| Chronicle Reading Room original hero | `public/images/archive/chronicle-reading-room.webp` |
| Chronicle Reading Room asset metadata | `public/images/archive/README.md` |
| Homepage Earth Explorer hero | `public/images/home/earth-explorer-archive.webp` |
| Homepage Game Chronicle hero | `public/images/home/game-chronicle-archive.webp` |
| Homepage asset metadata | `public/images/home/README.md` |
| Earth Explorer atmosphere assets | `public/images/earth/earth-atmosphere-archive-1280.webp`, `public/images/earth/earth-atmosphere-archive-1672.webp` |
| Earth Explorer atmosphere metadata | `public/images/earth/README.md` |
| MVP country border data | `public/data/mock-countries.geojson` |
| Lightweight world country border data | `public/data/world-countries-lite.geojson` |
| Full source country border data | `public/data/countries.geojson` |
| Landing Hub release screenshot | `docs/assets/landing-hub.png` |
| Earth global release screenshot | `docs/assets/earth-global.png` |
| Earth country-detail release screenshot | `docs/assets/earth-country-detail.png` |
| Game Chronicle release screenshot | `docs/assets/game-chronicle.png` |
| Shared types         | `src/types/game.ts`               |
| Earth state types    | `src/types/earth.ts`              |
| Earth view / navigation contract | `src/lib/earthViewState.ts` |
| Active projection viewport | `src/components/earth/EarthProjectionViewport.tsx` |
| Game cover helper    | `src/lib/gameCover.ts`            |
| Filtering logic      | `src/lib/filterGames.ts`          |
| Statistics logic     | `src/lib/stats.ts`                |
| Region / camera mode helpers | `src/lib/regions.ts`          |

## Current Main Entry Files

| Feature                   | Current File                                   |
| ------------------------- | ---------------------------------------------- |
| Home page                 | `src/app/page.tsx`                             |
| Root layout               | `src/app/layout.tsx`                           |
| Global styles             | `src/app/globals.css`                          |
| Main product shell        | `src/components/GameEarthApp.tsx`              |
| Landing hub               | `src/components/home/LandingHub.tsx`           |
| Homepage browser regression suite | `tests/e2e/homepage.spec.ts`              |
| Game Chronicle view       | `src/components/archive/GameArchiveView.tsx`   |
| Game Chronicle optimized cover | `src/components/archive/ArchiveCover.tsx` |
| Game Chronicle reduced-motion subscription | `src/components/archive/useArchiveReducedMotion.ts` |
| Game Chronicle scoped styles | `src/components/archive/GameArchiveView.module.css` |
| Archive derived model | `src/lib/archiveModel.ts` |
| Archive year index | `src/components/archive/ArchiveTimeline.tsx`   |
| Archive dossier drawer | `src/components/archive/ArchiveYearModal.tsx` |
| Archive active year drawer | `src/components/archive/ArchiveYearDrawer.tsx` |
| Archive dossier panel     | `src/components/archive/ArchiveDossier.tsx`    |
| Archive model tests | `tests/archive-model.test.ts` |
| Archive browser tests | `tests/e2e/game-archive.spec.ts` |
| Legacy 2.5D earth map view | `src/components/globe/GameGlobe2D.tsx`        |
| 3D earth view             | `src/components/globe/GameGlobe.tsx`           |
| Globe boundary geodesic builder | `src/lib/globeBoundary.ts`              |
| Game cover markers        | `src/components/globe/GameMarkers.tsx`         |
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
| Indexed game catalog      | `src/data/gameCatalog.ts`                      |
| Generated RAWG game data  | `src/data/games.generated.ts`                  |
| RAWG cover cache script   | `scripts/cache-rawg-covers.mjs`                |
| RAWG cover compression script | `scripts/compress-rawg-covers.mjs`         |
| Stable mock game fallback | `src/data/games.mock.ts`                       |
| Country mock data         | `src/data/countries.ts`                        |
| Data types                | `src/types/game.ts`                            |
| Filtering logic           | `src/lib/filterGames.ts`                       |
| Statistics logic          | `src/lib/stats.ts`                             |
| Geographic helpers        | `src/lib/geo.ts`                               |
| Region / camera helpers   | `src/lib/regions.ts`                           |
| Atomic Earth exploration state | `src/lib/explorerState.ts`               |
| Cancellable globe camera animation | `src/lib/globeCamera.ts`              |
| Globe semantic camera fitting | `src/lib/globeNavigation.ts`              |
| Earth safe viewport calculation | `src/lib/safeViewport.ts`              |
| Layout-owned safe viewport measurement | `src/components/earth/useEarthSafeViewport.ts` |
| Stable marker selection model | `src/lib/globeMarkerModel.ts`              |
| Cover-size pure contract | `src/lib/coverSize.ts` |
| Marker identity and interaction policy contract | `src/lib/markerContracts.ts` |
| Marker continuity and cover-size browser suite | `tests/e2e/earth-marker-phase1.spec.ts` |
| Earth browser regression suite | `tests/e2e/earth-explorer.spec.ts`       |
| Globe stability browser suite | `tests/e2e/globe-stability.spec.ts`       |
| Phase 3 marker/LOD browser suite | `tests/e2e/marker-lod.spec.ts`         |
| Phase 4 Globe visual/interaction suite | `tests/e2e/globe-visual-phase4.spec.ts` |
| Phase 5 atmosphere delivery/fallback suite | `tests/e2e/earth-atmosphere-phase5.spec.ts` |
| Phase 6 comprehensive validation suite | `tests/e2e/earth-phase6-validation.spec.ts` |
| Earth validation, marker-continuity, and performance record | `docs/EARTH_EXPLORER_VALIDATION.md` |
| Normalized geography model | `src/lib/geography.ts`                    |
| Geography repository/cache | `src/lib/geographyRepository.ts`          |
| Marker budget/collision engine | `src/lib/markerLayout.ts`              |
| Phase 4 repair unit/browser regressions | `tests/globe-phase4-repair.test.ts`, `tests/e2e/globe-phase4-repair.spec.ts` |
| Offline geography LOD generator | `scripts/generate-earth-lod.mjs`      |
| Playwright configuration  | `playwright.config.ts`                         |
| Search logic              | `src/lib/search.ts`                            |
