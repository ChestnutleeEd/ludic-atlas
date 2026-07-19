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
