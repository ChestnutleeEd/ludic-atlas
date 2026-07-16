## Why

The current Ludic Atlas landing hub underuses wide desktop space and cannot keep the brand, both product entrances, and supporting copy inside common desktop viewports without vertical scrolling. Redesigning the hub now establishes a clearer product identity and a reliable entry experience before further work deepens the two destination experiences.

## What Changes

- Replace the current stacked landing composition with a desktop `100dvh` single-screen hub that fits without vertical scrolling at 1366×768, 1440×900, and wider desktop viewports.
- Present Earth Explorer and Game Chronicle as a roughly 58:42 asymmetric pair, with Earth Explorer as the visual lead while both full entrance surfaces remain independently clickable.
- Reframe the visual direction around a restrained “world game archive,” supported by selective retro game-magazine collage details and warm archival materials rather than sci-fi blue, neon, or glass-heavy styling.
- Remove the standalone collection statistics strip and integrate collection count and year-range information into the brand bar or entrance labels.
- Introduce two original, text-free entrance hero images during implementation, with responsive cropping and delivery optimized for LCP.
- Add restrained interaction motion using existing CSS, Motion, or GSAP capabilities and provide a reduced-motion presentation through `prefers-reduced-motion`.
- Preserve the existing `hub / earth / archive` local-state transitions, destination behavior, data flow, and route architecture.
- Allow the mobile hub to stack vertically and scroll naturally while retaining two complete, readable entrance controls.
- Isolate all new landing-page styles so they do not alter Earth Explorer or Game Chronicle internal pages.
- Add Playwright coverage for desktop viewport fit, mobile stacking, responsive imagery, and the two existing entrance transitions.

Non-goals:

- Redesigning or changing behavior inside Earth Explorer or Game Chronicle.
- Introducing URL routes, deep links, or a new top-level navigation architecture.
- Changing game data, exploration state, destination filters, or destination interaction models.
- Adding new runtime dependencies or heavy animation systems.

## Capabilities

### New Capabilities

- `homepage-hub`: Defines the full-screen desktop landing hub, asymmetric dual entrances, archival visual treatment, original responsive imagery, motion accessibility, interaction preservation, style isolation, performance expectations, and responsive browser coverage.

### Modified Capabilities

None. No existing OpenSpec capabilities are present.

## Impact

- Primary implementation areas: `src/components/home/LandingHub.tsx` and the landing-scoped rules in `src/app/globals.css`.
- `src/components/GameEarthApp.tsx` may receive only minimal shell-class or rendering-boundary adjustments required to isolate the hub; its existing view-state behavior remains unchanged.
- Two generated image assets will be added under a homepage-specific directory such as `public/images/home/` during implementation, with no text embedded in either image.
- Playwright coverage will be added under `tests/e2e/` for the landing hub; existing Earth Explorer and Game Chronicle regression behavior must continue to pass.
- Living documentation will be updated where homepage behavior, assets, or feature-to-file mappings change.
- No API, data-schema, route, or dependency changes are expected.
