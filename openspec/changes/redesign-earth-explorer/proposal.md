## Why

Earth Explorer remains visually disconnected from the archival Landing Hub and Game Chronicle, while its dense-country markers, close boundary quality, camera coordination, responsive sizing, and renderer lifecycle need a reliable production finish. This change therefore completes the existing 3D Orbital Globe as the sole user-facing Earth renderer; the previously planned 2D/2.5D Atlas Map is deferred intact to a future change rather than shipped unfinished.

## What Changes

- Stabilize the existing `react-globe.gl` experience with one cancellable camera controller, safe-viewport fitting, deterministic view restoration, responsive shrink behavior, and explicit lifecycle cleanup.
- Replace fixed marker limits and whole-MultiPolygon bbox sampling with deterministic dynamic budgets, mainland-first component placement, collision handling, hysteresis, tiny-country overflow, and bounded image loading.
- Serve Global, Region, and Country geographic LOD through a reusable, bounded geography repository without runtime coordinate-index sampling or first-loading the complete high-resolution world source.
- Redesign the 3D Earth workspace, Globe materials, panels, tools, filters, details, focus states, and motion as an archival orbital observatory using charcoal, ink green, oxblood, oxidized brass, aged gold, warm white, and low-frequency desaturated cyan.
- Allow optional, human-approved, text-free atmosphere and material assets with strict safe zones, compression budgets, responsive delivery, and CSS fallbacks.
- Complete desktop, mobile-safety, accessibility, reduced-motion, performance, failure, lifecycle, and human visual acceptance gates for the 3D Globe.
- Preserve the already implemented `EarthProjectionMode`, `AtlasViewState`, semantic navigation, and active-only renderer compatibility contracts, but keep `globe` as the default and only user-facing mode. The Atlas placeholder remains inert and must not create a canvas, WebGL renderer, loop, listeners, or geography request.
- Remove the production Atlas renderer, OrthographicCamera map, planar pan/zoom/hit testing, public Globe/Atlas switch, Atlas runtime restoration, and Atlas lifecycle acceptance from this change. Their complete plan is retained in `docs/DEFERRED_ATLAS_MAP_PLAN.md` for `add-atlas-map-renderer`.

## Capabilities

### New Capabilities

- `earth-explorer-state-navigation`: One authoritative Earth selection/filter contract, revisioned spatial intent, Globe-default compatibility state, and an inert deferred-Atlas boundary.
- `orbital-globe-experience`: Stable 3D Globe camera, resize, safe viewport, view restoration, lifecycle, and WebGL fallback behavior.
- `earth-marker-presentation`: Deterministic dynamic marker budgets, MultiPolygon placement, collision, hysteresis, overflow, and image fallback.
- `earth-geography-lod`: Shape-aware geographic LOD generation, loading, fallback, normalization, and bounded caching for the Globe and future reuse.
- `archive-orbital-atlas-visuals`: The branded 3D Orbital Globe workspace, shared Earth panels/controls, atmosphere assets, accessibility, and reduced motion.
- `earth-explorer-validation`: Required Globe viewports, navigation, lifecycle, representative geographies, performance, regressions, and human acceptance.
- `atlas-map-experience`: A deferral boundary only: the current change must not expose or accept a production Atlas renderer; the future capability contract lives in `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

### Modified Capabilities

- None. The current main OpenSpec has no Earth capability with requirements that this change modifies.

## Impact

- **Earth runtime:** `GameEarthApp`, the Earth projection boundary, 3D Globe, camera/navigation, markers, geography repository, panels, controls, and Earth-scoped styles.
- **Static data/tooling:** deterministic Global/Region/Country LOD outputs and their offline generator; no change to raw game records, RAWG generation, or country inference.
- **Assets:** optional Earth-only atmosphere/material files after human selection; no text, maps, game imagery imitation, or required information in generated assets.
- **Tests/docs:** Node tests, Earth Playwright suites, living architecture/product maps, and the long-term deferred Atlas plan.
- **Compatibility:** pathname, App Router, `mainViewMode`, Landing Hub, Game Chronicle, source game schema, and existing data pipelines remain unchanged. No map engine or dependency is added by this scope adjustment.
- **Success:** the 3D Globe alone passes the required viewport, interaction, accessibility, lifecycle, visual, performance, and regression gates; no unfinished Atlas entry is user-visible; finalization remains prohibited until explicit human visual acceptance.
