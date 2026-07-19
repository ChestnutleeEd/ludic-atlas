# Orbital Globe Experience Specification

## Purpose

Define the production 3D Globe renderer, coordinated camera behavior, responsive safe framing, lifecycle cleanup, and WebGL fallback for Earth Explorer.

## Requirements

### Requirement: Keep Orbital Globe as the production Earth renderer
The system SHALL provide the existing rotatable and zoomable 3D globe as Earth Explorer's default and only user-facing renderer in this change, with global, region, country, and game navigation.

#### Scenario: Navigate every geographic level
- **WHEN** the user moves from global to region to country to game context
- **THEN** Orbital Globe frames the latest level and exposes the corresponding shared context and details

### Requirement: Use one Globe camera writer
The system SHALL route `onGlobeReady`, selection, focus, reset, resize, and Globe-restoration requests through one Globe camera controller rather than independent `pointOfView` writers.

#### Scenario: Ready and selection occur together
- **WHEN** the Globe becomes ready while a current selection or restore intent exists
- **THEN** one controller resolves and writes the latest target without competing completion callbacks

### Requirement: Coordinate manual and programmatic camera control
The system SHALL cancel an active programmatic Globe transition when pointer, wheel, or equivalent manual camera input begins and SHALL retain user control until the interaction settles.

#### Scenario: Drag during a country flight
- **WHEN** the user starts dragging before a country-focus animation completes
- **THEN** the animation is cancelled immediately and no stale frame later overwrites the user's view

### Requirement: Shrink responsively without replacing the canvas
The Globe canvas, command header, and containing workspace SHALL follow the current measured container width when the viewport grows or shrinks and SHALL NOT retain a larger previous intrinsic width.

#### Scenario: Shrink a wide viewport
- **WHEN** a mounted Globe changes from 1920×1080 to 1280×720
- **THEN** the existing canvas and header widths shrink to the new container bounds without document horizontal overflow or canvas replacement

### Requirement: Fit focus to the safe viewport
The Globe camera SHALL frame the current geographic target inside the safe viewport remaining after visible command, panel, filter, and sheet overlays.

#### Scenario: Open the country panel
- **WHEN** the right panel opens for the selected country
- **THEN** the target country and actionable markers remain outside the panel-obscured area without clearing selection

### Requirement: Adapt country focus altitude
The Globe SHALL derive country focus distance from geographic bounds, safe viewport, marker footprint, and configured camera limits rather than applying one universal minimum altitude to every country.

#### Scenario: Focus a small country
- **WHEN** a user selects a geographically small country
- **THEN** the camera provides a useful close view while keeping required markers operable and avoiding near-plane clipping

### Requirement: Release Globe resources on exit
The Globe SHALL cancel animation, disconnect observers, remove external listeners, clear marker DOM, and dispose owned controls, geometry, materials, textures, render targets, scene resources, and renderer when unmounted.

#### Scenario: Leave Earth for Hub or Chronicle
- **WHEN** the user leaves Earth Explorer
- **THEN** no Earth canvas or active Globe animation remains in the destination view

#### Scenario: Repeat Earth round trips
- **WHEN** the user performs multiple Earth → Hub → Earth and Earth → Chronicle → Earth cycles
- **THEN** every Earth visit contains one Globe canvas at most and no prior listener or animation updates the current renderer

### Requirement: Degrade safely when WebGL is unavailable
The system SHALL preserve a working Earth exit and understandable unavailable state if Globe WebGL initialization fails.

#### Scenario: Globe renderer creation fails
- **WHEN** the browser cannot create the Globe renderer
- **THEN** Earth shows a non-crashing fallback with a return action and does not affect Hub or Chronicle
