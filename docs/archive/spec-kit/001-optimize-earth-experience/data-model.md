# Data Model: 游戏地球沉浸体验优化

本功能不改变持久化游戏/国家字段。以下实体均为现有数据派生的运行时 UI、几何与相机模型。

## ExplorationState

表示用户当前已提交的唯一探索状态。

| Field | Type | Rules |
|-------|------|-------|
| `activeRegionId` | `RegionId` | 必须与选中国家所属区域一致；无国家时可为任一区域 |
| `selectedCountryCode` | `string \| null` | 非空时必须存在于本地 country index |
| `selectedGameId` | `string \| null` | 非空时必须存在，且所属国家等于 `selectedCountryCode` |
| `selectionRevision` | `number` | 每次改变相机目标的有效动作单调递增 |
| `cameraMode` | `overview \| surface` | 改变时生成新 revision |

### State Transitions

| Action | Transition |
|--------|------------|
| `SELECT_COUNTRY(code)` | 校验国家；同步其 region；设置 country；清空 game；revision + 1 |
| `SELECT_GAME(id)` | 校验游戏；同步游戏所属 country 与 region；设置 game；revision + 1 |
| `SELECT_REGION(region)` | 设置 region；若当前 country 不属于新区则清空 country/game；revision + 1 |
| `CLEAR_COUNTRY` | 保留 region，清空 country/game；revision + 1 |
| `RESET` | 原子恢复 global、无 country/game 和默认 camera mode；revision + 1 |
| `SET_CAMERA_MODE(mode)` | 保留选择，更新 mode；值变化时 revision + 1 |

无效 code/id 不改变状态。相同有效目标的重复动作是否增加 revision 由交互语义决定：普通重复点击保持幂等；显式“重新聚焦”命令单独生成 camera command revision。

## CameraIntent

表示从已提交探索状态派生的唯一相机目标。

| Field | Type | Rules |
|-------|------|-------|
| `revision` | `number` | 必须等于产生它的 ExplorationState revision |
| `target` | `{lat,lng,altitude}` | 数值有限；altitude 在当前 camera mode 范围内 |
| `durationMs` | `number` | 普通 0–600；reduced-motion 为 0 |
| `reason` | `selection \| region \| reset \| focus \| zoom` | 仅用于诊断和测试，不显示虚构 UI |

### Lifecycle

`idle → animating(revision) → settled(revision)`。

- 新 revision 在任何阶段到来：取消旧 rAF，从当前 POV 启动新 intent。
- 用户 pointer/wheel 交互开始：取消程序动画并进入 `user-controlled`。
- 旧 revision 的 callback 即使迟到也不得写 POV 或 settled 状态。

## CountryGeometryIndex

从本地 world GeoJSON 派生，按国家代码缓存边界和安全槽位所需信息。

| Field | Type | Rules |
|-------|------|-------|
| `countryCode` | `string` | 通过 Alpha-2/Alpha-3/name fallback 映射 |
| `polygons` | normalized Polygon[] | 外环与 holes 分离；支持 MultiPolygon |
| `bounds` | geographic bounds | 日期线国家使用 unwrapped longitude |
| `anchorPolygonIndex` | `number` | 优先包含 country anchor 的主面，否则取最大有效面 |
| `candidateSlots` | `InteriorCandidate[]` | 所有候选都必须 outer-inside 且 hole-outside |

## InteriorCandidate

| Field | Type | Rules |
|-------|------|-------|
| `lat`, `lng` | `number` | 必须在对应 polygon 内 |
| `clearance` | `number` | 到最近边界 segment 的确定性近似距离 |
| `polygonIndex` | `number` | 指向 normalized polygon |
| `stableKey` | `string` | 由规范化坐标生成，用于平局排序 |

clearance 小于当前模式安全阈值的候选不能承载 cover card，但可在必要时承载小型 aggregate/dot。

## CountryMarkerLayout

| Field | Type | Rules |
|-------|------|-------|
| `countryCode` | `string` | 等于所有输入游戏的国家代码 |
| `mode` | `global \| region \| country` | 决定最大容量和安全距 |
| `markers` | `GameMarkerDescriptor[]` | 每个可见 marker 绑定唯一安全 slot |
| `overflowCount` | `number` | `totalGames - visibleGameMarkers`，不得为负 |
| `aggregateMarker` | descriptor or null | overflow > 0 时存在并显示真实 `+N` |
| `layoutVersion` | `string` | 几何算法变化时显式更新，便于缓存失效 |

### Validation

- `visible game count + overflowCount = eligible total`。
- 每个 slot 必须通过 polygon/holes 检查和模式 clearance。
- 同一 feature、mode 和有序 game ids 重复调用 deep-equal。
- 输入数组顺序变化不改变 gameId → slot 映射。
- hover、旋转和缩放不改变布局键。

## GameMarkerDescriptor

| Field | Type | Rules |
|-------|------|-------|
| `markerKey` | `game:<id> \| country:<code>:overflow` | 在 marker 生命周期内稳定 |
| `gameId` | `string \| null` | aggregate 为 null |
| `countryCode` | `string` | 与布局一致 |
| `lat`, `lng` | `number` | 来自安全 slot |
| `presentation` | `cover \| dot \| aggregate` | 交互期只改变 CSS 表现，不替换 key/DOM |
| `selected` | `boolean` | 与 ExplorationState 派生一致 |
| `count` | `number` | aggregate/国家点使用真实数量 |

## InteractionQualityState

| Field | Type | Meaning |
|-------|------|---------|
| `isUserInteracting` | `boolean` | drag/wheel/pinch 期间为 true |
| `prefersReducedMotion` | `boolean` | 系统媒体查询结果 |
| `visualTier` | `full \| interactive \| reduced` | full 展示完整装饰；interactive 保留稳定节点但关闭阴影/tooltip；reduced 取消非必要动画 |

视觉 tier 不能改变选中状态、marker key、游戏数量或国家归属。
