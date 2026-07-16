# UI Contract: Earth Explorer 沉浸工作台

## 1. Initial Viewport Contract

- 在 1280×720、1440×900、1920×1080 首次进入 Earth Explorer 时，工作台不得要求整页滚动才能开始探索。
- 主地图 panel 高度 / viewport height 必须 ≥0.70，完整 stage 与 canvas 必须位于可见工作区内。
- 首屏必须可访问：返回、国家入口、旋转/缩放/重置/聚焦入口，以及年份、封面大小、显示模式控制的入口。
- 右栏与控制托盘可以内部滚动/展开，但不得改变地球为最大单一区域的层级。
- 1023px 以下使用三态 bottom sheet；collapsed 状态必须保留地图和核心控制可用空间。

## 2. Selection Consistency Contract

所有国家入口（polygon、国家 aggregate、快捷按钮、国家列表）遵循同一事件：

```text
selectCountry(countryCode)
  -> validate local country
  -> commit country + owning region + clear selected game atomically
  -> expose visible selected feedback within 100ms
  -> issue camera intent for the same revision
  -> settle heading, panel, stats, markers and camera within 700ms
```

- 跨区域选择必须切换到目标国家所属区域，不得继续使用旧区域过滤其游戏。
- 在 3 秒内发起至少 10 个选择或连续 100 次选择时，最后一个有效动作是唯一最终状态。
- 无效国家代码不得清除当前有效状态或启动相机动画。
- 无游戏国家显示明确空状态；不得沿用上一国家的标记、统计或封面。

## 3. Camera Contract

- 每个相机 intent 有单调 revision；只有最新 revision 可以写 POV 和 settled 状态。
- 新 intent 必须取消旧 rAF，并从当前实际 POV 开始，不得先跳到旧目标。
- 经度插值走最短弧；用户 drag/wheel/pinch 立即取消程序动画。
- 普通国家选择动画不超过 680ms；reduced-motion 为 0ms。
- reset、focus、zoom 和 state selection 共用一个命令入口，不能为同一动作发两次 camera transition。

## 4. Marker Geometry Contract

- SE、NO、DK、NL、BE、CH、JP、GB、KR 的每个可见 cover/aggregate anchor 必须在对应 GeoJSON 外环内且不在 hole 中。
- cover slot 必须满足模式安全距；若安全槽位不足，减少 cover 数并显示真实 `+N`，不得使用越界位置补足数量。
- 同一输入的 gameId → slot 映射跨 render、hover、旋转、缩放和回访保持不变。
- Marker DOM 使用稳定 `markerKey`；仅在 eligible game/layout 真正变化时新增或删除节点。
- marker 或 cover 失败时使用固定尺寸 fallback，不得使 stage/canvas 归零、跳高或闪烁。

## 5. Rendering Contract

- 国家点阵是非交互装饰 mesh；国家选择必须通过 polygon、aggregate 或列表继续可达。
- Pointer hover 不得触发对完整游戏目录的重新分组/排序。
- drag/zoom 期间通过 stage 状态类降低阴影、tooltip 和封面装饰，不重建整套 marker DOM 或 canvas。
- visibility modifier 只在目标值变化时写 style。
- controls listeners、rAF、timer、ResizeObserver 和 fetch controller 在 unmount/rebind 时清理。

## 6. Visual Contract

- Earth mode 使用 Retro-Futuristic 单一锚点：`#0A0014` 主表面、`#030712` 深层画布、`#00FFFF` 交互、`#FF006E` 选中、`#EAF4FF` 正文、`#8CA3B8` 次级文字，真实封面保持原色。
- 黄褐/金色不得成为背景、地球、普通国界、面板或主控制的主导色；暖色仅限评分/警示等小面积语义。
- 海洋最暗；陆地略亮；普通国界低对比；可探索国家为青色；hover 增亮；selected 同时使用洋红轮廓、外圈/高度或其他非纯颜色线索。
- 所有显示字符串必须来自真实产品信息或标准操作文案，不增加虚构遥测、装饰性状态条或主题化替代按钮文案。
- 文字对比度目标为普通文本 ≥4.5:1，大字和关键图形 ≥3:1；键盘 focus 必须可见。
- reduced-motion 下非必要 transition/animation 近似为零，所有状态仍可辨识。

## 7. Test Observability

实施可增加稳定的语义属性用于测试，但不得向用户暴露调试信息：

- Earth shell 的 mode 与交互期状态。
- 当前 region/country/game 与 selection revision。
- Marker 的 stable key、country code、presentation 与 aggregate count。
- Camera phase 只用于测试/开发观察，生产 UI 不显示虚构遥测。

自动化测试不得依赖易变的视觉类名来判断业务状态，优先使用 role、aria 状态和上述稳定语义属性。
