# Ludic Atlas / Game Earth

A 3D cultural atlas of global video games across geography and time.

Ludic Atlas / Game Earth is an interactive game culture exploration product. It combines a country-based 3D globe, a timeline archive, and a local RAWG-derived data pipeline to help users browse representative games by place, year, studio origin, and cultural context.

The project is built as a runnable MVP: the browser reads static local data, cached local cover assets, and lightweight geographic files. It does not require a backend service or runtime RAWG API calls.

## What Is This Project

Ludic Atlas treats games as cultural records rather than a flat database. The main exploration model is:

- Earth Explorer: browse games by country or region on a 3D globe.
- Game Chronicle: browse generated game records through a year-based archive and timeline.
- Data engine: ingest RAWG data locally, infer country / region from developer or studio context, and cache cover images for stable presentation.

Country mapping in the MVP is based on the primary developer / studio country or region. The mapping is a project-level inference layer for exploration and should not be read as an official classification.

## Features

### Globe

- Real 3D earth rendering with `react-globe.gl` and Three.js.
- Lightweight world country borders from local GeoJSON.
- Country aggregate markers and representative game cover markers.
- Hover tooltips, country selection, selected-game detail cards, and right-side country panels.
- Region presets, selected-country focus, overview / surface camera modes, zoom controls, and mobile bottom-sheet behavior.
- Experimental `/earth-pro` route using MapLibre GL JS and deck.gl for a GPU-layer map architecture.

### Archive

- Game Chronicle / 游戏编年馆 timeline browsing surface.
- Year-grouped archive cards with cover previews, counts, rating summaries, genre summaries, and platform summaries.
- Search, genre filters, platform filters, year-desc sorting, and rating-desc sorting.
- Year Exhibit modal with selected-year overview and selected-game dossier details.
- Retro-premium visual direction using archive textures, film-like timeline rhythm, and local cover imagery.

### Data Engine

- RAWG ingestion scripts generate a static TypeScript game dataset.
- Batch mode fetches paginated RAWG list results by date, Metacritic range, ordering, and maximum record count.
- Seed mode supports manually curated country mappings where RAWG does not provide reliable studio-country data.
- Country inference applies reviewed high-confidence mappings to generated records.
- Cover cache downloads RAWG cover URLs into `public/covers/rawg/` and rewrites records to local static paths.
- Current generated dataset contains roughly 1,000 records, with local cached cover assets and a fallback SVG for missing images.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `react-globe.gl`
- Three.js
- MapLibre GL JS and deck.gl for the experimental Pro route
- GSAP and Motion for archive UI transitions
- RAWG API for local data generation
- Node.js scripts for ingestion, enrichment, inference, and cover caching

## Data Pipeline Overview

The browser app does not call RAWG directly. Data is prepared offline and committed as static project assets.

```text
RAWG API
  -> scripts/fetch-rawg-games.mjs
  -> src/data/games.generated.ts
  -> scripts/cache-rawg-covers.mjs
  -> public/covers/rawg/
  -> scripts/apply-country-inference.mjs
  -> src/data/games.ts
  -> Earth Explorer / Game Chronicle
```

Main commands:

```bash
npm run data:rawg
npm run data:covers
npm run data:enrich
npm run data:apply-countries
npm run data:infer-countries:dry
```

RAWG access requires a local `.env.local` file with `RAWG_API_KEY`. Running the app from the committed dataset does not require an API key.

## Screenshots

### Home Hub

![Home hub](docs/assets/readme/home-hub.png)

### 3D Globe

![3D globe](docs/assets/readme/earth-globe.png)

### Country Detail

![Country detail panel](docs/assets/readme/country-detail.png)

### Game Detail

![Game detail card](docs/assets/readme/game-detail-card.png)

### Game Chronicle

![Game Chronicle archive](docs/assets/readme/game-archive.png)

## Getting Started

Requirements:

- Node.js LTS, preferably Node.js 20 or newer
- Git

Install and run:

```bash
git clone https://github.com/ChestnutleeEd/ludic-atlas.git
cd ludic-atlas
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful commands:

```bash
npm run dev
npm run start:local
npm run lint
npm run typecheck
npm run build
```

## Architecture Overview

```text
src/app                 Next.js routes, layout, and global styles
src/components/home     Landing hub and product entrance UI
src/components/globe    3D earth, country layer, markers, and tooltips
src/components/archive  Game Chronicle timeline and dossier surfaces
src/components/panels   Country list, country detail, and game detail panels
src/components/controls Earth Explorer filters and camera controls
src/components/earth-pro Experimental MapLibre / deck.gl explorer
src/data                Static frontend game and country data
src/lib                 Filtering, statistics, geography, covers, regions
src/types               Shared TypeScript data contracts
scripts                 RAWG ingestion, enrichment, inference, cover caching
public/covers           Local cover assets and fallback image
public/data             Local GeoJSON country border data
docs                    Product, architecture, schema, and release docs
```

Primary runtime entrypoints:

- `src/app/page.tsx`
- `src/components/GameEarthApp.tsx`
- `src/components/globe/GameGlobe.tsx`
- `src/components/archive/GameArchiveView.tsx`
- `src/app/earth-pro/page.tsx`

## Documentation

- `docs/00_PROJECT_INDEX.md`: project navigation index
- `docs/01_PRODUCT_SPEC.md`: product scope and MVP rules
- `docs/02_FEATURE_MAP.md`: feature-to-file ownership map
- `docs/03_ARCHITECTURE.md`: technical architecture
- `docs/04_DATA_SCHEMA.md`: data contracts and generation rules
- `docs/releases/v0.1.0.md`: first official release notes

## Repository Status

This is the first official MVP release line. The project is suitable for portfolio review, local exploration, and further product iteration. It is not a complete commercial game database.

No license has been selected yet.
