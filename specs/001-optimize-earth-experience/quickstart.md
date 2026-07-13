# Quickstart: 实施与验收

## 1. Preconditions

- 当前分支：`001-optimize-earth-experience`
- 功能规格与计划：`specs/001-optimize-earth-experience/`
- 不改变本地游戏/国家数据字段，不调用运行时 RAWG。
- 保留用户已有未提交修改；实施只触及 plan.md 列出的 Earth Explorer 文件。

## 2. Baseline Before Implementation

1. 固定一台满足规格基线的设备和浏览器版本，记录系统、GPU、DPR、刷新率和硬件加速状态。
2. 使用 production build，而非 dev/HMR，分别以 1280×720、1440×900、1920×1080 运行三轮。
3. 保存以下基线：首屏截图、地图 panel rect、document scroll height、SE/JP/GB marker 坐标检查、30 秒 drag/wheel FPS 窗口、最大 frame gap、10/100 次国家切换录像与结果。

```bash
npm install
npm run build
npm exec next start
```

若必须下载依赖，按项目规则优先使用可靠国内镜像。

## 3. Red Tests First

实施前新增并确认以下测试能复现当前问题：

- `tests/geo-markers.test.ts`: SE/JP/GB 现有 12 槽出现越界；新契约要求九国全部 inside、holes outside、确定性与 overflow 守恒。
- `tests/explorer-state.test.ts`: Europe → JP/US 等跨区选择时旧区域过滤造成空数据；新 reducer 要求一次动作同步 region/country/game。
- `tests/camera-intent.test.ts`: A 动画中发 B/C，旧 revision 仍写终点；新 animator 要求最终仅 C 且没有 A 终点帧。
- `tests/e2e/earth-explorer.spec.ts`: 三种桌面视口首屏地图不足 70%、整页滚动、快速切换最终状态不一致或 marker/canvas churn。

## 4. Static and Unit Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

必须全部通过。新增几何测试至少覆盖：

- SE、NO、DK、NL、BE、CH、JP、GB、KR。
- Polygon holes、MultiPolygon、跨日期线 fixture。
- 相同输入 deep-equal、输入顺序变化后 gameId → slot 不变。
- `visible + overflow = eligible total`。

Reducer/相机测试至少覆盖：

- 100 次跨区域选择后最终 state 等于最后动作。
- SELECT_GAME 同步国家与区域；RESET 原子；无效 id/code 不改变状态。
- 新 revision 后旧 callback 零写入；经度跨 180° 走短弧；reduced-motion 直达。

## 5. Browser Layout and Behavior

使用真实浏览器或 Playwright Interactive 检查：

1. 从 Hub 进入 Earth Explorer。
2. 在 1280×720、1440×900、1920×1080 读取 viewport 与地图 panel rect，断言 `height / viewportHeight >= 0.70`。
3. 断言 stage/canvas、国家入口和核心控制在视口内，desktop document 不因 Earth 工作台产生整页滚动。
4. 将窗口循环 resize 三次，确认 canvas 不被替换、不归零且无 ResizeObserver loop。
5. 依次测试 polygon、快捷国家、国家列表、region、Reset、Zoom、Focus、年份、封面大小、显示模式与游戏详情。
6. 在 3 秒内点击至少 10 个跨区国家，并执行 100 次循环；最终 region、heading、panel、stats、marker country 与最后国家一致。
7. 用 MutationObserver 记录 canvas/img/button 增删：hover 与 drag 不得触发全量 marker 图片移除/重建。
8. 以 390×844、768×1024 验证 bottom sheet collapsed/peek/expanded，地图与控制不被永久遮挡。

## 6. Marker Visual Acceptance

- 对九个验收国家分别选择并截图；纯函数断言所有 anchor inside/clearance，浏览器走查封面矩形没有被误判到邻国。
- 瑞典必须不再出现当前基线的 6/12 越界；容量不足时验证 `+N` 数量真实且右栏仍能访问全部游戏。
- 旋转、缩放、切换显示模式并返回同一国家，gameId → slot 保持不变。
- 缺失/失败封面显示固定尺寸 fallback，无 layout jump、重复请求风暴或闪屏。

## 7. Performance Acceptance

在 production build、前台可见、硬件加速的同一浏览器中，每个目标桌面视口执行三轮：

1. 页面内 rAF sampler 以 1 秒为窗口，连续 drag + wheel 30 秒。
2. 记录每轮中位 FPS、低于 45 FPS 窗口比例、最大 frame gap 和 long task。
3. 验收：中位 FPS ≥55；至少 95% 窗口 ≥45；最大可见冻结 ≤250ms。
4. 国家点击记录 event timestamp 到 aria/heading 反馈与 camera settled：反馈 ≤100ms，稳定 ≤700ms。
5. 连续 100 次国家切换无失败、旧终点回跳、纯背景帧、canvas replacement 或整屏亮度闪烁。

Headless FPS 只作诊断，不作为用户性能验收；最终数值必须来自固定设备 headed 浏览器。

## 8. Visual and Accessibility Acceptance

- 截图状态：Global、瑞典 selected、country hover、右栏详情、controls open、移动 bottom sheet。
- 确认深海军蓝黑/青/洋红体系贯穿 DOM 与 WebGL，无大面积黄褐；真实封面保持主视觉焦点。
- 键盘遍历国家、控制和详情；focus-visible 清晰，标准按钮文案不被主题化替换。
- 模拟 `prefers-reduced-motion: reduce`，重复主要流程并确认无非必要动画、无功能缺失。
- 视觉回归 Hub 与 Game Chronicle，确认 Earth 主题作用域未污染其他入口。

## 9. Documentation Completion

验收通过后同步：

- `docs/00_PROJECT_INDEX.md`: 新增测试/重要文件入口。
- `docs/02_FEATURE_MAP.md`: 更新 Earth shell、globe、markers、country layer、controls 与验证职责。
- `docs/03_ARCHITECTURE.md`: 记录视口工作台、原子状态、可取消相机、polygon 槽位与稳定 marker 性能策略。
- `docs/04_DATA_SCHEMA.md`: 只有共享持久字段或 `src/types/game.ts` 数据契约变化时才更新。
