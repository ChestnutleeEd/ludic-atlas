## 1. Homepage Visual Assets

- [x] 1.1 Define desktop and mobile focal safe zones, live-copy exclusion zones, palette constraints, and text-free prompts for the Earth Explorer and Game Chronicle hero images.
- [x] 1.2 Use the image-generation capability to create original variants for both entrances, review them against the world-game-archive and restrained magazine-collage direction, and select one approved image per entrance.
- [x] 1.3 Crop and compress the two approved images into stable modern-format assets under `public/images/home/`, record their intrinsic dimensions and focal positions, and verify the approximate 450 KiB-per-asset target or document any measured exception.

## 2. Landing Structure and Existing Behavior

- [x] 2.1 Restructure `src/components/home/LandingHub.tsx` into a compact brand/context bar plus two semantic full-surface entrance buttons, preserving the existing props, DOM reading order, and callbacks.
- [x] 2.2 Integrate the live collection count and year range into the top bar or entrance metadata and remove the standalone statistics strip.
- [x] 2.3 Render both generated images as responsive visual layers with live DOM copy, explicit focal treatment, accessible button names, and a usable image-failure fallback.
- [x] 2.4 If required, make the minimal hub-only class/padding adjustment in `src/components/GameEarthApp.tsx` while preserving the `hub / earth / archive` state model, existing URL behavior, and all destination branches.

## 3. Scoped Responsive Styling and Motion

- [x] 3.1 Replace the obsolete landing rules in `src/app/globals.css` with hub-scoped `100dvh` desktop styles using an `auto / minmax(0, 1fr)` page grid and an approximately 58:42 entrance grid.
- [x] 3.2 Implement the restrained world-game-archive palette, typography, overlays, and supporting magazine-collage details without sci-fi blue dominance, neon glow, or glass-heavy panels.
- [x] 3.3 Add responsive rules that fit the entire hub without vertical scrolling at 1366×768, 1440×900, and wider desktops, while switching compact/mobile viewports to a vertically stacked, naturally scrollable layout without horizontal overflow.
- [x] 3.4 Add short transform/opacity-based hover and focus feedback using the smallest suitable existing mechanism, plus hub-scoped `prefers-reduced-motion` rules that remove nonessential motion while retaining visible focus feedback.
- [x] 3.5 Audit the final selector set to ensure every new homepage rule is rooted in hub mode or the landing component and does not target Earth Explorer or Game Chronicle internal classes.

## 4. Browser and Performance Verification

- [x] 4.1 Add a focused Playwright homepage spec under `tests/e2e/` that checks document metrics and required-region bounds at 1366×768, 1440×900, and one wider desktop viewport.
- [x] 4.2 Extend the homepage spec to verify the approximate asymmetric hierarchy, wide-screen expansion, complete brand/copy visibility, two full interactive surfaces, and the absence of desktop vertical or horizontal overflow.
- [x] 4.3 Add Playwright cases for the existing Earth Explorer and Game Chronicle state transitions, unchanged pathname behavior, keyboard activation/focus visibility, and absence of homepage layers after each transition.
- [x] 4.4 Add Playwright coverage at 390×844 for vertical ordering, natural scrolling, responsive crops, image request success, fallback usability, and absence of horizontal overflow.
- [x] 4.5 Add reduced-motion coverage and verify that nonessential homepage transitions are disabled while focus feedback remains visible.
- [x] 4.6 Inspect a production build with an empty cache to confirm the Earth hero receives lead-image loading priority, responsive sources avoid unconditional maximum-size transfer, both images preserve their focal subjects, and LCP is not delayed by avoidable competing homepage work.
- [x] 4.7 Run visual QA at every specified viewport, including image-failure and reduced-motion states, and adjust only homepage code or assets until the spec scenarios pass.

## 5. Living Documentation

- [x] 5.1 Update `docs/02_FEATURE_MAP.md` with the redesigned landing behavior, new homepage assets, and homepage Playwright coverage.
- [x] 5.2 Update `docs/01_PRODUCT_SPEC.md` to record the confirmed homepage hierarchy, desktop single-screen requirement, mobile stacking behavior, and archival visual direction.
- [x] 5.3 Update `docs/00_PROJECT_INDEX.md` for the new `public/images/home/` asset location and homepage browser-test entrypoint; update `docs/03_ARCHITECTURE.md` only if implementation changes a rendering or asset-delivery strategy beyond this design.

## 6. Final Project Verification

- [x] 6.1 Run `npm run lint` and resolve homepage-related findings.
- [x] 6.2 Run `npm run typecheck` and resolve homepage-related findings.
- [x] 6.3 Run `npm test` and confirm the existing unit suite remains green.
- [x] 6.4 Run `npm run build` and confirm the production build succeeds without homepage image or rendering errors.
- [x] 6.5 Run the focused homepage Playwright suite and the relevant existing Earth Explorer browser regression suite, then confirm no destination-page regression was introduced.
