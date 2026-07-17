# Game Archive Reading Room Specification

## Purpose

Define the responsive, accessible, performant, and visually isolated Game Chronicle reading room, including archive-owned browsing state, chronology navigation, filtering, dossiers, imagery, and motion behavior.

## Requirements

### Requirement: Preserve the local Game Chronicle entrance
The system SHALL continue to open Game Chronicle through `GameEarthApp.mainViewMode` on the existing page, SHALL provide a return action to the landing hub, and SHALL NOT introduce an archive route or pathname change.

#### Scenario: Enter and leave the reading room
- **WHEN** a user activates the Game Chronicle entrance and later activates the return action
- **THEN** the main view changes from hub to archive and back to hub while the browser pathname remains unchanged

### Requirement: Present an immediately browsable desktop reading room
At 1366×768, 1440×900, 1920×1080, and 1280×720, the initial Game Chronicle viewport SHALL expose an operable year navigation, the current year, at least one real game cover, a search or filter entry, and an actionable game-detail entry without requiring document scrolling.

#### Scenario: Open archive on a supported desktop viewport
- **WHEN** Game Chronicle finishes rendering at any required desktop viewport with the default catalog
- **THEN** the year navigation, active year, real cover content, compact search/filter entry, and game-detail entry are visible and operable within the first viewport

#### Scenario: Use a short desktop viewport
- **WHEN** the viewport is 1280×720
- **THEN** the primary browsing workspace fits without clipping its active controls or requiring document scrolling before a game can be opened

### Requirement: Use a dedicated mobile reading flow
At 390×844, the system SHALL present a compact top bar, sticky or persistently discoverable year navigation, current-year feature, game collection, filter entry, and a mobile-appropriate detail layer without reproducing the desktop three-column composition at a smaller scale.

#### Scenario: Browse at the required mobile viewport
- **WHEN** Game Chronicle is rendered at 390×844
- **THEN** the document has no horizontal overflow, vertical document scrolling remains usable, and horizontal or gestural controls do not prevent the user from scrolling the collection vertically

#### Scenario: Open details on mobile
- **WHEN** a mobile user opens a game dossier
- **THEN** the dossier uses a full-screen or bottom-layer reading treatment with an explicit close action and without content extending beyond the viewport width

### Requirement: Own archive selection independently from Earth Explorer
Game Chronicle SHALL own `openYearKey` and `selectedArchiveGameId` within the archive experience. Selecting or closing archive content SHALL NOT dispatch Earth game-selection actions or change Earth Explorer's selected country, active region, selected game, camera mode, or selection revision.

#### Scenario: Select an identified-country archive game
- **WHEN** a user opens a game whose country exists in the Earth catalog
- **THEN** the archive dossier changes to that game while all Earth Explorer exploration state remains unchanged

#### Scenario: Return to Earth after archive browsing
- **WHEN** a user browses multiple archive years and games and later enters Earth Explorer
- **THEN** Earth Explorer resumes with the same exploration state it held before archive browsing

### Requirement: Open every catalog game including UNKNOWN records
The system SHALL allow every game supplied to Game Chronicle to become the selected archive game regardless of whether its `countryCode` is recognized by Earth Explorer.

#### Scenario: Open an UNKNOWN-country dossier
- **WHEN** a user activates a game card whose `countryCode` is `UNKNOWN`
- **THEN** that exact game becomes selected, its card exposes the selected semantic state, and its title, cover, year, rating, genres, platforms, developer, publisher, country label, and description populate the dossier

#### Scenario: Verify the current complete catalog
- **WHEN** the current 992-game catalog is exercised by archive selection tests
- **THEN** all 992 records, including the 200 current UNKNOWN-country records, resolve to their own dossier without rejection by country mapping

### Requirement: Derive the archive model from source games
The system SHALL derive year groups, valid year range, representative games, preview covers, average ratings, filter options, result counts, active group, and effective selected game from the source games and the minimal archive control state. It SHALL represent an unknown year with a value distinct from the closed-detail state.

#### Scenario: Build the default chronology
- **WHEN** the current unfiltered catalog is loaded
- **THEN** the model produces the complete valid year range, one group per valid or unknown year key, deterministic representative games and previews, and statistics calculated from source records

#### Scenario: Filters invalidate the active selection
- **WHEN** a filter removes the active year or selected game from the result set
- **THEN** the system resolves a deterministic valid year and game fallback or a documented empty state without displaying a dossier from a different result set

#### Scenario: Switch controls rapidly
- **WHEN** the user rapidly changes years, filters, search text, or sorting
- **THEN** the rendered active year, selected card, cover, and dossier all correspond to the latest user intent with no stale state or animation completion overwriting it

### Requirement: Provide correct search filtering sorting and empty states
The system SHALL preserve case-insensitive search across game title, Chinese title, developer, and publisher; genre and platform SHALL remain multi-select OR filters within each category and AND across categories. The year index SHALL always remain newest-to-oldest with unknown years last. The `rating-desc` interface label SHALL be `馆藏评分优先`, and it SHALL order games within the current year collection or search result by descending rating with deterministic title and ID tie-breaks without changing year-index chronology.

#### Scenario: Search archive metadata
- **WHEN** a user enters a title, developer, or publisher term
- **THEN** only games whose indexed archive metadata contains that term contribute to years, statistics, covers, and detail choices

#### Scenario: Combine filters
- **WHEN** a user selects multiple genres and multiple platforms
- **THEN** a game matches when it has any selected genre and any selected platform, and all displayed counts and year groups are recomputed from those matches

#### Scenario: Sort by rating
- **WHEN** the user chooses rating-desc
- **THEN** games in each annual collection follow the documented rating ordering while the year index remains newest-to-oldest

#### Scenario: Show no matches
- **WHEN** no game matches the active search and filters
- **THEN** the system shows an understandable empty state, reports zero results, removes stale year/detail content, and provides a clear way to reset filters

### Requirement: Provide discoverable and keyboard-operable year navigation
The year navigation SHALL expose its purpose, active year, position, and available newer/older boundaries to assistive technology. Year controls SHALL support pointer and touch activation plus Tab, Enter, Space, ArrowLeft/ArrowRight or ArrowUp/ArrowDown according to orientation, Home, and End.

#### Scenario: Navigate years with the keyboard
- **WHEN** keyboard focus is within the year navigation and the user presses an Arrow key, Home, or End
- **THEN** focus moves to the expected adjacent, first, or last available year, the focused year is visible, and activating it updates the current year

#### Scenario: Reach a rail boundary
- **WHEN** the active or visible year is at the newest or oldest boundary
- **THEN** the corresponding navigation control is disabled or otherwise communicates that no further year exists in that direction

#### Scenario: Announce the active year
- **WHEN** a year becomes current
- **THEN** exactly one year control exposes the current semantic state and the current-year content is programmatically associated with it

### Requirement: Provide an accessible archive dossier
The game-detail reading layer SHALL use dialog semantics when it overlays the workspace, set an initial focus target, contain keyboard focus, close with Escape and an explicit close action, restore focus to the triggering game, prevent background interaction while open, and keep long content internally readable.

#### Scenario: Open and close a dossier with the keyboard
- **WHEN** a keyboard user activates a game and later presses Escape
- **THEN** the correct dossier opens, focus stays within it while open, it closes, background interaction is restored, and focus returns to the same game trigger

#### Scenario: Change the selected game inside a year
- **WHEN** a user selects another game from the open annual collection
- **THEN** the dossier updates to that game, the selected semantic state moves to that card, and focus is not unexpectedly reset to the dialog close button

### Requirement: Use the Chronicle Reading Room brand system
Game Chronicle SHALL use a contemporary editorial archive language based on warm paper, charcoal or ink black, oxblood, aged gold or brass, fine rules, restrained print texture, serif years/titles, and modern sans-serif controls/body text. Surfaces SHALL use subtle depth, hairlines, moderate radii, and selective shadows instead of heavy right-angle frames or dense separators. It SHALL avoid phosphor green, technology blue, neon glow, generic glass panels, SaaS dashboard composition, and both uniformly boxed cards and a purely traditional newspaper treatment.

#### Scenario: Render the reading room theme
- **WHEN** Game Chronicle is shown in default mode
- **THEN** its computed colors, typography, surfaces, and separators express the reading-room palette and no phosphor/neon terminal treatment is used for primary hierarchy or state

#### Scenario: Preserve a distinct archive experience
- **WHEN** the archive is compared with the landing hub
- **THEN** both share the world-archive brand language while the archive prioritizes chronology, catalog browsing, and reading rather than copying the hub's 58:42 entrance layout

#### Scenario: Distinguish current selection
- **WHEN** a year or game becomes selected
- **THEN** its state gains clear oxblood/brass contrast, depth, and hierarchy without relying only on a border or color that is difficult to distinguish

### Requirement: Use resilient and proportionally stable imagery
The system SHALL render game covers through one archive-specific image component that retains existing sources and centralized fallback behavior, reserves stable aspect ratios and intrinsic sizing, exposes an immediate skeleton or branded placeholder, and keeps labels and detail actions usable when any image fails. It SHALL prioritize only the first 6–8 visible annual covers, lazy-load later batches when their sentinel approaches the viewport, and SHALL NOT mount or request every annual cover at initial archive entry.

#### Scenario: A game cover fails
- **WHEN** a local or remote cover cannot load
- **THEN** a stable fallback occupies the same reserved geometry and the game's title, year, selection state, and detail action remain available

#### Scenario: Covers render responsively
- **WHEN** archive covers render at desktop and mobile breakpoints
- **THEN** their layout reserves dimensions before decode, uses an appropriate display-size strategy, and does not introduce document overflow or a visible layout shift

#### Scenario: Enter an annual collection
- **WHEN** the archive first opens or a new year becomes current
- **THEN** the representative and first 6–8 collection covers receive priority, all cover slots show immediate reserved placeholders, and later games are added in bounded batches only as the list approaches them

#### Scenario: Approach another year
- **WHEN** a newer or older year control receives pointer or keyboard intent
- **THEN** at most that year's first few optimized cover candidates may be prefetched without requesting the complete year or unbounded original images

### Requirement: Differentiate every annual feature with real covers
For each valid year from 2010 through 2026, the annual feature SHALL combine the shared lightweight archive atmosphere with that group's representative and 2–3 highest-rated real cover sources in a data-driven DOM composition. The system SHALL preserve cover artwork, keep year/title labels as DOM text, apply deterministic year-specific crop/position/accent variations, and SHALL NOT generate independent AI reinterpretations of game characters or posters.

#### Scenario: Compare the complete chronology
- **WHEN** the 17 valid years are visited with the default catalog
- **THEN** each feature exposes a different cover-ID signature and deterministic visual variant while retaining one coherent Contemporary Game Archive system

#### Scenario: Annual feature imagery fails
- **WHEN** one or more annual covers or the shared atmosphere image fail
- **THEN** the remaining real covers and a same-geometry paper/halftone branded fallback continue to distinguish the current year without broken-image icons

### Requirement: Coordinate responsive archive motion
Year changes SHALL coordinate the feature stage, year numeral, representative metadata, and visible collection using 180–360 ms CSS or existing Motion transitions. Forward and backward chronology SHALL use restrained opposing horizontal offsets, the feature SHALL use subtle opacity/depth/scale, and visible covers MAY stagger within a bounded interval. Motion SHALL never delay current state correctness or allow an earlier year completion to overwrite later rapid input.

#### Scenario: Move through adjacent years
- **WHEN** the user activates a newer or older year
- **THEN** the feature and visible collection transition in the matching direction while immediately representing the newly selected year

#### Scenario: Switch years rapidly
- **WHEN** multiple year selections occur before prior transitions complete
- **THEN** React state and rendered labels/covers settle on the final selection without flashback, stale content, or duplicate active years

#### Scenario: Prefer reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** year, cover, and drawer position/scale/stagger effects are removed and the final visual state appears immediately

### Requirement: Measure archive image performance
The implementation SHALL record real-browser archive image request count, transferred bytes, local/remote source behavior, and mounted cover count before and after optimization. Verification SHALL cover initial entry, one year change, and collection scrolling without committing browser traces or temporary screenshots.

#### Scenario: Verify optimized entry
- **WHEN** Network observations are captured on a clean archive entry
- **THEN** the report distinguishes atmosphere, representative, priority collection, lazy collection, local, remote, optimized, and failed requests and demonstrates that the initial view does not request all years or all current-year originals

### Requirement: Specify one original archive hero asset
The change SHALL define one text-free original Chronicle Reading Room visual for `public/images/archive/` with warm archive materials, globally representative game-culture atmosphere, safe desktop and mobile crop zones, live DOM text separation, a failure fallback, and a compressed WebP or AVIF target no larger than 350 KB. Proposal creation SHALL NOT generate the final asset.

#### Scenario: Review the asset specification before generation
- **WHEN** implementation reaches the image task before a final image is generated
- **THEN** the repository contains an asset note describing subject, mood, prohibited text/logos, target dimensions, crop focal point, loading priority, fallback treatment, and file-size budget for human approval

### Requirement: Respect reduced motion and rapid interaction
The archive SHALL provide a static-equivalent `prefers-reduced-motion: reduce` presentation with no required information hidden behind animation. Motion SHALL be limited to short state transitions and SHALL NOT delay year, filter, or game selection correctness.

#### Scenario: Use reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** all archive content and controls remain visible and functional, smooth scrolling and decorative entrance motion are disabled, and no continuous archive animation runs

#### Scenario: Leave during deferred animation setup
- **WHEN** the user returns to the hub before a deferred animation module or transition finishes
- **THEN** no animation initializes against an unmounted archive and no later completion changes the active view or archive state

### Requirement: Isolate archive styles and preserve regressions
Archive-specific styles SHALL be scoped to the archive root or a CSS Module, and portal styles SHALL use an archive-unique namespace. Implementing the reading room SHALL NOT change landing hub or Earth Explorer appearance, layout, interaction, or reducer behavior.

#### Scenario: Check CSS isolation
- **WHEN** the archive style bundle is loaded and the user switches among hub, Earth, and archive
- **THEN** archive selectors do not match hub or Earth elements and no generic archive rule changes shared headings, buttons, images, cards, or panels

#### Scenario: Run product regressions
- **WHEN** the complete verification suite runs after implementation
- **THEN** archive unit and browser tests pass together with lint, typecheck, build, Node tests, homepage tests, and Earth Explorer tests
