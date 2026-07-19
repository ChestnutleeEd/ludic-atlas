# Earth Explorer Phase 6 validation

## Scope and environment

This record closes the comprehensive validation stage of OpenSpec Change `redesign-earth-explorer` and records the accepted marker-continuity / cover-size follow-up from `improve-earth-marker-scaling-and-persistence`. It covers the production 3D Orbital Globe only. The deferred 2D/2.5D Atlas renderer and any user-facing projection switch remain outside this acceptance and are preserved in `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

Validation date: 2026-07-19, with the final follow-up on branch `feat/improve-earth-marker-scaling-and-persistence`, using local Chromium on macOS. Measurements are machine- and headless-browser-specific observations, not hardware-independent performance guarantees.

## Functional and viewport acceptance

- Fresh Globe entry passed at 1280×720, 1366×768, 1440×900, and 1920×1080 with one canvas, more than 200 world country features, visible Global boundaries, bounded header/stage/canvas, no horizontal overflow, operable exit/tools/directory, and the correct responsive atmosphere asset.
- The 390×844 safety viewport passed non-crash, bounded document/stage/canvas width, one active Earth canvas, collapsed mobile sheet, and a working Hub exit.
- Large-to-small and small-to-large resize preserved the same canvas DOM node and kept CSS size, drawing buffer, header, safe viewport, and document width within the current container.
- Global → Region → Country → Game, rapid country/game changes, manual camera interruption, panel compensation, Escape, filter changes, and settled Globe restoration passed. Older camera intents did not overwrite the latest semantic selection.
- Five Earth ↔ Hub cycles and five Earth ↔ Chronicle cycles passed with zero destination canvases and one returning Globe canvas. Retained country/filter/view state remained stable.
- No user-facing Atlas selector or placeholder was present. The internal Atlas branch remained renderer-free under its contract tests.

## Representative geography and markers

At 1440×900 and the default cover size:

| Geography | Visible result | Acceptance evidence |
| --- | ---: | --- |
| France | 14 direct cover markers, `+21` overflow with the tray closed | Mainland-priority MultiPolygon placement; accepted 10–18 band at 72 px; repeated entry keeps identical identities/coordinates |
| Poland | 8 direct cover markers, `+6` overflow | Deterministic compact layout; accepted 6–12 band at 72 px; Country LOD |
| Belgium | 1 collapsed aggregate, bounded expansion to at most 4 | Tiny-country strategy and explicit `aria-expanded` path |
| Japan | 5–24 depending on collision-free space | Multi-island component allocation and Country LOD remain component-aware |

Opening and switching game detail preserved every unrelated marker/image DOM identity and caused no additional requests for already loaded covers across five selections. Year, rating, cover size, and marker view changes retained authoritative selection and truthful filtered totals/overflow.

The canonical cover height is 48–112 px with a 72 px default and 4 px step. The filter tray provides a native slider, decrease/increase buttons, and current px display, and safely restores `ludic-atlas:earth-cover-size:v1`. With the tray open, the final France size matrix was 20 markers / `+15` at 48 px, 12 / `+23` at 72 px, and 7 / `+28` at 112 px; every result equals the 35-game filtered total, remains nonzero, and reflects the smaller open-tray SafeViewport. Drag, wheel, automatic rotation, camera tools, and programmatic flight retain the last accepted layout. Low-detail styling removes only nonessential decoration/pointer work, retained button/image nodes stay identical, and 19 cover requests remain 19 unique URLs.

## Production frame and network observations

The final serialized full-project browser run produced the following marker-continuity sample. It is recorded as an observation rather than a universal performance constant.

| Context | FPS | p95 frame | Maximum frame | Long tasks |
| --- | ---: | ---: | ---: | ---: |
| Global | 50.9 | 33.4 ms | 33.7 ms | 0 |
| France | 41.8 | 33.4 ms | 33.8 ms | 0 |
| Poland | 42.3 | 33.4 ms | 34.0 ms | 0 |

An isolated ownership/performance check also passed the explicit maximum-long-task gate with Global/France/Poland continuous markers, one canvas, one controller, two OrbitControls listeners, one ResizeObserver, no retained-cover re-request, and no long task above 200 ms. Multi-worker performance sampling was intentionally not treated as a product measurement because parallel Chromium workers contend for the same machine resources.

The final production sample observed:

- one responsive Earth atmosphere WebP request;
- 22 lightweight aggregate Marker DOM nodes and zero cover images at Global;
- 14 cover Marker/image nodes for France and 8 for Poland at the closed-tray 72 px default;
- 19 cover requests across Global → France → Poland, with already cached images reused;
- four geographic requests: Global, Europe Region, France Country, and Poland Country;
- geography repository diagnostics of four fetches and four parses for those four unique resources;
- one canvas, zero console errors, zero hydration warnings, and zero WebGL / ReadPixels / GPU-stall warnings.

The earlier ReadPixels GPU-stall message was not reproduced in the current production headless runs, so this validation cannot reliably classify it as headless-only. Browser APIs do not expose a trustworthy count of live GPU resources. Cleanup evidence therefore uses observable ownership instead: one camera controller, two OrbitControls listeners, one ResizeObserver, inactive camera RAF after settle, zero destination canvases, repository disposal unit tests, and no stale action across repeated remounts.

## Failure, accessibility, and motion paths

- Keyboard navigation, logical focus, `focus-visible`, accessible names/current/pressed/expanded state, detail-dialog inert background, and top-layer Escape behavior passed.
- `prefers-reduced-motion` produced immediate/short camera navigation, disabled continuous decorative movement, and retained essential feedback.
- Primary and fallback cover failure retained fixed geometry, game name, and activation. Atmosphere failure hid the broken image while preserving the CSS composition and Globe controls.
- Country LOD failure retained lower-detail geography and selection. The development-only injected WebGL initialization failure showed the bounded unavailable state and a working Hub return.
- Empty/filtered states remained understandable and did not corrupt the current selection contract.

## Verification commands

| Command or suite | Result |
| --- | --- |
| `openspec validate improve-earth-marker-scaling-and-persistence --strict` | passed |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm test` | 56/56 passed |
| Marker continuity / size audit | passed, including 48/72/112, overflow, repeated France layout, safe-space selection, identity, request, ownership, and diagnostics |
| Complete Earth Playwright | 63/63 passed, 0 skipped, serialized |
| Complete project Playwright | 80/80 passed, 0 skipped, serialized |
| `npm run build` | passed; static `/` generated |

One attempted full-suite rerun failed uniformly with `ERR_CONNECTION_REFUSED` after the auto-started development server exited. A stable manual development server was started and the identical Earth suite then passed 56/56; this was classified as test infrastructure failure, not a product defect. A production full-Earth attempt passed 54 tests before two environment-specific failures: one asynchronous fresh-load assertion that was corrected to wait for real LOD readiness, and the deliberately development-only WebGL injection hook. Production Phase 6 was then rerun successfully.

## Human acceptance and finalization boundary

The user explicitly accepted the adopted Phase 5 Globe atmosphere/effect and the final marker-continuity delivery. The accepted marker review covers the default 72 px size, the full 48–112 px control, persistent covers during rotation/zoom/automatic rotation/programmatic flight, France/Poland/Belgium/Japan layout, persistence, interaction smoothness, focus/reduced motion, occlusion, and 390×844 usability. Atlas remains excluded from the accepted product surface.
