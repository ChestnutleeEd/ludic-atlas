## MODIFIED Requirements
### Requirement: Unify Globe panel and control semantics
The current Earth experience SHALL provide one consistent country directory, geographic context, country/game details, year and rating filters, one cover-size control, marker view mode, camera mode, rotation, focus, and exit semantics without exposing an unfinished Atlas switch or duplicating cover-size state.

#### Scenario: Browse a filtered country
- **WHEN** the user changes filters, focuses a country, adjusts cover size, and opens a game detail
- **THEN** controls and details remain current, nonduplicated, and subordinate to the Globe

## ADDED Requirements

### Requirement: Make cover sizing discoverable and accessible
The existing Earth filter tray SHALL expose the current cover size with an understandable Chinese label, a native range control, and explicit decrease/increase actions that share the 4 px step, keyboard behavior, bound state, and accessible value.

#### Scenario: Operate cover sizing with a keyboard
- **WHEN** keyboard focus reaches the cover-size controls and the user presses an arrow key or activates decrease/increase
- **THEN** focus remains visible, the value changes by one valid step, bounds are enforced, and assistive technology receives the updated pixel value

#### Scenario: Reach a size bound
- **WHEN** cover size is 48 px or 112 px
- **THEN** the corresponding decrease or increase action is disabled while the native slider remains correctly valued

### Requirement: Fit cover controls into responsive Earth hierarchy
The cover-size control SHALL remain within the existing filter-tray hierarchy, SHALL NOT create a competing floating HUD, and SHALL fit desktop and 390×844 layouts without horizontal overflow or obscuring other required controls.

#### Scenario: Open the tray on a narrow viewport
- **WHEN** the user opens cover sizing at 390×844 with the mobile sheet present
- **THEN** the control renders as a compact operable row inside a scroll-bounded tray, SafeViewport reflects visible overlays, and the tray can return to its summary state

### Requirement: Preserve archival marker styling during motion
In-motion marker simplification SHALL retain charcoal, ink green, oxblood, oxidized brass, aged gold, warm white, and restrained material treatment and SHALL NOT introduce technology blue, neon glow, glass-dashboard styling, or a broad Earth redesign.

#### Scenario: Review a moving Globe
- **WHEN** the Globe is dragged or flown with covers visible
- **THEN** cover silhouettes remain readable and culturally primary while nonessential decoration is reduced in the established archival observatory style
