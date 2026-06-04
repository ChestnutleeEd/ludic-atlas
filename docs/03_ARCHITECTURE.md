# 03_ARCHITECTURE.md
## Purpose
This document defines the technical architecture for Game Earth.
The goal is to help Codex quickly understand where each module belongs and avoid unnecessary full-project search.
## Tech Stack
The first MVP should use:
- Next.js 16.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.0
- React 19.2.7
- ESLint 9.39.4
- React Three Fiber / Three.js for 3D earth rendering
- Local mock data
- No backend database in MVP
## Architecture Principle
Game Earth should separate:
1. page entry
2. 3D globe rendering
3. UI panels
4. controls
5. data
6. business logic
7. TypeScript types
UI components should not directly own raw data transformation logic.
Data filtering and statistics should live in `src/lib/`.
## Current Directory Structure
```txt
src/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ GameEarthApp.tsx
│  ├─ globe/
│  │  ├─ GameGlobe.tsx
│  │  ├─ GameMarkers.tsx
│  │  ├─ CountryLayer.tsx
│  │  └─ GameTooltip.tsx
│  ├─ panels/
│  │  ├─ RightPanel.tsx
│  │  ├─ CountryPanel.tsx
│  │  ├─ CountryDetailPanel.tsx
│  │  └─ GameDetailCard.tsx
│  └─ controls/
│     ├─ BottomControls.tsx
│     ├─ YearSlider.tsx
│     ├─ CoverSizeSlider.tsx
│     └─ ViewModeToggle.tsx
├─ data/
│  ├─ countries.ts
│  └─ games.ts
├─ lib/
│  ├─ filterGames.ts
│  ├─ stats.ts
│  ├─ geo.ts
│  └─ search.ts
├─ types/
│  └─ game.ts
```

Root setup files:

```txt
package.json
package-lock.json
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
.gitignore
```

Main Component Responsibilities

File	Responsibility
src/app/page.tsx	Home page entry. Should render GameEarthApp.
src/app/layout.tsx	App Router root layout and page metadata.
src/app/globals.css	Global Tailwind import and base visual tokens.
src/components/GameEarthApp.tsx	Main product shell. Owns top-level UI state and layout.
src/components/globe/GameGlobe.tsx	Renders the main 3D earth or map scene.
src/components/globe/GameMarkers.tsx	Renders game cover markers on the globe.
src/components/globe/CountryLayer.tsx	Handles country boundaries, hover, and click interaction.
src/components/globe/GameTooltip.tsx	Shows hover information for a game marker.
src/components/panels/RightPanel.tsx	Wraps right-side country and detail panels.
src/components/panels/CountryPanel.tsx	Shows country list and country-level statistics.
src/components/panels/CountryDetailPanel.tsx	Shows games from the selected country.
src/components/panels/GameDetailCard.tsx	Shows selected game details.
src/components/controls/BottomControls.tsx	Wraps bottom interaction controls.
src/components/controls/YearSlider.tsx	Filters games by release year range.
src/components/controls/CoverSizeSlider.tsx	Controls visual size of game cover markers.
src/components/controls/ViewModeToggle.tsx	Switches marker display mode.
src/data/games.ts	Local mock game data.
src/data/countries.ts	Local mock country data.
src/lib/filterGames.ts	Pure filtering functions.
src/lib/stats.ts	Pure statistics functions.
src/lib/geo.ts	Geographic coordinate and marker position helpers.
src/types/game.ts	Shared TypeScript types.

State Management Strategy

For MVP, use React state in GameEarthApp.tsx.

The current MVP keeps interaction state in `src/components/GameEarthApp.tsx`.

Top-level state should include:

* `selectedCountryCode`
* `selectedGameId`
* `hoveredGameId`
* `yearRange`
* `coverSize`
* `viewMode`
* auto rotate enabled or disabled

Do not introduce Zustand or Redux in the first MVP unless state becomes difficult to maintain.

Rendering Strategy

MVP can choose one of two approaches:

Option A: 3D Globe

Use React Three Fiber or a globe library to render:

* earth sphere
* country points or simplified country layer
* game cover markers as sprites or cards
* hover and click interaction

Option B: Interactive 2D World Map

Use SVG or a map library to render:

* world map
* country regions
* game cover markers
* hover and click interaction

Preferred MVP direction: start with the simpler implementation that can run reliably.

If 3D globe becomes too unstable, implement a 2D world map first and keep the component names compatible.

Data Flow

src/data/games.ts
        ↓
src/lib/filterGames.ts
        ↓
GameEarthApp state
        ↓
GameGlobe / RightPanel / BottomControls

Current interaction flow:

* `CountryPanel` emits country selection to `GameEarthApp`.
* `CountryDetailPanel` emits game selection to `GameEarthApp`.
* `BottomControls` emits year range, cover size, and view mode updates to `GameEarthApp`.
* `GameGlobe` receives filtered games and current state, and can emit game hover / selection.

Statistics flow:

src/data/games.ts
        ↓
src/lib/stats.ts
        ↓
CountryPanel / CountryDetailPanel

UI Layout

The MVP layout should include:

1. top header
    * product name
    * total games
    * total countries
2. main center area
    * globe or map
    * game cover markers
    * hover tooltip
3. right panel
    * country list
    * selected country detail
    * selected game detail
4. bottom controls
    * year slider
    * cover size slider
    * view mode toggle
    * rotation control if using 3D

Documentation Update Rule

When changing architecture, update this file.

Examples:

* adding Zustand
* replacing 3D globe with 2D map
* changing data source from mock to API
* adding backend database
* changing directory structure
* adding major dependencies

Also update:

* docs/00_PROJECT_INDEX.md
* docs/02_FEATURE_MAP.md
* AGENTS.md if working rules change
