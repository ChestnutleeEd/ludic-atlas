## MODIFIED Requirements
### Requirement: Coordinate manual and programmatic camera control
The system SHALL cancel an active programmatic Globe transition when pointer, wheel, or equivalent manual camera input begins, SHALL retain user control until the interaction settles, and SHALL keep the latest accepted marker layer surface-anchored and visible throughout both control modes.

#### Scenario: Drag during a country flight
- **WHEN** the user starts dragging before a country-focus animation completes
- **THEN** the animation is cancelled immediately, no stale frame later overwrites the user's view, and eligible front-side markers continue to follow the manually controlled Globe

#### Scenario: Use a camera zoom tool
- **WHEN** the user activates the zoom-in or zoom-out control
- **THEN** the single camera controller performs the transition while retained markers remain visible, projected, and correctly occluded

## ADDED Requirements

### Requirement: Keep one continuous HTML marker projection
The Globe SHALL use its existing HTML marker layer to continuously update retained marker transforms during drag, wheel zoom, automatic rotation, and programmatic camera flight without introducing a second canvas, renderer, or camera writer.

#### Scenario: Inspect active camera motion
- **WHEN** any supported camera motion is active
- **THEN** one Globe canvas and one camera controller remain authoritative while front-side marker positions update with the Earth surface

### Requirement: Bound interaction lifecycle resources
The continuous-marker behavior SHALL NOT accumulate animation frames, OrbitControls listeners, ResizeObservers, marker registries, or detached image nodes across repeated interactions or Earth mounts.

#### Scenario: Repeat motion and local-view round trips
- **WHEN** the user repeatedly drags, zooms, changes country, leaves Earth, and returns
- **THEN** Earth has at most one canvas, one camera controller, two OrbitControls lifecycle listeners, one layout ResizeObserver, and no prior marker registry updating the current renderer
