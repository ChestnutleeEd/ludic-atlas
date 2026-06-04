# Game Earth

Game Earth is a global game culture discovery product.

Users explore representative games by country or region through a 3D earth / world map style interface. The current MVP uses local mock data and maps games to countries based on the developer or studio's country or region.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Playwright for browser QA
- Local mock data

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Page URL

Open:

```text
http://localhost:3000
```

## Core Source Entrypoints

- Page entry: `src/app/page.tsx`
- App shell: `src/components/GameEarthApp.tsx`
- Global styles: `src/app/globals.css`
- Mock game data: `src/data/games.ts`
- Mock country data: `src/data/countries.ts`
- Shared types: `src/types/game.ts`
- Filtering logic: `src/lib/filterGames.ts`
- Statistics logic: `src/lib/stats.ts`

## Current Features

- Next.js App Router project skeleton
- Dark technical MVP interface
- Country list panel with derived statistics
- Country detail panel
- Game detail card
- Year range filter
- Cover size control
- View mode toggle
- Interactive placeholder map / globe area
- Local mock data for Japan, United States, and Poland

## Development Plan

- Improve central map country selection
- Refine marker placement for countries with multiple games
- Add more countries and representative game data
- Add richer hover tooltip behavior
- Replace the placeholder map with a stable 2D map or lightweight 3D globe when the MVP flow is ready

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

For UI acceptance, start the dev server with `npm run dev` and check `http://localhost:3000`.

Playwright browser QA should also use `http://localhost:3000`. In Next.js development mode, avoid using `127.0.0.1` unless `allowedDevOrigins` is configured, because dev resources can be blocked as cross-origin.
