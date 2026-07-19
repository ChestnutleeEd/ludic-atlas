## ADDED Requirements

### Requirement: Defer production Atlas delivery
The current change SHALL NOT deliver a production Atlas renderer, planar map interaction, public projection switch, Atlas view-restoration workflow, or Atlas renderer lifecycle acceptance; those requirements SHALL remain assigned to the future `add-atlas-map-renderer` change documented in `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

#### Scenario: Review current change scope
- **WHEN** the current proposal, design, specs, tasks, and acceptance plan are reviewed
- **THEN** no production Atlas renderer or user-facing Atlas interaction is required for completion

### Requirement: Keep the deferred placeholder inert
Any retained Atlas compatibility placeholder MUST NOT create a canvas, WebGL renderer, animation loop, geography request, or long-lived pointer, resize, or window listener.

#### Scenario: Exercise the internal compatibility branch
- **WHEN** a contract test mounts the retained Atlas placeholder
- **THEN** it renders no heavy renderer resource and does not affect Globe, selection, filters, Hub, or Chronicle

### Requirement: Hide unfinished Atlas from users
Earth Explorer SHALL default to the 3D Globe and SHALL NOT expose a user-facing control that enters the unfinished Atlas placeholder.

#### Scenario: Open the completed Earth Explorer
- **WHEN** a user enters Earth from the Landing Hub
- **THEN** the Orbital Globe opens and no unfinished Atlas option is presented

### Requirement: Preserve a complete resumption contract
The repository SHALL retain the deferred Atlas product goal, architecture, shared contracts, requirements, acceptance scenarios, implementation tasks, prerequisites, and resumption checklist in `docs/DEFERRED_ATLAS_MAP_PLAN.md`.

#### Scenario: Start a future Atlas change
- **WHEN** a future implementation begins from a new conversation or branch
- **THEN** the deferred plan identifies the recommended branch/change names, files, completed foundations, technical decisions, tasks, and validation required to resume safely
