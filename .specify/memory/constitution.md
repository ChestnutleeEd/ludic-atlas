# Game Earth Constitution

## Core Principles

### I. Runnable Exploration First

Every change MUST preserve a runnable Game Earth experience and prioritize the
core product loop: enter an exploration surface, navigate by country or time,
and inspect real game records. New infrastructure or abstraction MUST serve an
accepted user scenario. Login, payments, backend databases, production APIs,
and complex recommendation systems remain out of scope unless the product spec
is explicitly amended.

### II. Measurable Performance

Rendering and interaction work MUST define a baseline and measurable acceptance
criteria before optimization begins. Globe changes MUST consider initial load,
interactive frame rate, marker count, camera responsiveness, memory use, and a
mobile or reduced-capability fallback. Performance claims MUST be supported by
repeatable measurements; visual fidelity may degrade during interaction when the
restoration behavior is specified and verified.

### III. Local, Deterministic Data

Runtime product views MUST use local generated or mock data for the MVP. Browser
components MUST NOT depend on live RAWG requests. Country mapping, marker layout,
filtering, and statistics MUST remain deterministic for the same input. Changes
to fields, TypeScript types, or generated-data formats MUST update
`docs/04_DATA_SCHEMA.md` and retain a safe fallback for missing cover assets.

### IV. Small Scope and Living Documentation

Implementation MUST touch only files directly required by the accepted feature.
Before work, contributors MUST read `docs/00_PROJECT_INDEX.md` and
`docs/02_FEATURE_MAP.md`, plus the conditional documents required by
`AGENTS.md`. Important file, feature, data, or architecture changes MUST flow
back into the corresponding living documentation. Broad project searches and
unrelated refactors require explicit justification.

### V. Verification Proportional to Risk

Pure data and business behavior MUST be covered by automated tests when changed.
Interactive globe, responsive layout, focus, hover, and panel behavior MUST be
verified in a real browser when affected. Every implementation plan MUST name
the lint, type-check, test, build, browser, or performance checks needed for its
risk level. A task is not complete while required checks fail or acceptance
criteria remain unverified.

## Technical and Product Constraints

- The application uses Next.js, React, and TypeScript.
- The default Earth Explorer uses `react-globe.gl` and Three.js; Earth Explorer
  Pro remains a separate MapLibre GL JS and deck.gl experiment unless an
  accepted specification changes that boundary.
- React state remains the default state-management strategy until demonstrated
  complexity justifies another dependency.
- UI copy is Chinese-first, with English supporting proper names where useful.
- Accessibility, reduced-motion behavior, keyboard operation, and responsive
  layouts are part of feature acceptance when the affected UI exposes them.
- Files and directories MUST NOT be batch-deleted. Downloaded dependencies
  SHOULD use a reliable domestic mirror when one is available.

## Specification Workflow

Substantial performance work, cross-module features, architecture changes, and
changes spanning several responsibilities SHOULD follow the Spec Kit sequence:
specification, clarification when needed, plan, tasks, consistency analysis, and
implementation. Small copy, style, documentation, and isolated bug changes MAY
use the existing lightweight workflow.

Feature specifications under `specs/` describe an intended change. The root
product and architecture documents describe the accepted current system. Once a
feature is implemented, its durable decisions MUST be reflected in those root
documents so the two sources do not drift. Specifications MUST define outcomes
and acceptance criteria; plans MUST contain implementation choices and file
scope.

## Governance

`AGENTS.md` remains the authoritative repository execution policy. This
constitution adds Spec Kit project principles and MUST NOT weaken rules in
`AGENTS.md`. Product scope is governed by `docs/01_PRODUCT_SPEC.md`, current
architecture by `docs/03_ARCHITECTURE.md`, and data contracts by
`docs/04_DATA_SCHEMA.md`. Constitution amendments require a reason, an updated
version and date, and synchronized changes to any affected project documents.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
