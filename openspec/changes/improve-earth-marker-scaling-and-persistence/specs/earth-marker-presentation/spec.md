## MODIFIED Requirements
### Requirement: Reduce marker work during motion
The system SHALL keep the last accepted bounded cover layout visible during active manual, automatic, and programmatic camera movement, SHALL let the Globe update marker surface transforms and occlusion continuously, and SHALL defer expensive marker selection and collision recomputation until a scheduled threshold or settled view.

#### Scenario: Rotate zoom or fly the Globe
- **WHEN** the camera is moving under pointer drag, wheel zoom, camera-tool zoom, automatic rotation, or programmatic control
- **THEN** eligible front-side covers remain visible and move with the Globe while nonessential tooltip, shine, filter, shadow, animation, transition, and pointer work is downgraded

#### Scenario: Camera movement settles
- **WHEN** the latest manual or programmatic camera movement settles
- **THEN** one current collision/layout pass may update the accepted set without blanking all covers or allowing an older camera revision to restore stale markers

### Requirement: Keep cover loading stable
Marker and panel covers SHALL reserve stable dimensions, use bounded eager loading, lazy-load noncritical images, show a placeholder or skeleton, retain usable content after primary and fallback image failures, and preserve an unchanged marker's button and image DOM identity without re-requesting its loaded source.

#### Scenario: Cover and fallback both fail
- **WHEN** a game cover and its fallback cannot load
- **THEN** the marker or list item retains its dimensions, accessible game name, and activation behavior without broken-image layout collapse

#### Scenario: Interact with an already loaded marker
- **WHEN** a marker remains in the accepted set through drag, zoom, camera flight, selection, or cover-size adjustment
- **THEN** its existing button and image nodes remain connected and no new request is issued for the same loaded cover source

## ADDED Requirements

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
