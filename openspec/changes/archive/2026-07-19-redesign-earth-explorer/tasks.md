## 1. Phase 1 — Shared state contract and test baseline

- [x] 1.1 Record current Globe canvas bounds, renderer count, console diagnostics, geographic request sizes, France/Poland marker counts, and Hub/Chronicle round-trip behavior at the required viewports.
- [x] 1.2 Add unit tests proving the existing exploration reducer atomically owns region, country, game, and `selectionRevision`, and that Chronicle cannot dispatch Earth selection actions.
- [x] 1.3 Consolidate duplicate country-to-region resolution behind one tested exported function without changing current mappings.
- [x] 1.4 Define `ProjectionMode`, `GlobeViewState`, `AtlasViewState`, `EarthViewState`, `SafeViewport`, and `SpatialNavigationIntent` types with documented ownership boundaries.
- [x] 1.5 Add `projectionMode` and settled Globe/Atlas view snapshots to the Earth shell while keeping country, game, region, and filters in their existing authoritative sources.
- [x] 1.6 Add rating-filter state and derivation to the shared Earth filter pipeline without changing the source game schema or Chronicle filtering.
- [x] 1.7 Implement a selector that derives one revisioned spatial navigation intent for global, region, country, and game actions.
- [x] 1.8 Add unit tests proving projection switches preserve region, country, game, year, rating, cover-size, and marker-view filters and do not increment selection revision unnecessarily.
- [x] 1.9 Add an active-only `EarthProjectionViewport` contract and a test proving the inactive renderer is not mounted.

## 2. Phase 2 — Orbital Globe stabilization

- [x] 2.1 Add a failing browser regression for shrinking a mounted Earth workspace from 1920×1080 to 1280×720 while preserving canvas identity.
- [x] 2.2 Remove intrinsic-width feedback from the Earth workspace, command header, Globe container, and canvas so measured CSS and drawing-buffer widths shrink correctly.
- [x] 2.3 Introduce a Globe camera controller state machine with one animation token, one `pointOfView` writer, and observable settled/user-controlled/programmatic states.
- [x] 2.4 Route Globe ready, navigation intent, focus, reset, resize refit, and view restoration through the single camera controller.
- [x] 2.5 Add unit tests for shortest-arc interpolation, latest-intent cancellation, manual interruption, reduced motion, and unmount cancellation.
- [x] 2.6 Publish settled Globe view snapshots only at interaction end, projection switch, or Earth exit rather than on every animation frame.
- [x] 2.7 Measure command, panel, filter, and mobile-sheet overlays into a shared safe viewport without triggering a ResizeObserver feedback loop.
- [x] 2.8 Refit the current semantic target when the safe viewport materially shrinks and add a browser assertion that the selected target remains outside the open right panel.
- [x] 2.9 Replace the universal small-country altitude floor with a bounded fit derived from country bounds, safe viewport, and marker footprint, with representative country tests.
- [x] 2.10 Add lifecycle instrumentation and browser checks for one canvas, cancelled RAF/timers, disconnected listeners/observers, and disposed owned Three.js resources across repeated Earth/Hub/Chronicle cycles.
- [x] 2.11 Add a non-crashing Globe WebGL-unavailable fallback that retains the Earth return action and test the fallback path.

## 3. Phase 3 — Marker engine and geographic LOD

- [x] 3.1 Define the renderer-neutral normalized geographic feature/component model with stable IDs, antimeridian-aware rings, bounds, area, interior anchors, and source LOD metadata.
- [x] 3.2 Add fixtures and unit tests for France, Poland, a tiny country, polygon holes, remote MultiPolygons, and date-line-crossing geometry.
- [x] 3.3 Implement connected-component mainland scoring using area, catalog-anchor containment, and proximity, with an explicit bounded territory allocation.
- [x] 3.4 Replace whole-country bbox candidate generation with deterministic per-component interior candidates and verify France receives mainland candidates independent of overseas extent.
- [x] 3.5 Implement projection-aware marker budget calculation using visible country area, zoom, cover footprint, filtered game count, projection mode, and coarse performance tier.
- [x] 3.6 Add tests for large 10–18, medium/small 6–12, tiny 1–4 target bands, the absolute cap, cover-size changes, and truthful overflow.
- [x] 3.7 Implement deterministic screen-space grid-hash collision against marker rectangles and protected safe-viewport regions.
- [x] 3.8 Implement settled-view quantization and enter/exit hysteresis so small zoom changes do not continuously change marker count or positions.
- [x] 3.9 Freeze, hide, or downgrade rich markers during camera motion and recompute once for the latest settled view.
- [x] 3.10 Implement a deterministic tiny-country cluster with one bounded fan-out, leader-line, or local-expansion path and an explicit collapse action.
- [x] 3.11 Preserve stable marker dimensions, bounded eager loading, lazy noncritical covers, skeleton/placeholder state, one fallback swap, and usable double-failure content.
- [x] 3.12 Add an offline shape-aware LOD generation command that emits Global, Region, and country/bundle outputs plus source, parameter, coordinate-count, feature-count, and byte-size metadata.
- [x] 3.13 Generate and review Global/Region/Country LOD artifacts without changing the high-resolution source or loading the complete 14.6 MB source at runtime.
- [x] 3.14 Remove runtime coordinate-index boundary sampling and migrate Globe boundaries to generated LOD geometry with a dedicated selected-country detail layer.
- [x] 3.15 Implement deduplicated normalized-data loading and a bounded renderer-geometry cache with retryable failures and explicit GPU disposal on eviction.
- [x] 3.16 Add tests proving lower LOD remains visible when Region/Country loading fails and that selection survives degradation.

## 4. Phase 4 — 3D Globe UI, visual, animation, and interaction upgrade

- [x] 4.1 Keep `projectionMode` defaulted to `globe`, remove or suppress every user-facing entry to the unfinished Atlas placeholder, and add a browser assertion that Earth opens directly to one Globe canvas with no Atlas switch.
- [x] 4.2 Refactor the Earth command header and current geographic context into a concise archival-instrument hierarchy while preserving the existing Hub return action, pathname, and `mainViewMode` ownership.
- [x] 4.3 Restyle and reorganize the left camera/location controls as restrained Globe observation instruments while preserving zoom, focus/reset, global/region navigation, camera mode, and rotation semantics.
- [x] 4.4 Rework the right country/game panel hierarchy without changing its business data; key details to the latest `selectionRevision`, preserve scroll-safe game access, and verify rapid selections cannot show stale content.
- [x] 4.5 Consolidate year, rating, cover size, marker view mode, camera mode, and rotation into one low-priority bottom control tray or drawer that leaves the Globe visually dominant.
- [x] 4.6 Expand the country panel's deterministic browsable collection beyond directly rendered markers and verify filtered totals and marker `+N` remain truthful.
- [x] 4.7 Replace Earth cyan/magenta HUD variables and superseded overrides with one Earth-scoped charcoal, ink-green, oxblood, oxidized-brass, aged-gold, warm-white, muted, and spatial-feedback token set.
- [x] 4.8 Apply the token system to Globe land/ocean/atmosphere lighting, LOD boundaries, selected country, markers, panels, controls, focus, borders, and shadows without making cyan or magenta dominant.
- [x] 4.9 Remove repeated glass treatment, uniform large rounded cards, strong starfields, decorative particles, nested equal-weight borders, and competing ornament while preserving readable hierarchy and the Globe as the focal object.
- [x] 4.10 Refine Globe/panel/marker transitions so animation communicates spatial or state change, remains interruptible, and does not create another camera writer or per-frame React state.
- [x] 4.11 Add keyboard, `focus-visible`, accessible names/states, logical focus order, and Escape/top-layer close coverage for navigation, countries, games, filters, clusters, panel, and details.
- [x] 4.12 Implement reduced-motion behavior for long Globe flights, continuous rotation, parallax, marker transitions, panel transitions, and any staged sequence while preserving immediate state feedback.
- [x] 4.13 Verify selected targets and actionable markers remain inside the measured safe viewport after the redesigned header, panel, tools, and filter tray open or resize.
- [x] 4.14 Add scoped browser/visual regression checks proving Landing Hub and Game Chronicle appearance, local transitions, state ownership, and pathname remain unchanged.
- [x] 4.15 Repair Globe boundary construction so every Polygon/MultiPolygon ring and hole emits independent, geodesically subdivided segments with no cross-ring/component chord; verify Country LOD quality for France, Poland, China/Russia, and Japan/Indonesia without upgrading the full world.
- [x] 4.16 Preserve stable marker and image DOM identity when game details open or switch: stable keys/layout identity, no unrelated remount or entrance replay, no panel-width-induced relayout, and no repeated requests for already loaded covers across five game selections.
- [x] 4.17 Raise only focused-country marker capacity and candidate density to a viewport/collision-controlled maximum of 24, targeting 18–24 for France and 12–14 for Poland at 1440×900/default cover size while preserving tiny-country aggregation, truthful overflow, bounded requests, hysteresis, and unchanged Global/Region density.
- [x] 4.18 Add unit and real-browser repair regressions for ring/component isolation, abnormal segment length, focused Country LOD detail, marker DOM/request stability, France/Poland/Belgium/Japan counts, detail-open layout stability, filters/cover size, required viewports, diagnostics, and Phase 1–3 lifecycle/camera/cache behavior.

## 5. Phase 5 — Original atmosphere images and material assets

- [x] 5.1 Complete a CSS-and-Globe-material-only review at all desktop viewports and record whether generated atmosphere imagery materially improves the composition without competing with the Globe.
  - Baseline reviewed at 1280×720, 1366×768, 1440×900, and 1920×1080 with one Globe canvas, no document overflow, and no page errors. CSS and Globe materials remain complete; restrained edge-only imagery is justified to add material depth to wide empty margins, especially at 1920×1080, without changing the central hierarchy.
- [x] 5.2 If imagery is justified, define prompts, central Globe safe zone, right-panel safe zone, responsive crops, and byte budgets for text-free archival paper, mineral/brass texture, subtle chart points, optical vignette, edge instrument atmosphere, and desktop-wide environment candidates.
  - Candidate prompts require charcoal, ink green, oxidized brass, dark oxblood, aged paper, mineral grain, optical vignette, and peripheral atmosphere with no text or depicted subject. The middle 50–52% width / 76% height is a calm Globe safe zone; the rightmost 25–27% is a darker low-detail panel safe zone. Delivery will use a centered desktop cover crop, target no more than 320 KB at 1920 px wide and 180 KB at 1280 px wide, and retain the existing CSS fallback.
- [x] 5.3 Generate candidates only in this asset phase and reject any output containing text, logo, UI, watermark, map, country border, game-poster imitation, character, dominant starfield, or central competing subject.
  - Two real image-model desktop-wide candidates passed the prohibited-content review and were previewed non-persistently behind the Globe at 1440×900 with the right panel both closed and open. No standalone tile texture was generated because the existing CSS grid/material layer already supplies sufficient repeatable texture without another request.
- [x] 5.4 Present candidates for explicit human selection and proceed with no generated image when none improves the CSS-and-renderer baseline.
  - The user explicitly selected candidate A on 2026-07-18; candidate B remains rejected and must not enter the project.
- [x] 5.5 Convert only selected candidates to WebP or the project-appropriate compressed format, record dimensions/bytes, and implement responsive delivery within the approved safe zones and budgets.
  - Candidate A is delivered only as 1280×721 / 18,662-byte and 1672×941 / 43,520-byte metadata-free WebP files. An Earth-only decorative `<picture>` selects the smaller source through 1366 px, keeps fixed intrinsic dimensions, and now composites inside the Globe workspace above its opaque backdrop but below the chart grid, canvas, markers, tools, and panel. A slightly left-biased cover crop and radial alpha mask make the approved peripheral material legible while suppressing the central Globe zone.
- [x] 5.6 Add CSS-only and blocked/loading-failure fallbacks and verify required content, Globe interaction, and composition remain complete without atmosphere requests.
  - The existing gradient/chart/vignette composition remains on the atmosphere container beneath the optional image. Phase 5 Playwright passed 3/3, including an aborted atmosphere request with stable Globe dimensions, visible exit/directory controls, and a working camera action.
- [x] 5.7 Individually remove rejected temporary candidates and verify no unselected output, prompt scratch file, screenshot, browser artifact, or cache enters the final change.
  - Candidate B, the unreturned first-generation output, the selected PNG source after conversion, every Phase 5 temporary screenshot, and Playwright run-state artifacts were removed individually. The project retains only the two approved WebP deliveries, their durable metadata README, Earth-scoped implementation, and Phase 5 regression test.

## 6. Phase 6 — Comprehensive validation, documentation, and human acceptance

- [x] 6.1 Add fresh-load Globe coverage at 1280×720, 1366×768, 1440×900, and 1920×1080 for canvas/container/header bounds, geographic completeness, controls, markers, panels, image delivery, and document overflow.
- [x] 6.2 Add the 390×844 safety check for non-crash rendering, no infinite or severe horizontal overflow, no runaway canvas size, and a visible Earth exit without requiring a dedicated mobile redesign.
- [x] 6.3 Re-run large-to-small and small-to-large resize checks that preserve canvas identity and verify header, canvas CSS size, drawing buffer, safe viewport, and document width follow the current container.
- [x] 6.4 Validate France, Poland, a tiny country, and a multi-island country for marker bands, mainland/component priority, deterministic return layout, collision, expansion, image-request cap, and truthful overflow.
- [x] 6.5 Validate rapid country/game selection, manual camera interruption, panel open/close compensation, filter changes, and Globe restoration so only the latest semantic target and detail settle.
- [x] 6.6 Repeat Earth → Hub → Earth and Earth → Chronicle → Earth cycles and verify retained state, zero destination canvases, one returning Globe canvas, and no stale controller, RAF, listener, observer, or WebGL action.
- [x] 6.7 Verify no unfinished Atlas switch is user-visible and retain only a contract test proving the internal placeholder creates no canvas, WebGL renderer, animation loop, geography request, or long-lived listener.
- [x] 6.8 Run keyboard, focus-visible, ARIA state, Escape, reduced-motion, cover double-failure, atmosphere failure, LOD failure, and Globe WebGL failure checks.
- [x] 6.9 Inspect production console, hydration output, WebGL diagnostics, geographic/image requests, canvas count, cache reuse, long tasks, and representative FPS/frame delivery against the Phase 1 baseline without inventing unavailable metrics.
- [x] 6.10 Update `docs/00_PROJECT_INDEX.md`, `docs/01_PRODUCT_SPEC.md`, `docs/02_FEATURE_MAP.md`, `docs/03_ARCHITECTURE.md`, and applicable asset/data documentation to describe the completed 3D-only Earth delivery and retained deferred Atlas plan.
- [x] 6.11 Run `openspec validate redesign-earth-explorer --strict`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and all relevant Earth Playwright suites, and record every actual result.
- [x] 6.12 Review the complete diff and verify it is limited to Earth Explorer, Earth-owned tests/data/docs/assets, with no Hub, Chronicle, RAWG, source-schema, inference, route, dependency, or backup-branch mutation.
- [x] 6.13 Obtain explicit human visual acceptance of the 3D Orbital Globe, including optional assets if adopted; until recorded, do not sync, archive, commit, push, or merge.
  - The user explicitly accepted the adopted Phase 5 Globe atmosphere/effect before the 2026-07-19 Phase 6 apply turn and requested completion of the final validation workflow. No prohibited finalization action was performed.
