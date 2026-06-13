# 05_TASK_LOG.md

## Purpose

This document records major implementation steps, file changes, and documentation updates during the Game Earth project.

Codex should update this file after meaningful code or architecture changes.

## Log Format

Each entry should use this format:

```md
## YYYY-MM-DD - Task Title

### Goal

Briefly describe the task goal.

### Files Changed

- `path/to/file.tsx`: what changed
- `path/to/file.ts`: what changed
- `docs/example.md`: what changed

### Implementation Summary

Briefly summarize what was implemented.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/04_DATA_SCHEMA.md`

### Verification

Describe how the change was checked.

Example:

- App starts with `npm run dev`
- Page renders correctly in browser
- No TypeScript errors
- UI checked with Playwright Interactive

### Next Step

Briefly state the recommended next step.

## 2026-06-13 - Game Chronicle Archive Visual Polish

### Goal

Refine the Game Chronicle / 年度馆藏 drawer UI with equal-height exhibition cards, a less intrusive year-drawer icon, and a more modern dark museum visual system.

### Files Changed

- `src/components/archive/ArchiveYearModal.tsx`: added full-title accessibility attributes to exhibition cards so clamped titles remain available.
- `src/app/globals.css`: added focused Game Chronicle polish styles for page background, archive panels, modal header, equal-height card grid, fixed cover ratio, title clamps, metadata alignment, hover, selected, and fallback states.
- `docs/02_FEATURE_MAP.md`: documented the equal-height drawer card system and updated visual responsibility notes.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The selected-year drawer now uses a uniform card grid with fixed cover aspect ratio, three-line title clamp, stable metadata rows, and full title access through `title` / `aria-label`. The modal header drawer mark was redesigned from a large solid brass block into a translucent archive badge with thin borders and a subtle handle detail. The archive surface now leans into a darker museum palette with restrained brass and cyan accents, glassy panels, thin borders, noise texture, and softer hover / selected states.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run lint` with one existing warning in `scripts/infer-game-countries-with-ollama.mjs` for an unused `cache` variable.
- Passed `npm run build`.
- Checked `http://localhost:3000` in browser: entered Game Chronicle, opened `2010 年馆藏`, verified 45 equal-height cards, selected state, title clamp / full title access, modal header badge, and 390px narrow viewport layout.

### Next Step

Continue with smaller visual passes for archive timeline density and dossier typography after the core drawer card system settles.

## 2026-06-13 - Game Chronicle Drawer Readability Pass

### Goal

Fix metadata overlap inside selected-year game cards, stabilize right-side dossier section titles, and continue refining the archive drawer visual system.

### Files Changed

- `src/components/archive/ArchiveYearModal.tsx`: added explicit genre / platform row classes and full row titles for card metadata.
- `src/app/globals.css`: refined the selected-year drawer palette, card layout, card metadata rows, right-side dossier grid placement, mobile dossier sizing, hover states, selected states, and panel spacing.
- `docs/02_FEATURE_MAP.md`: updated Game Chronicle notes for separate metadata rows and stable dossier spacing.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

Exhibition cards now keep title, secondary title, year / rating badges, genre, and platform in normal flex / grid document flow. Genre and platform rows have their own labelled areas and clamps, preventing overlap with badges. The desktop dossier starts at the top of the drawer and spans the drawer rows; mobile lets the dossier grow with its content so section headings stay inside the panel instead of being clipped by an internal scroll box. The visual treatment was cleaned toward dark glass, thin warm-brass borders, muted cyan light, and softer selected / hover states.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run lint` with one existing warning in `scripts/infer-game-countries-with-ollama.mjs` for an unused `cache` variable.
- Passed `npm run build`.
- Verified production build at `http://localhost:3001`: opened `2010 年馆藏`, checked 45 cards, selected state, first six desktop cards including long titles, 390px mobile layout, card metadata overlap, right-side `年度概览` and `游戏档案卡` title containment, and horizontal overflow.

### Next Step

Consider extracting archive drawer style primitives into component-level class constants if the archive surface continues to grow.

## 2026-06-04 - Project Setup

### Goal

Initialize a runnable Next.js + TypeScript + Tailwind MVP skeleton for Game Earth.

### Files Changed

- `package.json`: added Next.js project metadata, scripts, and dependencies.
- `package-lock.json`: recorded installed dependency versions.
- `next.config.ts`: added minimal Next.js config.
- `tsconfig.json`: added TypeScript config for Next.js with `@/*` path alias.
- `postcss.config.mjs`: added Tailwind CSS PostCSS config.
- `eslint.config.mjs`: added ESLint flat config for Next.js and TypeScript.
- `.gitignore`: added generated file and dependency ignore rules.
- `src/app/layout.tsx`: added App Router root layout and metadata.
- `src/app/globals.css`: added Tailwind import and dark technical base styling.
- `src/app/page.tsx`: added home page entry rendering `GameEarthApp`.
- `src/components/GameEarthApp.tsx`: added base product layout with header, globe panel, right panel, and bottom controls.
- `src/components/globe/GameGlobe.tsx`: added placeholder globe/map panel.
- `src/components/globe/GameMarkers.tsx`: added placeholder game marker rendering.
- `src/components/globe/CountryLayer.tsx`: added placeholder country label layer.
- `src/components/globe/GameTooltip.tsx`: added reusable tooltip placeholder.
- `src/components/panels/RightPanel.tsx`: added right panel wrapper.
- `src/components/panels/CountryPanel.tsx`: added country list with derived stats.
- `src/components/panels/CountryDetailPanel.tsx`: added country detail placeholder using country filtering.
- `src/components/panels/GameDetailCard.tsx`: added reusable game detail card.
- `src/components/controls/BottomControls.tsx`: added bottom controls wrapper.
- `src/components/controls/YearSlider.tsx`: added year filter placeholder.
- `src/components/controls/CoverSizeSlider.tsx`: added cover size placeholder.
- `src/components/controls/ViewModeToggle.tsx`: added view mode placeholder.
- `src/data/countries.ts`: added Japan, United States, and Poland mock country data.
- `src/data/games.ts`: added six mock game records following the schema.
- `src/lib/filterGames.ts`: added country and year range filter functions.
- `src/lib/stats.ts`: added country and total statistics functions.
- `src/lib/geo.ts`: added coordinate and placeholder marker position helpers.
- `src/lib/search.ts`: added basic game and country search helpers.
- `src/types/game.ts`: added Country, Game, ViewMode, YearRange, and stats types.
- `docs/00_PROJECT_INDEX.md`: updated current directories, setup files, and main entry files.
- `docs/02_FEATURE_MAP.md`: added project setup and root layout mapping.
- `docs/03_ARCHITECTURE.md`: updated actual setup files, global styles location, and dependency versions.
- `docs/04_DATA_SCHEMA.md`: documented current shared types, mock data, and implemented functions.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The project root is now a runnable Next.js App Router project using TypeScript, Tailwind CSS, and ESLint. The MVP screen renders a dark technical Game Earth shell with a central globe/map placeholder, right-side country panel, bottom controls, local mock data, shared types, and pure data helpers.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DATA_SCHEMA.md`
- `docs/05_TASK_LOG.md`

### Verification

- Installed dependencies with `npm install`.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Started the app with `npm run dev`.
- Confirmed `http://localhost:3000` returns `200 OK`.

### Next Step

Implement interactive selection state for country and game detail panels while keeping data transformations in `src/lib/`.

## 2026-06-04 - Interactive MVP State

### Goal

Upgrade the placeholder page into an interactive MVP shell with country selection, game selection, year filtering, cover size control, and view mode switching.

### Files Changed

- `src/components/GameEarthApp.tsx`: added top-level React state and derived filtered data flow.
- `src/components/globe/GameGlobe.tsx`: displays selected country, filtered game count, view mode, and cover size.
- `src/components/globe/GameMarkers.tsx`: added clickable / hoverable marker placeholders driven by cover size and view mode.
- `src/components/globe/CountryLayer.tsx`: highlights the selected country.
- `src/components/panels/RightPanel.tsx`: wired country list, country detail, and game detail props / callbacks.
- `src/components/panels/CountryPanel.tsx`: added clickable country list with derived stats.
- `src/components/panels/CountryDetailPanel.tsx`: added selected country info, year-filtered game list, and selected game detail area.
- `src/components/panels/GameDetailCard.tsx`: expanded game details with title, titleZh, developer, publisher, release year, genres, platforms, rating, and description.
- `src/components/controls/BottomControls.tsx`: wired control callbacks.
- `src/components/controls/YearSlider.tsx`: added native range inputs for year range.
- `src/components/controls/CoverSizeSlider.tsx`: added native range input for marker size.
- `src/components/controls/ViewModeToggle.tsx`: added native button toggle for view mode.
- `docs/02_FEATURE_MAP.md`: updated feature responsibilities for interactive MVP state.
- `docs/03_ARCHITECTURE.md`: updated state management and interaction flow.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The app now uses `GameEarthApp` as the state owner for selected country, selected game, hovered game, year range, cover size, and view mode. Panels and controls are prop-driven, while filtering and statistics remain in `src/lib/`.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.

### Next Step

Add direct country selection from the central map placeholder and refine marker placement for overlapping games in the same country.

## 2026-06-04 - Git Engineering and Completion Report Rules

### Goal

Initialize Git engineering for Game Earth and add a rule requiring each task completion report to include source locations and page acceptance instructions.

### Files Changed

- `.gitignore`: expanded ignored generated files, dependency directories, logs, cache directories, and environment files.
- `README.md`: added project overview, tech stack, setup commands, page URL, source entrypoints, current features, and development plan.
- `docs/00_PROJECT_INDEX.md`: added README, Git engineering, page access, and core source entrypoint sections.
- `docs/02_FEATURE_MAP.md`: added project documentation mapping.
- `docs/06_CODEX_RULES.md`: added required Chinese completion report rule.
- `.codex_task_template.md`: expanded verification requirements with page URL, source entrypoints, and UI acceptance location.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The project is now initialized as a local Git repository. Documentation now records how to start and verify the app, where the page is available, and which source files are the primary entrypoints. Codex completion reporting rules now require Chinese output with source files, document files, page access, local commands, entrypoints, verification, and living docs status.

### Documentation Updated

- `README.md`
- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/06_CODEX_RULES.md`
- `.codex_task_template.md`
- `docs/05_TASK_LOG.md`

### Verification

- Checked Git status.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Dev server can be started with `npm run dev`; page is available at `http://localhost:3000`.

### Next Step

Review the first Git commit contents and create an initial commit when the user confirms which existing project materials should be included.

## 2026-06-04 - Playwright Interactive Page QA

### Goal

Use Playwright Interactive to verify the current Game Earth page rendering and core MVP interactions.

### Files Changed

- `package.json`: added `playwright` as a development dependency for browser QA.
- `package-lock.json`: recorded the installed Playwright dependency.
- `README.md`: added Playwright browser QA note and the required localhost acceptance URL.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

No business UI logic was changed. The page was verified in Chrome through Playwright using `http://localhost:3000`. During QA, `127.0.0.1` was found to trigger Next.js development cross-origin blocking for HMR resources, so browser QA should use `localhost`.

### Documentation Updated

- `README.md`
- `docs/05_TASK_LOG.md`

### Verification

- Started the app with `npm run dev`.
- Verified the page at `http://localhost:3000` with Playwright Interactive.
- Checked title, globe/map placeholder, country list, country detail, game detail area, and bottom controls.
- Tested country selection, game selection, year range, cover size, and view mode interactions.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.

### Next Step

Keep using `http://localhost:3000` for local browser acceptance, then refine direct map-based country selection.

## 2026-06-04 - Git Baseline Commit

### Goal

Create the first Git baseline commit for the Game Earth MVP while excluding reference materials from version control.

### Files Changed

- `.gitignore`: added ignore rules for `screenshots/`, `transcript_raw.txt`, and video reference files.
- `docs/05_TASK_LOG.md`: appended this Git baseline record.

### Implementation Summary

The first Git commit includes project source, configuration, documentation, and setup files. Reference materials such as screenshots, transcripts, and video files are intentionally ignored and left on disk.

### Documentation Updated

- `docs/05_TASK_LOG.md`

### Verification

- Checked `git status`.
- Checked `.gitignore` rules with `git check-ignore`.
- Created the initial baseline commit.
- Confirmed reference materials remain untracked and ignored.

### Next Step

Continue feature work from the committed MVP baseline; push to a remote only when explicitly requested.

## 2026-06-04 - Interactive Globe Map Panel

### Goal

Upgrade the central Globe / Map placeholder into a simplified country and game marker exploration panel without adding a real map API or complex 3D rendering.

### Files Changed

- `src/components/GameEarthApp.tsx`: wired map country selection and map game selection into top-level selected country / game state.
- `src/components/globe/GameGlobe.tsx`: restyled the central panel as a dark 2D global game map and connected country click callbacks.
- `src/components/globe/CountryLayer.tsx`: changed country labels into clickable country points positioned from country coordinates.
- `src/components/globe/GameMarkers.tsx`: added country-based marker placement, same-country marker offsets, cover-size responsive sizing, hover state, click selection, and tooltip rendering.
- `src/components/globe/GameTooltip.tsx`: expanded tooltip content to show title, release year, rating, and genres.
- `src/lib/geo.ts`: added 2D longitude / latitude projection helpers and same-country marker offset logic.
- `docs/02_FEATURE_MAP.md`: updated Globe / Map, marker, country layer, tooltip, and geo helper responsibilities.
- `docs/03_ARCHITECTURE.md`: documented the current 2D projection rendering strategy and map interaction flow.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The central panel now uses local country latitude / longitude data to place clickable country points and local game `countryCode` data to place game markers nearby. Hovering a game marker shows a tooltip driven by `hoveredGameId`; clicking a marker updates the selected game and selected country so the right panel shows the matching detail context.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` in the in-app browser.
- Verified central country points render and map country click switches the selected country / right panel.
- Verified map game marker click switches the selected game / right panel.
- Verified tooltip content renders for the active marker and remains wired to marker hover state.
- Cover size remains wired through `coverSize` into marker dimensions; browser automation could not reliably drive the native range input during QA.

### Next Step

Refine mobile framing and add richer mock country / game coverage so the map has denser exploration content.

## 2026-06-04 - Blue Sci-Fi Globe Visual Redesign

### Goal

Redesign the central Globe / Map area and surrounding app chrome from a green terminal style into a blue sci-fi earth / game planet visual direction while keeping the existing MVP interactions and local mock data.

### Files Changed

- `src/components/GameEarthApp.tsx`: changed the app shell, background, header, and stat cards to a deep-space blue glass style.
- `src/components/globe/GameGlobe.tsx`: replaced the rectangular map panel with a CSS-rendered circular blue globe using glow, star field, grid lines, and horizon arcs.
- `src/components/globe/CountryLayer.tsx`: restyled country controls as blue glow points with stable clickable hit areas.
- `src/components/globe/GameMarkers.tsx`: restyled game markers as floating cover-like cards with initials, short titles, blue glow selected state, hover scale, and tooltip support.
- `src/components/globe/GameTooltip.tsx`: changed tooltip colors to blue glass styling.
- `src/app/globals.css`: replaced the green terminal global background with deep-space blue styling and added scoped blue glass overrides for legacy emerald panel / control classes.
- `docs/02_FEATURE_MAP.md`: updated Globe / Map, marker, and country layer notes for the CSS blue globe visual.
- `docs/03_ARCHITECTURE.md`: documented the CSS-rendered blue globe visual strategy and global visual system overrides.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The app now presents the central exploration area as a blue glowing game planet rather than a rectangular terminal map. Country and game positions still use the existing 2D projection and mock data, while the visual layer adds a circular globe, star field, latitude / longitude grid, glass panels, floating marker cards, and blue tooltip treatment.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` in the in-app browser.
- Verified the globe renders as a circular blue sci-fi earth container.
- Verified country point click switches selected country and right panel context.
- Verified game marker click switches selected game and right panel detail.
- Verified hover tooltip appears for game markers.

### Next Step

Add more countries and representative games so the globe has denser visible coverage, then tune marker collision behavior for larger data sets.

## 2026-06-04 - Chinese-First UI Copy

### Goal

Adjust Game Earth to use Chinese as the primary interface language while keeping English as supporting text for proper nouns such as game titles, studios, publishers, platforms, and country names.

### Files Changed

- `src/components/GameEarthApp.tsx`: localized the product title, subtitle, and stat cards.
- `src/components/globe/GameGlobe.tsx`: localized map panel labels and selected state copy.
- `src/components/globe/CountryLayer.tsx`: changed globe country labels to Chinese-first country names.
- `src/components/globe/GameMarkers.tsx`: changed marker title display to prefer Chinese game titles.
- `src/components/globe/GameTooltip.tsx`: localized tooltip fields and genre display.
- `src/components/panels/CountryPanel.tsx`: localized country list heading, stats labels, count labels, region labels, and top genre display.
- `src/components/panels/CountryDetailPanel.tsx`: localized country detail labels, empty states, game list title display, and year-range copy.
- `src/components/panels/GameDetailCard.tsx`: localized game detail fields and changed title display to Chinese-first with English subtitle.
- `src/components/controls/YearSlider.tsx`: localized year filter label and range input accessibility label.
- `src/components/controls/CoverSizeSlider.tsx`: localized cover size label.
- `src/components/controls/ViewModeToggle.tsx`: localized view mode labels.
- `src/data/games.ts`: changed mock game descriptions to Chinese while preserving existing schema.
- `src/lib/localization.ts`: added Chinese-first display helpers for countries, regions, games, genres, and view modes.
- `docs/01_PRODUCT_SPEC.md`: added product language policy.
- `docs/02_FEATURE_MAP.md`: documented the localization helper and related feature responsibilities.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The main app UI now uses Chinese-first copy across the header, globe stats, country panels, game detail cards, controls, and tooltips. Game titles prefer `titleZh` with English titles as secondary text. Company names, platform names, and official English game titles remain available as supporting information.

### Documentation Updated

- `docs/01_PRODUCT_SPEC.md`
- `docs/02_FEATURE_MAP.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` in the in-app browser.
- Verified main header, globe panel, country panel, detail panel, tooltip, and bottom controls use Chinese-first UI copy.
- Verified game details prefer Chinese titles and keep English titles as secondary text.
- Verified mock game descriptions display in Chinese.

### Next Step

Review marker card typography for long Chinese titles and tune wrapping / sizing in the globe view.

## 2026-06-04 - Sci-Fi Visual Polish and Cover-Ready Markers

### Goal

Upgrade the Game Earth MVP from a plain blue sci-fi panel style into a more polished deep-space game planet presentation, and replace abbreviated game markers with full-title cover-ready marker cards.

### Files Changed

- `src/components/GameEarthApp.tsx`: upgraded the app shell, deep-space backdrop, header, and stat cards.
- `src/components/globe/GameGlobe.tsx`: strengthened the CSS globe with blue-purple glow, finer grid layers, arcs, and center highlight.
- `src/components/globe/GameMarkers.tsx`: replaced abbreviation markers with full-title cover cards, `coverImage` rendering, fallback cover placeholders, hover scaling, and stronger selected glow.
- `src/components/globe/GameTooltip.tsx`: widened and restyled the tooltip for full Chinese-first titles and glass styling.
- `src/components/panels/RightPanel.tsx`: switched the wrapper to the shared glass panel style.
- `src/components/panels/CountryPanel.tsx`: restyled country list cards and selected state.
- `src/components/panels/CountryDetailPanel.tsx`: restyled country detail, game list, empty states, and selected game row.
- `src/components/panels/GameDetailCard.tsx`: added cover-ready preview with image fallback and restyled detail fields.
- `src/components/controls/BottomControls.tsx`: restyled the bottom control wrapper.
- `src/app/globals.css`: added deep-space background, glass panel tokens, marker cover card styling, and cyan range accent.
- `docs/02_FEATURE_MAP.md`: updated marker, globe, and game detail responsibilities.
- `docs/03_ARCHITECTURE.md`: documented the CSS globe visual strategy and cover-ready marker rendering.
- `docs/04_DATA_SCHEMA.md`: documented `coverImage` rendering and fallback usage.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The page now uses a blue-purple deep-space visual system with glass panels, nebula glow, stronger planet lighting, fine globe grid layers, and cover-like marker cards. Game markers no longer use abbreviations; they display Chinese-first full titles, optional English subtitles, year, rating, and fallback gradient cover art until real local cover assets are added.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DATA_SCHEMA.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` with Playwright using the system Chrome executable after bundled Chromium download was blocked by a local certificate-chain error.
- Verified deep-space visual shell, circular globe, full Chinese marker titles, no abbreviation markers, hover tooltip, marker click detail selection, cover-size control, and mobile 390px viewport without horizontal overflow.

### Next Step

Add real local cover images under `public/covers/` when assets are available, then tune marker clustering for denser mock data.

## 2026-06-05 - Mock Data Expansion and Cover Asset Directory

### Goal

Expand local mock data so the globe has richer country and game coverage, and prepare a standardized local cover asset directory for future real cover images.

### Files Changed

- `src/data/countries.ts`: expanded country data from 3 to 10 countries / regions.
- `src/data/games.ts`: expanded mock game data from 6 to 50 representative games with complete fields and normalized cover paths.
- `src/types/game.ts`: made `titleZh` and `publisher` required fields for mock game records.
- `src/lib/localization.ts`: added Chinese labels for new genres and regions.
- `src/lib/geo.ts`: lightly increased clustered marker offsets for countries with more games.
- `public/covers/README.md`: documented future local cover image placement and naming rules.
- `docs/00_PROJECT_INDEX.md`: documented `public/covers/` as the future cover asset location.
- `docs/02_FEATURE_MAP.md`: updated game data, country data, marker, and cover asset directory responsibilities.
- `docs/04_DATA_SCHEMA.md`: updated current country list, game count, per-country coverage, required game fields, and cover path rule.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The MVP now includes 10 countries / regions and 50 representative games. Every game uses `coverImage: "/covers/{game-id}.jpg"` and still falls back to the existing gradient cover placeholder when the image file is missing. Genre and region labels remain Chinese-first.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/04_DATA_SCHEMA.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed local data consistency check for country count, game count, per-country counts, country code coverage, and cover path format.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` with Playwright using the system Chrome executable.
- Verified 10 countries, 50 game markers, expanded right-side country list, China country selection, Black Myth: Wukong marker selection, and missing-cover gradient fallback.

### Next Step

Add curated local `.jpg` cover assets under `public/covers/` when licensing and source files are ready.

## 2026-06-05 - Real 3D Globe Implementation

### Goal

Replace the CSS fake globe with a real interactive 3D globe that supports drag rotation, zoom, country borders, country selection, and game markers.

### Files Changed

- `package.json`: added `react-globe.gl` and `three` runtime dependencies.
- `package-lock.json`: recorded `react-globe.gl`, `three`, `@types/three`, and transitive dependency versions.
- `public/data/countries.geojson`: added local GeoJSON country border data from `https://github.com/datasets/geo-countries`.
- `src/components/globe/GameGlobe.tsx`: replaced the CSS globe with a client-only dynamically imported `react-globe.gl` scene, orbit controls, atmosphere, graticules, country polygons, labels, and HTML marker layer.
- `src/components/globe/CountryLayer.tsx`: changed from 2D country point rendering to globe polygon / label prop generation for country border hover and click.
- `src/components/globe/GameMarkers.tsx`: changed from 2D absolute React marker rendering to globe HTML marker data and DOM element generation.
- `src/components/globe/GameTooltip.tsx`: added escaped HTML tooltip markup for globe HTML markers while keeping the React tooltip component.
- `src/lib/geo.ts`: added GeoJSON feature types, Alpha-2 / name fallback country mapping, and globe coordinate clustering helpers.
- `src/app/globals.css`: added real globe stage styling, clickable globe marker styling, and country / game tooltip styling.
- `docs/00_PROJECT_INDEX.md`: documented `public/data/countries.geojson`.
- `docs/02_FEATURE_MAP.md`: updated real 3D globe, country layer, marker, and geo helper responsibilities.
- `docs/03_ARCHITECTURE.md`: documented `react-globe.gl` + Three.js rendering and local GeoJSON strategy.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The central exploration surface now renders a real WebGL globe with drag rotation and zoom. Country borders come from local GeoJSON polygons. The 10 mock countries are clickable through highlighted polygons and globe labels. Games are positioned from country latitude / longitude with small globe offsets; selected-country games become cover-like cards and other countries remain weak dots to reduce occlusion.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Started the app with `npm run dev`.
- Checked `http://localhost:3000` with Playwright using system Chrome.
- Verified the page renders one WebGL canvas, 50 globe game markers, 8 default Japan cover markers, and 42 weak markers.
- Verified clicking the visible Black Myth: Wukong marker switches the selected country to China and shows the matching game detail.
- Verified drag interaction does not crash the page. Automated polygon click targeting was not stable enough for final signoff, so country polygon / label click should be manually rechecked in browser.
- Observed expected 404 requests for missing local cover images under `public/covers/`; the UI keeps gradient fallback placeholders.

### Next Step

Manually tune country polygon hit areas and marker visibility after adding real cover assets, then add a small country label visual QA pass for desktop and mobile.

## 2026-06-05 - Real 3D Globe Performance Tuning

### Goal

Reduce Real 3D Globe first-screen and interaction cost, disable automatic globe rotation, and prevent missing mock cover images from creating repeated 404 requests.

### Files Changed

- `public/data/mock-countries.geojson`: added simplified MVP runtime GeoJSON with only the current 10 mock countries.
- `src/components/globe/GameGlobe.tsx`: loads the simplified GeoJSON, disables auto-rotate, disables damping, disables atmosphere / graticules, lowers marker altitude, and removes HTML marker transitions.
- `src/components/globe/CountryLayer.tsx`: lowers polygon / label altitude, opacity, curvature pressure, and transition cost.
- `src/components/globe/GameMarkers.tsx`: defaults globe cover markers to fallback art without requesting missing `coverImage` paths and limits heavy tooltip markup to cover / active markers.
- `src/components/panels/GameDetailCard.tsx`: keeps the mock-stage cover preview as a gradient fallback without requesting missing local cover files.
- `docs/00_PROJECT_INDEX.md`: documents both the simplified runtime GeoJSON and full source GeoJSON.
- `docs/02_FEATURE_MAP.md`: updates Real 3D Globe, marker, and country layer responsibilities for the performance strategy.
- `docs/03_ARCHITECTURE.md`: adds Real 3D Globe performance strategy.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The globe now uses a 473 KB simplified GeoJSON instead of loading the 14.6 MB full world file at runtime. Auto-rotation is explicitly disabled so the globe only moves through user drag / zoom. Rendering load is reduced by removing graticules / atmosphere, lowering polygon styling cost, removing transition animation on globe layers, limiting cover-card markers in country mode, and avoiding missing cover image network requests during marker / detail rendering.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck` after Next regenerated `.next` types.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` with Playwright using system Chrome.
- Verified the canvas grows to the larger globe stage without abnormal page height.
- Verified auto-rotation stays disabled by comparing marker positions while idle.
- Verified drag / zoom temporarily reduce marker DOM to the selected marker and restore all 50 markers after interaction.
- Verified country selection for China, United States, Japan, and France updates the right panel and keeps one selected cover marker.
- Verified `全球视角` and `聚焦当前国家` buttons are present and callable.

### Next Step

Measure real browser frame rate on lower-end machines, then tune polygon precision further if manual drag still feels heavy.

## 2026-06-06 - Country Detail Panel and Game Summary Dock

### Goal

Refactor the right-side country experience so the unselected state shows compact country rows, selected countries show a larger vertical detail panel, and game selection opens a small closable summary card.

### Files Changed

- `src/components/panels/RightPanel.tsx`: added the right-panel shell class while keeping mode switching between overview and selected-country detail.
- `src/components/panels/CountryDetailPanel.tsx`: added selected-country stats, current-year game card flow, return-to-overview control, and sticky bottom selected-game dock.
- `src/components/panels/GameDetailCard.tsx`: changed the card into a compact closable HUD-style game summary.
- `src/app/globals.css`: added black / cold-cyan right-panel, country detail, vertical game card, and sticky game detail dock styles.
- `docs/02_FEATURE_MAP.md`: updated right panel, country panel, country detail, and game detail responsibilities.
- `docs/03_ARCHITECTURE.md`: updated right-panel state flow and selected-game dock placement.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The right panel now shows searchable compact country rows when no country is selected. Selecting a country switches the panel to a vertical country detail mode with Chinese-first country metadata, current-filter statistics, year range, and a single-column game card flow. Selecting a game from the panel or a globe marker updates shared `selectedGameId` state and opens a closable sticky game summary dock.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Restarted the app with `npm run dev` at `http://localhost:3000`.
- Checked the page in the in-app browser and a standalone Playwright run with system Chrome.
- Verified country overview rows, country search, country detail switch, country statistics, game card flow, game summary open / close, return-to-overview, no horizontal overflow, and no page runtime errors.
- Verified a clickable 3D globe game marker opens the right-side game summary and synchronizes selected marker / card state. Dense selected-country markers can overlap visually, so marker spacing remains a future polish item.

### Next Step

Tune selected-country globe marker spacing / z-order so dense countries like China are easier to click directly on the 3D globe.

## 2026-06-05 - Globe Zoom and Focus Tuning

### Goal

Make the Real 3D Globe feel larger and more region-focused, allow deeper zoom into Europe / East Asia / North America, and reduce drag cost by hiding non-essential markers during interaction.

### Files Changed

- `src/components/globe/GameGlobe.tsx`: enlarged the globe stage, increased canvas height bounds, uses closer country focus views, allows deeper zoom, adds `全球视角` and `聚焦当前国家` buttons, and temporarily shows only the selected marker during drag / zoom.
- `src/components/globe/CountryLayer.tsx`: makes selected and hovered country borders / labels clearer for zoomed regional views.
- `src/lib/geo.ts`: added reusable global and per-country camera point-of-view helpers.
- `src/app/globals.css`: added globe view button styling and adjusted the larger globe stage visual treatment.
- `docs/02_FEATURE_MAP.md`: documented globe focus controls, deeper zoom, marker interaction throttling, and geo camera helpers.
- `docs/03_ARCHITECTURE.md`: documented globe camera strategy, deeper zoom, view controls, and drag-time marker reduction.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

Country selection now flies to a closer regional point of view instead of a distant global camera. European mock countries use lower altitude focus values so France / Poland / Sweden / Finland / United Kingdom are easier to inspect together. The globe stage is larger, zoom limits allow closer inspection, and user interaction temporarily reduces marker rendering pressure.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Verified `http://localhost:3000` in browser with the real 3D globe as the default mode.
- Verified the globe stays idle without auto-rotation, while manual drag changes the globe view.
- Verified the stage / canvas height stays bounded around the intended globe viewport instead of being stretched by the right panel.
- Verified 10 country markers are present, country labels do not include `??`, visible labels use plain bilingual names such as `日本 Japan`, and the default `react-globe.gl` English nav hint is hidden.
- Verified country marker selection updates `selectedCountryCode` and the right panel, and game marker selection updates the selected game detail.
- Verified no console errors or failed cover-image requests during the browser check.

### Next Step

Validate country focus behavior manually across China, Japan, France, and the United States, then tune per-country altitude values if any region feels too close or too far.

## 2026-06-05 - Black White 3D Dot Matrix Globe

### Goal

Keep the real 3D globe as the main experience and redesign the visual system toward a black / white sci-fi dot-matrix earth with clearer country hover, less purple, smoother rotation / zoom, and lighter game markers.

### Files Changed

- `src/components/GameEarthApp.tsx`: changed the default globe mode back to real 3D and adjusted the root space backdrop toward black / white cold light.
- `src/components/globe/GameGlobe.tsx`: adds country dot-matrix data, combines country HTML labels with current-country game markers, keeps country labels visible while reducing game markers during drag / zoom, uses a near-black globe material, and tunes orbit controls with damping.
- `src/components/globe/CountryLayer.tsx`: removes the canvas label layer, adds country point-cloud props, uses white / gray / cold-cyan colors, and limits hover / selected effects to the matching country.
- `src/components/globe/GameMarkers.tsx`: supports mixed HTML markers for country labels and games, uses plain text country labels, caps game cover cards, and keeps non-current-country game markers out of the 3D HTML layer.
- `src/lib/geo.ts`: adds controlled polygon-based country dot-matrix sampling for the 10 mock countries.
- `src/app/globals.css`: changes the main visual system from blue-purple to near-black, white, gray, and cold-cyan; adds country label styling; hides the default `react-globe.gl` English nav hint.
- `docs/02_FEATURE_MAP.md`: documents the real 3D default mode, dot-matrix country layer, mixed HTML markers, and geo dot sampling helper.
- `docs/03_ARCHITECTURE.md`: updates the rendering strategy and performance notes for the black / white 3D dot-matrix globe.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The default page now opens into the real WebGL 3D globe rather than the 2.5D fallback. Country polygons remain for borders and clicks, while a controlled point cloud sampled from the 10 mock country polygons creates the dot-matrix land / country pattern. Country names are rendered as HTML text (`日本 Japan`, `法国 France`, etc.) to avoid canvas font fallback artifacts. Hover and selected states brighten only the relevant country border and dots.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Pending final verification in this task: `npm run typecheck`, `npm run lint`, `npm run build`, and browser check at `http://localhost:3000`.

### Next Step

If the dot pattern needs to match full landmasses instead of just the 10 mock countries, add a separate low-resolution land point dataset rather than restoring the full 14MB GeoJSON at startup.

## 2026-06-05 - Default 2.5D Globe Mode

### Goal

Keep the existing Real 3D Globe as an experimental mode, add a smoother default 2.5D planet map mode, improve country label / hover behavior, and show selected-country games as cover-style markers.

### Files Changed

- `src/components/GameEarthApp.tsx`: added `globeMode` state, defaulted the app to 2.5D mode, and switches between `GameGlobe2D` and the existing 3D `GameGlobe` without resetting right-panel state.
- `src/components/globe/GameGlobe2D.tsx`: added the default SVG 2.5D planet map, local mock GeoJSON country paths, country focus viewBox behavior, global / focus controls, cover-style selected-country markers, lightweight other-country dots, and marker tooltip support.
- `src/components/globe/GameGlobe.tsx`: renamed the real globe surface as 3D experimental mode, added the same mode switch control, and displays `react-globe.gl 2.38.0`.
- `src/components/globe/CountryLayer.tsx`: filters 3D polygons to supported mock countries and avoids unsupported / blank hover highlights.
- `src/lib/geo.ts`: added SVG projection, GeoJSON path conversion, 2.5D global viewBox, and per-country 2.5D focus viewBox helpers.
- `src/app/globals.css`: added 2.5D planet map, scanline, grid, country outline, mode toggle, cover marker, dot marker, and tooltip styling.
- `docs/00_PROJECT_INDEX.md`: documented the new `GameGlobe2D` source entry.
- `docs/02_FEATURE_MAP.md`: mapped the new 2.5D globe mode and updated related globe, country layer, and geo helper responsibilities.
- `docs/03_ARCHITECTURE.md`: documented the dual-mode rendering architecture and default 2.5D rendering strategy.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The app now opens in `2.5D 星球地图` by default. The 2.5D mode uses `public/data/mock-countries.geojson` for the current 10 mock country outlines, renders them as SVG paths, and changes the SVG `viewBox` to focus the selected country. Selected-country games render as full-title blue-purple cover placeholders with year and rating, while games from other countries remain lightweight glowing dots. The existing 3D globe is still available through `3D 实验模式`.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Verified the production page with system Chrome at `http://127.0.0.1:3001` because an existing dev server already occupied `http://localhost:3000`.
- Verified default 2.5D mode, 10 country outlines, no `??` country label fallback, 8 Japan cover markers, 42 weak other-country dots, global viewBox reset, France country focus, `dishonored` marker selection, right-panel game detail update, and 3D experimental mode with one WebGL canvas and `react-globe.gl 2.38.0`.

### Next Step

Run a manual low-end-machine drag / hover pass on the 3D experimental mode and tune 2.5D marker collision for Europe if more mock games are added.

## 2026-06-06 - 3D Globe Base Layer Performance Refactor

### Goal

Make the real 3D globe base layer complete and smoother by showing full world country outlines, fixing incorrect large-area hover highlights, disabling automatic rotation, and reducing game marker cost.

### Files Changed

- `public/data/world-countries-lite.geojson`: added lightweight runtime world country / region outlines generated from the full source GeoJSON.
- `src/components/globe/GameGlobe.tsx`: loads the lightweight world outline file, caps renderer pixel ratio, disables antialiasing, keeps auto-rotate off, supports non-mock country polygon highlight, and limits 3D game markers.
- `src/components/globe/CountryLayer.tsx`: renders all world polygons, uses per-feature hover / selected keys, clears hover on ocean / blank areas, and keeps mock country clicks wired to the right panel.
- `src/components/globe/GameMarkers.tsx`: added a switch to disable cover-card marker rendering for the 3D globe and use lightweight dots instead.
- `src/lib/geo.ts`: added GeoJSON country feature key and name helpers for Alpha-2 / Alpha-3 / name fallback behavior.
- `docs/00_PROJECT_INDEX.md`: documented the new lightweight world outline asset.
- `docs/02_FEATURE_MAP.md`: updated 3D globe, country layer, game marker, and geo helper responsibilities.
- `docs/03_ARCHITECTURE.md`: documented the lightweight world data source, renderer cap, hover behavior, and temporary game marker reduction.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The 3D globe now uses `public/data/world-countries-lite.geojson` instead of only the 10 mock-country runtime polygons. All world country outlines render on the globe, while the 10 mock countries still have labels / dot-matrix emphasis and can update the right panel. Hover state is keyed to actual country polygons and cleared when no polygon is hovered. Game markers are temporarily reduced to at most three lightweight selected-country dots, with only the selected dot kept during drag / zoom.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked `http://localhost:3000` with Playwright using system Chrome.
- Verified the 3D globe is the active mode, renders one WebGL canvas, shows 236 lightweight world outline features, keeps 10 mock country HTML labels, and reduces 3D game markers to 3 lightweight dots.
- Verified idle label positions do not change, so automatic rotation is off.
- Verified manual drag changes label positions and wheel zoom keeps the reduced marker layer stable.
- Verified blank / ocean-area hover leaves no country label in hovered state.
- Verified clicking the China mock country label updates the right panel to `中国 China` and shows China game detail content.
- Verified a fresh page load has no console errors and no 404 responses.

### Next Step

After confirming the base globe is smooth on real hardware, restore richer game marker / cover behavior in a separate marker-focused performance pass.

## 2026-06-06 - 3D Globe Performance and Interaction Architecture Refactor

### Goal

Improve the real 3D globe toward a smoother 60fps-like interaction baseline, remove default country-name clutter, add representative default game markers, and refactor the right panel into a searchable country overview plus selected-country detail shell.

### Files Changed

- `src/components/GameEarthApp.tsx`: defaults to no selected country, clears selected game on country selection, and adds a clear-country flow for returning to overview.
- `src/components/globe/GameGlobe.tsx`: hides country labels by default, shows representative markers before selection, shows selected-country games after selection, downgrades cover markers to lightweight dots during drag / zoom, restores after about 200ms, and darkens the globe material.
- `src/components/globe/CountryLayer.tsx`: precomputes GeoJSON feature keys for lighter polygon style functions and reduces polygon fill / side opacity for a clearer black / white globe.
- `src/components/globe/GameMarkers.tsx`: adds marker style support so markers can switch between full-title cover cards and lightweight dots without using title abbreviations.
- `src/components/panels/RightPanel.tsx`: switches between country overview and selected-country detail instead of always rendering both.
- `src/components/panels/CountryPanel.tsx`: adds a compact searchable country overview with memoized stats.
- `src/components/panels/CountryDetailPanel.tsx`: adds a return-to-overview control and keeps a vertical detail shell for the later cover-wall / bottom-description phase.
- `src/app/globals.css`: reduces foggy gray / white overlays, strengthens dark HUD contrast, adds compact country overview and detail-shell styling.
- `src/app/layout.tsx`: declares a local SVG favicon to avoid browser favicon 404 noise.
- `public/favicon.svg`: adds a small local Game Earth favicon.
- `docs/00_PROJECT_INDEX.md`: documents the favicon asset.
- `docs/02_FEATURE_MAP.md`: updates root layout, main shell, 3D globe, marker, right panel, country overview, and country detail responsibilities.
- `docs/03_ARCHITECTURE.md`: updates 3D marker visibility, drag-time downgrade, right-panel flow, and default 3D rendering strategy.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The app now opens with no selected country. The 3D globe shows the full world outline, no default country-name labels, and one representative cover marker per mock country. During drag / zoom, all country labels are hidden and cover markers downgrade to lightweight dots, then recover shortly after interaction ends. Selecting a country highlights it, shows only that country's label, and displays all current-year games for that country on the globe. The right panel now starts as a compact searchable country overview; selecting a country switches it to the selected-country detail shell.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Checked production preview at `http://localhost:3002` with Playwright using system Chrome.
- Verified default state has 0 country HTML labels, 10 representative cover markers, country overview visible, selected-country detail hidden, and 236 world outline features.
- Verified drag state has 0 country labels, 0 cover markers, and 10 lightweight dot markers; after interaction recovery, the 10 cover markers return.
- Verified search for `china` filters to one country row and selecting it focuses China.
- Verified selected China state shows one country label, five China cover markers, selected-country detail, and China game content.
- Verified no browser console errors and no 404 responses in production preview.

### Next Step

Implement the second-stage selected-country experience: a larger vertical country detail panel, a proper cover wall on the globe / side panel, and a bottom game-summary popover opened from game marker clicks.

## 2026-06-06 - 3D Globe Stability QA and Runtime Fix

### Goal

Recheck the latest real 3D globe performance / interaction refactor after the page was reopened successfully, confirm runtime stability, and fix obvious issues introduced by the recent UI changes.

### Files Changed

- `src/components/GameEarthApp.tsx`: allows vertical page scrolling while keeping horizontal overflow hidden.
- `src/components/panels/RightPanel.tsx`: adds a viewport-bounded vertical scroll area for long country detail content.
- `docs/02_FEATURE_MAP.md`: documents the right panel scroll responsibility.
- `docs/03_ARCHITECTURE.md`: documents bounded right-panel scrolling in the MVP layout.
- `docs/05_TASK_LOG.md`: appended this QA / fix record.

### Implementation Summary

The local page was checked at `http://localhost:3000` with system Chrome through Playwright. The 3D globe renders, stays idle without automatic rotation, responds to drag and wheel input, keeps blank-area hover from selecting a country, supports country search and selected-country detail switching, and recovers marker layers after interaction. The only visible stability issue found was that selected-country right-panel content could be clipped by the page shell on desktop viewports; the layout now permits vertical page scrolling and bounds the right panel content.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Confirmed `http://localhost:3000` returns `200 OK`.
- Checked the page with Playwright using system Chrome.
- Verified one WebGL canvas, 236 world outline features, 10 overview country rows, no `??` country names, and no console errors, React warnings, failed requests, or 4xx responses.
- Verified idle canvas does not change after waiting, while drag changes the canvas.
- Verified search for `Japan` filters to one row and selecting it opens `日本 Japan` detail with 8 game markers.
- Verified clicking a globe game marker switches the right panel into selected-country game detail.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.

### Next Step

Keep the current 3D architecture stable; the next small QA pass should focus on manual low-end hardware drag feel before adding larger selected-country cover-wall features.

## 2026-06-06 - RAWG Static Data Pipeline

### Goal

Add a local RAWG data generation pipeline that expands game records and cover URLs without exposing the RAWG API key or making browser runtime API requests.

### Files Changed

- `src/data/games.ts`: changed to a stable frontend export that reads generated local game data.
- `src/data/games.generated.ts`: added generated data module placeholder, overwritten by `npm run data:rawg`.
- `src/data/games.mock.ts`: preserved the original stable mock dataset.
- `scripts/fetch-rawg-games.mjs`: added local RAWG fetch and generation script.
- `scripts/rawg-seeds.mjs`: added manually maintained country-to-game seed list.
- `src/components/GameEarthApp.tsx`: added small RAWG attribution / runtime behavior note.
- `package.json`: added `data:rawg` script.
- `README.md`: documented RAWG key setup, generation command, and attribution.
- `docs/00_PROJECT_INDEX.md`: added scripts and generated data entrypoints.
- `docs/02_FEATURE_MAP.md`: added RAWG data generation feature mapping.
- `docs/03_ARCHITECTURE.md`: documented local generation architecture.
- `docs/04_DATA_SCHEMA.md`: documented seed fields and RAWG-to-Game mapping.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The frontend continues to import games from `src/data/games.ts`. RAWG access is isolated to `scripts/fetch-rawg-games.mjs`, which reads `RAWG_API_KEY` from `.env.local` or the shell environment, fetches seeded RAWG records, maps them to the existing `Game` type, and writes `src/data/games.generated.ts`. The checked-in generated file falls back to the original mock dataset so the app stays runnable before API key setup.

### Documentation Updated

- `README.md`
- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DATA_SCHEMA.md`
- `docs/05_TASK_LOG.md`

### Verification

- Verified `npm run data:rawg` without `.env.local` exits with a clear `RAWG_API_KEY` setup error and does not overwrite generated data.
- Verified the seed list contains 85 entries and all country codes match the current country list.
- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Verified `RAWG_API_KEY` and `api.rawg.io` do not appear in `src/` or `.next/static`.
- Existing Next dev server at `http://localhost:3000` did not respond before timeout, so no user-owned process was stopped.
- Started a temporary production preview at `http://localhost:3002` and verified the page with system Chrome through Playwright.
- Verified title, `50 / 10 / 50` overview stats, country overview, RAWG attribution, Japan search / selection, Japan game detail content, no console errors, no failed requests, and no visible `RAWG_API_KEY`.

### Next Step

Run the RAWG generation command with a real `RAWG_API_KEY`, review generated country coverage and image quality, then expand the seed list conservatively.

## 2026-06-06 - GitHub README Publishing Preparation

### Goal

Prepare Game Earth for publishing to the GitHub repository `https://github.com/ChestnutleeEd/ludic-atlas.git` with a complete bilingual README and a project preview image.

### Files Changed

- `README.md`: rewritten as a Chinese / English GitHub README with preview, overview, features, tech stack, project structure, setup, RAWG data pipeline, attribution, scripts, status, roadmap, repository, and license sections.
- `docs/assets/preview.png`: added homepage preview image captured from `http://localhost:3000`.
- `docs/00_PROJECT_INDEX.md`: documented the README preview asset and expanded ignored reference-material notes.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The README now presents the project as a public bilingual GitHub artifact and references `docs/assets/preview.png`. The preview image was generated from the running local homepage using Playwright with the system Chrome executable. Git ignore rules were checked for dependencies, build output, environment files, screenshots, transcripts, and video references.

### Documentation Updated

- `README.md`
- `docs/00_PROJECT_INDEX.md`
- `docs/05_TASK_LOG.md`

### Verification

- Confirmed `http://localhost:3000` returned `200 OK`.
- Captured and visually checked `docs/assets/preview.png`.
- Confirmed `.gitignore` covers `node_modules/`, `.next/`, `out/`, `dist/`, `.env`, `.env.*`, `.env.local`, `screenshots/`, `transcript_raw.txt`, and configured video extensions.
- Searched for `RAWG_API_KEY` and potential API key assignment patterns without printing secret values.

### Next Step

Run typecheck, lint, and build, then commit and push the safe tracked project scope to GitHub.

## 2026-06-06 - RAWG Data Script Proxy Support

### Goal

Fix `npm run data:rawg` network failures caused by Node fetch not automatically using local proxy environment variables, and improve RAWG script error diagnostics.

### Files Changed

- `scripts/fetch-rawg-games.mjs`: added `undici` `ProxyAgent` / `setGlobalDispatcher` support for `HTTPS_PROXY`, `HTTP_PROXY`, and `ALL_PROXY`; added structured error output with redacted RAWG API key URLs.
- `package.json`: added `undici` as a runtime dependency for the local RAWG data script.
- `package-lock.json`: recorded the installed `undici` dependency.
- `README.md`: documented proxy environment variables before running `npm run data:rawg`.
- `docs/03_ARCHITECTURE.md`: documented proxy-aware RAWG script transport and structured error output.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

The RAWG generation script now reads proxy configuration from the shell environment and installs a global undici dispatcher before making any RAWG request. Network and HTTP failures now print error name, error message, cause message, HTTP status, response body preview, and a redacted request URL when available.

### Documentation Updated

- `README.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Ran `npm run data:rawg` with a shell-provided fake `RAWG_API_KEY` and `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` set to `http://127.0.0.1:7890`, so `.env.local` was not read.
- Verified the script reports the selected proxy variable, structured error fields, a nested cause message, no HTTP status when no response is received, no response body when unavailable, and a request URL with the RAWG key redacted.
- Full RAWG data generation with a real key was not run because this task must not read `.env.local` or expose the API key.

### Next Step

Run `HTTPS_PROXY=http://127.0.0.1:7890 HTTP_PROXY=http://127.0.0.1:7890 ALL_PROXY=http://127.0.0.1:7890 npm run data:rawg` locally with a valid RAWG API key configured in the shell or `.env.local`.

## 2026-06-13 - 3D Earth Marker Covers and Performance

### Goal

Connect real game covers to Earth Explorer markers and detail cards, reduce heavy marker counts, and distribute same-country markers more naturally.

### Files Changed

- `src/lib/gameCover.ts`: added centralized cover field lookup and shared fallback path.
- `public/covers/fallback-game-cover.svg`: added the unified fallback cover image.
- `src/types/game.ts`: documented optional cover aliases accepted by runtime cover lookup.
- `src/lib/geo.ts`: added deterministic country-aware globe marker distribution.
- `src/components/globe/GameMarkers.tsx`: capped representative markers by country, sorted by rating, loaded real covers, and added image-error fallback.
- `src/components/globe/GameGlobe.tsx`: enabled marker cover loading and simplified visible marker derivation.
- `src/components/panels/CountryDetailPanel.tsx`: displayed real / fallback cover images in the selected-country cover wall.
- `src/components/panels/GameDetailCard.tsx`: displayed real / fallback cover images in the selected game detail card.
- `src/app/globals.css`: added object-fit cover image rules for Earth markers and right-panel cards.
- `docs/00_PROJECT_INDEX.md`: recorded the new cover helper and fallback asset.
- `docs/02_FEATURE_MAP.md`: updated 3D Earth, marker, country detail, and game detail mappings.
- `docs/03_ARCHITECTURE.md`: documented marker cap, fallback cover flow, and deterministic distribution.
- `docs/04_DATA_SCHEMA.md`: documented optional cover aliases and cover lookup order.

### Implementation Summary

Earth marker rendering now builds only representative marker data: one top-rated game per country in global view and up to 12 top-rated games for the selected country. Marker coordinates use a deterministic golden-angle distribution around each country center with country-specific spread profiles. Earth markers, country cover wall cards, and selected game detail cards use the same cover lookup and fall back to `public/covers/fallback-game-cover.svg` when a field is missing or image loading fails.

### Documentation Updated

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DATA_SCHEMA.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run typecheck`.
- Passed `npm run lint` with one pre-existing warning in `scripts/infer-game-countries-with-ollama.mjs`.
- Passed `npm run build`.
- Verified the existing local dev server at `http://localhost:3000` with Playwright and system Chrome.
- Confirmed global Earth view renders 15 representative cover markers for countries with games.
- Confirmed selecting the United States limits globe markers to 12 despite 170 matching games.
- Confirmed marker cover images and selected game detail cover images load with non-zero natural width and no failed requests.

### Next Step

Tune country spread profiles further after visual review on more screen sizes if a specific country still feels too dense.

## 2026-06-13 - 3D Earth Marker and Detail Layer Polish

### Goal

Clean up Earth game cover markers, make game detail a blocking top layer, and replace prism-like country points with smaller circular points.

### Files Changed

- `src/components/globe/GameMarkers.tsx`: removed title / year / metadata overlays from cover markers and kept only a compact rating badge.
- `src/components/globe/CountryLayer.tsx`: reduced point altitude / radius and increased point resolution so country samples read as small circular dots.
- `src/components/panels/RightPanel.tsx`: added the Earth-side game detail dialog layer, inert background content, Escape close, and backdrop click close.
- `src/components/panels/CountryDetailPanel.tsx`: removed the inline selected-game card from the country scroll layer.
- `src/app/globals.css`: added clean marker cover styling, right-panel modal/backdrop styling, refined game detail card styling, and non-interactive country labels so they do not block game marker clicks.
- `docs/02_FEATURE_MAP.md`: updated game marker and right-panel behavior notes.
- `docs/03_ARCHITECTURE.md`: documented clean cover markers and the right-side game detail layer.
- `docs/05_TASK_LOG.md`: appended this task record.

### Implementation Summary

Earth cover markers now show the cover image without large text overlays. Full game data stays available in hover tooltip and the right-side detail layer. The right panel now treats a selected game as a modal state: background country content is marked inert, pointer events are disabled, the panel stops background scrolling, and Escape closes the detail. Country dot-matrix samples use low-altitude small circular points instead of triangular prism-like points.

### Documentation Updated

- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/05_TASK_LOG.md`

### Verification

- Passed `npm run lint` with one pre-existing warning in `scripts/infer-game-countries-with-ollama.mjs`.
- Passed `npm run build`.
- Verified Earth view with Playwright and system Chrome at `http://localhost:3000`.
- Confirmed selected United States marker count stays at 12.
- Confirmed globe cover marker title overlay count is 0 and rating badge count is 12.
- Confirmed country labels no longer intercept game marker clicks.
- Confirmed opening a game detail sets background content to `inert`, disables pointer events, hides right-panel background scrolling, blocks background clicks, and Escape closes the detail layer.
- Captured `output/playwright/earth-detail-layer.png` for visual review.

### Next Step

Review the Earth view visually on mobile width and tune detail-layer height if needed.
