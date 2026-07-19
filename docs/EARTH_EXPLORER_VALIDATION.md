# Earth Explorer Phase 6 validation

## Scope and environment

This record closes the comprehensive validation stage of OpenSpec Change `redesign-earth-explorer`. It covers the production 3D Orbital Globe only. The deferred 2D/2.5D Atlas renderer and any user-facing projection switch remain outside this acceptance and are preserved in `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

Validation date: 2026-07-19, on branch `feat/redesign-earth-explorer`, using local Chromium on macOS. Production measurements used an optimized `next build` followed by `next start`; they are machine- and headless-browser-specific observations, not hardware-independent performance guarantees.

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
| France | 21 direct cover markers, `+14` overflow | Mainland-priority MultiPolygon placement; 18–24 focused band; Country LOD |
| Poland | 13 direct cover markers, `+1` overflow | Deterministic compact layout; 12–14 focused band; Country LOD |
| Belgium | 1 collapsed aggregate, bounded expansion to at most 4 | Tiny-country strategy and explicit `aria-expanded` path |
| Japan | 10–24 depending on collision-free space | Multi-island component allocation and Country LOD |

Opening and switching game detail preserved every unrelated marker/image DOM identity and caused no additional requests for already loaded covers across five selections. Year, rating, cover size, and marker view changes retained authoritative selection and truthful filtered totals/overflow.

## Production frame and network observations

Three successful serial Phase 6 production runs produced the following range. The last run is the final post-documentation sample.

| Context | FPS | p95 frame | Maximum frame | Long tasks |
| --- | ---: | ---: | ---: | ---: |
| Global | 60.1–60.9 | 17.0–17.7 ms | 17.2–33.9 ms | 0 |
| France | 53.2–58.5 | 17.5–33.3 ms | 49.9–99.8 ms | 1–2 |
| Poland | 59.9–60.6 | 17.2–17.6 ms | 17.4–33.3 ms | 0 |

France still produces a small, variable headless long-task tail while focused Country LOD and 21 covers settle. It is substantially bounded and did not cause stale selection, marker flashing, second canvas creation, console errors, or failed interaction assertions. The result is recorded rather than normalized away.

The final production sample observed:

- one responsive Earth atmosphere WebP request;
- 22 lightweight aggregate Marker DOM nodes and zero cover images at Global;
- 21 cover Marker/image nodes for France and 13 for Poland;
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
| `openspec validate redesign-earth-explorer --strict` | passed |
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm test` | 42/42 passed |
| Phase 6 production Playwright | 6/6 passed |
| Complete Earth Playwright | 56/56 passed |
| Complete project Playwright | 73/73 passed |
| `npm run build` | passed; static `/` generated |

One attempted full-suite rerun failed uniformly with `ERR_CONNECTION_REFUSED` after the auto-started development server exited. A stable manual development server was started and the identical Earth suite then passed 56/56; this was classified as test infrastructure failure, not a product defect. A production full-Earth attempt passed 54 tests before two environment-specific failures: one asynchronous fresh-load assertion that was corrected to wait for real LOD readiness, and the deliberately development-only WebGL injection hook. Production Phase 6 was then rerun successfully.

## Human acceptance and finalization boundary

The user explicitly accepted the adopted Phase 5 Globe atmosphere/effect before this Phase 6 apply turn and requested completion of the full validation flow. That acceptance satisfies task 6.13 for the 3D Orbital Globe and approved optional assets. This change is ready for a later OpenSpec sync/archive and Git submission stage, but no sync, archive, commit, push, merge, reset, revert, or rebase was performed in this validation turn.
