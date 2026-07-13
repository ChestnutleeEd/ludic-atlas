# Phase 0 Research: 游戏地球沉浸体验优化

## Baseline Findings

- 当前 Earth 页面是普通纵向文档：标题、690px 地球、右栏、全宽 BottomControls 和页脚依次占据文档流；地球 stage 另有 560px 下限，ResizeObserver 也强制 560–760px，因此 720/900px 高视口不可能在首屏完整容纳核心界面。
- CSS 至少存在早期冷色基础、black-gold 主题和 v3 black-gold override 三层相互覆盖，组件和 WebGL 层仍硬编码 `#D99A32`、`#F0B65A` 与棕金透明色，导致大面积黄褐。
- 轻量世界数据有 236 个 polygon feature，当前 21 个本地国家生成约 550 个点阵点；`pointsMerge: false` 和 point resolution 12 产生大量独立可拾取对象。
- game hover 会让最多 992 条游戏重新分组、排序和生成 marker；拖拽开始/结束又重建 marker 对象、HTML button、图片和事件监听器。
- 国家切换固定启动 820ms 相机 tween，超过 700ms 验收目标；新 tween 会强制结束旧 tween，可能先写入旧国终点再开始新动画。
- `handleSelectCountry` 不同步 `activeRegionId`，跨区选择后 globe 与右栏继续使用旧区域过滤数据，造成标题/相机已变但标记或详情为空。
- 现有椭圆 spread 不检查 Polygon/MultiPolygon。以生产排序和分布逻辑测量，瑞典、英国、日本前 12 个标记中心分别有 6、7、7 个越界。

## Decision 1: 保留默认地球引擎

**Decision**: 继续使用 `react-globe.gl` + Three.js 优化默认 Earth Explorer，Earth Explorer Pro 保持独立实验入口。

**Rationale**: 当前引擎已经完成本地 GeoJSON、OrbitControls、Next client-only 加载、HTML marker 和相机控制集成。本功能问题来自布局、热路径、状态竞争与错误坐标算法，不需要以高风险迁移换取正确性。

**Alternatives considered**:

- 迁移 MapLibre/deck.gl：大量点渲染更强，但项目已有 `/earth-pro` 验证面，替换默认入口会扩大相机、交互和视觉回归范围。
- CesiumJS：地形、3D Tiles 和高精度 GIS 并非 MVP 需求，依赖与资产成本过高。

## Decision 2: 单视口探索工作台

**Decision**: 桌面 Earth mode 使用 `100dvh`、紧凑顶栏、等高地图/右栏和地图内控制托盘；页面本身不滚动，长内容只在右栏/托盘内部滚动。

**Rationale**: 这直接解除 690/560px 硬高度与文档流叠加，能在三个目标视口中证明地图高度 ≥70%，同时保留国家入口和全部控制。

**Alternatives considered**:

- 只缩小标题字号/padding：仍无法容纳地球与全宽控制条。
- 保留 sticky BottomControls：sticky 仍占文档流高度。
- 隐藏右栏：会破坏国家浏览核心流程。

## Decision 3: Retro-Futuristic 视觉锚点

**Decision**: 采用深空 Retro-Futuristic 锚点：`#0A0014` 主表面、`#030712` 深层画布、`#00FFFF` 交互、`#FF006E` 选中、静态扫描纹理与 `Space Mono` / `IBM Plex Mono` 终端感英文数字；中文使用可读的系统字体回退，真实游戏封面保持原色。

**Rationale**: 该锚点能彻底离开黄褐主导，又与“游戏文化地球仪器”形成明确辨识。单一语义 token 系统可同时约束 DOM、地球材质和国界层，避免局部换色。

**Differentiator**: 选中国家成为一枚非闪烁的“轨道目标”——洋红国界与外圈明确定位，青色槽位承载真实游戏封面，不增加虚构遥测文案。

**Alternatives considered**:

- 保留黑金只降饱和：不能满足用户明确的去黄褐诉求。
- Aurora/彩虹霓虹：颜色与封面竞争且会增加合成成本。
- 纯黑白：地图状态层级和游戏氛围不足。

## Decision 4: GeoJSON 安全槽位替代椭圆散布

**Decision**: 用 country feature 内的确定性候选网格、洞排除、边界 clearance 与 farthest-point sampling 生成安全槽位；容量不足时以 `+N` 聚合。

**Rationale**: 只有 polygon 约束可以对所有国家证明中心点在界内；clearance 与容量降级可以减少封面矩形跨界。相同输入生成相同槽位，旋转、缩放和 hover 不改变位置。

**Alternatives considered**:

- 继续调每国 spread profile：只能修复已知样例，无法保证新国家。
- 为每国手写坐标：维护成本高且不适应数据变化。
- 全部封面移入侧栏：性能好但损失地图发现体验；只作为极小国的最后降级。

## Decision 5: 原子探索 reducer

**Decision**: 以单个 React reducer 原子维护 region/country/game/revision，所有选择入口派发同一组动作。

**Rationale**: 跨区国家选择必须同时更新区域过滤、国家详情、游戏选择和相机意图。原子状态比多个 setState 与补偿 effect 更容易证明 last action wins，且无需新状态库。

**Alternatives considered**:

- 在 `handleSelectCountry` 增加一次 `setActiveRegionId`：能修主要 bug，但 reset/game/region 仍有多入口组合风险。
- Zustand/Redux：本地状态规模尚不需要额外依赖，违反 MVP 小范围原则。

## Decision 6: 可取消的 last-intent-wins 相机

**Decision**: 用带 revision 的自有 rAF 插值代替不可控长 tween；新意图取消旧帧并从当前 POV 重启，旧 revision 不得再写相机。

**Rationale**: 底层 tween 在开始新动画前强制结束旧动画会产生旧终点单帧回跳。revision 守卫、最短经度弧和 ≤600ms 动画能同时满足正确性与自然感。

**Alternatives considered**:

- 排队执行所有相机动画：违背最后一次输入优先。
- 所有切换瞬移：正确但普通交互不自然；只用于 reduced-motion 或输入风暴降级。

## Decision 7: 稳定节点与合并点云

**Decision**: 国家点阵合并为非交互 mesh；hover 不进入 React marker 构建；HTML marker/factory/图片保持稳定身份；拖拽期只切 stage class；逐帧 DOM 写使用差异更新。

**Rationale**: 这直接减少 draw calls、raycast candidates、992 条数据重算和 CSS2D DOM/图片 churn，且不重写 marker 为 Canvas sprite，控制了范围。

**Alternatives considered**:

- 只 throttle hover：仍会周期性重建全量 marker。
- 自定义 Three sprite/Canvas marker：潜在性能更高，但交互、图片、tooltip 和无障碍重写过大。

## Decision 8: 分层验证

**Decision**: 纯函数测试证明几何、状态和相机竞争；Playwright 证明首屏、最终状态、DOM/canvas 稳定与响应式；固定设备 production build headed 测量 FPS 和冻结。

**Rationale**: Headless 软件渲染 FPS 不能代表真实用户设备，但几何和状态正确性适合自动化。分层验证既可重复又不制造虚假的性能保证。

**Alternatives considered**:

- 只做截图：不能证明状态竞争或帧率。
- 只用开发模式性能：HMR 和开发开销会污染结论。

## Research Resolution

所有技术上下文未知项均已解决。方案不新增运行时依赖，不改变本地数据字段，也不需要宪章豁免。
