# 01_PRODUCT_SPEC.md

## Product Name

Ludic Atlas / 游戏星图

## One-Sentence Positioning

Ludic Atlas / 游戏星图 is a global game culture discovery product that lets users explore games through space and time: Earth Explorer focuses on country-based 3D earth exploration, while Game Chronicle focuses on timeline-based game archive browsing.

## Product Type

Ludic Atlas is primarily a game culture discovery and recommendation product.

It is not intended to be a complete game database in the first MVP. It should first work as an interactive, visual, and explorable product prototype.

## Reference Product Logic

The reference product is Movie Globe.

Earth Explorer should learn from its functional structure:

- global map / earth as the main exploration space
- country-based content organization
- cover cards distributed by geography
- right-side country list and detail panel
- hover preview
- click-to-view detail
- year filter
- cover size control

Ludic Atlas does not need to copy Movie Globe's exact visual style.

## Product Language Policy

Ludic Atlas should use Chinese as the primary interface language.

UI titles, field labels, buttons, panel headings, empty states, and explanatory copy should be written in Chinese first. English can remain as supporting information for proper nouns such as game titles, studio / company names, publisher names, platform names, and English country names.

## Current Earth Explorer Delivery Scope

The current `redesign-earth-explorer` delivery completes the existing 3D Orbital Globe only. “Archive Orbital Atlas / 档案式轨道地图” remains the visual brand concept, while the actual product surface in this change is a Globe-first archival observatory with no user-facing 2D/2.5D projection switch.

The Globe uses a charcoal, ink-green, oxblood, oxidized-brass, aged-gold, warm-white palette with desaturated cyan reserved for low-frequency spatial feedback. Geography remains visually primary; panels and controls avoid neon HUD dominance, glass-heavy dashboard styling, repeated equal-radius cards, and competing decorative effects. Optional original text-free atmosphere/material assets may enhance the composition only after human review and must retain CSS fallbacks.

The already implemented `EarthProjectionMode`, `AtlasViewState`, active-only mount contract, and inert Atlas placeholder remain as future-compatible internals. They do not make Atlas a current product capability, and the unfinished placeholder must not be reachable from normal product UI or create canvas, WebGL, animation, listener, or geography work.

The complete deferred Atlas product and implementation handoff is maintained in `docs/DEFERRED_ATLAS_MAP_PLAN.md`. Its recommended future branch is `feat/add-atlas-map-renderer`, and its recommended OpenSpec Change is `add-atlas-map-renderer`.

The 3D-only delivery has completed its Phase 6 functional, viewport, accessibility, failure, lifecycle, production-performance, and human visual acceptance gates. The measured evidence and environment limits are recorded in `docs/EARTH_EXPLORER_VALIDATION.md`; Atlas remains excluded from the accepted product surface.

Earth cover presentation now uses one canonical 48–112 px height with a 72 px default and 4 px step. The existing filter tray exposes a native slider, explicit decrease/increase buttons, and the current `px` value; the last valid value is restored from `ludic-atlas:earth-cover-size:v1`. During drag rotation, wheel zoom, automatic rotation, camera-tool movement, and programmatic country flight, the last accepted Marker layout remains visible and surface-anchored while only tooltip, shine, filtering, shadow, animation, pointer, and other nonessential decoration work is reduced. Retained Marker/button/image identities update in place and already loaded covers are not requested again. At 1440×900 and the 72 px default, France uses a collision-safe 10–18 direct-cover range and Poland 6–12; Belgium retains truthful tiny-country aggregation and Japan retains component-aware multi-island placement. The user accepted the final desktop and 390×844 presentation on 2026-07-19.

Display rules:

- Countries should prefer Chinese names and may show English names as secondary information, for example `日本 Japan`.
- Games should prefer `titleZh` when available and show the English title as a subtitle.
- Company names and platform names can remain in their official English form.
- Genre values may stay in raw mock data, but UI should map common genre labels to Chinese where practical.

## Target Users

### Primary Users

Users who are interested in games, game culture, and global game industry differences.

They may want to know:

- which countries have produced famous games
- what kinds of games are representative of each country
- how game styles differ across countries and regions
- what games to try if they are interested in a specific country's culture

### Secondary Users

- game industry learners
- students making game / digital humanities projects
- users interested in interactive data visualization
- portfolio reviewers evaluating product and frontend implementation ability

## Core User Scenarios

### Scenario 1: Explore games by country

A user clicks Japan, Poland, China, the United States, or South Korea and views representative games from that country.

### Scenario 2: Understand national game styles

A user checks the main genres, average rating, representative studios, and release years of games from a specific country.

### Scenario 3: Discover games visually

A user browses game covers on the globe and hovers over a cover to see the game name, rating, year, and genre.

### Scenario 4: Filter games by time

A user drags a year slider to explore games from different periods.

### Scenario 5: Browse the game chronology

A user opens Game Chronicle / 游戏编年馆 and immediately browses the generated global game list through a Contemporary Game Archive: a chronological year index, current-year editorial feature assembled from that year's real covers, progressively loaded annual collection, title search, genre filters, platform filters, and optional `馆藏评分优先` ordering. Opening a game uses a right-side desktop dossier drawer or full-screen mobile reading layer while preserving the current year context.

### Scenario 6: Choose an exploration mode

A user opens the site and first sees Ludic Atlas / 游戏星图 with two independent, fully clickable entrances: Earth Explorer / 地球探索 and Game Chronicle / 游戏编年馆. Earth Explorer is the larger visual lead, while Game Chronicle remains a complete parallel entrance. Choosing either entrance preserves the current local view-state behavior rather than navigating to a new route.

## Landing Hub Experience

The landing hub uses a restrained world-game-archive direction with retro game-magazine collage as a supporting material language. It avoids sci-fi blue dominance, neon glow, glass-heavy panels, and heavy continuous animation.

Desktop requirements:

- use one `100dvh` composition with the brand, collection context, and both entrances visible without vertical scrolling at 1366×768, 1440×900, and wider desktop viewports;
- allocate the entrance stage at approximately 58:42, with Earth Explorer as the larger visual entrance;
- integrate the live collection count and year range into the brand bar rather than a separate statistics strip;
- use two original, text-free entrance images with live DOM labels, responsive crops, image-failure fallback, and prioritized loading for the Earth lead image;
- keep all homepage layout, imagery, and motion styles isolated from Earth Explorer and Game Chronicle internal pages;
- provide restrained hover / focus feedback and a static-equivalent `prefers-reduced-motion` presentation.

On mobile, the brand and both complete entrances stack vertically and the document scrolls naturally without horizontal overflow.

## Country Mapping Rule

For the MVP, each game is mapped to the country or region of its main developer / studio.

Examples:

- Nintendo / FromSoftware / Capcom -> Japan
- CD Projekt Red -> Poland
- Rockstar Games / Valve / Naughty Dog -> United States
- Ubisoft Montreal -> Canada
- Supercell -> Finland
- miHoYo / Game Science / Tencent Games -> China

If a game involves multiple countries, MVP should use one primary country only.

## MVP Features

The first version should include:

1. 3D earth or interactive world map
2. country-based game distribution
3. game cover markers
4. right-side country list panel
5. country detail panel
6. game hover tooltip
7. game detail card
8. year filter
9. cover size control
10. local mock data
11. Ludic Atlas landing hub with an Earth-led 58:42 desktop composition, original responsive entrance imagery, integrated collection context, preserved local view switching, and naturally scrolling mobile stacking
12. Chronicle Reading Room for RAWG-generated global game records, with archive-owned selection, chronological year navigation, current-year feature, annual collection, and accessible dossier reading
13. Earth Explorer region mode with Global, Europe, East Asia, North America, Latin America, Middle East, South Asia, and Oceania camera presets
14. Retro-Futuristic deep-space observatory system for Earth Explorer, including a globe-dominant single-viewport workspace, on-demand country drawer and filter tray, Overview / regional-context Surface camera modes, progressive Global/Region/Country boundary LOD, interaction-time 60 FPS rendering targets, portrait-aware camera framing, controlled zoom, region and key-country presets, screen-area/zoom/cover/performance-aware marker budgets (normally 10–18 for large focused countries, 6–12 for medium/small countries, and 1–4 plus explicit overflow for tiny countries), deterministic mainland-priority placement, truthful aggregation, scroll-safe game details, and mobile three-state bottom-sheet behavior
15. Archive Orbital Atlas visual language applied to the 3D Globe, Earth-owned panels and controls, with optional original text-free atmosphere/material assets, keyboard and reduced-motion support, desktop acceptance, and mobile non-crash safety

RAWG batch data may also be previewed in a global right-panel gallery when no country is selected. This gallery is a validation surface for generated records and cover display, and does not replace the country-based exploration model.

Game Chronicle / 游戏编年馆 is the first dedicated global browsing surface for generated records whose `countryCode` is still `UNKNOWN`. Archive selection is independent from Earth Explorer, so every supplied game ID can open its own dossier without changing Earth country, region, selected game, or camera state. The desktop Reading Room keeps year navigation, current year, a real cover, search/filter access, annual collection, and detail actions in the first workspace; mobile uses a sticky horizontal year rail, vertical collection, and full-screen dossier. Search covers title, Chinese title, developer, and publisher; genre and platform remain OR within each category and AND across categories. Years always remain newest-to-oldest, while `馆藏评分优先` only reorders games inside annual collections or search results.

The archive retains warm paper, charcoal, oxblood, brass, and serif year/title cues while using contemporary sans-serif controls, hairlines, moderate radii, surface depth, and restrained 180–360ms motion. Each annual feature combines one shared atmosphere WebP with the year's three rating-priority real covers; the collection initially mounts eight optimized thumbnails and appends bounded batches as the reader scrolls. Reduced-motion users receive immediate state changes without translation, scale, or stagger.

## MVP Data Fields

Each game should include at least:

- id
- title
- countryCode
- countryName
- developer
- publisher
- releaseYear
- genres
- platforms
- rating
- coverImage
- description

Each country should include at least:

- code
- name
- nameZh
- latitude
- longitude
- region

## Out of Scope for First MVP

Do not implement these unless explicitly requested:

- login
- account system
- favorite / collection system
- payment
- comments
- real recommendation algorithm
- backend database
- production-level API integration
- complex AI recommendation
- multiplayer / social features
- production 2D/2.5D Atlas Map, OrthographicCamera renderer, planar pan/zoom/hit testing, public Globe/Atlas switch, and Atlas runtime restoration/lifecycle acceptance; see `docs/DEFERRED_ATLAS_MAP_PLAN.md`

## Success Criteria for MVP

The MVP is successful if:

1. users can open the app locally;
2. users can see a globe or map interface;
3. users can browse games by country;
4. users can click a country and view its games;
5. users can hover or click a game and view basic information;
6. users can filter games by year;
7. the project structure is clear enough for future iteration.
