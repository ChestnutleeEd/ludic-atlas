# 06_CODEX_RULES.md

## Purpose

This document defines how Codex should work inside the Game Earth project.

The goal is to reduce unnecessary file traversal, keep modifications focused, and maintain living documentation.

## Required Reading Before Work

Before any task, Codex must read:

1. `AGENTS.md`
2. `docs/00_PROJECT_INDEX.md`
3. `docs/02_FEATURE_MAP.md`

Then Codex should read only the files directly related to the requested task.

## Search Minimization Rule

Codex should not perform full-project search by default.

Use this process:

1. Identify the requested feature.
2. Find the feature in `docs/02_FEATURE_MAP.md`.
3. Read the listed main file.
4. Read only the related files if necessary.
5. Modify the smallest possible file set.

Full-project search is allowed only when:

- the feature is not listed in `docs/02_FEATURE_MAP.md`;
- the mapped file does not exist;
- the documentation is inconsistent with actual code;
- the user explicitly asks for a global inspection.

## Modification Scope Rule

Each task should have a clear scope.

Before editing, Codex should identify:

- target feature
- target file
- related files
- expected output

Codex should avoid changing unrelated modules.

## Living Documentation Rule

Documentation must evolve with the code.

### When adding a new feature

Update:

- `docs/02_FEATURE_MAP.md`
- `docs/01_PRODUCT_SPEC.md` if product scope changes

### When adding, deleting, moving, or renaming files

Update:

- `docs/00_PROJECT_INDEX.md`
- `docs/02_FEATURE_MAP.md`

### When changing data fields or TypeScript types

Update:

- `docs/04_DATA_SCHEMA.md`

### When changing architecture or dependencies

Update:

- `docs/03_ARCHITECTURE.md`
- `docs/00_PROJECT_INDEX.md` if directory responsibilities change

## File Creation Rule

When creating a new file, Codex should state:

- file path
- file responsibility
- which existing module uses it
- which documentation file was updated

## UI Work Rule

When working on visual design, Codex should use the installed `frontend-design` skill when useful.

When checking layout, browser behavior, interaction, or visual bugs, Codex should use Playwright Interactive when useful.

## MVP Priority Rule

Prioritize a working MVP over feature completeness.

The MVP should first support:

1. local app startup
2. base layout
3. mock game and country data
4. country list panel
5. globe or map view
6. game markers
7. country detail panel
8. game detail card
9. year filter
10. cover size control

## Avoid in First MVP

Do not add these unless explicitly requested:

- login
- authentication
- backend database
- payment
- comments
- social features
- advanced recommendation algorithm
- production API integration
- complex AI agent workflow

## Response Format After Each Task

After completing a task, Codex should report:

1. files changed
2. what was implemented
3. how to run or verify
4. documentation updated
5. next recommended step

## Required Chinese Completion Report

每次任务完成后，Codex 必须用中文输出：

1. 修改了哪些源码文件
2. 修改了哪些文档文件
3. 页面在哪里查看
4. 本地启动命令
5. 核心入口文件
6. 如何验证效果
7. 是否更新了 living docs

如果本次任务没有修改源码或没有页面变化，也必须明确说明。

## Important Principle

The documentation files are part of the project architecture.

Do not treat them as static planning notes. They are living project control files and must stay synchronized with the codebase.
