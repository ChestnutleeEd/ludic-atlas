# Deferred Atlas Map Plan

## Status and resumption identity

This document preserves the complete deferred 2D/2.5D Atlas Map plan removed from the active `redesign-earth-explorer` delivery scope on 2026-07-17. It is an implementation handoff, not a statement that Atlas currently ships.

- Recommended future Git branch: `feat/add-atlas-map-renderer`
- Recommended future OpenSpec Change: `add-atlas-map-renderer`
- Current production Earth renderer: 3D Orbital Globe only
- Current user-facing projection switch: none
- Existing compatibility types/placeholders: retained but not a production Atlas
- Prohibited shortcut: do not expose the placeholder or mount Globe and Atlas concurrently

Before resuming, confirm the active 3D Globe change has passed human acceptance and completed its permitted sync/archive/commit/push/merge workflow. Start the future change from a clean, current `main`, verify backup pointers, then use this document as the source for explore/propose—not as authorization to apply directly.

## Product goal

Atlas Map is a second projection inside the existing Earth Explorer module: a premium, draggable and zoomable 2D/2.5D game-culture world atlas optimized for dense regional comparison, small-country access, and more spatially legible cover browsing than the orbital Globe. It must preserve the same archival observatory identity and use the same country, game, filter, detail, marker, geography, and navigation semantics.

Atlas is not a new route, a separate product state, a bright commodity web map, or an online basemap. It complements the immersive Globe; it does not replace it.

## Visual concept

- Flat or gently projected world geography presented as an archival observation plate.
- Charcoal and ink-green ground; warm-white labels; oxidized brass and aged-gold structure; oxblood selection; low-frequency desaturated cyan only for spatial feedback.
- Selected country may use shallow elevation/z-offset, restrained shadow, material contrast, or edge reinforcement.
- Country boundaries remain geographically real and readable without becoming a bright street-map treatment.
- Covers float above geography with bounded depth, hierarchy, collision handling, and truthful overflow.
- Dense regions such as Europe expose more useful covers as zoom increases.
- Tiny countries use clusters, fan-out, leader lines, or bounded local expansion.
- Shared header, panels, filters, focus states, motion language, and atmosphere assets match Orbital Globe.
- The map remains primary; SaaS dashboard cards, glass-heavy panels, neon borders, strong starfields, and decorative particles remain excluded.

## Recommended technical route

Use the existing Three.js dependency with one `WebGLRenderer` and an `OrthographicCamera` inside the active-only Earth projection boundary.

Recommended scene layers:

1. Batched Global/Region low- or medium-LOD country fills and outlines.
2. Optional restrained neighboring-country context.
3. Selected-country Country-LOD mesh with shallow z-offset/elevation and archival material emphasis.
4. Renderer-neutral marker anchors projected into screen space and rendered as bounded accessible DOM controls above the canvas.
5. Simplified country interaction meshes used for raycasting, separate from higher-detail visual geometry.
6. A parallel semantic country surface/list so canvas hit testing is never the only accessible entry.

Reasons to prefer this route:

- Reuses installed Three.js, renderer lifecycle knowledge, visual materials, geography repository, LOD artifacts, marker model, and performance instrumentation.
- Provides controlled 2.5D depth and selected-country treatment without a large map engine.
- Keeps projection-specific camera/scene code behind the same renderer contract.
- Avoids Mapbox, MapLibre, Cesium, online tiles, tokens, and unrelated map-engine state.

Rejected baselines:

- SVG: strong semantic accessibility and path authoring, but high-detail paths plus dense covers complicate the targeted 2.5D/material and performance envelope.
- Canvas 2D: efficient drawing, but requires parallel hit/accessibility surfaces and offers weaker material depth.
- `react-globe.gl` flat mode: no verified first-class planar projection contract suitable for this product.
- Large map engines/online basemaps: excessive dependency, state, network, styling, and product-scope cost.

## Projection adapter and antimeridian handling

Create a renderer-independent adapter:

```ts
interface AtlasProjection {
  project(lngLat: [number, number]): [number, number] | null;
  unproject(point: [number, number]): [number, number] | null;
  projectRing(ring: number[][]): ProjectedSegment[];
  fitBounds(bounds: GeoBounds, safeViewport: SafeViewport): AtlasViewState;
}
```

Start with a lightweight, directly tested pseudocylindrical or equirectangular projection using project-owned math. For each ring:

1. Choose a stable reference meridian from country/component metadata.
2. Normalize and unwrap adjacent longitudes relative to that meridian.
3. Detect segments whose canonical delta crosses ±180°.
4. Split or clip those segments at the antimeridian.
5. Project each local segment without a world-spanning chord.
6. Preserve stable country/component IDs and canonical geographic coordinates in the shared model.

Required fixtures include a date-line-crossing country, polygon holes, remote MultiPolygons, and world/region `fitBounds` across asymmetric safe viewports.

Dependency gate: do not install `d3-geo` by default. Consider it only as a direct small dependency if the lightweight adapter cannot reliably pass antimeridian clipping, projection correctness, or `fitExtent` fixtures. The future apply turn must first report failing fixtures, expected API/bundle impact, and why project-owned math is unsafe. Never import a transitive dependency as an undeclared API.

## Interaction contract

### Pan and zoom

- Pointer drag pans the orthographic view; wheel/pinch zooms around a stable cursor or viewport anchor.
- Set deterministic min/max zoom and world bounds with elastic or clamped overscroll that cannot lose the world indefinitely.
- Controls publish a settled view only on interaction end, projection switch, or renderer unmount—not every frame.
- Manual input cancels active programmatic navigation using the same latest-token semantics as Globe.

### Hover click and keyboard

- Raycast against simplified interaction meshes keyed by country code.
- Hover changes only short-lived renderer-local state.
- Click dispatches the existing authoritative Earth country action.
- Keyboard country controls use meaningful labels, current/selected state, visible focus, and the same action as pointer selection.
- Game markers are real DOM buttons or equivalent semantic controls with stable names and focus.
- Escape closes the topmost fan-out/detail/panel without destroying the underlying selection unless explicitly documented.

### Global region country and game focus

The Atlas controller consumes the same `SpatialNavigationIntent` target hierarchy:

```text
selected game -> selected country -> active region -> global
```

It maps the target to `fitBounds`/center/zoom inside `SafeViewport`, cancels older revisions, and never embeds Three.js camera or controls objects in shared state.

## Shared state contract

Business selection and filters remain unique in the Earth shell:

- `activeRegionId`
- `selectedCountryCode`
- `selectedGameId`
- `selectionRevision`
- year range
- rating/filter state
- cover size
- marker view mode

Renderer-specific view state remains separate:

```ts
interface GlobeViewState {
  lat: number;
  lng: number;
  altitude: number;
}

interface AtlasViewState {
  center: [lng: number, lat: number];
  zoom: number;
}
```

`AtlasViewState` is saved only at settled/user-end/switch/unmount boundaries. A newer business selection revision takes priority over an older saved view. Game Chronicle must not read or modify projection or renderer views.

## SpatialNavigationIntent reuse

Reuse the existing revisioned, renderer-neutral intent. Both controllers interpret the same semantic target, source, motion preference, and latest revision. Do not create Atlas-specific country/game state, a second reducer, or a global event bus.

Future projection switching must:

- preserve selection and every filter;
- save the active renderer's settled view;
- unmount it completely;
- mount only the selected renderer;
- restore the destination renderer view when its saved revision remains valid;
- otherwise interpret the latest navigation intent;
- never let both camera controllers compete.

## Active-only renderer lifecycle

The production contract is:

```tsx
return projectionMode === "globe"
  ? <OrbitalGlobe {...sharedProps} />
  : <AtlasMap {...sharedProps} />;
```

The inactive renderer owns no canvas, RAF, controls, listeners, textures, render targets, or live camera. Atlas unmount must:

- cancel RAF/tweens/navigation tokens;
- disconnect `ResizeObserver`;
- remove pointer/wheel/control/window listeners;
- remove overlay markers;
- dispose controls, owned geometry, material, texture, render target, scene, and renderer resources;
- prevent pending fetch/parse results from updating an unmounted selection;
- release references.

Repeated Globe ↔ Atlas, Earth ↔ Hub, and Earth ↔ Chronicle cycles must never accumulate canvases, controllers, listeners, or GPU work.

## Geography repository LOD and cache reuse

Reuse `src/lib/geographyRepository.ts`, `src/lib/geography.ts`, generated `public/data/earth-lod/`, and stable country/component metadata.

- Global LOD provides first paint.
- Region LOD loads for active regional context.
- Country LOD loads for selected-country detail.
- Lower LOD remains visible until higher detail is ready.
- Concurrent identical requests deduplicate.
- Failed promises leave the cache so retry is possible.
- Normalized data stays renderer-neutral.
- Atlas geometry cache keys include renderer/lod/country/style version and have an explicit capacity/byte boundary.
- Geometry eviction disposes GPU resources.
- Fast France → Poland navigation must not let a stale France result replace Poland.
- Resize and projection remount must not repeat network fetch/parse when cached data is compatible.

## Marker layout reuse

Reuse stable filtered-game ranking, normalized country components, deterministic candidate generation, dynamic budget, collision, hysteresis, motion freeze, overflow, and cover fallback. Atlas supplies projected screen points, zoom scale, visible country area, safe viewport, and performance tier.

- Large focused countries target about 10–18 covers when collision-free space permits.
- Medium/small countries target about 6–12.
- Tiny countries render 1–4 primary markers plus cluster/fan/leader-line/local expansion.
- Global and regional views retain lower per-country and total hard caps.
- Candidate count exceeds the final budget but is bounded.
- Only accepted markers request images.
- Equal data/filter/quantized-view inputs return equal marker identities, positions, and overflow.
- Camera movement freezes/hides/downgrades rich markers; settled recomputes once.

## Dense regions small countries and MultiPolygon strategy

- In dense Europe, additional covers become eligible as zoom and visible country area increase, then pass screen-space collision.
- Tiny countries expose one accessible aggregate anchor and a deterministic bounded expansion inside safe space.
- MultiPolygon countries allocate the main budget to the component selected by catalog-anchor containment, area, and proximity.
- Remote territories receive 0–2 or another explicitly small independent allocation and cannot enlarge mainland sampling bounds.
- Multi-island countries preserve major islands via component weighting rather than deleting all small components.
- Geometry anomalies fall back to a stable anchor/aggregate, never random placement.

## Performance risks and mitigations

- Second heavy renderer surface → active-only mounting and explicit disposal.
- High-detail planar geometry → Global/Region batching, Country-only high detail, cached geometry, separate simple hit meshes.
- DOM cover pressure → marker budgets, image request cap, settled-only layout, panel-owned deep list.
- Projection CPU cost → cache projected/normalized geometry by LOD/projection version; avoid React render loops.
- Pan/zoom React churn → refs during motion, settled snapshot only.
- Raycast cost → simplified interaction meshes, spatial pruning, pointer throttling/coalescing.
- Antimeridian bugs → fixture-driven adapter and gated `d3-geo` decision.
- Context leaks across switches → repeated lifecycle instrumentation and browser loops.
- Accessibility gaps in canvas → parallel semantic surface and DOM markers.

## Deferred capability requirements and acceptance scenarios

### Requirement: Deliver Atlas as a production Earth projection
Atlas SHALL replace the placeholder with a real 2D/2.5D world renderer using real country boundaries and shared Earth context.

#### Scenario: Open Atlas
- **WHEN** the user selects Atlas
- **THEN** the Globe unmounts and one operable Atlas renderer appears without clearing selection or filters

### Requirement: Support planar navigation
Atlas SHALL support pan, zoom, and global/region/country/game focus through its orthographic controller.

#### Scenario: Explore and refocus
- **WHEN** the user pans and zooms away and selects a country
- **THEN** Atlas fits the country into safe space and normal manual controls remain available

### Requirement: Support pointer and keyboard country access
Country hover, click, and keyboard activation SHALL resolve the same stable country identity and dispatch the same authoritative selection action.

#### Scenario: Select by two input methods
- **WHEN** a country is activated through raycast and semantic keyboard entry
- **THEN** both paths produce the same selection and panel content

### Requirement: Provide restrained 2.5D selection emphasis
The selected country SHALL gain non-neon depth/material/edge emphasis without obscuring neighbors or relying on color alone.

#### Scenario: Focus a country
- **WHEN** Country LOD is ready
- **THEN** the country is clearly selected and neighboring context remains readable

### Requirement: Reuse shared markers and details
Atlas SHALL use the existing filtered data, budgets, placement, collision, overflow, covers, and right detail panel.

#### Scenario: Explore a dense region
- **WHEN** the user zooms into dense geography
- **THEN** bounded additional markers become available and undisplayed games remain in the shared panel

### Requirement: Restore Atlas independently
Atlas SHALL save settled center/zoom without frame-frequency React state and restore it when still valid.

#### Scenario: Return to Atlas
- **WHEN** the user switches away and back without a newer selection
- **THEN** Atlas restores its prior view while business state remains unchanged

### Requirement: Handle the antimeridian
Atlas SHALL split, clip, or unwrap date-line geometry so visual paths and hit areas do not span the world incorrectly.

#### Scenario: Render a date-line fixture
- **WHEN** a country crosses ±180°
- **THEN** its visible segments and interaction area remain local and preserve identity

### Requirement: Maintain renderer exclusivity and cleanup
Only the selected heavy renderer SHALL remain mounted, and Atlas SHALL release all owned resources on switch/exit.

#### Scenario: Repeat projection switches
- **WHEN** Globe and Atlas are switched repeatedly
- **THEN** canvas count never exceeds one and no stale loop/listener/controller remains

### Requirement: Fail without corrupting Earth
Atlas initialization/projection failure SHALL preserve selection and filters, dispose partial resources, and provide a path to Globe or Hub.

#### Scenario: Renderer creation fails
- **WHEN** Atlas cannot initialize WebGL or geometry
- **THEN** Earth presents a bounded fallback and retains usable navigation away

### Requirement: Meet accessibility motion and viewport gates
Atlas SHALL support visible focus, meaningful states, reduced motion, Escape behavior, required desktop sizes, and 390×844 safety.

#### Scenario: Validate inclusive responsive use
- **WHEN** keyboard, reduced-motion, desktop, and mobile-safety checks run
- **THEN** Atlas remains operable, bounded, and escapable without severe overflow

## Original Phase 4 task checklist

1. Implement and unit-test the projection adapter for project/unproject, ring segmentation, antimeridian handling, and safe `fitBounds`.
2. Evaluate date-line and fit fixtures; report the `d3-geo` rationale and bundle impact before any dependency installation if the adapter fails.
3. Create one Three.js Atlas renderer with `OrthographicCamera`, bounded controls, and explicit disposal ownership.
4. Render cached Global/Region country fills and outlines with stable IDs and no online basemap.
5. Add pan/zoom/global/region/country/game fitting through an Atlas controller consuming shared intents.
6. Add country raycast hit testing and hover/selected state using simplified interaction geometry.
7. Add the semantic keyboard country surface using the same selection actions.
8. Add restrained selected-country 2.5D elevation/material/edge treatment.
9. Project shared marker candidates into Atlas and integrate budget, collision, motion freeze, tiny-country expansion, overflow, and image fallback.
10. Publish settled `AtlasViewState` without per-frame React state and restore it after projection/local-view round trips.
11. Add Atlas initialization/projection failure handling with partial-resource disposal and preserved business state.
12. Add unit/browser tests for antimeridian, pan/zoom, pointer/keyboard selection, safe focus, marker activation, restoration, and renderer exclusivity.
13. Add the accessible user-facing projection switch only after the real Atlas renderer and failure path pass targeted tests.
14. Run repeated Globe ↔ Atlas, Hub, and Chronicle lifecycle/performance validation before human acceptance.

## Preconditions before resuming

- `redesign-earth-explorer` has completed 3D Globe visual/performance/human acceptance and its approved integration workflow.
- `main` and `origin/main` are clean and aligned; backup pointers are recorded and unchanged.
- No active product change has overlapping Earth shell, projection, geography, marker, or panel modifications.
- Globe camera/marker/LOD/repository tests pass before Atlas code begins.
- Current `package.json` and lockfile are inspected; no map dependency is assumed.
- The future proposal explicitly states Atlas is now a formal delivery, not a placeholder.
- Dependency installation, if any, receives apply-stage justification and authorization.

## Files to inspect first

- `docs/00_PROJECT_INDEX.md`
- `docs/01_PRODUCT_SPEC.md`
- `docs/02_FEATURE_MAP.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DATA_SCHEMA.md`
- `src/components/GameEarthApp.tsx`
- `src/components/earth/EarthProjectionViewport.tsx`
- `src/components/earth/AtlasPlaceholder.tsx` or its current equivalent
- `src/types/earth.ts`
- `src/lib/earthViewState.ts`
- `src/lib/globeNavigation.ts`
- `src/lib/safeViewport.ts`
- `src/lib/geography.ts`
- `src/lib/geographyRepository.ts`
- `src/lib/markerLayout.ts`
- `src/components/globe/GameGlobe.tsx`
- `src/components/globe/GameMarkers.tsx`
- `src/components/panels/RightPanel.tsx`
- `src/components/controls/BottomControls.tsx`
- `public/data/earth-lod/`
- `tests/earth-view-state.test.ts`
- `tests/marker-geography-phase3.test.ts`
- `tests/e2e/earth-explorer.spec.ts`
- `tests/e2e/globe-stability.spec.ts`
- `tests/e2e/marker-lod.spec.ts`

## Already completed foundations to verify

- One authoritative Earth selection/filter model.
- `EarthProjectionMode`, `AtlasViewState`, `GlobeViewState`, and renderer-neutral `SpatialNavigationIntent` types.
- Active-only mount boundary and renderer-free placeholder.
- Latest-revision navigation semantics.
- Safe viewport measurement.
- Deterministic component-aware marker budget/collision/hysteresis/overflow.
- France mainland-first MultiPolygon handling and tiny/multi-island strategies.
- Global/Region/Country LOD artifacts and deterministic offline generator.
- Deduplicated geography loading, lower-LOD fallback, bounded normalized/geometry caches, and GPU disposal.
- Globe lifecycle instrumentation and local-view canvas assertions that can be extended to Atlas.

## Future validation matrix

The 3D-only `redesign-earth-explorer` change completed its Phase 6 validation and human visual acceptance on 2026-07-19. This does not activate Atlas: the future branch/change, prerequisites, renderer exclusivity, and validation matrix below remain unchanged and must begin through a separate OpenSpec workflow after the current change is formally integrated.

- Viewports: 1280×720, 1366×768, 1440×900, 1920×1080; 390×844 safety.
- Atlas pan/zoom, global/region/country/game focus, pointer hover/click, keyboard country/game access.
- Antimeridian, polygon holes, France, Poland, tiny country, Japan/Indonesia or another multi-island country.
- Cover size/year/rating/marker mode preservation and controlled image requests.
- Globe ↔ Atlas retains selection/filters and independently restores views.
- Only one renderer/canvas/controller/listener set across at least five projection cycles.
- Earth ↔ Hub and Earth ↔ Chronicle leave zero Earth canvas and return one active renderer.
- Atlas failure preserves state and returns to Globe/Hub.
- No console error, hydration warning, unmounted update, or new serious WebGL warning.
- Lint, typecheck, unit tests, build, targeted Atlas Playwright, full Earth Playwright, and explicit human visual acceptance.
