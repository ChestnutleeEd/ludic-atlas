## ADDED Requirements

### Requirement: Provide three geographic detail levels
The system SHALL provide Global low-detail, Region medium-detail, and Country high-detail geographic LODs, with Country detail covering the current country and only necessary neighboring context.

#### Scenario: Navigate from world to country
- **WHEN** a user moves from global overview through region to country focus
- **THEN** progressively appropriate geometry becomes available without blanking the lower-detail geography

### Requirement: Generate LOD geometry with shape-aware offline simplification
Geographic build tooling SHALL use a shape-aware, topology-conscious offline simplification process and SHALL record source identity, parameters, feature counts, coordinate counts, and output sizes.

#### Scenario: Review generated LOD output
- **WHEN** an LOD artifact is regenerated
- **THEN** reviewers can verify its input, simplification configuration, geographic identity, counts, and size without comparing opaque runtime output

### Requirement: Prohibit runtime index sampling
The runtime SHALL NOT reduce country boundaries by taking every nth coordinate from source rings.

#### Scenario: Render a focused boundary
- **WHEN** Globe builds a boundary from an LOD artifact
- **THEN** it consumes the shape-aware geometry as generated rather than applying coordinate-array index decimation

### Requirement: Keep high-resolution world data out of first load
Earth first load MUST NOT request or parse the complete approximately 14.6 MB high-resolution world source; high-detail data SHALL be split by country or rational bundle and loaded on demand.

#### Scenario: Open Earth at global level
- **WHEN** Earth Explorer first becomes interactive
- **THEN** global geography loads without a request for the complete high-resolution source file

### Requirement: Keep normalized geography renderer-neutral
Globe SHALL consume a renderer-neutral normalized feature model containing stable country IDs, antimeridian-aware components, bounds, interior anchors, and source LOD metadata so a future renderer can reuse the data without changing current Globe behavior.

#### Scenario: Inspect selected-country normalized data
- **WHEN** Globe resolves a selected country at the appropriate LOD
- **THEN** it uses stable renderer-neutral country identity and geometry metadata without loading an Atlas renderer

### Requirement: Cache parsing and renderer geometry responsibly
The system SHALL deduplicate in-flight geographic fetch/parse work, cache normalized data across renderer remounts, bound renderer-specific geometry caches, and explicitly dispose evicted GPU resources.

#### Scenario: Re-enter Earth
- **WHEN** previously loaded LOD data is requested again in the same session
- **THEN** compatible normalized data is reused without unbounded cache growth and evicted geometry is disposed

### Requirement: Degrade to the nearest available LOD
If Region or Country LOD loading or construction fails, the system SHALL retain and use the nearest lower-detail valid geometry without clearing current selection.

#### Scenario: Country detail request fails
- **WHEN** high-detail geometry for the selected country cannot load
- **THEN** medium or global geometry remains visible, the country stays selected, and the user can continue or retry

### Requirement: Strengthen selected-country geography without overdraw
The active country SHALL be eligible for a dedicated higher-detail boundary and material while non-active countries use lower detail, reduced emphasis, or paused detail work.

#### Scenario: Focus one country
- **WHEN** Country LOD becomes ready
- **THEN** the selected country gains higher-quality readable geometry without upgrading the complete world to the same cost
