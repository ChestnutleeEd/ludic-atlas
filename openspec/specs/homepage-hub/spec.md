# Homepage Hub Specification

## Purpose

Define the responsive, accessible, and visually isolated homepage hub that introduces Ludic Atlas and provides the existing Earth Explorer and Game Chronicle entrances.

## Requirements

### Requirement: Desktop single-screen composition
The homepage hub SHALL use the available `100dvh` desktop viewport so that the brand, primary copy, collection context, and both complete entrance controls are visible without document-level vertical scrolling at supported desktop sizes.

#### Scenario: Minimum desktop viewport fits
- **WHEN** the homepage is opened at 1366×768 with default browser zoom and no destination view selected
- **THEN** the brand, primary copy, collection context, Earth Explorer entrance, and Game Chronicle entrance are fully visible within the initial viewport
- **AND** the document has no vertical scrollbar

#### Scenario: Standard desktop viewport fits
- **WHEN** the homepage is opened at 1440×900 with default browser zoom
- **THEN** all required homepage regions fit within the initial viewport without clipping or vertical scrolling

#### Scenario: Wide desktop uses available space
- **WHEN** the homepage is opened at a desktop viewport wider than 1440 pixels
- **THEN** the dual entrance composition expands within its defined safe margins instead of remaining constrained to a narrow centered column
- **AND** both entrance visuals remain legible and proportionate

### Requirement: Asymmetric dual entrances
The homepage SHALL present Earth Explorer and Game Chronicle as a single asymmetric desktop composition with an approximate 58:42 allocation, SHALL give Earth Explorer the stronger visual emphasis, and SHALL keep each full entrance surface independently interactive.

#### Scenario: Desktop entrance hierarchy
- **WHEN** the homepage is viewed at a supported desktop size
- **THEN** Earth Explorer occupies the larger share of the dual entrance region and is visually recognizable as the lead entrance
- **AND** Game Chronicle remains a complete, prominent entrance rather than a subordinate text link

#### Scenario: Full surfaces are interactive
- **WHEN** a pointer or keyboard user targets any visible part of either entrance control
- **THEN** the targeted entrance exposes one coherent focus and activation surface with an accessible name

### Requirement: Existing view transitions remain compatible
The homepage SHALL preserve the existing local `hub / earth / archive` state model and SHALL invoke the existing Earth Explorer and Game Chronicle transitions without introducing route or URL changes.

#### Scenario: Open Earth Explorer
- **WHEN** the user activates the Earth Explorer entrance
- **THEN** the application changes its existing main view state from `hub` to `earth`
- **AND** Earth Explorer is presented using its existing behavior

#### Scenario: Open Game Chronicle
- **WHEN** the user activates the Game Chronicle entrance
- **THEN** the application changes its existing main view state from `hub` to `archive`
- **AND** Game Chronicle is presented using its existing behavior

#### Scenario: URL behavior is unchanged
- **WHEN** either entrance is activated and the destination view appears
- **THEN** the application does not introduce a new pathname or route-based state contract

### Requirement: Integrated collection context
The homepage SHALL display the current collection count and supported year range within the brand bar or entrance labels and SHALL NOT render a separate statistics strip below the two entrances.

#### Scenario: Collection context is visible
- **WHEN** the homepage receives the current total game count and year range
- **THEN** both values are readable within the single-screen composition
- **AND** they do not create an additional layout row beneath the entrances

### Requirement: Archival visual direction and original imagery
The homepage SHALL use a restrained world-game-archive visual direction with retro game-magazine collage as a supporting treatment. Each entrance SHALL use a distinct original raster hero image created with image-generation capability during implementation, while all interface text SHALL remain live DOM content outside the images.

#### Scenario: Two distinct entrance images render
- **WHEN** the homepage loads successfully
- **THEN** Earth Explorer and Game Chronicle each display their assigned original hero image
- **AND** the two images support their respective entrance identities without embedding titles, labels, or descriptive copy

#### Scenario: Text remains semantic
- **WHEN** images are unavailable to assistive technology or fail to load
- **THEN** the brand, entrance names, descriptions, collection count, and year range remain present as readable DOM text
- **AND** both entrance controls remain usable

#### Scenario: Excluded visual motifs are absent
- **WHEN** the finished homepage is visually reviewed
- **THEN** sci-fi blue dominance, neon glow, glass-heavy panels, and decorative effects that reduce archival restraint are not used as the primary visual language

### Requirement: Responsive image presentation and delivery
The homepage SHALL render each hero image without distortion, SHALL preserve a meaningful focal region across supported breakpoints, and SHALL deliver appropriately sized compressed image resources so the lead visual does not create avoidable LCP delay.

#### Scenario: Desktop image crop
- **WHEN** the homepage is viewed at 1366×768, 1440×900, or a wider desktop viewport
- **THEN** each hero image fills its entrance region without stretching
- **AND** its defined focal subject is not hidden by the live text overlay or cropped outside the entrance

#### Scenario: Mobile image crop
- **WHEN** the homepage is viewed at the supported mobile viewport
- **THEN** each image uses the mobile crop or focal position defined for its entrance
- **AND** text remains legible without depending on image-embedded copy

#### Scenario: Lead visual loading priority
- **WHEN** a production build loads the homepage with an empty browser cache
- **THEN** the Earth Explorer lead image is requested with explicit high loading priority or equivalent preload behavior
- **AND** responsive image selection avoids transferring the largest source to every viewport

#### Scenario: Image request failure
- **WHEN** either hero image cannot be loaded
- **THEN** its entrance retains a deliberate fallback background, readable copy, visible focus treatment, and working activation behavior

### Requirement: Restrained and accessible motion
Homepage motion SHALL use only existing CSS, Motion, or GSAP capabilities, SHALL avoid heavy or continuous effects, and SHALL provide a reduced-motion presentation.

#### Scenario: Default interaction motion
- **WHEN** a user hovers, focuses, or activates an entrance without requesting reduced motion
- **THEN** any response is short, restrained, and limited to properties that do not cause disruptive layout movement

#### Scenario: Reduced motion preference
- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** nonessential entrance, image, and collage movement is removed or reduced to an effectively static state
- **AND** focus and selection feedback remain perceptible

### Requirement: Mobile stacking and natural scrolling
Below the desktop layout breakpoint, the homepage SHALL stack the two complete entrances vertically and SHALL allow document-level natural scrolling instead of compressing both entrances into an unusable fixed-height viewport.

#### Scenario: Mobile homepage layout
- **WHEN** the homepage is opened at 390×844
- **THEN** the brand content and both entrance controls appear in a single vertical reading order
- **AND** the page can scroll naturally to reveal all content without horizontal overflow

### Requirement: Homepage style isolation
Homepage layout, visual, and motion rules SHALL be scoped to the hub mode or homepage component and SHALL NOT change the rendered layout or interaction behavior inside Earth Explorer or Game Chronicle.

#### Scenario: Earth Explorer remains isolated
- **WHEN** the user opens Earth Explorer after loading the redesigned homepage
- **THEN** homepage-specific containers, imagery, and layout rules do not remain visible or alter the Earth Explorer workspace

#### Scenario: Game Chronicle remains isolated
- **WHEN** the user opens Game Chronicle after loading the redesigned homepage
- **THEN** homepage-specific containers, imagery, and layout rules do not remain visible or alter the Game Chronicle view

### Requirement: Browser regression coverage
The implementation SHALL include Playwright coverage for desktop viewport fit, wide-screen expansion, mobile stacking, reduced motion, responsive images, and both existing entrance transitions.

#### Scenario: Homepage browser suite passes
- **WHEN** the homepage Playwright suite runs against the completed implementation
- **THEN** it verifies 1366×768, 1440×900, a wider desktop viewport, and 390×844 mobile behavior
- **AND** it verifies both entrance transitions and the absence of unintended horizontal overflow
