# Implementation Plan: 游戏地球沉浸体验优化

**Branch**: `001-optimize-earth-experience` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-optimize-earth-experience/spec.md`

## Summary

将现有 Earth Explorer 改造成单视口探索工作台：压缩重复的标题与统计信息，让地球画布在目标桌面视口中占据至少 70% 高度；采用 Retro-Futuristic 深空观测站视觉锚点，以深海军蓝、霓虹青和选中洋红替换大面积黑金/黄褐色；保留 `react-globe.gl` 与 Three.js，通过持久化中等密度采样边界线、移除高开销 polygon/points mesh、保持 HTML 标记节点稳定和可取消的 last-intent-wins 相机动画提升流畅度；用 GeoJSON 边界内缩采样生成确定性国家内部槽位，并在容量不足时聚合多余游戏；以原子探索 reducer 保证国家、区域、游戏和相机意图一致。

## Technical Context

**Language/Version**: TypeScript 6.0.3, React 19.2.7, Next.js 16.2.7

**Primary Dependencies**: `react-globe.gl` 2.38.0, Three.js 0.184.0, Tailwind CSS 4.3.0；不新增运行时依赖

**Storage**: 本地静态生成/模拟游戏数据与本地 GeoJSON；无后端数据库、无运行时 RAWG 请求

**Testing**: Node 原生测试运行器、ESLint、TypeScript typecheck、Next production build、Playwright headed 浏览器验收与固定设备性能采样

**Target Platform**: 当前稳定版桌面 Chromium/Safari/Firefox；1280×720、1440×900、1920×1080 桌面基线，以及 390×844、768×1024 响应式回归

**Project Type**: 单体前端 Web 应用

**Performance Goals**: 30 秒连续旋转/缩放中位帧率 ≥55 FPS，95% 采样窗口 ≥45 FPS，无超过 250ms 可见冻结；国家选择 ≤100ms 可见响应、≤700ms 达到一致稳定状态；连续 100 次切换零失败、回跳、空白或闪屏

**Constraints**: 保留默认 `react-globe.gl` 引擎和独立 `/earth-pro` 边界；运行时数据必须本地且布局确定；地球、年份筛选、封面大小、显示模式、详情和移动端底部面板能力不得回退；减少动态效果模式必须完整可用

**Scale/Scope**: 当前约 992 条游戏、21 个本地国家/地区、236 个世界边界 feature；全球每国 1 个代表标记、区域每国至多 6 个、选中国家至多 8 个候选且受安全槽位容量约束

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Pre-Research Gate | Post-Design Gate | Evidence |
|-----------|-------------------|------------------|----------|
| Runnable Exploration First | PASS | PASS | 保留现有入口、引擎、筛选和详情能力；不增加后端、账户或推荐系统 |
| Measurable Performance | PASS | PASS | 固定视口、设备、FPS、冻结、响应和 100 次切换指标；production build 采样 |
| Local, Deterministic Data | PASS | PASS | 继续使用本地数据；GeoJSON 槽位、游戏排序和 reducer 状态转移均为纯且确定性 |
| Small Scope and Living Documentation | PASS | PASS | 仅触及功能地图映射的 Earth Explorer 文件；实施后同步项目索引、功能地图与架构文档 |
| Verification Proportional to Risk | PASS | PASS | 纯函数测试覆盖几何、reducer、相机；真实浏览器覆盖 WebGL、响应式、视觉与性能 |

未发现需要豁免的宪章冲突，所有技术上下文问题均已解决。

## Project Structure

### Documentation (this feature)

```text
specs/001-optimize-earth-experience/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── earth-explorer-ui.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── globals.css
├── components/
│   ├── GameEarthApp.tsx
│   ├── controls/
│   │   └── BottomControls.tsx
│   ├── globe/
│   │   ├── GameGlobe.tsx
│   │   └── GameMarkers.tsx
│   └── panels/
│       ├── RightPanel.tsx
│       ├── CountryPanel.tsx
│       └── CountryDetailPanel.tsx
├── lib/
│   ├── explorerState.ts       # 新增：原子探索 reducer 与动作
│   ├── globeCamera.ts         # 新增：可取消相机插值纯逻辑
│   ├── geo.ts
│   └── regions.ts
└── types/
    └── game.ts                 # 仅在共享 UI 类型确有必要时修改

tests/
├── core-data.test.ts
├── geo-markers.test.ts        # 新增：边界内槽位、容量与确定性
├── explorer-state.test.ts     # 新增：原子选择状态转移
├── camera-intent.test.ts      # 新增：last-intent-wins 插值
└── e2e/
    └── earth-explorer.spec.ts # 新增：首屏、切换、闪屏与响应式

playwright.config.ts           # 新增：只收集 tests/e2e 的浏览器配置
package.json                   # 增加独立 browser test script

docs/
├── 00_PROJECT_INDEX.md
├── 02_FEATURE_MAP.md
├── 03_ARCHITECTURE.md
└── 04_DATA_SCHEMA.md          # 仅共享数据字段/类型变化时更新
```

**Structure Decision**: 保持现有单体 Next.js 结构和职责边界。`src/lib/explorerState.ts` 只负责原子 reducer 和不变量，`src/lib/globeCamera.ts` 只负责 revision 守卫、最短弧与插值，GeoJSON 几何继续归属 `src/lib/geo.ts`；React 组件只协调状态、渲染与引擎生命周期。`playwright.config.ts` 将浏览器测试与 `npm test` 的 Node 测试隔离。不会将默认入口迁移到 Earth Explorer Pro，也不会引入新的状态库或主题依赖。

## Implementation Design

### 1. 单视口探索工作台

- 在 Earth 模式为主壳增加明确的作用域状态类，桌面使用 `100dvh` 工作台、紧凑顶栏和 `minmax(0, 1fr)` 主探索区，禁止整页因地球、控制条和面板叠加而纵向增长。
- 顶栏只保留返回、产品名、必要当前状态和国家目录入口；删除标题区与地球状态区的重复统计。桌面右栏默认离屏且 inert，按需覆盖地球并内部滚动，不永久挤压画布。
- 地球 panel、内部容器和 stage 继承可用高度；移除 690/560px 硬最小高度与 ResizeObserver 的 560px 下限。
- 将筛选类控制收进地图内紧凑可展开控制托盘；地图已有的缩放、重置、聚焦不再在首屏形成第二套大型重复控件。
- 1023px 以下保留三态 bottom sheet，并用 `dvh`、safe area 和收起态预留确保地图操作始终可触达。

### 2. Retro-Futuristic 深空观测站视觉

- 视觉锚点固定为 Retro-Futuristic：主表面 `#0A0014`，深层画布 `#030712`，霓虹青 `#00FFFF` 负责可交互状态，洋红 `#FF006E` 负责选中状态，正文 `#EAF4FF`、次级文字 `#8CA3B8`，真实游戏封面保持原色；英文和数字优先 `Space Mono` / `IBM Plex Mono` 等终端感等宽字形，中文使用清晰的系统中文字体回退。
- 差异化动作是“国家被选中时成为一枚仪器化轨道目标”：国界使用洋红轮廓与非闪烁外圈，游戏槽位使用青色连接语义，封面仍在国界内，不伪造遥测或装饰性文案。
- 将 Earth Explorer 颜色集中为语义 CSS token；DOM、Three.js 边界材质与气氛共用同一语义层级。暖色只允许用于评分/警示的小面积语义。
- 收束现有多段黑金覆盖和组件内硬编码金色值，不再追加互相冲突的主题层；背景只保留一层稀疏星点和一层静态扫描纹理，交互期禁用高成本滤镜。
- `prefers-reduced-motion` 下取消非必要过渡与扫描效果，但保留边界、焦点、选中与加载反馈。

### 3. 原子探索状态与 last-intent-wins 相机

- 用 React `useReducer` 原子维护区域、国家、游戏和 `selectionRevision`。`SELECT_COUNTRY` 同步切换到目标国家所属区域；`SELECT_GAME` 同步其国家和区域；`SELECT_REGION` 按契约保留或清除不属于新区的国家；`RESET` 一次完成。
- 所有地图 polygon、快捷国家、国家列表、游戏标记和重置入口只派发动作，不使用 effect 事后修补区域/国家不一致。
- 每次已提交选择生成带 revision 的相机请求。自有 `requestAnimationFrame` animator 在新请求到来时取消旧帧，从当前 POV 沿经度最短弧重新插值，旧 revision 永远不能再写相机。
- 普通区域切换动画目标 620ms、国家深度聚焦 680ms，UI 状态在事件批次内立即更新；共享动画工具硬上限 900ms，减少动态效果或极快速连续输入时可直接跳到最新目标。
- controls listener、相机 rAF 与恢复 timer 都必须显式清理；reset 只走唯一相机请求路径。

### 4. GeoJSON 驱动的国家内部标记槽位

- 导出并复用 GeoJSON Polygon/MultiPolygon 规范化、洞排除、边界与 point-in-polygon 纯函数，建立 countryCode → feature 索引。
- 为每个国家生成确定性候选网格，处理日期变更线展开；过滤到外环内部且洞外，并按到边界的最小距离做安全内缩。
- 从最安全且接近国家锚点的候选开始，以确定性 farthest-point sampling 选择互相分离的槽位；平局按稳定坐标键解决。
- 代表游戏使用完整 total order（评分、真实封面、标题、id）后绑定槽位。旋转、缩放、hover 不参与缓存键，因此同一输入始终得到相同位置。
- 可见封面数取请求上限、安全槽位数和模式上限的最小值；多余记录以一个 `+N` 聚合标记表示。小国、狭长国和多岛国优先减少卡片而不是把卡片推出国界。
- 删除仅靠国家椭圆 spread profile 证明正确性的路径；country profiles 只可作为候选密度/相机提示，不能绕过 polygon 约束。

### 5. 渲染热路径收敛

- 移除装饰性国家 points mesh 和 `react-globe.gl` polygon mesh，避免射线拾取竞争及聚焦后同步三角化造成的主线程长任务；国家交互改由地球点击经纬度的 point-in-polygon 查询、游戏标记和右栏承担。
- 世界边界与选中国家边界使用身份稳定的中等密度 `LineSegments`（每环分别最多 144 / 240 个源点）；相机移动期间不卸载，选中变化只原位复制 geometry，避免邻国边界闪烁。国家近地聚焦高度不低于 0.26，以保留周边国家上下文。
- 删除 `hoveredGameId` 对 marker 构建的依赖，tooltip 和视觉悬停使用稳定 DOM 节点的原生 hover/focus；992 条游戏不再因 pointer hover 重新分组排序。
- marker descriptor、`htmlElement` factory、button 与 img 以稳定 key 保持身份。拖拽/缩放时通过 stage 状态类降级封面、标签、阴影与滤镜，不替换整套 HTML data。
- `htmlElementVisibilityModifier` 只在值实际变化时写 DOM；封面声明固有尺寸、异步解码和稳定 fallback，避免布局跳变与重复解码。
- 边界采样数和 hover 更新频率以轮廓可读性为约束逐步降低；保留 pixel ratio 1.25、关闭 antialias、轻量 GeoJSON 和 marker cap 等现有正确策略。

## Delivery Sequence

1. 先新增几何、reducer 与相机纯函数测试，复现瑞典 6/12 越界、跨区选择失败和旧相机写入。
2. 实现原子探索状态和可取消相机请求，确保 UI/区域/国家/游戏一致。
3. 替换 marker 槽位并加入容量聚合，再覆盖九个验收国家和日期线/MultiPolygon fixture。
4. 稳定 marker DOM、移除装饰点云与 polygon mesh、使用持久边界线和坐标拾取、移除 hover 全量计算并清理引擎监听器。
5. 重构桌面单视口布局和控制托盘，随后实施 Retro-Futuristic token、Three.js 边界配色和响应式状态。
6. 运行静态检查、纯函数测试、production build、Playwright 行为/布局测试和固定设备三轮性能测量。
7. 验收通过后同步 `docs/00_PROJECT_INDEX.md`、`docs/02_FEATURE_MAP.md`、`docs/03_ARCHITECTURE.md`；仅当共享字段或类型变化时更新 `docs/04_DATA_SCHEMA.md`。

## Risk Controls

- **小国没有足够安全槽位**: 降级为 1–3 张封面加 `+N` 聚合，不回退到越界椭圆散布。
- **移除 polygon/点云后国家拾取失效**: 地球和边界点击统一转换为经纬度并执行 GeoJSON point-in-polygon；真实浏览器测试覆盖无 polygon mesh 的表面选择。
- **自有相机插值与 OrbitControls 竞争**: 用户交互开始立即取消程序动画；程序动画结束后再恢复 controls 状态。
- **主题重构污染 Hub/Archive**: 所有 token 与规则限定在明确 Earth mode 类下，视觉回归同时覆盖 hub/archive 不变。
- **性能测试受环境波动影响**: production build、同一前台窗口、同一设备/浏览器、每个视口三轮并报告中位数与最差窗口。
