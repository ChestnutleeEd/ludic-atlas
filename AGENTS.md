# AGENTS.md

## Project Goal

This project is Game Earth, a global game culture exploration product.

The product references the interaction logic of Movie Globe, but the topic is games rather than movies. Users explore representative games by country or region through a 3D earth interface.

Core direction:

- Product type: game culture discovery / recommendation product
- First goal: build a runnable MVP quickly
- Data source: local mock data first
- Country mapping rule: based on the country or region of the game developer / studio

## Required Reading Before Any Change

Before making any code or document changes, always read:

1. `docs/00_PROJECT_INDEX.md`
2. `docs/02_FEATURE_MAP.md`

If the task involves data structure, also read:

3. `docs/04_DATA_SCHEMA.md`

If the task involves product scope or feature priority, also read:

4. `docs/01_PRODUCT_SPEC.md`

## File Location Rule

Do not search the whole project by default.

First use `docs/02_FEATURE_MAP.md` to locate the files related to the requested feature.

Only perform broad project search when:

1. the feature is not recorded in `docs/02_FEATURE_MAP.md`;
2. the mapped file does not exist;
3. the documentation is clearly inconsistent with the current code;
4. the user explicitly asks for a global check.

## Living Documentation Rule

The documentation is not fixed. It must be maintained as the project evolves.

When adding, deleting, moving, or renaming important files, update:

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`

When adding or changing a feature, update:

- `docs/02_FEATURE_MAP.md`
- `docs/01_PRODUCT_SPEC.md` if the product scope changes

When changing data fields, mock data format, or TypeScript types, update:

- `docs/04_DATA_SCHEMA.md`

When changing architecture, state management, rendering strategy, or major dependencies, update:

- `docs/03_ARCHITECTURE.md`

## Modification Scope Rule

Each task should modify only the files directly related to the requested feature.

If a new file is needed, explain:

1. the file path;
2. the file responsibility;
3. which documentation files were updated accordingly.

## Frontend Quality Rule

When working on UI, use the installed `frontend-design` skill when useful.

When checking local UI behavior, layout, browser rendering, or interaction, use Playwright Interactive when useful.

## MVP Principle

Prioritize a runnable MVP over completeness.

The first version should focus on:

- 3D earth / map exploration
- country-based game discovery
- game covers on the globe or map
- country list panel
- country detail panel
- game detail card
- year filter
- cover size control
- local mock data

Do not implement these in the first MVP unless explicitly requested:

- login
- user accounts
- backend database
- payment
- real recommendation algorithm
- complex AI features
- production-level API integration