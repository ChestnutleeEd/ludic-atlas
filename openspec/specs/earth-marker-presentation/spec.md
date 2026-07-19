# Earth Marker Presentation Specification

## Purpose

Define bounded, deterministic, component-aware, collision-safe, motion-aware marker layout and truthful overflow behavior for Earth Explorer.

## Requirements

### Requirement: Calculate Globe marker budgets with future-compatible inputs
The system SHALL calculate visible Globe marker capacity from projected country screen area, zoom or altitude, cover size, game count, exploration level, and a coarse performance tier while retaining a renderer identifier for future reuse.

#### Scenario: Compare country size bands
- **WHEN** large, medium/small, and tiny countries have sufficient games and settled views
- **THEN** the layout targets approximately 10–18, 6–12, and 1–4 primary covers respectively, subject to collision-free safe space

### Requirement: Keep marker rendering bounded
The system MUST enforce a documented absolute marker cap and SHALL NOT render every game in a selected country merely because the catalog contains them.

#### Scenario: Select a country with many games
- **WHEN** the selected country contains more games than its computed capacity
- **THEN** only the bounded representative set renders on the map and the undisplayed count remains truthful

### Requirement: Place MultiPolygon markers by connected component
The system SHALL generate marker candidates per Polygon component, prioritize the main landmass using area and catalog-anchor evidence, and allocate remote territories an independent low budget.

#### Scenario: Select France
- **WHEN** France is selected with metropolitan and overseas components
- **THEN** overseas bbox extent does not reduce metropolitan candidate density to only a few markers and any overseas allocation remains separately bounded

#### Scenario: Select compact Poland
- **WHEN** Poland is selected repeatedly with identical inputs
- **THEN** its compact geometry produces a stable layout within the medium/small target band

### Requirement: Resolve screen-space collisions lightly
The system SHALL reject or relocate marker rectangles that collide with accepted markers, protected controls, or unsafe viewport regions using a grid hash or equivalent bounded screen-space method.

#### Scenario: Layout markers near a panel
- **WHEN** a panel or filter reduces available map area
- **THEN** accepted markers remain clickable and do not materially overlap the protected overlay region

### Requirement: Stabilize layout with hysteresis
The system SHALL require a stable threshold crossing and settled camera before changing marker count or layout for minor zoom variation.

#### Scenario: Make small zoom adjustments
- **WHEN** the user makes repeated small zoom changes around one capacity boundary
- **THEN** marker count does not alternate continuously or visibly jump on every incremental change

### Requirement: Produce deterministic marker layouts
The system SHALL use stable game ranking, geographic candidate ordering, quantized view inputs, and deterministic tie-breakers so equal inputs yield equal marker positions and overflow.

#### Scenario: Return to the same view
- **WHEN** the same data, filters, Globe settled view, cover size, and performance tier are restored
- **THEN** marker identities, positions, and `+N` value match the previous layout

### Requirement: Reduce marker work during motion
The system SHALL keep the last accepted bounded cover layout visible during active manual, automatic, and programmatic camera movement, SHALL let the Globe update marker surface transforms and occlusion continuously, and SHALL defer expensive marker selection and collision recomputation until a scheduled threshold or settled view.

#### Scenario: Rotate zoom or fly the Globe
- **WHEN** the camera is moving under pointer drag, wheel zoom, camera-tool zoom, automatic rotation, or programmatic control
- **THEN** eligible front-side covers remain visible and move with the Globe while nonessential tooltip, shine, filter, shadow, animation, transition, and pointer work is downgraded

#### Scenario: Camera movement settles
- **WHEN** the latest manual or programmatic camera movement settles
- **THEN** one current collision/layout pass may update the accepted set without blanking all covers or allowing an older camera revision to restore stale markers

### Requirement: Expand tiny-country access
Tiny countries SHALL provide a deterministic cluster, fan-out, leader-line, or local-expansion interaction when primary markers cannot fit inside their projected area.

#### Scenario: Activate a tiny-country cluster
- **WHEN** a user activates a tiny country's aggregate marker
- **THEN** a bounded expanded layout exposes its primary games inside the safe viewport with an explicit way to collapse or leave it

### Requirement: Disclose undisplayed games and preserve panel depth
The final marker or stack SHALL expose a truthful `+N` overflow and the shared country panel SHALL support browsing more games than the direct marker layer.

#### Scenario: Open overflow content
- **WHEN** a country has more games than visible markers
- **THEN** `N` equals the filtered country total minus directly represented games and the panel offers additional game entries

### Requirement: Keep cover loading stable
Marker and panel covers SHALL reserve stable dimensions, use bounded eager loading, lazy-load noncritical images, show a placeholder or skeleton, retain usable content after primary and fallback image failures, and preserve an unchanged marker's button and image DOM identity without re-requesting its loaded source.

#### Scenario: Cover and fallback both fail
- **WHEN** a game cover and its fallback cannot load
- **THEN** the marker or list item retains its dimensions, accessible game name, and activation behavior without broken-image layout collapse

#### Scenario: Interact with an already loaded marker
- **WHEN** a marker remains in the accepted set through drag, zoom, camera flight, selection, or cover-size adjustment
- **THEN** its existing button and image nodes remain connected and no new request is issued for the same loaded cover source

### Requirement: Provide one canonical cover-size contract
Earth Explorer SHALL use one authoritative cover height with a 48 px minimum, 72 px default, 112 px maximum, and 4 px increment for Global, Region, and Country cover cards.

#### Scenario: Adjust cover size across its range
- **WHEN** the user decreases, increases, drags, or keyboard-adjusts the existing cover-size control
- **THEN** the displayed value remains step-aligned within 48–112 px and every cover card follows the same canonical height contract

#### Scenario: Enter each exploration level
- **WHEN** the user moves among Global, Region, and Country contexts without changing cover size
- **THEN** the authoritative value remains unchanged and density adapts through budget/collision rather than an undisclosed context multiplier

### Requirement: Scale retained covers continuously
Cover cards SHALL resize continuously from the canonical value through presentation styles without recreating unchanged marker or image nodes, flashing the layer, or issuing duplicate cover requests.

#### Scenario: Drag the cover-size slider
- **WHEN** the user continuously drags the size slider through multiple values
- **THEN** retained covers change dimensions on screen throughout the gesture while their button/image identity and loaded source remain stable

#### Scenario: Resolve the enlarged layout
- **WHEN** a size gesture crosses a layout bucket or commits
- **THEN** collision and truthful overflow update in a bounded scheduled pass without recomputing the full layout on every camera frame

### Requirement: Scale aggregates conservatively
Country aggregate dots, tiny-country clusters, and overflow badges SHALL remain legible and operable as cover size changes, but SHALL use clamped dimensions rather than scaling into full cover cards.

#### Scenario: Enlarge covers for a tiny country
- **WHEN** a tiny-country aggregate is shown at the maximum cover size
- **THEN** the aggregate remains inside the SafeViewport, retains its truthful count and accessible expanded state, and does not obscure the complete tiny geography

### Requirement: Preserve globe-side occlusion
The system SHALL keep `htmlElementVisibilityModifier` or an equivalent single visibility authority responsible for hiding back-side markers while interaction-quality styling SHALL NOT hide the complete marker layer.

#### Scenario: Rotate a marker behind the Globe
- **WHEN** a visible cover crosses from the front hemisphere to the back during drag or automatic rotation
- **THEN** that cover becomes nonvisible and noninteractive without causing front-side covers to disappear
