## Why

Game Chronicle currently delays its core year-and-game browsing flow behind a large phosphor-green terminal-style hero and index, while archive game selection rejects the 200 catalog records whose `countryCode` is `UNKNOWN`. This change turns the experience into a compact Chronicle Reading Room that matches the landing hub's restrained world-archive brand, makes game content actionable in the first desktop viewport, and isolates archive browsing from Earth Explorer state.

## What Changes

- Replace the black-and-green terminal/dashboard presentation with a warm paper, charcoal, oxblood, and brass editorial archive system aligned with the landing hub, while giving Game Chronicle its own reading-room composition.
- Recompose desktop Game Chronicle around a compact masthead, immediately operable year index, current-year feature, game collection, compact search/filter tools, and an archive detail reading layer.
- Provide a mobile-specific 390×844 composition with a compact header, sticky year navigation, current-year feature, touch-safe collection flow, accessible filters, and a full-screen or bottom-sheet detail layer rather than shrinking the desktop grid.
- Move archive game selection to archive-owned state so every catalog game, including all `UNKNOWN` country records, opens the correct dossier without changing Earth Explorer's country, region, selected game, or camera state.
- Consolidate year grouping, representative-game selection, average ratings, filter options, and result statistics as derived archive data instead of parallel state sources.
- Clarify year navigation and sorting semantics, add discoverable rail position/boundary behavior, and support keyboard year navigation with Enter, Space, Arrow keys, Home, and End.
- Preserve search, genre/platform OR filters, sorting, empty states, existing covers, fallback recovery, Escape close, focus trapping/restoration, and reduced-motion behavior while making them testable archive requirements.
- Define, but do not generate in this change proposal, one original text-free archive reading-room hero asset with responsive crop, loading, failure, and file-budget requirements.
- Add archive-focused unit and Playwright coverage plus the living-documentation updates required by the implemented behavior and architecture.

### Non-goals

- No landing hub visual or interaction changes.
- No Earth Explorer visual changes and no change to Earth reducer semantics.
- No new route or pathname-driven view state.
- No game schema, catalog record, RAWG generation, country inference, or cover-source migration.
- No unrelated global CSS cleanup, new backend, account feature, or unnecessary dependency.
- No deletion or modification of backup branches.

## Capabilities

### New Capabilities

- `game-archive-reading-room`: Defines the branded desktop and mobile Game Chronicle browsing experience, archive-owned selection state, derived year model, search/filter/sort behavior, game dossier interaction, image and motion behavior, accessibility, isolation, and responsive acceptance criteria.

### Modified Capabilities

None. The existing `homepage-hub` capability remains unchanged; its local archive entrance and pathname behavior are compatibility constraints for this change.

## Impact

- Primary source areas: `src/components/archive/GameArchiveView.tsx`, `ArchiveTimeline.tsx`, `ArchiveYearModal.tsx`, `ArchiveDossier.tsx`, archive-specific styles in `src/app/globals.css`, and the archive integration boundary in `src/components/GameEarthApp.tsx`.
- Verification areas: new archive model/state tests and Playwright coverage, plus existing homepage and Earth Explorer regressions.
- Documentation areas: `docs/01_PRODUCT_SPEC.md`, `docs/02_FEATURE_MAP.md`, and `docs/03_ARCHITECTURE.md` when implementation changes the documented archive behavior and state boundary; an archive asset note will record the future original image specification.
- Compatibility: the single `/` route, `GameEarthApp.mainViewMode`, landing hub callbacks, static game data, current covers, localization helpers, and all Earth Explorer behavior remain intact.
- Performance and data risks: 992 games, 17 year groups, 518 remote cover URLs, large local cover files, responsive image sizing, long-list rendering, and rapid year/filter changes must remain bounded and deterministic.
- No new runtime API or dependency is planned. Existing Motion, GSAP, CSS, Next.js image support, Sharp tooling, and cover fallback helpers are sufficient; implementation should remove or avoid animation machinery that does not justify its cost.
