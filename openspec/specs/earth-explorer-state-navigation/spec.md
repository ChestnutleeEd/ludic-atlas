# Earth Explorer State and Navigation Specification

## Purpose

Define the authoritative Earth state, local entrance architecture, latest-wins navigation, renderer boundary, and Chronicle isolation contracts.

## Requirements

### Requirement: Preserve the local Earth Explorer entrance architecture
The system SHALL continue to open Earth Explorer through `GameEarthApp.mainViewMode` on the existing page and SHALL NOT introduce an Earth route or pathname change.

#### Scenario: Enter and leave Earth Explorer
- **WHEN** a user enters Earth Explorer and later returns to the landing hub
- **THEN** `mainViewMode` changes locally while the browser pathname remains unchanged

### Requirement: Maintain one authoritative business selection
The system SHALL maintain one authoritative `activeRegionId`, `selectedCountryCode`, `selectedGameId`, and `selectionRevision` and SHALL NOT create renderer-specific country, game, region, or filter reducers.

#### Scenario: Select a game on the Globe
- **WHEN** a game is selected from the Orbital Globe or shared country panel
- **THEN** the shared country, region, game, and revision state updates atomically

### Requirement: Keep filters in the Earth shell
The system SHALL keep year, rating, cover-size, and marker-view filters outside renderer-specific state and SHALL preserve them across Earth renderer remounts and local Hub/Chronicle round trips.

#### Scenario: Return to a filtered Earth view
- **WHEN** the user configures filters, leaves Earth for a local product view, and returns
- **THEN** every retained filter has one authoritative value and produces the same filtered collection

### Requirement: Default the current product to Globe only
The current product SHALL use `projectionMode: "globe"` by default and SHALL NOT expose the unfinished `atlas` compatibility value as a user-selectable production destination.

#### Scenario: Enter Earth through the product UI
- **WHEN** a user opens Earth Explorer
- **THEN** Globe is the active renderer and no incomplete Atlas switch is visible

### Requirement: Preserve independent view types as future compatibility
The system MAY retain `GlobeViewState`, `AtlasViewState`, and `EarthProjectionMode` types established in Phase 1, but current acceptance SHALL require runtime restoration only for the Globe.

#### Scenario: Review shared state types
- **WHEN** the current Globe implementation and deferred Atlas plan are inspected
- **THEN** Globe restoration is active, Atlas state is inert compatibility data, and neither contains imperative renderer objects

### Requirement: Use latest-wins spatial navigation intents
The system SHALL represent global, region, country, and game navigation as revisioned `SpatialNavigationIntent` values and SHALL prevent an older intent from settling after a newer intent.

#### Scenario: Rapidly select countries
- **WHEN** the user selects multiple countries faster than Globe transitions complete
- **THEN** only the greatest intent revision controls the final camera, geographic context, and details

### Requirement: Preserve the active-only renderer boundary
The system SHALL mount at most one heavy Earth renderer and SHALL keep the retained deferred Atlas placeholder free of canvases, animation loops, controls, geography requests, and GPU resources.

#### Scenario: Inspect Globe and the internal placeholder
- **WHEN** production Earth is opened and the internal placeholder is separately exercised by a contract test
- **THEN** production Earth has one Globe canvas and the placeholder has none

### Requirement: Isolate Earth state from Game Chronicle
Game Chronicle SHALL NOT read or modify Earth projection, selection, filter, intent, or renderer-view state.

#### Scenario: Browse Chronicle and return to Earth
- **WHEN** a user leaves a configured Earth view, browses Game Chronicle, and re-enters Earth
- **THEN** Earth resumes its retained state without Chronicle-generated mutations
