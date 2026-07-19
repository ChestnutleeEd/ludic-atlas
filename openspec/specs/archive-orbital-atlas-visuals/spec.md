# Archive Orbital Atlas Visuals Specification

## Purpose

Define the completed archival visual system, hierarchy, media fallback, accessibility, and product-boundary requirements for the production 3D Earth Explorer.

## Requirements

### Requirement: Use one archival 3D Earth visual system
The Orbital Globe, panels, and controls SHALL share semantic Earth tokens based on charcoal, ink green, oxblood, oxidized brass, aged gold, warm white, muted neutrals, and low-frequency desaturated cyan spatial feedback.

#### Scenario: Review the completed Globe workspace
- **WHEN** the Earth workspace is viewed with global, country, and game contexts
- **THEN** the Globe and surrounding interface present one coherent archival observatory identity

### Requirement: Retire neon HUD dominance
Earth Explorer SHALL NOT use large pure-cyan glow, magenta neon boundaries, blue-black science-fiction consoles, glass-heavy cards, uniform large radii, strong starfields, or decorative particles as its primary visual language.

#### Scenario: Perform human visual review
- **WHEN** the finished 3D Earth experience is reviewed
- **THEN** archival geography and cultural content dominate rather than a SaaS dashboard or neon HUD treatment

### Requirement: Keep the Globe visually primary
The Globe SHALL remain the dominant visual element while the command bar, camera tools, location context, right panel, and filter tray use a restrained, noncompeting hierarchy.

#### Scenario: Open secondary controls
- **WHEN** the country panel and filter controls are used
- **THEN** the Globe remains legible and the current focal target remains visible in its safe viewport

### Requirement: Unify Globe panel and control semantics
The current Earth experience SHALL provide one consistent country directory, geographic context, country/game details, year and rating filters, one cover-size control, marker view mode, camera mode, rotation, focus, and exit semantics without exposing an unfinished Atlas switch or duplicating cover-size state.

#### Scenario: Browse a filtered country
- **WHEN** the user changes filters, focuses a country, adjusts cover size, and opens a game detail
- **THEN** controls and details remain current, nonduplicated, and subordinate to the Globe

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

### Requirement: Make atmosphere imagery optional and constrained
Core Earth visuals SHALL pass without generated imagery. Apply MAY add human-approved original atmosphere images only when they contain no text, logo, UI copy, watermark, map, border, game-poster imitation, character, or dominant focal object and preserve central and right-panel safe zones.

#### Scenario: Complete Earth without an atmosphere image
- **WHEN** no generated candidate passes human review or an asset fails to load
- **THEN** CSS and Globe materials still provide a complete accepted visual experience

#### Scenario: Adopt a generated candidate
- **WHEN** a candidate is selected during the asset phase
- **THEN** it is compressed, budgeted, responsive, backed by CSS, and no rejected temporary output enters the final change

### Requirement: Preserve image layout and fallback
Atmosphere and cover media SHALL have explicit presentation dimensions, responsive loading behavior, and non-image fallbacks that retain required information and interaction.

#### Scenario: Disable image delivery
- **WHEN** Earth atmosphere and cover requests fail
- **THEN** required text, controls, selection, and Globe interaction remain usable without severe layout shift

### Requirement: Provide keyboard focus and close behavior
Buttons, countries, games, filters, clusters, and detail actions SHALL be keyboard operable with visible focus, meaningful accessible names and states, and Escape or an equivalent action for the topmost dismissible Earth layer.

#### Scenario: Operate Earth without a pointer
- **WHEN** a keyboard user selects a country and game, opens details, and presses Escape
- **THEN** focus remains visible and logical, state is announced, and the topmost layer closes without trapping focus

### Requirement: Respect reduced motion
With `prefers-reduced-motion`, Earth SHALL cancel or substantially shorten long-distance camera flights, continuous rotation, strong parallax, marker choreography, and complex staged animation while preserving immediate spatial feedback.

#### Scenario: Navigate with reduced motion
- **WHEN** reduced motion is active and a distant country is selected
- **THEN** the target appears without a long flight, forced rotation, or nonessential choreography

### Requirement: Protect Landing Hub and Game Chronicle
The Earth visual migration SHALL remain Earth-scoped and SHALL NOT change Landing Hub or Game Chronicle appearance, navigation, state ownership, or interaction behavior.

#### Scenario: Compare unaffected views
- **WHEN** the user visits Hub and Chronicle after the Earth redesign
- **THEN** their established visual systems and local entrance/return behavior remain unchanged
