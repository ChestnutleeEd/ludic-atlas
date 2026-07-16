## Context

The current homepage is rendered by `LandingHub` inside the client-side `GameEarthApp` shell. `GameEarthApp` owns a local `mainViewMode` union (`hub / earth / archive`) and conditionally mounts the landing hub or one of the two destination experiences. The current landing markup creates a large vertical masthead, two fixed-height portal cards, and a separate collection strip inside multiple nested `min-height: calc(100vh - 40px)` and centered max-width constraints. In measured desktop viewports this produces vertical scrolling at 1366×768 and 1440×900, while a 1920-pixel-wide display leaves substantial unused side space.

The redesign must change only the landing surface. Earth Explorer and Game Chronicle are regression-sensitive and keep their current rendering, local state, and return-to-hub behavior. The implementation must use two original generated images, but the images are content-free visual layers: all labels and copy remain semantic React markup. No new dependency is justified because CSS, Motion, GSAP, Next.js image delivery, and Playwright are already available.

## Goals / Non-Goals

**Goals:**

- Fit the complete desktop homepage into `100dvh` without document scrolling at 1366×768, 1440×900, and wider desktop sizes.
- Establish a roughly 58:42 dual-entrance composition with Earth Explorer as the visual lead.
- Use wide-screen space for the entrance narrative while keeping safe margins and readable line lengths.
- Express a restrained world game archive with selective retro magazine collage detail.
- Integrate collection count and year range into the compact top bar or entrance metadata.
- Deliver two original, text-free generated entrance images with robust responsive cropping, failure fallback, and controlled LCP impact.
- Preserve accessible full-card buttons, keyboard focus, local view transitions, and reduced-motion behavior.
- Keep homepage CSS and rendering changes isolated from both destination views.

**Non-Goals:**

- Changing Earth Explorer or Game Chronicle component markup, styling, data, or internal interactions.
- Replacing `mainViewMode` with routes, URL parameters, persistent navigation state, or a new state manager.
- Changing `gameCatalog`, its statistics, or any data schema.
- Creating a generic design-system abstraction for a one-page redesign.
- Adding new image, animation, carousel, or layout dependencies.
- Generating the final images during the proposal phase.

## Decisions

### 1. Make the hub own one viewport and one layout grid

At desktop breakpoints, hub mode will own `height: 100dvh` and `overflow: hidden`. `LandingHub` will use a two-row grid: a compact brand/context bar (`auto`) followed by the dual entrance stage (`minmax(0, 1fr)`). The entrance stage will use columns close to `minmax(0, 58fr) minmax(0, 42fr)` and a bounded fluid gap. The homepage will remove the separate collection strip; its count and year range move into the top bar or entrance metadata.

The implementation may simplify the hub branch classes in `GameEarthApp.tsx` so hub padding and width are owned in exactly one place. Earth and archive branch classes remain unchanged. `LandingHub.tsx` continues to receive the existing props and callbacks, so state ownership and destination rendering lifecycle do not change.

Alternative considered: keep the existing centered column and compress typography/card heights. Rejected because it preserves the unused wide-screen area and makes 1366×768 depend on fragile pixel reductions.

### 2. Use a deliberate desktop/mobile layout boundary

Desktop and sufficiently wide landscape viewports use the fixed one-screen composition. Below the selected desktop breakpoint, the hub switches to `height: auto`, `min-height: 100dvh`, `overflow: visible`, and a single-column entrance stack. The mobile document is intentionally scrollable; neither entrance is squeezed into a half-height panel merely to preserve a one-screen claim that applies only to desktop.

The existing 900px homepage breakpoint is the initial candidate because it already separates the dual and stacked portal layouts. During implementation it must be checked against content fit and landscape tablets; the final breakpoint may move slightly without changing the requirement.

Alternative considered: preserve 58:42 at every width. Rejected because narrow cards would compromise Chinese titles, image focal crops, and touch targets.

### 3. Keep both entrances as semantic full-surface buttons

Each entrance remains one native `<button type="button">` connected to the current `onOpenEarth` or `onOpenArchive` callback. Visual layers, generated imagery, metadata, and arrow treatments remain descendants of the button and do not create nested interactive elements. Focus-visible styling must be at least as perceptible as hover styling. The DOM order remains Earth Explorer followed by Game Chronicle, matching visual order and primary emphasis.

Alternative considered: convert entrances to links. Rejected for this change because navigation is still local state rather than route navigation.

### 4. Generate and deliver two purpose-built text-free images

Implementation will use the image-generation capability to create one Earth Explorer image and one Game Chronicle image. Prompting and selection will enforce the shared archival palette and leave negative space for live copy. No title, label, number, logo, or pseudo-interface text may be baked into either image.

Selected source assets will live under `public/images/home/` with stable descriptive names. They will be cropped/compressed to a modern web format, retain enough source resolution for wide desktop rendering, and target no more than about 450 KiB per final source asset (about 900 KiB combined) unless visual QA demonstrates that a modest exception is necessary. Focal position will be explicit per entrance and may change at the mobile breakpoint.

The project will use the framework's existing responsive image delivery rather than shipping the maximum source dimensions to every viewport. The Earth image is the likely LCP candidate and receives explicit high-priority/preload treatment. The Chronicle image must remain promptly visible without competing unnecessarily with the lead image. A CSS archival color/texture layer remains beneath each image so request failure does not remove contrast, copy, or clickability.

Alternative considered: keep CSS-drawn planet and cabinet illustrations. Rejected because those abstractions are the principal source of the current low-fidelity presentation and cannot deliver the requested authored visual character.

Alternative considered: embed titles into the generated artwork. Rejected because it harms accessibility, localization, responsive composition, and future copy editing.

### 5. Scope visual rules to hub mode

New or replaced CSS selectors will be rooted under `.game-earth-shell.is-hub-mode` and/or `.ludic-atlas-hub`. Generic selectors such as unqualified `button`, `h1`, `.glass-panel`, or shared destination classes will not be used for the redesign. Any existing homepage selectors that become obsolete will be removed or replaced only after confirming they have no destination consumers.

The ambient backdrop used by non-archive modes must be explicitly neutralized or restyled only in hub mode. The Earth Explorer and Game Chronicle branches keep their current backdrop and layout rules. No destination component file should require modification.

Alternative considered: append another late global override block. Rejected because the current stylesheet already has multiple override generations; adding unscoped cascade layers would raise regression risk.

### 6. Keep motion local, transform-based, and optional

Default interaction may use short opacity, transform, crop-position, or overlay transitions. Motion will not resize the grid, trigger document reflow, run an elaborate entrance sequence, or continuously animate large raster layers. Existing CSS is preferred for hover/focus; Motion or GSAP is used only if layered choreography materially improves the result.

A hub-scoped `prefers-reduced-motion: reduce` rule disables nonessential image drift, parallax, and animated collage offsets while retaining immediate focus, contrast, and state feedback.

Alternative considered: add a dedicated parallax or animation package. Rejected because the effect does not justify dependency and bundle cost.

### 7. Test observable layout bounds and behavior in Playwright

A focused homepage spec under `tests/e2e/` will open a fresh hub state and exercise 1366×768, 1440×900, one wider desktop viewport, and 390×844 mobile. Desktop assertions will combine document scroll metrics with bounding-box checks for the top bar and both entrances; a zero `scrollHeight - clientHeight` result alone is insufficient if a fixed region is clipped. Wide-screen coverage will assert that the entrance stage expands beyond the old narrow-column footprint.

The suite will activate each entrance using normal user input and assert the existing `data-main-view` transition. Separate fresh-page cases avoid coupling the two checks through destination return controls. Mobile coverage verifies vertical ordering, natural vertical scrolling when needed, and no horizontal overflow. Reduced-motion coverage emulates the user preference and confirms that nonessential transitions/animations are disabled. Responsive image checks verify successful requests, nonzero rendered bounds, correct aspect-preserving fit, and an appropriately sized current source.

Existing Earth Explorer tests remain a regression boundary. Game Chronicle does not need a new internal-page suite for this change, but the homepage transition test must confirm its branch renders without homepage layers.

## Risks / Trade-offs

- [Generated artwork has the wrong focal balance] → Define desktop and mobile safe zones in the prompts, generate variants, and approve crops in all required viewports before wiring final filenames.
- [A strict `100dvh` layout clips content under font substitution or browser zoom] → Use `minmax(0, 1fr)`, fluid type/spacing clamps, bounded copy widths, and explicit region-bound checks at the minimum viewport; allow the mobile/compact breakpoint to switch to scrolling before content becomes unsafe.
- [Large artwork regresses LCP] → Enforce compressed source budgets, responsive candidates, high priority only for the lead image, and production-build performance inspection before acceptance.
- [Hub rules leak into destination views through the global stylesheet] → Root every new rule in hub mode, avoid shared destination classes, and run entrance-transition plus existing regression tests.
- [58:42 becomes visually unbalanced after real images arrive] → Treat 58:42 as an approximate target; preserve Earth as the larger column while allowing a small ratio adjustment during cross-viewport visual QA.
- [Image failure creates unreadable copy] → Keep independent contrast overlays and archival fallback backgrounds beneath image layers.
- [Using both Motion and GSAP increases complexity] → Choose the smallest existing mechanism needed; CSS-only interaction is the default, not a mixture of all three.

## Migration Plan

1. Generate, review, crop, and compress the two homepage images without changing runtime code.
2. Restructure `LandingHub` while preserving its prop contract and native button callbacks.
3. Replace homepage-only CSS with the scoped desktop/mobile layout and reduced-motion rules.
4. Make only the minimal hub-shell class adjustment in `GameEarthApp` if required to establish single ownership of viewport padding and height.
5. Add Playwright coverage and run visual checks at every required viewport.
6. Run lint, typecheck, unit tests, production build, homepage Playwright tests, and relevant existing regression tests.
7. Update living documentation for the new homepage behavior and asset paths.

Rollback is limited to reverting the hub component, hub-scoped styles, generated homepage assets, tests, and documentation; no data or route migration is involved.

## Open Questions

- Which generated image variants best preserve the required archival tone and text-safe focal zones? This is resolved through implementation-stage image review, not by changing the layout contract.
- Does the existing 900px stacking breakpoint remain the best boundary after final typography and artwork are in place, or should it move slightly to protect landscape tablet readability?
- Can both final images remain within the proposed 450 KiB-per-source budget without visible archival texture degradation? Any exception should be documented with measured production impact.
