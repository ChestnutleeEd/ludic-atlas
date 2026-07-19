## Why

Earth Explorer deliberately hides every HTML game cover while the Globe is dragged, zoomed, auto-rotated, or moved programmatically, so the content disappears at exactly the moment users are orienting themselves. The existing cover-size control also rebuilds marker DOM and produces weak visual change across part of its range, making covers feel too small and the adjustment unstable.

## What Changes

- Keep bounded game markers visible and surface-anchored during pointer drag, wheel zoom, camera-tool zoom, auto-rotation, and programmatic camera flights; downgrade nonessential decoration instead of hiding the marker layer.
- Preserve marker and image DOM identity for unchanged game/layout identities across interaction lifecycle changes and cover-size adjustments, without creating another renderer or issuing duplicate cover requests.
- Refine the existing cover-size control rather than adding a second control: use a 48–112 px product range, 72 px default, 4 px keyboard/step increment, native slider plus explicit decrease/increase buttons, and a shared value for Global, Region, and Country contexts.
- Persist the user's last valid cover size locally, with a deterministic 72 px fallback when storage is absent, invalid, or unavailable.
- Scale cover markers continuously while keeping country aggregate dots legible and bounded; tiny-country aggregate/overflow badges adapt conservatively rather than becoming full-size covers.
- Separate per-frame globe projection from low-frequency marker selection and collision layout: update position/occlusion continuously, keep the last accepted layout during motion, and recompute collision after meaningful size/view thresholds or settle.
- Preserve back-face occlusion, truthful overflow, SafeViewport, country LOD, latest-wins camera cancellation, reduced motion, one-canvas ownership, and unaffected Hub/Chronicle behavior.
- Add unit, Playwright, production-performance, accessibility, responsive, lifecycle, and human visual acceptance gates for the new behavior.
- Non-goals: no new dependency, renderer, route, Atlas surface, data change, Landing Hub or Chronicle redesign, RAWG/country-inference work, README change, release, or packaging work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `earth-marker-presentation`: Markers remain visible through interaction, resize without wholesale DOM replacement, preserve cover loading, and use revised sizing/collision/aggregate contracts.
- `orbital-globe-experience`: Manual and programmatic camera movement continuously projects and occludes retained HTML markers while preserving single-writer and lifecycle guarantees.
- `earth-explorer-state-navigation`: Cover size gains validated local restoration while remaining a single Earth-shell-owned value.
- `archive-orbital-atlas-visuals`: The existing filter tray receives a discoverable, responsive, keyboard-accessible archival size control without changing the established palette or hierarchy.
- `earth-explorer-validation`: Regression and production gates explicitly cover in-motion visibility, DOM/image identity, sizing, collision, performance, accessibility, and responsive behavior.

## Impact

- Primary implementation areas: `src/components/GameEarthApp.tsx`, `src/components/globe/GameGlobe.tsx`, `src/components/globe/GameMarkers.tsx`, `src/components/controls/CoverSizeSlider.tsx`, `src/components/controls/BottomControls.tsx`, `src/lib/markerLayout.ts`, and Earth-scoped rules in `src/app/globals.css`.
- Test areas: marker/layout Node tests and Earth Playwright suites, including production diagnostics for Global, France, and Poland.
- Documentation areas: `docs/01_PRODUCT_SPEC.md`, `docs/02_FEATURE_MAP.md`, `docs/03_ARCHITECTURE.md`, and `docs/EARTH_EXPLORER_VALIDATION.md`; no README change.
- Compatibility: no data-schema, pathname, `mainViewMode`, public API, dependency, Hub, Chronicle, Atlas, or renderer-count change.
- Main risks are frame-time regression with visible HTML markers, incorrect back-face visibility, overlap during size changes, and accidental node churn. The design requires bounded budgets, cheap in-motion styling, throttled/settled collision work, stable marker keys, and measurable performance/identity assertions.
