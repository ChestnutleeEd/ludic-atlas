## Context

Earth Explorer already has one authoritative `coverSize` in `GameEarthApp` (default 56), one native `CoverSizeSlider` (28–96, step 4), dynamic marker budgets, screen-space collision, stable game ranking, back-face visibility through `htmlElementVisibilityModifier`, one camera controller, and one Globe renderer. The control lives in the existing bottom filter tray and is retained only while `GameEarthApp` remains mounted; it is not restored after a reload.

The reported disappearance is an intentional low-detail path, not a WebGL or image-loading failure. OrbitControls `start` sets `isGlobeInteracting`; the camera controller sets `isCameraAnimating`; auto-rotation also contributes to `isLowDetailRendering`. `GameGlobe` then applies `is-globe-low-detail`, and `globals.css` forces every `.globe-game-marker` and `.globe-country-marker` to `visibility: hidden !important`. Marker data remains mounted during motion, but settled altitude/collision updates and a cover-size-dependent `htmlElement` factory cause `react-globe.gl` to replace marker nodes afterward.

Playwright reproduction at 1440×900 showed one canvas throughout. France drag retained all 21 marker nodes while hidden, then retained 0/21 after settle; cover request count stayed at nine because the browser cache reused already loaded sources. Changing 56→60→64 retained 0 marker nodes, changed visible France markers 18→14→13, and only changed the first card width from 46 to 48 px because multiple scale factors and minimum floors flatten the lower range. Wheel, button zoom, country flight, and rapid Japan→United States focus all produced the same low-detail hiding class. The established production baseline is Global 60.1–60.9 FPS, France 53.2–58.5 FPS, and Poland 59.9–60.6 FPS with hidden markers during motion.

Constraints include one canvas/renderer, one camera writer, bounded marker work, correct globe-side occlusion, stable image loading, truthful overflow, SafeViewport, responsive controls, reduced motion, and no changes to Hub, Chronicle, Atlas, routes, dependencies, or catalog data.

## Goals / Non-Goals

**Goals:**

- Keep bounded game covers visible and correctly occluded throughout manual and programmatic camera motion.
- Keep the DOM element and `<img>` for every unchanged marker identity stable across interaction, selection, and size adjustment.
- Make size adjustment visibly useful, continuous, accessible, responsive, and locally restorable.
- Preserve collision, aggregation, overflow, camera cancellation, lifecycle cleanup, and established production performance within an explicit budget.

**Non-Goals:**

- No renderer, canvas, route, dependency, data-schema, RAWG, country-inference, Atlas, Hub, Chronicle, README, release, packaging, or cross-platform work.
- No full Earth UI redesign and no second cover-size state/control system.
- No per-frame collision solver or unbounded increase to the focused-country marker cap.

## Decisions

### 1. Replace hiding with an interaction-quality tier

`isGlobeInteracting`, `isCameraAnimating`, and auto-rotation remain lifecycle signals, but they SHALL no longer set marker `visibility: hidden`. The in-motion tier disables marker pointer events, tooltip, shine, animation, transition, expensive filter, and nonessential shadow; it preserves the cover image, border silhouette, opacity, and `react-globe.gl` transform. The existing `htmlElementVisibilityModifier` remains the single globe-side/back-face visibility authority.

This keeps geographic continuity while reducing paint cost. The rejected alternatives are retaining the current full hide, conditionally unmounting covers, or adding a canvas/sprite marker renderer; each violates the requested continuity or creates a second rendering system.

### 2. Reconcile semantic marker identities and update presentation in place

`GameGlobe` SHALL reconcile desired marker descriptors against a renderer-local registry keyed by stable semantic/layout identity. Markers that remain in the accepted set keep the same descriptor object, button, and image; changed selected/overflow/ARIA attributes update in place. Budget or collision changes add/remove only the set difference. The `htmlElement` callback SHALL not depend on live cover size.

Cover dimensions SHALL come from an Earth-stage CSS custom property and fixed aspect-ratio rules, so input changes update style without invoking `document.createElement`, resetting `src`, or recreating listeners. The canonical value is the rendered cover height in CSS pixels; card width follows the existing cover aspect ratio. This removes the current compounded Global/Region scaling and low-end size floor. Country aggregate dots stay a separate bounded affordance.

The rejected alternative is trusting array order or game ID alone. Layout identity must distinguish a marker that genuinely moves to a different geographic slot, while preserving a game node when only selection, camera state, or size changes.

### 3. Keep projection continuous and collision low-frequency

`react-globe.gl` continues updating marker transforms every render frame. During drag, wheel, auto-rotation, or programmatic flight, the last accepted collision layout stays mounted and visible; no collision calculation runs per frame. At settle, one scheduled layout pass uses the latest camera, SafeViewport, canonical cover footprint, and selection revision.

During cover-size dragging, visual size follows every input event through the CSS variable. Collision/layout recomputes at most once per animation frame only after crossing an 8 px layout bucket, and always once on commit (`change`, pointer release, blur, or keyboard completion). Hysteresis preserves the accepted set across one-marker budget differences. If a newly enlarged cover temporarily overlaps, the transition remains short and bounded; the next scheduled pass resolves it without blanking the layer.

### 4. Refine the existing control and persist one authoritative value

The product contract is minimum 48 px, default 72 px, maximum 112 px, step 4 px. Global, Region, and Country cover cards use the same canonical range; density differences are handled by marker budgets and collision rather than hidden visual multipliers. Aggregate dots do not scale as covers; their hit target remains at least 24 px and their count/overflow badge scales only within a conservative clamp.

The existing native range remains for continuous pointer and keyboard input. Explicit decrease/increase buttons flank or accompany it, use the same step/clamp function, expose meaningful Chinese accessible names, and disable at bounds. The recommended placement is the existing filter tray, with `封面 72 px` exposed in the tray summary or compact display row so the control is discoverable without creating a floating tool. At 390 px, the control becomes one compact row inside the scroll-bounded tray and the tray returns to its summary after commit when necessary; SafeViewport continues accounting for the open tray and mobile sheet. Exact CSS slot is confirmed during visual QA, not by adding a new region.

`GameEarthApp` remains the only owner. A versioned local-storage key restores a finite, in-range, step-aligned number in the client lazy initializer; invalid/unavailable storage falls back to 72 without warning or hydration divergence. Leaving for Hub/Chronicle retains the same state as today, and Chronicle never reads or writes the preference.

### 5. Preserve existing budgets while measuring the new paint cost

The absolute focused-country cap stays 24. Global retains its bounded representative/aggregate model; France, Poland, Belgium, and Japan keep their accepted geography behavior. Performance tier may reduce accepted cover count, but it MUST NOT hide all covers during interaction. If continuous HTML covers regress frame delivery, the first mitigation is the interaction-quality CSS tier, then throttled settled-state work, then dynamic budget reduction; image-quality swaps, DOM unmounting, and a second renderer are rejected.

Same-machine production acceptance targets one canvas, one controller, two OrbitControls listeners, one ResizeObserver, no cover re-request for retained sources, no new long task above 200 ms, and no more than 15% FPS regression from a paired baseline. Aspirational interaction targets are 55+ FPS for Global/Poland and 45+ FPS for dense France, with p95 frame time at or below 34 ms. Measurements remain observations tied to the validation environment, not universal hardware guarantees.

### 6. Test behavior at the identity and lifecycle boundaries without repeated evidence work

Unit tests cover size normalization/persistence parsing, budget hysteresis, collision buckets, aggregate clamps, and reconciliation set differences. Focused Playwright assigns probes to marker and image nodes, performs real drag/wheel/button/focus/rapid-switch/slider input, and asserts that retained IDs keep node identity, image request counts do not increase, back-face markers remain hidden, front-side markers remain visible, and canvas/listener/observer counts stay bounded. One concise Global/France/Poland interaction check records ownership, console/hydration, long-task, and obvious-stall evidence; repeated screenshots, duplicate sampling, and stage-by-stage performance reports are not required. After Phase 2, the user performs subjective visual review and explicitly confirms acceptance before Codex begins final validation, documentation, or Git/OpenSpec closeout.

### 7. Use three execution phases

The implementation plan has three phases. Phase 1 preserves the completed reproduction, contracts, and baseline. Phase 2 combines persistent markers, identity, cover sizing, persistence, collision scheduling, controls, responsive behavior, targeted regression coverage, and one concise performance check into one core product implementation stage. Phase 3 begins only after explicit user visual acceptance and contains final automated validation, accepted documentation, and separately authorized Git/OpenSpec closeout. This consolidation removes repeated screenshots, duplicate sampling, and artificial task fragmentation without removing any product requirement.

## Risks / Trade-offs

- [Visible HTML covers lower interaction FPS] → Remove paint-heavy decoration in motion, retain bounded budgets, pair production measurements against the current baseline, and reduce density before considering any richer renderer.
- [Stable descriptors become stale] → Centralize reconciliation, update mutable presentation fields deliberately, and assert latest selection/layout/ARIA data after rapid switching.
- [Large covers temporarily overlap during slider input] → Use 8 px bucketed scheduling plus final commit collision, SafeViewport protection, and hysteresis rather than per-frame full layout.
- [Back-side covers bleed through] → Keep `htmlElementVisibilityModifier` authoritative and add rotation/occlusion tests before removing any CSS hiding rule.
- [Local storage causes hydration or invalid state] → Read only on the client, validate/clamp/align values, catch storage errors, and use 72 px fallback.
- [Mobile tray obscures the Globe] → Keep one scroll-bounded tray, compact the size row, account for its open bounds in SafeViewport, and validate collapsed/expanded states at 390×844.
- [DOM registry leaks listeners/nodes] → Delete registry entries when markers leave the accepted set and clear the registry on Globe unmount; repeat Earth lifecycle tests.

## Migration Plan

1. Preserve the completed Phase 1 characterization, contracts, and baseline evidence.
2. In one Phase 2 implementation, introduce stable reconciliation and last-known layouts, remove all-marker hiding, connect canonical sizing/persistence, refine the existing control, and run focused regression plus one concise performance check.
3. Stop for user visual acceptance. Only after explicit acceptance, run Phase 3 final validation/documentation and separately authorized Git/OpenSpec closeout.
4. Roll back by reverting this change's files. The storage key is additive and harmless to older code; no catalog or schema migration is involved.

## Open Questions

- The user will judge the final subjective cover scale, motion feel, and narrow-screen visual balance after Phase 2; Codex does not iterate those subjective parameters without follow-up direction.
- The exact low/medium performance-tier marker reductions remain measurement-driven, but every tier must retain at least one truthful visible representative when eligible games exist.
