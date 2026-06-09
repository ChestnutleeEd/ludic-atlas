# 03_ARCHITECTURE.md
## Purpose
This document defines the technical architecture for Ludic Atlas / 游戏星图.
The goal is to help Codex quickly understand where each module belongs and avoid unnecessary full-project search.
## Tech Stack
The first MVP should use:
- Next.js 16.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.0
- React 19.2.7
- ESLint 9.39.4
- `react-globe.gl` + Three.js for real interactive 3D earth rendering
- `undici` for RAWG data script proxy-aware fetch transport
- SVG + CSS transforms remain available only in the legacy 2.5D earth component
- Local generated / mock data
- No backend database in MVP
## Architecture Principle
Ludic Atlas should separate:
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
│  ├─ home/
│  │  └─ LandingHub.tsx
│  ├─ archive/
│  │  ├─ GameArchiveView.tsx
│  │  ├─ ArchiveTimeline.tsx
│  │  ├─ ArchiveYearModal.tsx
│  │  ├─ ArchiveYearDrawer.tsx
│  │  └─ ArchiveDossier.tsx
│  ├─ globe/
│  │  ├─ GameGlobe2D.tsx
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
│  ├─ games.ts
│  ├─ games.generated.ts
│  └─ games.mock.ts
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

Data generation files:

```txt
scripts/fetch-rawg-games.mjs
scripts/rawg-seeds.mjs
```

Main Component Responsibilities

File	Responsibility
src/app/page.tsx	Home page entry. Should render GameEarthApp.
src/app/layout.tsx	App Router root layout, page metadata, and favicon metadata.
src/app/globals.css	Global Tailwind import and base visual tokens.
src/components/GameEarthApp.tsx	Main product shell. Owns top-level UI state and layout.
src/components/home/LandingHub.tsx	Renders the Ludic Atlas landing hub with Earth Explorer and Game Chronicle entrance cards.
src/components/archive/GameArchiveView.tsx	Renders Game Chronicle data preparation, local title search, multi-label genre / platform filters, year grouping, selected year modal state, sorting, and selected game archive details.
src/components/archive/ArchiveTimeline.tsx	Renders the large horizontal year cabinet timeline with filtered counts and cover previews.
src/components/archive/ArchiveYearModal.tsx	Renders the selected year exhibition modal, selected-year game card grid, close behavior, and selected game handoff.
src/components/archive/ArchiveYearDrawer.tsx	Legacy active-year drawer component retained on disk but no longer rendered by the current Game Chronicle view.
src/components/archive/ArchiveDossier.tsx	Renders the modal dossier panel, showing either selected-year overview stats or selected game details.
src/components/globe/GameGlobe2D.tsx	Legacy SVG 2.5D planet map component retained on disk but not exposed by the current main UI.
src/components/globe/GameGlobe.tsx	Renders the default real 3D earth scene.
src/components/globe/GameMarkers.tsx	Renders game cover markers on the globe.
src/components/globe/CountryLayer.tsx	Handles country boundaries, hover, and click interaction.
src/components/globe/GameTooltip.tsx	Shows hover information for a game marker.
src/components/panels/RightPanel.tsx	Switches between right-side country overview and selected-country detail panels.
src/components/panels/CountryPanel.tsx	Shows compact searchable country rows and country-level statistics.
src/components/panels/CountryDetailPanel.tsx	Shows selected-country detail mode with stats, current-year game cards, return control, and bottom game summary dock.
src/components/panels/GameDetailCard.tsx	Shows closable compact selected game details.
src/components/controls/BottomControls.tsx	Wraps bottom interaction controls.
src/components/controls/YearSlider.tsx	Filters games by release year range.
src/components/controls/CoverSizeSlider.tsx	Controls visual size of game cover markers.
src/components/controls/ViewModeToggle.tsx	Switches marker display mode.
src/data/games.ts	Stable frontend game data export.
src/data/games.generated.ts	Generated local static game data. Overwritten by `npm run data:rawg`.
src/data/games.mock.ts	Stable original mock game data fallback.
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
* `mainViewMode` (`hub`, `earth`, or `archive`)
* auto rotate enabled or disabled

Do not introduce Zustand or Redux in the first MVP unless state becomes difficult to maintain.

Rendering Strategy

The current MVP uses a landing hub plus a real 3D globe renderer and a separate archive view:

* `LandingHub` is the default first-screen experience and presents Earth Explorer and Game Chronicle as independent product entrances.
* `GameGlobe` keeps the real WebGL 3D globe as the Earth Explorer experience.
* `GameArchiveView` is selected through `GameEarthApp` main view mode and provides the Game Chronicle surface for generated global game records.
* `GameGlobe2D` remains on disk as a legacy component, but `GameEarthApp` no longer imports or renders it and the UI no longer exposes a 2.5D / 3D switch.
* `GameEarthApp` owns the main view switch so selected game state can carry between Earth and Archive. Earth-specific year range, cover size, and marker view controls are shown only in Earth mode.

Game Chronicle behavior:

* `GameArchiveView` receives `Game[]`, `selectedGameId`, and `onSelectGame` from `GameEarthApp`.
* The component keeps search, selected genre filters, selected platform filters, and sort mode as local state.
* Genre and platform filter options are built by splitting each game's `genres` and `platforms` arrays into individual tags. If a legacy tag string contains `/`, it is split before counting and filtering.
* Multi-select genre and platform filters use OR logic inside each filter category. When no genre or no platform is selected, that category does not filter the list.
* Filtered games are grouped by valid `releaseYear`, with invalid years placed under `Unknown Year`; year groups render as a large horizontal year cabinet timeline with filtered counts and 3-5 cover previews.
* The main Game Chronicle page does not render full game card lists. Clicking a year opens `ArchiveYearModal`, which shows only that year's game cards and a right-side dossier panel.
* If no game is selected inside the year modal, `ArchiveDossier` shows selected-year overview stats: record count, average rating, top genres, top platforms, and a prompt to choose a card. If a game is selected, it shows the selected game cover, year, rating, genres, platforms, and description.
* `year-desc` is the default sort mode. `rating-desc` sorts each year group by rating descending.
* Game covers render with regular `<img loading="lazy">` to avoid Next remote image domain configuration for RAWG URLs.

Legacy 2.5D globe behavior:

* `GameGlobe2D` renders a large circular / hemispheric SVG planet stage with deep blue-purple sci-fi styling, star texture, scanline overlay, and grid paths.
* It loads `public/data/mock-countries.geojson` and converts the 10 mock country polygons into SVG paths through `src/lib/geo.ts`.
* Country polygon hover and selected states only affect the actual polygon path. Empty ocean / blank stage hover does not recolor the planet.
* Selected country focus uses an SVG `viewBox` change through `getCountry2DViewBox`; the `全球视角` button restores the full world view and `聚焦当前国家` restores the selected country view.
* The selected country's games render as cover-like placeholder cards with full Chinese-first title, optional English subtitle, year, rating, selected state, and hover tooltip.
* Other countries' games render as small glowing dots to keep the map lightweight and avoid covering the globe.
* The component memoizes country paths, marker positions, selected-country marker lists, and non-selected marker lists.

Current 3D globe behavior:

* `GameGlobe` dynamically imports `react-globe.gl` with SSR disabled because the WebGL globe depends on browser APIs.
* Three.js `MeshPhongMaterial` provides a near-black globe surface, while `react-globe.gl` provides orbit controls, zoom, drag rotation, polygon layers, point layers, and HTML marker layers.
* `public/data/countries.geojson` stores the full source country border data copied from `https://github.com/datasets/geo-countries`.
* `public/data/world-countries-lite.geojson` stores a simplified runtime world country outline dataset generated from the full source file. `GameGlobe` loads this file for the 3D base layer so all world country outlines are visible without loading the 14 MB source GeoJSON.
* `public/data/mock-countries.geojson` stores the simplified MVP country border data for the current 10 mock countries and remains available to the 2.5D fallback mode.
* `CountryLayer` converts the lightweight world GeoJSON feature collection and local mock country list into globe polygon props and point-cloud props. It handles all-country border color, selected / hovered country elevation, polygon hover, polygon click, mock-country dot-matrix points, and country point hover / click.
* `src/lib/geo.ts` maps GeoJSON `ISO3166-1-Alpha-2` values to project country codes, with Alpha-3 / name fallback keys for non-mock countries and a small name fallback for records like France where this GeoJSON source uses `-99`.
* `src/lib/geo.ts` also owns globe camera view helpers: a global point of view and per-country focus points for Europe, East Asia, North America, and other mock regions.
* `src/lib/geo.ts` samples a controlled dot matrix inside the 10 mock country polygons. The 3D globe uses those points to make mock countries easier to spot without turning all game data into heavy HTML markers.
* `GameMarkers` converts local game records and countries into mixed globe HTML marker data. Country names render as HTML labels only when a mock country is hovered or selected. With no selected country, the globe shows one representative cover marker per mock country; after country selection, it shows that country's current-year game markers.
* Marker size responds to `coverSize`; view mode changes marker presentation while keeping the same local mock data source.
* `GameTooltip` still provides the React tooltip component for reusable UI and now also provides escaped HTML tooltip markup for globe HTML markers.
* `src/app/globals.css` provides the black / white sci-fi visual system, globe stage styling, country tooltip styling, dot / border styling, and globe HTML marker styling.

Real 3D Globe performance strategy:

* Automatic rotation is disabled. The globe should rotate only from user drag / zoom interaction.
* Initial and selected-country camera views use closer `pointOfView` altitude values so the globe fills the central stage and country selection focuses on the relevant geographic region.
* Orbit controls allow deeper zoom than the first Real 3D Globe implementation, while still retaining a global zoom-out range.
* Runtime country borders use `public/data/world-countries-lite.geojson`, not the full 14MB source GeoJSON. The lightweight file is about 1.1 MB and contains simplified world country / region outlines.
* The WebGL renderer pixel ratio is capped at 1.25 and antialiasing is disabled through `rendererConfig` to keep drag and zoom responsive on high-DPI screens.
* Polygon altitude, opacity, curvature resolution, and transition duration are kept low to reduce hover and drag overhead. Hover / selected states brighten only the matching country dots and border; ocean / blank hover does not recolor the globe.
* Atmosphere and graticules are disabled in the current MVP to prioritize interaction smoothness.
* Globe HTML country labels are disabled by default. They appear only for hovered / selected mock countries and are hidden during drag / zoom.
* With no selected country, `GameGlobe` shows only one representative game marker per mock country. After a country is selected, the globe shows only that country's current-year game markers and hides other countries' games.
* During drag / zoom interaction, `GameGlobe` hides country labels and downgrades cover-card markers into lightweight dots, then restores the needed card / label layer about 200ms after interaction ends.
* Polygon hover uses per-feature country keys. Ocean / blank hover clears the hovered country state instead of applying a broad globe highlight. Non-mock country clicks only highlight the globe polygon; mock country clicks still update the right panel.
* Missing cover images are not requested by default, so mock cover paths do not create repeated 404 requests during globe rendering.
* If real local cover files are added later, marker image loading should be gated by an explicit cover-availability check rather than blindly using every mock `coverImage` path.

Data Generation Strategy

RAWG is integrated as a build-time / local generation source, not as a browser runtime dependency.

* `scripts/rawg-seeds.mjs` stores a manually curated country-to-representative-game seed list.
* `scripts/fetch-rawg-games.mjs` reads `RAWG_API_KEY` from `.env.local` or the shell environment.
* `scripts/fetch-rawg-games.mjs` configures an `undici` `ProxyAgent` through `setGlobalDispatcher` when `HTTPS_PROXY`, `HTTP_PROXY`, or `ALL_PROXY` is present. This keeps proxy configuration in the shell environment instead of hard-coding local network settings.
* RAWG script errors are printed with structured fields: error name, error message, cause message, HTTP status when available, and the first 300 characters of any response body. RAWG API keys in request URLs are redacted before output.
* The script fetches RAWG game details, maps them into the existing `Game` type, and overwrites `src/data/games.generated.ts`.
* `src/data/games.ts` remains the only frontend data import path and exports the generated local module.
* `.env.local` is ignored by Git, so the RAWG API key is not bundled or committed.
* The frontend may render RAWG remote `background_image` URLs as `coverImage`, but components must not call RAWG APIs directly.

Data Flow

src/data/games.ts
        ↓
src/lib/filterGames.ts
        ↓
GameEarthApp state
        ↓
GameGlobe / RightPanel / BottomControls / GameArchiveView

Current interaction flow:

* `CountryPanel` emits searchable country overview selection to `GameEarthApp`.
* `CountryLayer` emits 3D country selection to `GameEarthApp`.
* `GameMarkers` emits game hover and game selection to `GameEarthApp`.
* `CountryDetailPanel` emits game selection, game clear, and clear-country actions to `GameEarthApp`.
* `BottomControls` emits year range, cover size, and view mode updates to `GameEarthApp`.
* `GameArchiveView` emits selected game updates to `GameEarthApp` and keeps archive search / filter / sort state local.
* `GameGlobe` receives year-filtered games and current earth state, and emits country selection plus game hover / selection.

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
    * default real 3D globe mode
    * fallback 2.5D globe map
    * game cover markers
    * hover tooltip
3. right panel
    * compact searchable country overview when no country is selected
    * selected country detail shell when a country is selected
    * selected-country stats and current-year game card flow
    * selected game detail as a sticky bottom compact HUD card inside the country detail panel
    * bounded vertical scrolling for long country detail content
4. bottom controls
    * year slider
    * cover size slider
    * view mode toggle
    * rotation control if using 3D

The current 3D globe panel also includes two local view controls:

* `全球视角`: returns the camera to the global point of view.
* `聚焦当前国家`: moves the camera back to the selected country's regional focus point.

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
