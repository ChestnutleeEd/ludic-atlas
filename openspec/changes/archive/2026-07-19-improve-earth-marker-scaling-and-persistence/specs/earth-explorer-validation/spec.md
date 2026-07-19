## ADDED Requirements

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
- **WHEN** automated checks pass but the user has not accepted the desktop and narrow-screen moving-marker presentation
- **THEN** the change remains active and commit, push, sync, archive, merge, release, and packaging remain prohibited
