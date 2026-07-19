# Earth Explorer Validation Specification

## Purpose

Define the viewport, behavior, lifecycle, accessibility, failure-state, performance, and human-acceptance gates for the production 3D Earth Explorer.

## Requirements

### Requirement: Validate required Globe viewports
The 3D Earth Explorer SHALL be validated at 1366×768, 1440×900, 1920×1080, and 1280×720, with a 390×844 mobile safety check.

#### Scenario: Open each required desktop viewport
- **WHEN** the Globe is exercised at each required desktop size
- **THEN** renderer, navigation, controls, context, panels, markers, and exit are operable without document horizontal overflow or severe clipping

#### Scenario: Open the mobile safety viewport
- **WHEN** Earth opens at 390×844
- **THEN** it does not crash, has no infinite or severe horizontal overflow, and retains a basic way to exit Earth

### Requirement: Validate responsive shrink and safe focus
Automated browser checks SHALL verify Globe container and canvas bounds after direct load and large-to-small resizing and SHALL verify that open panels do not obscure the selected focal target.

#### Scenario: Resize and open a panel
- **WHEN** a mounted Globe shrinks from 1920×1080 to 1280×720 and the right panel is opened
- **THEN** header and canvas match the new container and the selected target remains inside the computed safe viewport

### Requirement: Validate representative marker geographies
Automated tests SHALL cover France as a remote-territory MultiPolygon, Poland as a compact country, at least one tiny country requiring aggregation or expansion, and a multi-island country.

#### Scenario: Exercise marker fixtures
- **WHEN** representative countries are selected under stable inputs
- **THEN** mainland/island allocation, deterministic layout, bounded expansion, and truthful overflow satisfy their target bands

### Requirement: Validate latest Globe intent and restoration
Automated tests SHALL cover rapid cross-country selection, manual interruption, Globe view restoration, and filter preservation across Earth/Hub/Chronicle round trips.

#### Scenario: Stress Globe navigation
- **WHEN** selections or manual input occur before prior animations settle
- **THEN** the latest valid action wins, old animation cannot overwrite it, and the retained Globe view/filter state remains deterministic

### Requirement: Validate Globe lifecycle and deferred boundary
Automated browser checks SHALL cover repeated Earth → Hub → Earth and Earth → Chronicle → Earth round trips and SHALL prove the internal Atlas placeholder is renderer-free without exposing it as a user-facing destination.

#### Scenario: Repeat lifecycle cycles
- **WHEN** local-view round trips run multiple times and the compatibility placeholder receives a contract test
- **THEN** Earth has one Globe canvas at most, destination/placeholder views have none, and no stale controller, listener, animation, or serious WebGL warning remains

### Requirement: Validate accessibility motion assets and failure states
Automated checks SHALL cover keyboard navigation, focus-visible, accessible state, Escape behavior, reduced motion, cover/atmosphere failure, geographic LOD failure, and Globe WebGL fallback.

#### Scenario: Run inclusive failure checks
- **WHEN** tests exercise keyboard-only use, reduced motion, blocked assets, and injected loading failures
- **THEN** Earth remains understandable, operable, stable in layout, and able to exit or degrade as specified

### Requirement: Validate archival Globe visual acceptance
Human review SHALL evaluate the 3D Globe's brand continuity, geographic primacy, palette, material restraint, controls, panels, marker readability, motion, and optional assets without requiring any Atlas experience.

#### Scenario: Review the production Earth scope
- **WHEN** the completed Globe is reviewed at required desktop sizes
- **THEN** it forms a natural dark archival transition from the Hub and avoids dominant neon HUD, glass dashboard, or competing atmosphere treatment

### Requirement: Pass project verification commands
Implementation SHALL pass lint, TypeScript checking, unit tests, production build, and relevant Playwright tests with no console error, hydration warning, unmounted-state warning, or newly introduced serious WebGL warning.

#### Scenario: Run the implementation gate
- **WHEN** all required verification commands are executed on the completed change
- **THEN** every command passes and browser diagnostics satisfy the warning/error gate

### Requirement: Require human visual acceptance before finalization
The change MUST receive explicit human visual acceptance of the 3D Orbital Globe before OpenSpec sync/archive or Git commit/push/merge is performed.

#### Scenario: Automated checks pass before visual acceptance
- **WHEN** implementation and automated validation are complete but human visual acceptance is not recorded
- **THEN** the change remains active and sync, archive, commit, push, and merge remain prohibited

### Requirement: Validate marker continuity for every camera path
Automated browser checks SHALL exercise sustained pointer drag, continuous wheel zoom, camera-tool zoom, programmatic country focus, manual cancellation, automatic rotation, and rapid country switching with front-side markers continuously present.

#### Scenario: Exercise active camera motion
- **WHEN** each camera path runs at Global, France, Poland, and Canada contexts as applicable
- **THEN** eligible front-side markers remain visible and surface-anchored, back-side markers remain occluded, the latest camera intent wins, and the layer does not flash completely empty

### Requirement: Validate DOM and image request identity
Automated browser checks SHALL probe marker buttons and image nodes before, during, and after interaction, selection, and cover-size adjustment and SHALL record cover request events.

#### Scenario: Retain an accepted marker
- **WHEN** the same semantic/layout marker remains accepted across drag, wheel, camera-tool zoom, flight, game detail, or size input
- **THEN** its button and image probes remain on the same DOM nodes and its already loaded cover source is not requested again

#### Scenario: Change the accepted marker budget
- **WHEN** collision or budget legitimately removes or adds markers after settle
- **THEN** only the set difference is removed or created and every retained marker keeps identity

### Requirement: Validate cover-size product contract
Unit and Playwright checks SHALL cover 48 px, 72 px, 112 px, 4 px stepping, decrease/increase bounds, pointer continuity, keyboard/ARIA/focus-visible behavior, local restoration, invalid-storage fallback, and Global/Region/Country use.

#### Scenario: Run size-control regression
- **WHEN** the complete size-control test matrix is executed
- **THEN** canonical dimensions, accessible value, persistence, collision, aggregate clamp, overflow, and responsive layout match the specification without marker-layer flashing

### Requirement: Validate representative collision aggregation and occlusion
Automated tests SHALL revalidate France, Poland, Belgium, Japan, Global, Region, Country, open country/game details, SafeViewport, overflow, and back-face behavior at minimum/default/maximum cover sizes.

#### Scenario: Exercise dense and small geographies
- **WHEN** representative geographies are measured at the three size anchors
- **THEN** accepted markers remain bounded and collision-safe, France remains mainland-priority, Poland deterministic, Belgium truthfully aggregated, Japan component-aware, and `+N` remains correct

### Requirement: Validate continuous-marker production performance
One concise production-style browser check SHALL exercise Global, France, and Poland with continuous markers and record interaction delivery, long tasks, marker/image counts, requests, canvas, controller, listener, observer, console, hydration, and WebGL diagnostics without requiring repeated sampling or screenshot reports.

#### Scenario: Compare production interaction delivery
- **WHEN** the concise Global, France, and Poland interaction check runs
- **THEN** the new path keeps one canvas, one controller, two OrbitControls listeners, one ResizeObserver, creates no long task above 200 ms or duplicate retained-cover request, and shows no obvious interaction stall

### Requirement: Require responsive and user visual acceptance
After Phase 2, the user SHALL inspect settled and in-motion cover readability, size control placement, overlap, occlusion, archival styling, focus, reduced motion, and required controls at representative desktop size and 390×844 before Codex begins Phase 3 finalization.

#### Scenario: Automated gates pass before visual approval
- **WHEN** automated gates pass but the user has not accepted the desktop and narrow-screen moving-marker presentation
- **THEN** the change remains active and commit, push, sync, archive, merge, release, and packaging remain prohibited
