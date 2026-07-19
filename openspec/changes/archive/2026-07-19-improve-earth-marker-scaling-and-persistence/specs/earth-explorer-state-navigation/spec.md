## MODIFIED Requirements
### Requirement: Keep filters in the Earth shell
The system SHALL keep year, rating, cover-size, and marker-view filters outside renderer-specific state, SHALL preserve them across Earth renderer remounts and local Hub/Chronicle round trips, and SHALL restore the last valid cover size from versioned local browser storage without creating a second authoritative value.

#### Scenario: Return to a filtered Earth view
- **WHEN** the user configures filters, leaves Earth for a local product view, and returns
- **THEN** every retained filter has one authoritative value and produces the same filtered collection

#### Scenario: Reload after changing cover size
- **WHEN** the user commits a valid cover size and later reloads Earth Explorer in the same browser
- **THEN** the Earth shell restores that step-aligned value before the Globe marker layout is established

#### Scenario: Storage is invalid or unavailable
- **WHEN** the stored cover size is missing, nonnumeric, outside 48–112 px, misaligned to the 4 px step, or browser storage throws
- **THEN** Earth uses the 72 px default without crashing, hydration mismatch, or Chronicle mutation
