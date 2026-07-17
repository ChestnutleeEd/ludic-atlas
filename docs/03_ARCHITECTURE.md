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
- `motion` for existing lightweight UI transitions outside the new archive reading room
- `gsap` remains installed for existing experiments, but the Chronicle Reading Room does not use GSAP entry choreography
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
│  │  ├─ GameArchiveView.module.css
│  │  ├─ ArchiveTimeline.tsx
│  │  ├─ ArchiveYearModal.tsx
│  │  ├─ ArchiveYearDrawer.tsx
│  │  └─ ArchiveDossier.tsx
│  ├─ globe/
│  │  ├─ GameGlobe2D.tsx
│  │  ├─ GameGlobe.tsx
│  │  ├─ GameMarkers.tsx
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
│  ├─ archiveModel.ts
│  ├─ stats.ts
│  ├─ geo.ts
│  ├─ regions.ts
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
scripts/cache-rawg-covers.mjs
scripts/rawg-seeds.mjs
```

Main Component Responsibilities

File	Responsibility
src/app/page.tsx	Home page entry. Should render GameEarthApp.
src/app/layout.tsx	App Router root layout, page metadata, and favicon metadata.
src/app/globals.css	Global Tailwind import and base visual tokens.
src/components/GameEarthApp.tsx	Main product shell. Owns top-level UI state and layout.
src/components/home/LandingHub.tsx	Renders the Ludic Atlas landing hub with Earth Explorer and Game Chronicle entrance cards.
src/components/archive/GameArchiveView.tsx	Owns archive-only query / filter / sort / year / selected-game controls and composes the desktop and mobile Chronicle Reading Room.
src/components/archive/ArchiveCover.tsx	Centralizes optimized archive cover geometry, responsive sizing, skeleton/failure states, and bounded year-intent prefetch.
src/components/archive/GameArchiveView.module.css	Scopes the warm paper / ink / oxblood / brass reading-room visual system, responsive compositions, focus states, image geometry, drawer, and reduced-motion behavior.
src/components/archive/ArchiveTimeline.tsx	Renders chronological year navigation with one current year, boundary controls, roving focus, Arrow / Home / End movement, and Enter / Space activation.
src/components/archive/ArchiveYearModal.tsx	Renders the right-side desktop / full-screen mobile dossier portal, background inert state, body scroll lock, Escape close, focus trap, and trigger-focus restoration.
src/components/archive/ArchiveYearDrawer.tsx	Legacy active-year drawer component retained on disk but no longer rendered by the current Game Chronicle view.
src/components/archive/ArchiveDossier.tsx	Renders selected game cover and archive metadata with explicit missing-field and UNKNOWN-region fallbacks.
src/lib/archiveModel.ts	Purely derives archive search, filters, chronological groups, representatives, averages, options, collection ordering, active-year fallback, and selected game from catalog data plus archive controls.
src/components/globe/GameGlobe2D.tsx	Legacy SVG 2.5D planet map component retained on disk but not exposed by the current main UI.
src/components/globe/GameGlobe.tsx	Renders the default real 3D earth scene.
src/components/globe/GameMarkers.tsx	Renders game cover markers on the globe.
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
src/data/gameCatalog.ts	Shared derived catalog with game / country indexes, country groups, recognition counts, and total statistics.
src/data/games.generated.ts	Generated local static game data. Overwritten by `npm run data:rawg`.
src/data/games.mock.ts	Stable original mock game data fallback.
scripts/cache-rawg-covers.mjs	Downloads generated RAWG cover URLs into `public/covers/rawg/` and rewrites `coverImage` to local static paths.
src/data/countries.ts	Local mock country data.
src/lib/filterGames.ts	Pure filtering functions.
src/lib/stats.ts	Pure statistics functions.
src/lib/geo.ts	Geographic coordinate and marker position helpers.
src/lib/regions.ts	Broad atlas region mapping, labels, game / country region filters, and cinematic camera presets.
src/lib/gameCover.ts	Normalizes game cover fields and provides the shared fallback cover image path.
src/types/game.ts	Shared TypeScript types.
tests/core-data.test.ts	Node-native characterization tests for filtering, statistics, and cover selection.

State Management Strategy

For MVP, use React state in `GameEarthApp.tsx`, with a pure reducer for state that must change atomically.

Top-level state should include:

* `exploration` from `src/lib/explorerState.ts`: `selectedCountryCode`, `selectedGameId`, `activeRegionId`, `cameraMode`, and monotonic `selectionRevision`
* `yearRange`
* `coverSize`
* `viewMode`
* `mainViewMode` (`hub`, `earth`, or `archive`)
* auto rotate enabled or disabled

Country selection, game selection, and cross-region synchronization are one reducer action, so rapid preset / polygon / list input cannot leave the region, panel, markers, and camera on different intents. Game hover uses native marker CSS and does not participate in React marker derivation.

Do not introduce Zustand or Redux in the first MVP unless state becomes difficult to maintain.

Rendering Strategy

The current MVP uses a landing hub plus a real 3D globe renderer and a separate archive view:

* `LandingHub` is the default first-screen experience and presents Earth Explorer and Game Chronicle as independent product entrances.
* `GameEarthApp` dynamically imports the Earth Explorer and Game Chronicle view modules after the user chooses an entrance, keeping Three.js / globe and archive implementations out of the initial hub execution path.
* `GameGlobe` keeps the real WebGL 3D globe as the Earth Explorer experience.
* `GameArchiveView` is selected through `GameEarthApp` main view mode and provides the Game Chronicle surface for generated global game records.
* `GameGlobe2D` remains on disk as a legacy component, but `GameEarthApp` no longer imports or renders it and the UI no longer exposes a 2.5D / 3D switch.
* `GameEarthApp` owns only the cross-experience `mainViewMode` switch for Archive. Earth exploration state remains mounted but is not passed to or mutated by Game Chronicle. Earth-specific year range, cover size, and marker view controls are shown only in Earth mode.

Game Chronicle behavior:

* The annual visual is data-driven rather than a per-year bitmap: `archiveModel` deterministically derives three rating-priority cover IDs and a layout variant, while `GameArchiveView` combines those real covers with the shared archive atmosphere WebP.
* `ArchiveCover` resolves the existing `public/covers/rawg/<id>.webp` cache for all 992 records and routes display-size variants through Next Image, avoiding multi-megabyte originals and unreliable remote-image optimization. Collections mount eight games at a time and append bounded batches from an IntersectionObserver or explicit control; adjacent-year intent prefetch is capped at three 256px optimized images.
* Year transitions use the existing Motion package with the final active group as the only rendered authority. CSS hover/depth feedback and Motion displacement are disabled under `prefers-reduced-motion`.

* `GameArchiveView` receives only `Game[]` and `onBackToHub` from `GameEarthApp`; it never dispatches Earth reducer actions.
* The component owns `query`, selected genres, selected platforms, sort mode, `openYearKey`, and `selectedArchiveGameId`.
* `src/lib/archiveModel.ts` synchronously derives search results and every archive display model from the 992-record static catalog, so rapid controls cannot complete out of order.
* Genre and platform filter options are built by splitting each game's `genres` and `platforms` arrays into individual tags. If a legacy tag string contains `/`, it is split before counting and filtering.
* Multi-select genre and platform filters use OR logic inside each filter category. When no genre or no platform is selected, that category does not filter the list.
* Filtered games are grouped by valid `releaseYear`, with invalid years represented by the distinct `unknown` key. The year index always remains newest-to-oldest with unknown last.
* `馆藏评分优先` (`rating-desc`) only reorders games inside each annual collection; the default collection order is deterministic title / ID.
* Desktop renders a compact masthead and tools above a year index, original-image annual feature, and scroll-contained annual collection. Mobile shares the model but uses sticky horizontal years, vertical content, and a full-screen dossier.
* `public/images/archive/chronicle-reading-room.webp` is a 2400×1600 text-free original archive desk image. It has fixed intrinsic geometry, centered crop safety, and a CSS paper / halftone failure fallback.
* Archive covers reserve 2:3 geometry and use `getGameCoverImage` plus `/covers/fallback-game-cover.svg`; noncritical collection covers lazy-load.
* `ArchiveYearModal` is the selected-game dossier layer, not a year-selection owner. Desktop uses a right drawer and mobile uses the full viewport while background body scroll is locked.
* `ArchiveDossier` shows the exact selected ID regardless of country recognition and labels `UNKNOWN` as `地区待归档`. Missing strings use explicit unknown / unavailable states.
* The archive uses CSS transitions only, with a static-equivalent `prefers-reduced-motion` rule; it does not initialize GSAP.

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
* Three.js `MeshPhongMaterial` provides the deep-navy globe surface, while `react-globe.gl` provides orbit controls, zoom, drag rotation, the stable custom boundary layer, and HTML marker layers.
* `src/lib/regions.ts` owns broad Earth Explorer regions, `CAMERA_MODE_CONFIGS`, two-mode `CAMERA_PRESETS`, region labels, and pure helpers for deriving region-scoped country and game lists from existing source data.
* `public/data/countries.geojson` stores the full source country border data copied from `https://github.com/datasets/geo-countries`.
* `public/data/world-countries-lite.geojson` stores a simplified runtime world country outline dataset generated from the full source file. `GameGlobe` loads this file for the 3D base layer so all world country outlines are visible without loading the 14 MB source GeoJSON.
* The world-country request checks HTTP status and uses `AbortController` on unmount. Resize observation ignores unchanged dimensions, and the external Three.js material is disposed with the globe module.
* `public/data/mock-countries.geojson` stores the simplified legacy MVP country border subset and remains available to the 2.5D fallback mode.
* `GameGlobe` converts the lightweight world GeoJSON into one sampled cyan world `LineSegments` mesh plus one stable magenta selection mesh. World rings retain up to 144 source points and selected-country rings up to 240, giving coastlines and borders more shape without restoring polygon triangulation. It deliberately does not create polygon or decorative point layers, preventing both triangulation stalls and raycast interception.
* `src/lib/geo.ts` maps GeoJSON `ISO3166-1-Alpha-2` values to project country codes, with Alpha-3 / name fallback keys for non-mock countries and a small name fallback for records like France where this GeoJSON source uses `-99`.
* `src/lib/geo.ts` owns per-country focus points and deterministic country marker distribution. Broad Global / Europe / East Asia / North America / Latin America / Middle East / South Asia / Oceania camera presets live in `src/lib/regions.ts` with both Overview and Surface altitude values.
* `GameGlobe` supports Overview and Surface camera modes. Overview uses higher altitude and wider zoom limits for global / region browsing. Selecting a country atomically enters Surface mode, whose per-country altitude stays within 0.26–0.38 so nearby countries remain in frame while a 106-unit OrbitControls floor still permits manual close inspection; selecting a region returns to Overview. Portrait viewports apply bounded altitude compensation so a global globe remains framed at 390px widths while selected-country focus stays close.
* `GameMarkers` converts local game records and countries into mixed globe HTML marker data. Country names render as non-interactive HTML labels only when a mock country is hovered or selected. Country marker mode uses lightweight country aggregate dots with game counts. Game marker mode promotes only high-rated representative games to cover markers, while selected countries / selected games restore richer cover markers and tooltip detail. Region mode remains capped at 6 candidate games per country and selected-country mode is capped at 8 markers.
* Global / region markers retain deterministic representative offsets. Selected-country markers use `getCountrySafeMarkerSlots`: normalized Polygon / MultiPolygon rings, hole exclusion, date-line unwrapping, boundary-distance ranking, and deterministic farthest-point sampling keep cover anchors inside the actual country. At most 8 covers render and one `+N` badge accounts for the remainder.
* Game cover lookup is centralized in `src/lib/gameCover.ts`. Earth markers and country detail cards prefer real RAWG / local cover paths and fall back to `public/covers/fallback-game-cover.svg` when a cover field is missing or an image load fails.
* Earth cover markers keep the cover image clear. They do not render title / year text on top of the image; full game metadata is available through marker tooltip and the right panel game detail layer.
* Marker size responds to `coverSize`; view mode changes marker presentation while keeping the same local mock data source.
* `GameTooltip` provides typed tooltip content for both the React component and escaped HTML tooltip markup for globe HTML markers.
* `src/app/globals.css` scopes the Earth-only Retro-Futuristic observatory theme under `.is-earth-mode`: softened deep navy/black surfaces, restrained cyan geography, magenta selection, subtle scanlines, accessible focus rings, reduced-motion rules, a command bar in a dedicated row above the globe, on-demand location / filter trays, an off-canvas desktop country drawer, responsive `dvh` workspace, and an explicitly sized mobile bottom sheet. Earth WebGL overlays avoid backdrop filters so moving canvas content does not force per-frame backdrop rasterization. Hub and Archive retain their own themes.

Real 3D Globe performance strategy:

* Automatic rotation is disabled by default and exposed as a rotate toggle in `BottomControls`.
* Initial, region, and selected-country camera views use the revision-guarded animator in `src/lib/globeCamera.ts`. It interpolates the shortest longitude arc with a fifth-order smootherstep curve; normal country focus is 680ms, the shared utility has a 900ms hard cap, and reduced motion is 0ms. New intents cancel stale requests, and user input stops the animation immediately.
* Orbit controls disable pan, enable damping, and constrain zoom distance so manual dragging cannot easily push the earth out of the viewport.
* Runtime country borders use `public/data/world-countries-lite.geojson`, not the full 14MB source GeoJSON. The lightweight file is about 1.1 MB and contains simplified world country / region outlines.
* The WebGL renderer pixel ratio is capped at 1 and antialiasing is disabled through `rendererConfig` to keep drag and zoom responsive on high-DPI screens.
* The stable globe does not construct react-globe.gl polygon meshes. Country clicks use the globe surface latitude / longitude plus GeoJSON point containment, avoiding synchronous triangulation of 236 features and roughly 73,000 source vertices.
* A cyan atmosphere and deep-navy low-shininess globe material provide the observatory look; graticules remain disabled to prioritize interaction smoothness.
* Globe HTML country labels are disabled by default. They appear only for hovered / selected mock countries and are hidden during drag / zoom.
* Global / country marker mode shows lightweight aggregate dots with counts instead of cover cards. Game mode promotes only high-rated representative games to cover cards. After a country is selected, the globe shows only that country's top-rated current-year game markers, capped at 8, and hides other countries' games; one `+N` badge preserves the full eligible count.
* `src/lib/globeMarkerModel.ts` total-orders and caps representative games independently of hover. Marker descriptors remain stable during pointer hover; images declare intrinsic size and async decoding.
* The cyan world-boundary `LineSegments` mesh and empty magenta selection mesh are created once after GeoJSON load. Selection copies new BufferGeometry into the existing magenta object instead of replacing custom-layer data, so nearby borders never flash or disappear. During drag, wheel, automatic rotation, and camera travel, HTML marker nodes stay mounted but become CSS-hidden, avoiding restore-time DOM recreation and cover-image decoding.
* Zoom / reset / focus controls are the only camera tools that remain visible inside the globe stage. Region and key-country presets live in an on-demand location menu; year, cover, camera-mode, rotation, and marker controls live in a collapsed filter tray. This keeps the globe unobstructed while avoiding duplicate camera writes.
* On desktop, `RightPanel` is off-canvas and inert until the directory is requested or a country is selected; it overlays the globe instead of reserving a permanent column. On mobile, `GameEarthApp` owns a three-state Earth-side sheet state (`collapsed`, `peek`, `expanded`). Country selection opens Peek, game detail opens Expanded, and globe drag / wheel interaction collapses the sheet. The collapsed state has an explicit 68px height, the globe workspace is clamped to `100vw`, and portrait camera compensation keeps the global sphere visible at 390px widths.
* Surface clicks scan GeoJSON features with the existing date-line-aware point-in-polygon helper. Mapped countries update the atomic selection state and panel; other world countries receive the lightweight magenta boundary focus without opening unsupported detail content.
* Missing cover images are not requested by default, so mock cover paths do not create repeated 404 requests during globe rendering.
* If real local cover files are added later, marker image loading should be gated by an explicit cover-availability check rather than blindly using every mock `coverImage` path.

Engine evaluation:

* The stable Earth Explorer keeps `react-globe.gl` as the primary engine because it already integrates with Next.js through dynamic client loading, supports local GeoJSON polygons, HTML markers, custom Three.js material, and camera control without runtime map tokens or external services.
* CesiumJS was not added in this iteration. It remains unsuitable for the first MVP unless the product shifts toward real GIS terrain, imagery, 3D Tiles, or WGS84 precision; the package weight, worker / static asset setup, and possible token / provider decisions remain too costly for a safe MVP experiment.

Data Generation Strategy

RAWG is integrated as a build-time / local generation source, not as a browser runtime dependency.

* `scripts/rawg-seeds.mjs` stores a manually curated country-to-representative-game seed list.
* `scripts/fetch-rawg-games.mjs` reads `RAWG_API_KEY` from `.env.local` or the shell environment.
* `scripts/fetch-rawg-games.mjs` configures an `undici` `ProxyAgent` through `setGlobalDispatcher` when `HTTPS_PROXY`, `HTTP_PROXY`, or `ALL_PROXY` is present. This keeps proxy configuration in the shell environment instead of hard-coding local network settings.
* RAWG script errors are printed with structured fields: error name, error message, cause message, HTTP status when available, and the first 300 characters of any response body. RAWG API keys in request URLs are redacted before output.
* The script fetches RAWG game details, maps them into the existing `Game` type, and overwrites `src/data/games.generated.ts`.
* `scripts/cache-rawg-covers.mjs` reads `src/data/games.generated.ts`, downloads remote `coverImage` URLs into `public/covers/rawg/`, skips existing non-empty cover files, and rewrites successful records to `/covers/rawg/...`.
* The cover cache script uses shell proxy variables through `undici.ProxyAgent`, does not read `.env.local`, does not require a RAWG API key, and keeps failed cover URLs unchanged.
* `src/data/games.ts` remains the raw frontend data import path and exports the generated local module. Runtime shells consume `src/data/gameCatalog.ts` for indexed selection and grouped country access.
* `.env.local` is ignored by Git, so the RAWG API key is not bundled or committed.
* The frontend should prefer cached local RAWG cover paths as `coverImage`; components must not call RAWG APIs directly.

Data Flow

src/data/games.ts
        ↓
src/data/gameCatalog.ts
        ↓
src/lib/filterGames.ts
        ↓
GameEarthApp atomic exploration reducer + local filter state
        ↓
GameGlobe / RightPanel / BottomControls / GameArchiveView

Current interaction flow:

* `CountryPanel` emits searchable country overview selection to `GameEarthApp`.
* `GameGlobe` resolves globe / boundary click coordinates through GeoJSON point containment and emits country selection to `GameEarthApp`.
* `GameMarkers` emits game selection to `GameEarthApp`; hover is native CSS and country aggregate hover only updates the small country highlight state.
* `CountryDetailPanel` emits game selection, game clear, and clear-country actions to `GameEarthApp`.
* `BottomControls` emits year range, cover size, and view mode updates to `GameEarthApp`.
* `GameArchiveView` keeps archive search / filter / sort / year / game selection local; archive interaction never emits Earth selected-game updates.
* `GameGlobe` receives year-filtered games and current earth state, and emits country selection plus game hover / selection.
* `RightPanel` owns the Earth-side game detail layer. When `selectedGame` is set, the base country / gallery content is marked inert and visually dimmed, the right panel stops background scrolling, and Escape closes the detail layer.

Statistics flow:

src/data/gameCatalog.ts
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
