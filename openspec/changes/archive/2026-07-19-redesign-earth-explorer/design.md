## Context and current architecture

`GameEarthApp` owns `mainViewMode` and conditionally mounts Landing Hub, Earth Explorer, or Game Chronicle without changing the pathname. Within Earth, `explorationReducer` owns `activeRegionId`, `cameraMode`, `selectedCountryCode`, `selectedGameId`, and `selectionRevision`; `GameEarthApp` separately owns filters, marker controls, rotation, panels, `projectionMode`, and settled renderer view snapshots. Game Chronicle receives only catalog data and a return callback and cannot dispatch Earth actions.

Phases 1–3 already established shared Earth state types, revisioned `SpatialNavigationIntent`, an active-only projection boundary, a single cancellable Globe camera controller, safe viewport measurement, dynamic deterministic markers, component-aware MultiPolygon placement, three geographic LODs, and a reusable geography repository. `GameGlobe` remains the only production renderer. The Atlas branch is a renderer-free compatibility placeholder.

The scope is now deliberately narrower: complete the 3D Orbital Globe's visual system, interaction polish, optional atmosphere/material assets, performance, and acceptance. A production 2D/2.5D Atlas renderer is not part of this change. Its architecture and acceptance contract are preserved in `docs/DEFERRED_ATLAS_MAP_PLAN.md` so a future `add-atlas-map-renderer` change can resume without reconstructing decisions.

## Goals and non-goals

**Goals:**

- Ship one premium, stable, accessible 3D Orbital Globe as Earth Explorer's only user-facing renderer.
- Preserve the completed camera, marker, MultiPolygon, LOD, cache, and state foundations.
- Keep geography visually primary while reorganizing Earth-owned panels and controls into a restrained archival instrument hierarchy.
- Migrate cyan/magenta HUD styling to charcoal, ink green, oxblood, oxidized brass, aged gold, warm white, and low-frequency desaturated cyan feedback.
- Use original text-free atmosphere/material imagery only when it materially improves the CSS-and-renderer baseline and passes human selection.
- Meet desktop, mobile-safety, keyboard, reduced-motion, image-failure, WebGL, performance, lifecycle, and regression gates before human acceptance.

**Non-goals:**

- A production Atlas renderer, `OrthographicCamera` map, planar projection, antimeridian drawing, Atlas pan/zoom/hit testing, public projection switch, Atlas runtime view restoration, or Atlas renderer lifecycle acceptance.
- Deleting the already validated `EarthProjectionMode`, `AtlasViewState`, active-only mount contract, or inert Atlas placeholder merely to narrow scope.
- Changing routes, pathname, App Router, or `GameEarthApp.mainViewMode` ownership.
- Rewriting `GameEarthApp`, duplicating Earth selection/filter state, or introducing a global event bus/state library.
- Changing Landing Hub, Game Chronicle, source game schema, RAWG generation, country inference, or online map/data services.
- A complete mobile redesign, a large map engine, or generated imagery as a functional prerequisite.
- Syncing, archiving, committing, pushing, or merging before explicit human visual acceptance.

## Shared state ownership and deferred compatibility

`explorationReducer` remains the sole business-selection authority. Shared filters remain in the Earth shell. Renderer objects and frame-frequency camera values stay in refs owned by the active renderer.

```ts
type EarthProjectionMode = "globe" | "atlas";

type GlobeViewState = { lat: number; lng: number; altitude: number };
type AtlasViewState = { center: [lng: number, lat: number]; zoom: number };

type EarthViewState = {
  projectionMode: EarthProjectionMode;
  globeView: GlobeViewState | null;
  atlasView: AtlasViewState | null;
};
```

These Phase 1 types remain forward-compatible, but this change fixes the product default and visible experience to `globe`. No unfinished projection selector is rendered. The placeholder remains available only as an internal contract fixture and owns no canvas, WebGL context, animation loop, geography request, or long-lived listener. Archive neither reads nor mutates projection or view state.

## SpatialNavigationIntent contract

One immutable semantic intent describes global, region, country, or game navigation:

```ts
type SpatialNavigationIntent = {
  revision: number;
  target:
    | { type: "global" }
    | { type: "region"; regionId: string }
    | { type: "country"; countryCode: string }
    | { type: "game"; gameId: string; countryCode: string };
  source: "selection" | "focus-control" | "restore" | "projection-switch";
  motion: "animate" | "immediate";
};
```

`selectionRevision` is the monotonic authority. The Globe controller consumes the current intent and ignores older revisions. The contract remains renderer-neutral for future Atlas reuse, but only Globe interprets it in this change.

## Renderer lifecycle and active-only mounting

`EarthProjectionViewport` retains the Phase 1 active-only boundary. Production UI always selects Globe. The inactive Atlas compatibility branch has no heavy renderer. On Globe unmount, the controller cancels RAF/tweens and pending intents; observers and controls listeners are removed; owned geometry/material/texture/render-target resources are released; marker DOM and references are cleared.

Development/test instrumentation may expose active renderer kind, canvas count, controller state, and cache statistics without a production diagnostic UI. Hub and Chronicle must contain zero Earth canvases; Earth must contain at most one.

## Globe camera state machine

Only the Globe camera controller writes `pointOfView`.

```text
UNINITIALIZED --ready--> SETTLED
SETTLED --new intent--> PROGRAMMATIC_NAVIGATION
PROGRAMMATIC_NAVIGATION --newer intent--> CANCEL -> PROGRAMMATIC_NAVIGATION
PROGRAMMATIC_NAVIGATION --pointer/wheel--> CANCEL -> USER_CONTROLLED
USER_CONTROLLED --controls end--> SETTLING -> SETTLED
SETTLED --resize--> REFIT_CURRENT_VIEW (no selection replay)
any state --unmount--> DISPOSED
```

The controller owns one token/revision, uses the shortest longitude arc, and rejects completion from older tokens. Manual input cancels programmatic movement immediately. Reduced motion makes long navigation immediate or short. Settled Globe snapshots publish only at interaction end, before Earth exit, or another documented low-frequency boundary; camera frames never enter React state.

## Safe viewport and responsive layout

The Earth layout measures the actual Globe container and overlay obstructions:

```ts
type SafeViewport = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};
```

`ResizeObserver` input is coalesced without retaining historical maximum width. Canvas CSS size and drawing buffer follow the current container, including large-to-small resize and panel changes. The single Globe controller fits global/region/country/game targets into the remaining safe area. Panel changes do not steal control during manual interaction and do not create a second camera writer.

## Marker budget algorithm

The completed marker engine derives a bounded target from exploration level, projected country area, settled view scale/altitude, cover footprint, filtered game count, performance tier, and the renderer identifier retained for future compatibility.

```ts
function computeMarkerBudget(input: BudgetInput): number {
  const footprint = (input.coverWidth + input.gapX) * (input.coverHeight + input.gapY);
  const areaCapacity = Math.floor(input.visibleCountryAreaPx / footprint);
  const performance = { low: 0.65, medium: 0.85, high: 1 }[input.performanceTier];
  const raw = Math.floor(areaCapacity * input.quantizedZoomFactor * performance);
  return clampToLevelBand(raw, input.level, input.countryBand, input.gameCount, ABSOLUTE_CAP);
}
```

Focused large countries target 10–18, medium/small countries 6–12, and tiny countries 1–4 plus explicit overflow. Global and region views use lower bands and a total cap. Layout freezes or degrades during camera motion and recomputes at settled boundaries with quantization and hysteresis.

## MultiPolygon, collision, and overflow

Each connected Polygon component has stable ID, antimeridian-aware rings, area, bbox, interior anchor, and source metadata. Mainland selection combines catalog-anchor containment, area, and proximity. Candidates are generated inside each component's own geometry, so remote territories cannot enlarge the mainland sampling bbox. The main component receives the dominant budget; remote components receive a small bounded allocation; multi-island countries retain meaningful major components.

Deterministically ranked candidates enter a screen-space grid hash. Marker rectangles must remain within the safe viewport, avoid protected overlays, and not collide at the configured cover footprint. Equal data, filters, quantized view, cover size, and performance tier yield identical identities, positions, and overflow. Unplaced games are counted in truthful `+N` or cluster affordances and remain browsable in the country panel; only accepted visible markers create cover requests.

## GeoJSON LOD generation, loading, and cache

The offline generator emits shape-aware, deterministic Global low, Region medium, and Country high-detail artifacts while preserving Polygon/MultiPolygon structure, closed rings, IDs, and metadata. Runtime coordinate-index sampling is forbidden. The complete high-resolution world source is a build input, never a first-load request.

The module-scoped geography repository deduplicates in-flight fetch/parse, retains the nearest lower LOD during detail loading/failure, drops rejected promises for retry, and bounds normalized and renderer-geometry caches. Geometry eviction disposes owned GPU resources. The normalized model is intentionally renderer-neutral so the deferred Atlas can reuse it later without changing current Globe acceptance.

## 3D Globe UI and interaction architecture

Keep the Earth command header, geographic context, left camera/location tools, right country/game panel, and bottom filter controls outside `GameGlobe`, but design them only for the current Globe workflow:

1. The header preserves Hub return, product/location context, and concise system status. It does not expose an Atlas switch.
2. The left rail keeps zoom, focus/reset, region/global navigation, and rotation as a restrained observation instrument.
3. The right panel opens on demand, keys detail to the latest selection revision, supports Escape/top-layer close, and browses more games than the marker layer.
4. The bottom controls consolidate year, rating, cover size, marker view mode, camera mode, and rotation into one low-priority tray/drawer.
5. Globe focus is always computed against remaining safe space; overlays cannot silently cover the semantic target.

No panel business content, pathname, Hub/Chronicle ownership, or data pipeline is replaced.

## Visual token and Globe material migration

Replace layered cyan/magenta overrides with Earth-scoped semantic tokens:

```css
--earth-charcoal;
--earth-ink-green;
--earth-oxblood;
--earth-brass;
--earth-aged-gold;
--earth-warm-white;
--earth-muted;
--earth-spatial-feedback;
```

The 3D Globe, boundary layers, markers, selection, panels, controls, focus, borders, shadows, and motion consume the same hierarchy. Charcoal and ink green carry depth; oxblood marks rare selection/emphasis; brass and aged gold express archival hardware; warm white preserves reading; muted cyan appears only for low-frequency spatial feedback. Remove large pure-cyan glow, magenta neon borders, blue-black HUD dominance, glass-heavy cards, repeated equal-radius panels, strong starfields, decorative particles, and nested equal-weight outlines.

Globe material work uses existing Three.js/react-globe.gl capabilities: restrained lighting, readable atmosphere, stable land/ocean contrast, LOD-aware boundaries, and selected-country emphasis. Shader complexity, bloom, and particles are not added unless measured evidence shows they improve the Globe without harming clarity or performance. The Globe remains the visual center at all required desktop sizes.

## Generated atmosphere asset strategy

Core acceptance must pass with CSS and renderer lighting alone. In Phase 5, image generation may produce text-free candidates for dark archival paper, mineral/oxidized brass texture, extremely subtle chart points, optical vignette, edge-mounted instrument atmosphere, and a desktop-wide environmental backing.

Prompts and review prohibit text, logos, UI copy, watermarks, maps, country borders, game-poster imitation, characters, dominant starfields, or a central competing object. Candidates preserve a central Globe safe zone and right-panel safe zone. Only human-approved files are compressed to WebP or a project-appropriate format, receive responsive delivery and explicit size budgets, and enter the product. CSS fallbacks remain complete; rejected temporary files are removed individually and never committed.

## Image loading and fallback

Game covers keep stable aspect ratios and dimensions. Only bounded visible/near-visible markers may load eagerly; panel images are lazy where appropriate. Skeletons or archival placeholders preserve layout. Primary and fallback failure retains the game name and activation surface. Atmosphere images carry no required information, have responsive sources, and fail to the CSS baseline without layout shift.

## Accessibility and reduced motion

Hub return, tools, country directory, countries, games, filters, details, clusters, and close actions are keyboard operable with visible focus, meaningful labels, and current/selected/expanded state. Equivalent semantic controls accompany canvas interactions. Escape closes the topmost dismissible Earth layer without corrupting selection or trapping focus.

`prefers-reduced-motion` cancels or substantially shortens long orbital flights, continuous rotation, strong parallax, marker choreography, and staged panel transitions. CSS/Motion/Three.js interpolation is preferred; GSAP requires a demonstrated complex sequence and is not used for ordinary camera movement.

## Performance budget

- One Globe canvas while Earth is active; zero Earth canvases in Hub/Chronicle.
- No complete high-resolution world request on first load; detail LOD is incremental and cached.
- Camera and marker animation do not write frame-frequency React state.
- Marker DOM and image requests obey computed and absolute caps.
- Resize and panel changes do not recreate the Globe or sustain layout thrashing.
- No document horizontal overflow at 1280×720, 1366×768, 1440×900, or 1920×1080; 390×844 remains non-crashing and escapable.
- Production console has no error, hydration warning, unmounted-state warning, or newly introduced serious WebGL warning.
- Representative interaction is compared with the recorded Phase 1 baseline; measured FPS/frame/long-task evidence is reported without inventing hardware-independent guarantees.

## Failure modes and fallback paths

- **WebGL unavailable:** show an understandable Earth-unavailable state and working Hub return.
- **Global geography fails:** retain exit/navigation and a bounded non-interactive fallback; permit retry.
- **Region/Country LOD fails:** retain the lower LOD and selection.
- **Cover fails:** retain stable placeholder, name, and interaction.
- **Atmosphere fails or is absent:** retain the complete CSS-and-renderer composition.
- **Cache entry fails:** remove the rejected promise, retain lower detail, and never cache partial GPU objects.
- **Rapid navigation/manual input:** cancel the older token; only the latest revision can settle.
- **Deferred Atlas compatibility branch is reached internally:** render only the inert placeholder; do not create renderer resources or expose it as a production destination.

## Testing strategy

Unit tests retain Phase 1–3 coverage for reducer boundaries, intents, camera cancellation, safe viewport, mainland selection, budgets, deterministic collision/hysteresis, LOD fallback, and cache disposal. Phase 4 adds tests for current Globe UI semantics, detail freshness, image fallback, accessibility, and reduced motion.

Playwright covers the four desktop sizes plus 390×844 safety; canvas/container/header bounds; large-to-small shrink; safe focus; marker clicks; France/Poland/tiny/multi-island layouts; rapid navigation; manual interruption; Earth/Hub/Chronicle cycles; keyboard/Escape; reduced motion; image/LOD/WebGL failures; controlled requests; console diagnostics; and repeated lifecycle checks. It also proves no unfinished Atlas switch is user-visible and that the internal placeholder remains renderer-free if exercised by a contract test.

Human review covers the 3D Globe only: Hub-to-Earth continuity, archive-observatory palette, visual hierarchy, material quality, marker readability, panel/tool restraint, motion, optional assets, and absence of dominant neon/dashboard styling. Hub and Chronicle receive regression checks but no visual redesign.

## Migration and implementation order

1. **Completed:** state contracts and baseline tests.
2. **Completed:** Globe camera, resize, safe viewport, restoration, lifecycle, and WebGL fallback stabilization.
3. **Completed:** markers, MultiPolygon placement, geographic LOD, repository, and cache.
4. Complete the 3D Globe UI, visual tokens/materials, panels/controls, interaction, motion, accessibility, and suppression of any unfinished Atlas entry.
5. Generate/review/compress/integrate optional atmosphere and material assets only if they improve the baseline.
6. Run comprehensive Globe validation, living-documentation updates, diff review, and explicit human visual acceptance.

Rollback remains incremental: retain the prior Globe behavior or CSS fallback until each replacement passes targeted checks. No history rewrite or data migration is required. The deferred Atlas resumes only through a future branch `feat/add-atlas-map-renderer` and change `add-atlas-map-renderer`, following `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

## Dependency decision record

- **Current accepted baseline:** React, Three.js, and `react-globe.gl`; no dependency is added for this planning adjustment.
- **Current rejection:** Mapbox, MapLibre, Cesium, online basemaps, and any Atlas/projection dependency in this change.
- **Deferred Atlas decision:** Three.js `OrthographicCamera` remains the recommended route; lightweight projection fixtures are evaluated first, with direct `d3-geo` considered only under the gate recorded in the deferred plan.
- **Animation:** existing Motion/CSS/Three.js interpolation first; GSAP only for a justified complex sequence.

## Risks / trade-offs

- **[Compatibility Atlas types can be mistaken for shipped UI]** → Keep them documented as internal future contracts, default to Globe, hide the unfinished switch, and test that the placeholder owns no heavy resources.
- **[Visual work can regress stable camera/marker behavior]** → Keep controllers and engines separate from presentation, run Phase 1–3 tests after every visual tranche, and reject visual techniques that alter camera/state ownership.
- **[High-detail geography increases bytes and memory]** → Preserve on-demand LOD, lower-detail continuity, bounded caches, and explicit GPU disposal.
- **[DOM marker accessibility can pressure performance]** → Preserve dynamic caps, settled-only layout, lazy covers, and panel ownership of the deeper list.
- **[Generated texture can compete with the Globe]** → CSS-first acceptance, strict safe zones/size limits, human selection, and easy failure fallback.
- **[Deferral can lose Atlas context]** → Store product, architecture, algorithms, requirements, scenarios, tasks, prerequisites, and resumption checklist in one indexed long-term document.

## Open questions

- Which Globe material/light combination best preserves country/marker readability across the four desktop viewports without adding a measurable WebGL regression?
- Do atmosphere assets materially improve the accepted CSS-and-renderer composition? Human review may choose no generated image.
- Which exact Earth control hierarchy provides the clearest desktop workflow while leaving the Globe dominant? Resolve with real browser review in Phase 4 without changing business ownership.
