## 1. Reproduction, contracts, and test baseline

- [x] 1.1 Re-run the 1440×900 Playwright reproduction for Global, France, Poland, and Canada and record drag, wheel, camera-tool, programmatic-flight, rapid-switch, country-detail, and game-detail state transitions.
- [x] 1.2 Add characterization assertions for `is-globe-interacting`, `is-globe-low-detail`, marker visibility, settled marker counts, one canvas, two OrbitControls listeners, and one ResizeObserver.
- [x] 1.3 Add marker/image DOM probes and cover-request listeners that distinguish retained identities from legitimate accepted-set additions/removals.
- [x] 1.4 Add unit fixtures for the 48/72/112 px size anchors, 4 px stepping, storage normalization, collision buckets, hysteresis, and aggregate clamps.
- [x] 1.5 Capture the pre-implementation Global, France, and Poland frame-delivery, marker/image, request, console, hydration, WebGL, and ownership baseline.
- [x] 1.6 Confirm the implementation file set against `docs/02_FEATURE_MAP.md` and document any required new helper/test file before creating it.
- [x] 1.7 Verify the current branch, clean implementation baseline, main/origin ancestry, and unchanged backup refs before product-code edits begin.

## 2. Core product implementation

- [x] 2.1 Reconcile marker descriptors and renderer elements by the Phase 1 semantic/layout identity contract so retained game, aggregate, and overflow markers update selection, class, overflow, and ARIA state in place without duplicate cover requests.
- [x] 2.2 Keep the last-known-good accepted marker layout mounted through drag, wheel, camera-tool zoom, programmatic focus, auto-rotation, rapid country switching, and size input; atomically publish the latest settled layout while preserving back-face occlusion, manual camera cancellation, one canvas, and bounded lifecycle resources.
- [x] 2.3 Replace low-detail all-marker hiding with the archival interaction-quality tier that preserves covers, borders, positions, aggregation, and overflow while disabling only pointer, tooltip, shine, filter, shadow, animation, and nonessential transition work.
- [x] 2.4 Connect the shared 48/72/112/4 cover-size contract to the Earth-owned state, restore and persist `ludic-atlas:earth-cover-size:v1` safely, and keep Hub/Chronicle, SSR, and hydration unaffected.
- [x] 2.5 Drive retained cover dimensions from the canonical height through Earth-scoped CSS, remove opaque context multipliers/floors, and schedule bucketed/RAF/final-commit collision updates with hysteresis while preserving SafeViewport, LOD, representative geography, truthful aggregation, overflow, and occlusion.
- [x] 2.6 Refine the existing filter-tray size control with Chinese-first labeling, current px value, native slider, accessible decrease/increase buttons, disabled bounds, focus-visible behavior, and a compact overflow-free 390×844 layout without adding another HUD.
- [x] 2.7 Add and pass focused unit/Playwright coverage for interaction visibility, last-known layout, DOM/image identity, no retained-cover re-request, 48/72/112 controls and persistence, representative collision/aggregation/occlusion, one-canvas ownership, zero console/hydration errors, and 390 px safety.
- [x] 2.8 Run one concise Global/France/Poland interaction check confirming canvas ≤1, controller 1, OrbitControls listeners 2, ResizeObserver 1, no new long task above 200 ms, and no obvious interaction stall; update only directly affected living file mappings and stop for user visual acceptance.

## 3. Final automated validation, documentation, and Git/OpenSpec closeout

- [x] 3.1 Record explicit user visual acceptance of settled/moving covers, size anchors, overlap, occlusion, control layout, focus, reduced motion, and 390 px usability; this is required before any other Phase 3 task.
- [x] 3.2 After acceptance, run the final required automated suite once and update `docs/01_PRODUCT_SPEC.md`, `docs/02_FEATURE_MAP.md`, `docs/03_ARCHITECTURE.md`, and `docs/EARTH_EXPLORER_VALIDATION.md` with the accepted contract and concise measured result; do not modify README.
- [x] 3.3 Inspect final diff/status and unchanged backup refs, then only after explicit authorization perform the requested commit/push/PR or merge; do not create a release, package, course report, or backup.
- [x] 3.4 Only after implementation is merged and separately authorized, sync delta specs, archive the change, validate final main/origin state, and report immutable commit/ref evidence.
