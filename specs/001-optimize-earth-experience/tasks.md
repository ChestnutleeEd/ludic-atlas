# Tasks: 游戏地球沉浸体验优化

**Input**: Design documents from `/specs/001-optimize-earth-experience/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/earth-explorer-ui.md, quickstart.md

**Tests**: 本功能明确要求可重复的几何、状态、相机、浏览器和性能验证；各用户故事按 red → green → browser acceptance 顺序执行。

**Organization**: 任务按四个用户故事分组。所有任务均包含明确文件路径，并保持默认 Earth Explorer、Earth Explorer Pro 和 Game Chronicle 的边界。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可在依赖完成后与同阶段其他不同文件任务并行
- **[Story]**: 对应 spec.md 的 US1–US4
- 每个实现任务完成后同步勾选本文件，不在验证通过前标记完成

## Phase 1: Setup (Shared Test Infrastructure)

**Purpose**: 建立独立的浏览器测试入口，不让 Playwright 收集 Node 原生测试。

- [x] T001 Configure Playwright to collect only `tests/e2e/`, add `test:e2e` script, and preserve existing scripts in `playwright.config.ts` and `package.json`

---

## Phase 2: Foundational (Blocking Test Fixtures)

**Purpose**: 建立所有故事共享的 Earth 入口、视口、GeoJSON 与观测辅助能力。

**⚠️ CRITICAL**: 用户故事测试不得复制各自的导航、等待 WebGL 或几何 fixture 逻辑。

- [x] T002 [P] Create reusable Hub-to-Earth navigation, WebGL-ready wait, viewport metric, and console-error helpers in `tests/e2e/earth-fixture.ts`
- [x] T003 [P] Create deterministic Polygon, MultiPolygon, hole, date-line, country, and game fixtures in `tests/fixtures/earth-geometry.ts`

**Checkpoint**: Playwright 与几何测试基础可供四个故事复用。

---

## Phase 3: User Story 1 - 首屏以游戏地球为主角 (Priority: P1) 🎯 MVP

**Goal**: 把 Earth Explorer 变为单视口工作台，三个桌面基线无需滚动即可看到完整主地球、国家入口和核心控制。

**Independent Test**: 在 1280×720、1440×900、1920×1080 首次进入 Earth，地图 panel 高度/视口高度 ≥0.70，stage/canvas 和核心入口位于视口内；390×844、768×1024 保持 bottom sheet 可用。

### Tests for User Story 1

- [x] T004 [US1] Add failing desktop viewport, no-page-scroll, canvas-containment, resize-loop, and mobile bottom-sheet assertions in `tests/e2e/earth-explorer.spec.ts`

### Implementation for User Story 1

- [x] T005 [US1] Refactor Earth mode into a `100dvh` compact-header workspace with atomic layout state and no duplicate top statistics in `src/components/GameEarthApp.tsx`
- [x] T006 [US1] Remove 690/560px hard minimums, make the globe inherit available height, and let ResizeObserver use real non-zero content bounds in `src/components/globe/GameGlobe.tsx`
- [x] T007 [P] [US1] Convert the full-width bottom block into a compact expandable filter tray without duplicating map zoom/reset/focus controls in `src/components/controls/BottomControls.tsx`
- [x] T008 [P] [US1] Make the desktop right panel stretch and scroll internally while preserving the three mobile sheet states and safe areas in `src/components/panels/RightPanel.tsx`
- [x] T009 [US1] Implement scoped Earth workspace, tray, equal-height columns, responsive `dvh`, and canvas containment styles until the US1 browser assertions pass in `src/app/globals.css`

**Checkpoint**: US1 可单独演示；地球成为首屏最大区域，所有既有入口仍可达。

---

## Phase 4: User Story 2 - 流畅操控与稳定切换 (Priority: P1)

**Goal**: 消除跨区选择失败、旧相机回跳、hover 全量计算、拖动 marker DOM 重建和点阵 draw-call 热点。

**Independent Test**: 3 秒内至少 10 次跨区选择及连续 100 次选择后，region/country/game/heading/panel/markers/camera 等于最后意图；普通反馈 ≤100ms、稳定 ≤700ms，hover/drag 不全量替换 marker/canvas。

### Tests for User Story 2

- [x] T010 [P] [US2] Add failing reducer tests for cross-region country/game selection, reset, invalid ids, idempotence, and 100-action last-state correctness in `tests/explorer-state.test.ts`
- [x] T011 [P] [US2] Add failing camera tests for revision cancellation, no stale frame writes, shortest longitude arc, zero-duration reduced motion, and user interruption in `tests/camera-intent.test.ts`
- [x] T012 [P] [US2] Add failing marker cap, stable ordering, hover-independence, and interaction-identity tests in `tests/globe-markers.test.ts`

### Implementation for User Story 2

- [x] T013 [P] [US2] Implement the pure atomic ExplorationState reducer and validated actions in `src/lib/explorerState.ts`
- [x] T014 [P] [US2] Implement revision-guarded camera interpolation, shortest-arc helpers, cancellation, and reduced-motion duration in `src/lib/globeCamera.ts`
- [x] T015 [US2] Replace separate region/country/game state mutations with reducer dispatches for polygon, preset, list, game, clear, region, and reset entry points in `src/components/GameEarthApp.tsx`
- [x] T016 [US2] Integrate the cancellable ≤600ms camera animator, cancel on user input, clean controls listeners/timers, avoid duplicate reset commands, and expose stable semantic state in `src/components/globe/GameGlobe.tsx`
- [x] T017 [P] [US2] Merge decorative country dots, remove point hover/click picking, reuse static country/feature indexes, and reduce polygon/point geometry cost in `src/components/globe/CountryLayer.tsx`
- [x] T018 [P] [US2] Remove game hover from marker data derivation, stabilize marker descriptors/elements/images, add intrinsic image dimensions and differential visibility writes in `src/components/globe/GameMarkers.tsx`
- [x] T019 [US2] Add rapid 10/100-country selection, response/settle timing, MutationObserver canvas/img stability, reduced-motion, and interaction regression coverage in `tests/e2e/earth-explorer.spec.ts`

**Checkpoint**: US2 可单独验证最后意图一致性和渲染热路径稳定性。

---

## Phase 5: User Story 3 - 标记准确位于所选国家 (Priority: P1)

**Goal**: 以 GeoJSON 内缩安全槽位替换国家中心椭圆散布，瑞典及八个代表国家零中心点越界，容量不足时真实聚合。

**Independent Test**: SE、NO、DK、NL、BE、CH、JP、GB、KR 的 visible slots 全部 outer-inside/hole-outside、满足 clearance、重复调用稳定，`visible + overflow = eligible total`。

### Tests for User Story 3

- [x] T020 [US3] Add failing nine-country, hole, MultiPolygon, date-line, clearance, deterministic reorder, and overflow-conservation tests in `tests/geo-markers.test.ts`

### Implementation for User Story 3

- [x] T021 [US3] Export normalized polygon helpers and implement country feature indexing, boundary distance, safe candidate generation, and deterministic farthest-point slots in `src/lib/geo.ts`
- [x] T022 [US3] Replace elliptical selected-country spread with safe slots, total-order game binding, capacity limits, stable marker keys, and one truthful `+N` aggregate in `src/components/globe/GameMarkers.tsx`
- [x] T023 [US3] Provide the loaded country feature index to marker construction and keep layout cache keys independent of hover/rotation/zoom in `src/components/globe/GameGlobe.tsx`
- [x] T024 [P] [US3] Add accessible aggregate marker presentation, fixed-size cover fallback, and interaction-safe compact marker states in `src/app/globals.css`
- [x] T025 [US3] Add nine-country browser selection, aggregate count, stable return-position, and failed-cover layout assertions in `tests/e2e/earth-explorer.spec.ts`

**Checkpoint**: US3 可独立证明瑞典等国家的 marker anchor 正确且高密度数据不越界。

---

## Phase 6: User Story 4 - 统一且有辨识度的视觉体验 (Priority: P2)

**Goal**: 采用单一 Retro-Futuristic 深空观测站体系，消除 Earth DOM/WebGL 的黄褐主导，保持内容、键盘和减少动态效果可用。

**Independent Test**: Global、瑞典 selected、country hover、右栏详情、控制托盘和移动 sheet 截图均使用深海军蓝黑/青/洋红层级；普通文本对比 ≥4.5:1，关键图形 ≥3:1，reduced-motion 下核心任务完整。

### Tests for User Story 4

- [x] T026 [US4] Add visual-state screenshots, semantic color assertions, keyboard focus traversal, contrast targets, reduced-motion, and Hub/Archive non-regression checks in `tests/e2e/earth-explorer.spec.ts`

### Implementation for User Story 4

- [x] T027 [US4] Consolidate Earth-only Retro-Futuristic tokens, static scanline/star texture, focus states, low-cost interaction tier, and remove conflicting black-gold overrides in `src/app/globals.css`
- [x] T028 [P] [US4] Apply deep-navy globe material, cyan atmosphere, interaction state class, and non-flashing selected-country instrument treatment in `src/components/globe/GameGlobe.tsx`
- [x] T029 [P] [US4] Apply cyan explorable, brighter hover, magenta selected, and non-color altitude/ring cues to polygon/point accessors in `src/components/globe/CountryLayer.tsx`
- [x] T030 [P] [US4] Replace Earth hard-coded gold text/borders with semantic classes while preserving real Chinese copy in `src/components/controls/BottomControls.tsx`, `src/components/panels/CountryPanel.tsx`, and `src/components/panels/CountryDetailPanel.tsx`
- [x] T031 [US4] Tune desktop/mobile responsive visuals and reduced-motion behavior until all US4 screenshot and accessibility assertions pass in `src/app/globals.css`

**Checkpoint**: 四个用户故事全部可独立演示，Earth 主题不污染 Hub、Archive 或 `/earth-pro`。

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: 完成真实浏览器、性能、文档、任务状态和用户要求的本地 Git 提交。

- [x] T032 Run lint, typecheck, Node tests, production build, and Playwright suite; resolve every failure against `package.json` and `specs/001-optimize-earth-experience/quickstart.md`
- [x] T033 Execute three-round headed performance acceptance at 1280×720, 1440×900, and 1920×1080 and record FPS, frame-gap, response, settle, switch, and visual results in `specs/001-optimize-earth-experience/checklists/implementation.md`
- [x] T034 Update durable file responsibilities and implemented architecture in `docs/00_PROJECT_INDEX.md`, `docs/02_FEATURE_MAP.md`, `docs/03_ARCHITECTURE.md`, and update `docs/04_DATA_SCHEMA.md` only if shared persisted fields/types changed
- [x] T035 Mark completed task checkboxes and document any environment-only acceptance limits in `specs/001-optimize-earth-experience/tasks.md` and `specs/001-optimize-earth-experience/checklists/implementation.md`
- [x] T036 Enable the user-requested `after_implement` commit message while keeping push disabled in `.specify/extensions/git/git-config.yml`
- [x] T037 Review the complete staged scope, then run `.specify/extensions/git/scripts/bash/auto-commit.sh after_implement` and verify the resulting local commit without pushing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖。
- **Foundational (Phase 2)**: 依赖 T001；阻塞所有用户故事的浏览器/几何测试。
- **US1 (Phase 3)**: 依赖 T002；先写 T004，再按 T005 → T006 → T009 集成，T007/T008 可并行。
- **US2 (Phase 4)**: 依赖 T002；T010/T011/T012 可并行，T013/T014 可并行，随后 T015/T016 集成，T017/T018 可并行。
- **US3 (Phase 5)**: 依赖 T003；先写 T020，再执行 T021 → T022 → T023，T024 可与 T023 后半并行。
- **US4 (Phase 6)**: 依赖 T002；先写 T026，T027 建立 token 后 T028/T029/T030 可并行，T031 收敛。
- **Polish (Phase 7)**: 依赖所有目标故事；T032 通过后执行 T033/T034，再执行 T035–T037。

### User Story Dependencies

- **US1 (P1)**: Foundation 后可独立完成；提供最终工作台容器但不依赖 US2/US3/US4。
- **US2 (P1)**: Foundation 后可独立完成；不依赖新视觉或新几何即可证明状态/相机/DOM 稳定。
- **US3 (P1)**: Geometry fixture 后可独立完成；最终合并时复用 US2 的稳定 marker key 约定。
- **US4 (P2)**: Foundation 后可独立换肤；最终响应式收敛以 US1 工作台结构为准。

### Critical Path

`T001 → T002/T003 → T004–T009 → T010–T019 → T020–T025 → T026–T031 → T032 → T033/T034 → T035 → T036 → T037`

---

## Parallel Execution Examples

### User Story 1

```text
After T005 establishes the workspace structure:
- T007: BottomControls tray in src/components/controls/BottomControls.tsx
- T008: RightPanel height/sheet in src/components/panels/RightPanel.tsx
```

### User Story 2

```text
Tests in parallel: T010, T011, T012
Pure modules in parallel: T013, T014
Renderer hotspots in parallel after contracts settle: T017, T018
```

### User Story 3

```text
After T021 exposes safe slots:
- T022: marker binding/aggregate in src/components/globe/GameMarkers.tsx
- T024: aggregate/fallback styling in src/app/globals.css
```

### User Story 4

```text
After T027 establishes exact semantic tokens:
- T028: Three.js/globe visual layer
- T029: CountryLayer semantic colors
- T030: controls and panel semantic classes
```

---

## Implementation Strategy

### MVP First

1. Complete Setup + Foundational.
2. Deliver US1 and verify the globe dominates all target first screens.
3. Stop at the US1 checkpoint if a quick visual demo is needed.

### Correctness and Performance Increment

1. Add US2 atomic state/cancellable camera/stable rendering.
2. Add US3 polygon-constrained markers and truthful aggregation.
3. Re-run US1–US3 tests before visual changes.

### Visual Completion

1. Add US4 exact Retro-Futuristic token system.
2. Run responsive, reduced-motion, Hub/Archive regression, and fixed-device performance acceptance.
3. Update living documentation, check off tasks, commit locally through the configured Spec Kit Git hook, and do not push.

---

## Notes

- 测试任务必须先失败并证明当前问题，再开始对应实现。
- `[P]` 只表示文件与未完成依赖不冲突；共享 `GameGlobe.tsx`、`GameMarkers.tsx` 和 `globals.css` 的任务应顺序合并。
- 不新增运行时依赖，不替换默认 Earth 引擎，不修改游戏国家归属规则。
- 不批量删除文件或目录；若需移除旧样式，仅通过精确补丁删除相关规则。
- 最终只创建本地 commit，不执行 push。
