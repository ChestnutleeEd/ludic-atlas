## Context

Game Chronicle is rendered by the existing single-page product shell: `src/app/page.tsx` renders `GameEarthApp`, and `GameEarthApp.mainViewMode` selects hub, Earth, or archive without changing `/`. The implemented archive path is `GameArchiveView` → `ArchiveTimeline` → `ArchiveYearModal` → `ArchiveDossier`; archive selection is now local and all 992 current records, including 200 `UNKNOWN` country entries, resolve by ID without Earth reducer dispatch.

The catalog is a synchronous static input of 992 games spanning 17 valid years. Archive grouping, representatives, preview covers, average ratings, genres, and platforms are derived deterministically. The first Apply pass introduced a scoped warm-paper reading room and one shared 2400×1600 atmosphere image, but every year still uses that same background and the annual collection mounts every game card at once. Covers include local and remote sources with materially different file sizes and latency, so this refinement adds year-specific real-cover composition and bounded image loading without changing source records or RAWG generation.

This work affects the product shell boundary, archive components, an archive data/model layer, isolated archive styling, tests, and living documentation. It must preserve the local view switch, source catalog, routes, hub, Earth reducer semantics, Earth camera lifecycle, and RAWG pipeline.

## Goals / Non-Goals

**Goals:**

- Make the core year-and-game browsing flow visible and operable in the first viewport at all required desktop sizes.
- Provide a purpose-built 390×844 mobile flow without horizontal document overflow or competing scroll gestures.
- Make archive year and game selection fully local to the archive and able to resolve every supplied game, including `UNKNOWN` country records.
- Establish one minimal control-state model and derive all chronology, statistics, representative, and effective-selection data from it.
- Preserve and clarify search, filter, sort, year navigation, dossier, fallback, and empty-state behavior.
- Meet keyboard, focus, reduced-motion, image stability, style isolation, and hub/Earth regression requirements.
- Express the Chronicle Reading Room through the established paper, ink, oxblood, and brass brand vocabulary without copying the hub layout.

**Non-Goals:**

- Redesigning or changing the behavior of the landing hub or Earth Explorer.
- Changing `explorerState`, Earth reducer actions, globe camera behavior, routes, pathname semantics, the game schema, RAWG generation, or country inference.
- Migrating cover sources, cleaning unrelated global CSS, introducing a new state library, adding a backend, or adding an animation/image dependency.
- Generating the final original hero image during proposal work.

## Decisions

### 1. Keep view ownership in `GameEarthApp`, move archive selection behind the archive boundary

`GameEarthApp.mainViewMode` remains the only hub/Earth/archive view state. `GameEarthApp` will continue passing the catalog and return callback to `GameArchiveView`, but will stop wiring archive game clicks to Earth selection actions. `GameArchiveView` will own `openYearKey` and `selectedArchiveGameId` with the other archive controls. Entering, browsing, closing, and leaving the archive will not dispatch to the Earth reducer.

This is preferred over adding archive cases to the Earth reducer or introducing a shared store because archive selection has different validity rules and lifecycle semantics. It also creates a testable boundary: snapshots of Earth exploration state before and after an archive session must be identical.

### 2. Use minimal control state and a pure derived archive model

The archive's authoritative state will be:

- `query`
- `selectedGenres`
- `selectedPlatforms`
- `sortMode`
- `openYearKey`
- `selectedArchiveGameId`

`openYearKey` will use a distinct serializable key for unknown-year results rather than overloading `null`, which remains the closed state. A pure archive model module, colocated under `src/lib/` or the archive feature, will normalize searchable text, build filter options, apply query and filter predicates, group results, order groups and games, choose representatives and previews, calculate ratings and counts, and resolve valid active/selected fallbacks. Its functions will accept games plus control values and return derived values; derived collections will be memoized at the component boundary where profiling shows value.

This is preferred over synchronizing multiple `currentYear`, `focusedYear`, `expandedYear`, and `currentGame` states through effects. A pure model makes the 992-record selection matrix and sorting semantics easy to test and prevents effect ordering from letting stale year or game values overwrite newer input.

### 3. Define deterministic invalidation and sorting rules

When query or filters remove the open year, the view resolves the first group in the active sort order; when no groups remain, it renders the empty state and clears effective year/detail output. When the selected game no longer belongs to the effective result set, the dossier closes rather than showing stale content. The source ID remains the only game-selection key.

The year index always orders groups by year descending with unknown-year results placed after valid years. The `rating-desc` control is presented as `馆藏评分优先` and orders games within each group by rating descending and then title/ID; it never changes the year index. The default collection order is title/ID. These explicit rules replace the current rating option's accidental oldest-year behavior.

### 4. Compose desktop as a bounded reading workspace

The desktop archive will use a compact brand/masthead row plus a bounded workspace with:

- a left chronological year index;
- a central current-year editorial feature with a representative real cover and year context;
- a right annual collection with immediately actionable game entries;
- a compact search/filter/sort toolbar integrated above or within the workspace;
- a portal-based dossier reading layer above the workspace.

The workspace will size against the viewport (`100dvh` with safe fallbacks) and allow internal collection scrolling where needed. At 1366×768, 1440×900, 1920×1080, and 1280×720, document scrolling must not be required before the year navigation, active year, cover, tool entry, and detail action can be used. This composition is preferred over retaining a large hero because chronology and game discovery are the page's primary jobs.

### 5. Compose mobile from the same model, not the desktop grid

At the mobile breakpoint, the component tree will render a compact top bar, a sticky and touch-safe year navigator, the current-year feature, a vertical game collection, a filter sheet, and a full-screen or viewport-anchored dossier. Data and control state remain shared with desktop; only composition and interaction affordances change.

The year navigator may scroll horizontally, but it will use explicit containment and touch-action rules so vertical page scrolling remains native. The game collection will be vertical, and no fixed desktop column width may propagate into the mobile document. This is preferred over CSS-only compression of the three-column workspace because the reading priority and available gestures differ materially on mobile.

### 6. Make the year index a semantic single-selection navigator

Year entries will be real buttons in a labeled navigation/listbox-like structure with exactly one current state. Roving `tabIndex` keeps the rail concise while Arrow keys move focus according to orientation, Home/End jump to boundaries, and Enter/Space activate. Pointer and touch activation use the same selection function. Focused/active entries will scroll into view without smooth motion when reduced motion is requested. Newer/older controls communicate and enforce their disabled boundaries.

This is preferred over click handlers on visual cards because native controls provide activation semantics, focusability, and disabled behavior without custom emulation.

### 7. Keep the dossier as an archive-namespaced portal dialog

`ArchiveYearModal` and `ArchiveDossier` can retain their useful portal/dialog responsibilities but will be refactored into one coherent archive detail layer. The selected archive ID resolves directly against archive results, not Earth state. Opening records the exact game trigger; closing via Escape, backdrop policy, or explicit control restores that trigger when it still exists. The dialog receives initial focus once per open lifecycle, traps focus, prevents background interaction, and scrolls long content internally. Switching games while the layer remains open updates content and selected semantics without refocusing the close button.

A portal dialog is preferred over inline expansion because it preserves room for a rich dossier on desktop and a full-screen reading layer on mobile. Portal selectors and IDs will use an archive-specific namespace.

### 8. Isolate the new visual system with an archive root and CSS Module

The reading-room component will receive a unique root class and its component-level styles will move to an archive CSS Module where practical. Portal content will have its own unique archive namespace. Only a narrowly scoped shell hook may remain global if needed for the outer application surface. The old archive selectors in `globals.css` will be removed only when they are directly superseded and proven archive-only; unrelated global cleanup is excluded.

CSS custom properties scoped to the archive root will map warm paper, ink/charcoal, oxblood, brass, fine rules, and texture. Typography, spacing, and component shapes will distinguish chronology, catalog entries, tools, and reading surfaces instead of repeating one rounded outlined card. This is preferred over adding a fourth global override layer, which would preserve cascade ambiguity and increase cross-view risk.

### 9. Preserve cover sources and specify image geometry at the component boundary

Existing cover URLs and the centralized fallback helper remain authoritative. Cover components will reserve an explicit aspect ratio and intrinsic dimensions, apply responsive display sizing, lazy-load below-the-fold collection images, and prioritize only the representative visual needed in the first viewport. Failure swaps to a stable same-geometry fallback while retaining title and action content. Remote-source constraints will be respected rather than forcing a source migration.

The future original visual will live under `public/images/archive/` after approval. Before generation, an asset note will define a text-free archive reading-room subject, warm material palette, globally representative game-culture mood, prohibited logos and embedded lettering, target dimensions, focal/crop safe zones for desktop and mobile, DOM-text separation, loading priority, CSS fallback, and a compressed WebP/AVIF budget of at most 350 KB. The asset remains optional to functionality, so a paper/print CSS treatment is the deterministic fallback.

### 10. Limit motion to state communication and remove deferred animation risk

CSS transitions will handle short hover, focus, and selection feedback. Existing Motion may be used for the filter or dossier layer only when it improves spatial continuity; no dependency is added. The archive intro does not require GSAP. Any legacy deferred GSAP setup replaced by this structure will be removed from the archive path rather than retained solely for decoration.

Under `prefers-reduced-motion: reduce`, transitions, smooth scrolling, and entrance transforms become immediate, and no content depends on animation completion. This is preferred over maintaining timeline animation state because year/filter/game correctness must be synchronous and rapid view changes must not initialize work against an unmounted archive.

### 11. Verify behavior at pure-model, component, and browser boundaries

Node tests will cover search normalization, filter algebra, group and representative derivation, rating averages, deterministic sorting, unknown-year keys, invalidation, and all 992 game IDs. Playwright tests will cover entry/return/pathname, Earth-state non-interference, `UNKNOWN` dossier selection, keyboard year navigation, filter/sort/empty state, focus trapping/Escape/restoration, image failure, reduced motion, and required desktop/mobile geometry. Existing homepage and Earth suites remain regression gates.

Browser assertions will use `getBoundingClientRect`, `scrollWidth/clientWidth`, and `scrollHeight/clientHeight` rather than screenshots alone. Temporary captures and logs remain untracked. Lint, typecheck, Node tests, build, and Playwright are all final gates.

### 12. Refine the visual system into a Contemporary Game Archive

The warm paper, charcoal, oxblood, brass, serif-year, and editorial identity remain. Controls and body copy move to a modern system sans stack; borders become hairlines; panels use 8–14 px radii, tonal surface separation, and restrained soft shadows. Serif display typography is reserved for years, game titles, and editorial headings. Selected years use an oxblood surface, brass indicator, gentle lift, and clearer scale rather than a rotated paper-label treatment. Selected games use depth and a narrow accent marker without converting the list into generic dashboard cards.

This evolves the existing Lo-Fi material anchor rather than replacing the product palette. It is preferred over a wholesale visual rewrite because the archive brand remains recognizable while the interaction layer becomes contemporary and less literal.

### 13. Use one atmosphere asset plus a data-driven annual cover stage

Choose dynamic composition (Option B) over 17 pre-rendered WebP collages. `GameArchiveView` will reuse the 139 KB atmosphere asset as a low-cost material layer and render the active group's representative plus the next 2 highest-rated real covers as positioned DOM images. Each group receives a deterministic `yearVariant` derived from its chronological key to select cover offsets, crop positions, rotation limits, depth, and one restrained oxblood/brass tonal bias. The DOM exposes the three cover IDs as the annual visual signature for tests.

This avoids generating 17 duplicate background bitmaps, preserves source artwork, remains correct under search/filter changes, and makes failure fallback composable. The cost is three active cover requests instead of one annual bitmap; the unified optimized cover component and small requested sizes bound that cost.

### 14. Centralize archive image behavior in `ArchiveCover`

Add an archive-local component based on Next Image where supported by current remote-image configuration. It reserves a 2:3 box, exposes `loading/skeleton/loaded/error` state, swaps failures to the existing brand fallback without a broken icon, and accepts explicit `sizes`, `priority`, and visual role. The annual stage and dossier reuse it; the collection requests the first 8 entries eagerly/high-priority as appropriate and later entries lazily.

The annual collection will render an initial batch of 8 cards and append a bounded batch when an `IntersectionObserver` sentinel approaches the scroll container. It will reset synchronously on year/filter changes. Adjacent-year intent may prefetch at most 3 optimized thumbnails during idle time. This is preferred over a virtual-list dependency or generating a second archive data cache because the list sizes are moderate and no source schema changes are allowed.

### 15. Coordinate direction-aware Motion without owning state

`GameArchiveView` tracks only the previous chronological index in a ref to derive `-1/1` transition direction; the authoritative year remains `openYearKey`. Keyed Motion wrappers animate the annual stage and collection 220–320 ms with small direction-aware x offsets, opacity, and feature scale. Visible collection covers use a capped stagger. `AnimatePresence` uses replacement semantics so an exiting year cannot write state or reappear after rapid selection. Hover lift and cover zoom remain CSS.

The drawer uses the same duration/easing family. Under reduced motion, Motion receives zero duration/no transforms and CSS disables hover displacement, scale, stagger, and smooth scrolling.

### 16. Measure before and after in the real browser

Before image changes, record DOM image count, actual image requests, transfer sizes, initiators, and local/remote URLs for initial entry and one year switch. After implementation, repeat under the same viewport/cache conditions and record initial priority count, later batch behavior, optimized `/_next/image` URLs, transferred bytes, and image requests added by a year change and scroll. Use Playwright/Performance Resource Timing plus browser Network observations; do not commit trace, screenshots, or output files.

## Risks / Trade-offs

- **[Dense first viewport reduces breathing room]** → Use compact hierarchy and internally scrollable secondary collections while keeping readable minimum sizes; validate all four desktop geometries with measured assertions.
- **[Desktop and mobile compositions can drift]** → Share one model, state owner, controls, and content primitives; vary only layout wrappers and presentation at a documented breakpoint.
- **[Legacy archive rules remain in the global bundle]** → Remove only confirmed superseded archive rules and enforce a unique root/module for new styles; defer unrelated stylesheet cleanup.
- **[Remote covers fail or decode slowly]** → Reserve geometry, retain centralized fallback, limit first-view priority, and test failed images without depending on network success.
- **[Three-cover annual stages add requests]** → Reuse only active-year covers, request bounded optimized widths, and never mount stages for inactive years.
- **[Next Image optimization can fail for an unconfigured remote host]** → Verify existing `remotePatterns`; retain `ArchiveCover` fallback and report any origin that bypasses optimization.
- **[Progressive batches can hide a keyboard target]** → Keep load-more sentinel behavior deterministic, expose result totals, and append batches without removing already focused cards.
- **[Exit animations can retain old images briefly during rapid input]** → Keep transitions below 320 ms, use keyed replacement, and test final cover signature after rapid selection.
- **[Filtering 992 records on each keystroke causes avoidable work]** → Keep transforms pure, normalize reusable fields once where justified, memoize derived stages, and measure before adding virtualization or deferred input.
- **[Portal focus management regresses during in-dialog selection]** → Separate open-lifecycle focus from selected-game updates and test focus trap, Escape, restoration, and trigger removal explicitly.
- **[Pending hero art blocks layout completion]** → Treat the visual as progressive enhancement with fixed geometry and a production-quality CSS fallback; approve the written asset brief before generation.
- **[Rating sort expectations can be misread as a year sort]** → Use the fixed `馆藏评分优先` label and assert that year chronology never changes.

## Migration Plan

1. Add pure archive-model tests and implementation while preserving the current rendered archive.
2. Move archive selection ownership out of the Earth callback path and add Earth-state non-interference plus all-catalog selection coverage.
3. Introduce the scoped reading-room root and desktop/mobile structure using the derived model.
4. Replace year, tool, collection, and dossier interactions incrementally, retaining existing cover/fallback sources.
5. Add the approved asset specification and CSS fallback; generate/integrate the final visual only in a separately authorized implementation step after human approval.
6. Remove only archive code/styles made unreachable by the replacement, update living documentation, and run the full verification matrix.

No data migration or route rollout is required. Rollback consists of reverting the archive feature changes and the `GameEarthApp` archive prop boundary; Earth state and catalog data remain unchanged throughout.

## Open Questions

- Confirm the final hero-art subject, focal point, and crop-safe composition from the written asset brief before any image generation.
The fixed implementation decisions are an edge-bound desktop reading drawer, a full-screen mobile detail layer, and the `馆藏评分优先` label. No interaction decision remains open.
