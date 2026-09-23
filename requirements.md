# 洋葱穿衣 OnionWear · 需求设计文档

版本：v1.0（首次整理）
基线：工作树 2026-09-23 12:15，`main` 分支（仓库尚无 commit）
适用读者：产品、客户端、算法、测试；也是后续迭代的对照基线

> 注意：整理期间（12:00–12:15）工作树仍在快速变动（`UserSettings` 重构、活动/日程选择器、需求条、两个新测试类）。本文以 12:15 的源码为准，所有 `文件:行号` 请以当时状态复核；文中"状态"列优先于任何历史描述。

---

## 0. 文档定位与分工

| 文档 | 职责 | 权威范围 |
|---|---|---|
| `doc/design.md`（1455 行，用户撰写） | 穿搭**算法**的规格：约束、模块、公式方向、参数理由、测试哲学 | 算法层唯一权威。本文与其冲突时以它为准 |
| `doc/requirements.md`（本文） | **整个项目**的需求与系统设计：产品定位、功能/非功能需求、页面与信息架构、技术架构、数据与接口、验收标准、差距与路线 | 项目级需求与实现状态 |

本文对算法只做**接口级摘要**（第 7 节）并给出 spec ↔ 代码 ↔ 测试的对照表（附录 C），不重述公式推导。

---

## 1. 产品定义

### 1.1 一句话

> 输入天气、人群和活动，用**可解释的确定性算法**算出今天的洋葱式穿衣结构，并告诉你**此刻该穿几层、什么时候脱**。

### 1.2 产品约束（继承自 `design.md` 第一节，不可协商）

- 不依赖 LLM，不调用任何大模型，不用自然语言推理决定穿搭。
- 不允许"温度区间 → 衣服"的 if/else 映射表。
- 结果必须由：天气数据 + 太阳数据 + 人群特征 + 活动强度 + 时间段 + 服装属性 + 可配置参数 + 确定性算法 计算得到。
- 自然语言文案由独立的 Presentation 层生成，**不得参与决策**。

### 1.3 差异化定位

| 维度 | 常见天气 App | 穿搭内容社区 | OnionWear |
|---|---|---|---|
| 回答的问题 | 多少度、下不下雨 | 别人怎么搭 | 你今天需要怎样的**穿衣结构** |
| 决策依据 | 体感温度单一指标 | 主观审美 | 热平衡 + 防护需求（六维需求向量） |
| 昼夜温差 | 展示数字 | 无关 | **核心输入**：决定带不带中间层 |
| 可解释性 | 无 | 无 | 41 个 ReasonCode + 逐层说明 |
| 离线/可复现 | 否 | 否 | 是（纯本地计算，同输入必同输出） |

### 1.4 目标用户

- 通勤族：一天内进出空调房、早晚温差敏感。
- 明确怕冷/怕热人群：需要"比别人多穿/少穿多少"被量化，而不是"多穿点"。
- 家有老人或儿童：需要更保守的热保护建议。
- 户外工作者与骑行/跑步人群：活动强度对穿衣影响大。

### 1.5 非目标（明确不做）

- 不做时尚风格、色彩搭配、场合着装礼仪。
- 不做穿搭社区、UGC、分享广场。
- 不做服装电商与导购。
- 不接 LLM 做对话式推荐。
- 不做心率/健康数据驱动的动态建议（v2 之前不考虑）。

---

## 2. 用户场景（User Story）

格式：场景 → 期望 → 当前落地位置。

| # | 场景 | 用户期望 | 实现状态 |
|---|---|---|---|
| S1 | 早上出门前看一眼 | 三层各是什么、现在穿几层 | ✅ `HomeScreen` OnionCard + `OnionDiagram` |
| S2 | 昼夜温差 12℃ | 明确"中午要脱一层" | ✅ `timeline` + `wearNow` + 提醒文案 |
| S3 | 全天有雨 | 外层必须是防水壳，要不要带伞 | ✅ `DemandVector.RAIN` + `Accessory.UMBRELLA` |
| S4 | 高温高湿 33℃/85% | 不推保暖层，改推透气与备用贴身衣 | ✅ 湿度只在高温侧加载（`ThermalComfortEngine`） |
| S5 | 大风降温 | 防风优先于加厚度 | ✅ 风寒模型 + `WIND_SHELL_REQUIRED` 硬约束 |
| S6 | 我是老人/给孩子穿 | 更保守的保暖与升温风险 | ✅ `BodyProfile` 三档 + `AgeProfileConfig` 五档 |
| S7 | 我特别怕冷 | 在同样天气下比别人多一层 | ✅ `HeatSensitivity` 三档 → `preferenceOffsetK` |
| S8 | 今天骑行上班 8 点出门 19 点回家 | 按活动强度和时段给分层与携带建议 | ✅ 首页"穿衣设定"面板选活动与出门/回家时间 |
| S9 | 看明天 | 提前决定明日穿搭 | ✅ `TomorrowCard`（固定按 07:30 计算） |
| S10 | 不想解锁 App | 桌面组件直接看温度/温差/层数 | ✅ Glance 组件 |
| S11 | 地铁没信号 | 至少看到上次的结果 | ✅ DataStore 快照，失败保留旧数据 |
| S12 | 换城市/出差 | 搜索城市或用定位 | ✅ `CityPickerScreen` + `DeviceLocationProvider` |

---

## 3. 功能需求（FR）

优先级：P0 必须（当前版本核心闭环）/ P1 应该有 / P2 未来。
状态：✅ 已实现且已验证 / 🟡 部分或进行中 / ❌ 未实现。

### 3.1 数据获取与定位

| ID | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| FR-01 | 按经纬度获取当前 + 逐小时 + 逐日天气 | P0 | ✅ | Open-Meteo，2 天预报，`timezone=auto`（`OpenMeteoSource.kt:76-93`） |
| FR-02 | 支持第二个数据源（和风 QWeather）并可自动切换 | P1 | 🟡 | 代码与 `BuildConfig` 注入已完成（`AppContainer.kt:94-105`），但 `local.properties` 无 `qweather.key` → 生产仍走 Open-Meteo |
| FR-03 | 城市名搜索（中文） | P0 | ✅ | Open-Meteo geocoding，count=12，`language=zh`，输入 300ms 防抖（`CitySearch.kt:35-41`） |
| FR-04 | 设备定位选城 | P0 | ✅ | 仅用 `LocationManager`（不引入 Play Services）；last-known <10min 优先，否则一次性定位，8s 超时 |
| FR-05 | 定位权限申请与拒绝后的可读提示 | P0 | ✅ | `RequestMultiplePermissions`；失败文案"定位超时，可能在室内"/"未授予定位权限" |
| FR-06 | 反向地理编码为城市名 | P1 | ✅ | bigdatacloud；失败回退为 `gps:lat,lon` 显示"当前位置" |
| FR-07 | 无网络时展示上次结果并说明来源时间 | P1 | ✅ | 保留旧报告 + "网络不可用，当前显示上次结果" |
| FR-08 | 缓存有效期（TTL）与陈旧标记 | P2 | ❌ | 仅"X分钟前"文案，无过期判定；`WeatherRepository.cached()` 未被调用 |
| FR-09 | 手动刷新（界面 + 组件） | P0 | ✅ | 刷新期间图标持续旋转 |

### 3.2 穿搭推荐

| ID | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| FR-10 | 输出 BASE / INSULATION / PROTECTION 三层结构 | P0 | ✅ | `LayerRole`，最多 4 层（可两个 INSULATION 槽） |
| FR-11 | 指明"此刻穿几层"（哪几层现在穿、哪几层带着） | P0 | ✅ | `wornNowCount` / `wornNowRoles` / `OnionDiagram` 环数 |
| FR-12 | 每层给具体衣物名与选择理由 | P0 | ✅ | `ClothingAdvice.layers[].note` |
| FR-13 | 体感温度与全天温差展示 | P0 | ✅ | `feelsLikeC` / `diffC` |
| FR-14 | 人群：儿童 / 成人 / 老人 | P0 | ✅ | `BodyProfile` 三档，选择后不重新拉网络直接重算 |
| FR-15 | 冷热偏好：怕冷 / 标准 / 怕热 | P0 | ✅ | `HeatSensitivity` → `preferenceOffsetK` |
| FR-16 | 活动强度可选（8 类以上） | P1 | ✅ | `ActivityKind` 9 类，UI 暴露 `selectableActivities` 8 类（居家/办公/上课/步行/骑行/跑步/户外工作/户外休闲），选择器在 `HomeScreen.kt:256` |
| FR-17 | 出门/回家时间 → 时段日程 | P1 | ✅ | `TimeField` + `StepButton`（`HomeScreen.kt:277-286,307-366`）→ `UserSettings.schedule`；两个时间未同时填写时不给日程 |
| FR-18 | 早/午/晚分段建议 | P0 | ✅ | `dayparts()`，按太阳事件而非固定钟点切分 |
| FR-19 | 未来 12 小时逐时趋势 | P0 | ✅ | `HoursCard` / `HourChip` |
| FR-20 | 加/减层时间线（几点脱哪层） | P1 | ✅ | `TimelineEvent`，最多 6 条 |
| FR-21 | 配饰与携带建议（伞/围巾/手套/墨镜/备用T恤…） | P1 | ✅ | `Accessory` 10 种，`accessoriesOf()` |
| FR-22 | 安全预警分级 | P0 | ✅ | `SafetyLevel` NORMAL/WATCH/DANGER + `SafetyWarning`；安全只**上调**需求，不下调 |
| FR-23 | 明日预报与明日穿搭建议 | P1 | ✅ | `planTomorrow()`，固定 07:30 |
| FR-24 | 用户自己的衣橱作为候选集 | P2 | ❌ | 现为固定 `ClothingInventory.DEFAULT`（45 件目录） |
| FR-25 | 推荐理由可展开查看（ReasonCode 全量透出） | P2 | 🟡 | 引擎产出 41 个 code，仅部分映射为文案；存在从未产生的死 code |

### 3.3 展示与系统集成

| ID | 需求 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| FR-26 | 单 Activity + 首页/选城页，无路由库 | P0 | ✅ | `rememberSaveable` 字符串路由 + `Crossfade(320ms)` |
| FR-27 | 背景随天气与昼夜变化（9 组渐变 + 光晕） | P1 | ✅ | `paletteFor(condition, isDay)` |
| FR-28 | 洋葱示意图（自定义 Canvas，非图片资源） | P1 | ✅ | 150°/240° 弧、1–4 环、呼吸动效 |
| FR-29 | 桌面 Glance 组件：温度/城市/体感/温差/三层 | P1 | ✅ | 点击可刷新，点击整体进 App |
| FR-30 | 后台周期刷新天气 | P1 | 🟡 | WorkManager 1h 周期唯一任务；**未加网络 Constraints**，且与 `updatePeriodMillis=1800000` 重复计时 |
| FR-31 | 设置页（主题、单位、通知、默认活动） | P2 | 🟡 | 无独立设置页；人因输入以就地展开的"穿衣设定"面板承载（人群/体质/活动/出门回家），符合"就地修改"的取态 |
| FR-35 | 需求向量可视化（今天的主要矛盾） | P1 | ✅ | `DemandCard` + `DemandBar`（`HomeScreen.kt:657-714`）：保暖/防风/防雨/透气/遮阳/可脱卸 六条，配稳定色；副标"先算需求，再反推洋葱层次——不是按温度查衣服" |
| FR-32 | 多城市收藏/切换 | P2 | ❌ | 单城快照 |
| FR-33 | 通知推送（明早降温提醒） | P3 | ❌ | 无 |
| FR-34 | 首次启动引导 | P2 | ❌ | 直接落上海默认城市并持久化，空状态几乎不出现 |

---

## 4. 非功能需求（NFR）

| ID | 需求 | 指标 / 约束 | 状态 |
|---|---|---|---|
| NFR-01 | **确定性** | 同一 (报告, 人群, 活动, 日程, 服装库) 必产生同一结果 | ✅ 有单测保护（`RecommendationEngineTest.kt:158`） |
| NFR-02 | **纯本地算法** | 穿搭计算零网络、零模型请求；断网可用 | ✅ `RecommendationEngine` 无 Android 依赖 |
| NFR-03 | **可解释** | 每个结论可回溯到 code/参数 | 🟡 code 齐，文案不全 |
| NFR-04 | **性能** | 端到端穿搭计算目标 < 50ms（45 件目录、候选上限 480） | ⚠️ 未实测，见 11.2 |
| NFR-05 | **降级** | 缺逐小时/云量/UV/辐射时走估算路径而非报错 | ✅ `hasHourlyForecast`、`-1` 语义、`syntheticTemperature` |
| NFR-06 | **隐私** | 不采集身份数据、无埋点、无三方 SDK；定位仅前台一次性使用，不后台留存 | ✅ 依赖清单里无任何分析/广告 SDK；反向地理编码用公开客户端接口 |
| NFR-07 | **凭据安全** | API key 与签名口令不进版本库 | ✅ `local.properties`（已 gitignore）+ `BuildConfig` 注入（`app/build.gradle.kts:41-44`） |
| NFR-08 | **功耗** | 后台刷新 ≤ 1 次/小时，失败退避 | 🟡 有周期任务，缺网络约束→无网时空跑 |
| NFR-09 | **兼容性** | minSdk 26 / targetSdk 36 / compileSdk 37；手机竖屏为主 | ✅ 配置就绪；横屏、折叠屏、大字体未适配 |
| NFR-10 | **视觉一致性** | 禁止原生 Material 观感；自建设计语言（玻璃拟态 + 天气渐变 + 自定义 Canvas），需在真机/模拟器验收 | ✅ 已遵循（无 M3 主题，`themes.xml` 仅深色底） |
| NFR-11 | **无障碍** | 图标 `contentDescription`、语义分组、支持字体缩放与 TalkBack | ❌ 未做 |
| NFR-12 | **可测试性** | 领域层纯 JVM 单测，无需 Robolectric | ✅ 71 个单测 |
| NFR-13 | **配置化** | 阈值/权重/年龄/活动参数集中在 `OutfitEngineConfig` | 🟡 10 个配置组已建，仍有阈值散落在引擎内（见 9.2） |
| NFR-14 | **本地化** | 文案集中在 `strings.xml` | 🟡 部分 string 未被引用，界面/组件中文硬编码 |
| NFR-15 | **错误处理** | 网络/权限/解析失败均转为人话，不崩、不静默 | ✅ |
| NFR-16 | **可构建发布** | release 缺 keystore 时明确警告并回退 debug 签名 | ✅ `app/build.gradle.kts:24-29`（不可上架） |

---

## 5. 信息架构与界面设计

### 5.1 导航结构

```
MainActivity (单 Activity, edge-to-edge, 深色系统栏)
├── screen = "home"    → HomeScreen
└── screen = "picker"  → CityPickerScreen
        切换：Crossfade 320ms（无 Navigation 组件、无返回栈）
```

已知缺口：`CityPickerScreen` 未注册 `BackHandler`，系统返回键直接退出应用而非回首页。
"穿衣设定"不是独立页面，而是首页 ActionRow 下方的 `AnimatedVisibility` 展开面板——保持"看一眼就走"的单屏心智，不做多级导航。

### 5.2 首页分区（自上而下，错峰进场 70ms）

| 区 | 内容 | 交互 |
|---|---|---|
| Header | 城市名 26sp + 副标题（时间/数据源）+ 搜索图标 | → 选城页 |
| ActionRow | 人群胶囊、活动胶囊、刷新胶囊、定位胶囊；人群/活动胶囊展开就地面板 | `AnimatedVisibility { SettingsSheet }`（`HomeScreen.kt:129-130, 217-306`）：为谁穿衣、体质、活动、出门时间、回家时间 |
| ErrorBanner | 最近一次失败的人话说明 | — |
| EmptyState | 3 环淡显洋葱 + 提示 + 搜索/定位按钮 | 无数据时（当前被默认城市掩盖） |
| Hero | 92sp 温度数字滚动 + 天气描述 | 数值变化时动画过渡 |
| MetricsRow | 体感、湿度、风、降水概率等 chip | — |
| OnionCard | `OnionDiagram` + 每层 `LayerLine`（层名、衣物、理由），当前未穿的层淡显 | — |
| DemandCard | 六维需求条（保暖/防风/防雨/透气/遮阳/可脱卸），改活动或人群时可见哪一条动了 | — |
| DaypartCard | 早/午/晚 三段 + 日出日落 | — |
| HoursCard | `LazyRow` 逐小时 chip | 横向滚动 |
| TipsCard | 穿衣提醒（含安全预警） | — |
| TomorrowCard | 明日一句话建议 | — |
| metaLine | "数据源 Open-Meteo · X分钟前" | 数据源目前硬编码 |

### 5.3 视觉规范（`ui/theme/OnionTheme.kt`）

- 应用底色 `#12142E`，无 Material 主题色板。
- 文本三档：`White` / `White 72%` / `White 52%`。
- 玻璃卡片 `glassCard()`：`White 14%` 填充 + `White 24%` 1dp 描边 + 大圆角；强调用 `White 22%`。
- 三层专属色：内层 `#8FD3FF`（冷蓝）、中层 `#FFD28F`（暖黄）、外层 `#A8E6B0`（绿），与 `colors.xml` 保持一致，用于环、层名与图标。
- 9 组天气调色（晴/多云/雨/雪/雷/雾 × 昼/夜），每组 3 段竖向渐变 + 1 个光晕色，由 `paletteFor()` 按天气文本关键字（雷/雪/雨/雾/云）与日出日落挑选，未知回退晴。
- 天气→昼夜判定：`isDay()` 用日出日落，而非固定钟点。
- 需求条稳定配色（`demandColor(DemandTone)`，`OnionTheme.kt:69-79`）：保暖 `#FFB07A` / 防风 `#9FE8FF` / 防雨 `#8FB6FF` / 透气 `#A8E6B0` / 遮阳 `#FFD76E` / 可脱卸 `#D7B3FF`。同一维度在任何页面永远同色，让用户看多了能凭颜色读出"今天的主要矛盾"。
- 未穿层的表达：`LayerLine` 非活跃时正文 alpha 0.45、色点 0.5——"带着但此刻不穿"必须看得见。

### 5.4 动效

| 动效 | 参数 |
|---|---|
| 页面切换 | Crossfade 320ms |
| 分区进场 | 自上而下 stagger 70ms |
| 温度数字 | 数值过渡动画（92sp） |
| 洋葱环 | 呼吸缩放 1→1.04 / 2600ms，环透明度 0.75→1 微闪 |
| 刷新中 | 图标持续旋转 |
| 设定面板 | `AnimatedVisibility` 展开/收起，触发胶囊高亮为选中态 |

### 5.5 桌面组件（Glance）

- 背景按天气与昼夜选择 8 个 drawable 之一；内容：温度 34sp、城市 12sp、"体感 X° · 温差 Y℃" 10sp、最多 3 行层建议、"刷新"胶囊。
- 数据来自 DataStore 快照 + `ClothingPlanner.plan()`，首绘不触网。
- 已知缺口：每层只显示第一件衣物；无 `previewImage/previewLayout`、无 `minResizeWidth/Height`。

---

## 6. 技术架构

### 6.1 分层与依赖方向

```
ui/ ─────────┐                     Compose + ViewModel(StateFlow)
  │ view state 组装(MainUiState)   │
  ▼                                ▼
widget/ (Glance) ──► domain/ClothingPlanner（唯一应用↔算法适配层）
  │                        │            ▲
  │                        ▼            │ 仅传数据，不含阈值判断
  │                 domain/outfit/**    │ 13 个引擎 = 算法本体
  │                 (纯 Kotlin，无 Android 依赖)
  ▼
data/ ── WeatherRepository ── WeatherProvider(接口)
           ├── openmeteo/OpenMeteoSource（默认）
           ├── qweather/QWeatherSource（有 key 时优先）
           ├── geo/CitySearch（正/反向地理编码）
           ├── location/DeviceLocationProvider（LocationManager）
           └── local/AppPreferences（DataStore，单 key JSON 快照）
AppContainer（手写 DI，lazy 单例）
```

### 6.2 架构决策与理由

| 决策 | 理由 | 代价 |
|---|---|---|
| 不用 Hilt，手写 `AppContainer` | 依赖总量 <20，容器一个文件可读完，避免注解处理器与构建时长 | 需自律维护 `by lazy` 生命周期 |
| 不用 Room，DataStore 存**单个 JSON 快照** | 只需"上次结果"，无关系查询；新字段一律带默认值，旧缓存仍可解码（`AppPreferences.kt:88` 注释） | 无法做多城市/历史；读-改-写并发靠 `edit` 串行 |
| 领域层纯 Kotlin、不 import Android | JVM 单测无需 Robolectric；算法可离线复现（NFR-02） | 输入必须先转成 `WeatherReport` 等领域模型 |
| `ClothingPlanner` 作为唯一适配层 | 界面与算法解耦，Presentation 只翻译不参与决策（`design.md` 第一节） | 新增输入需同时改 planner 签名 |
| 引擎无状态、进程内复用一份 | 可并发调用、确定性、无锁 | 参数只能来自 `OutfitEngineConfig`，不能塞运行时缓存 |
| 不用 Navigation 组件 | 只有两个页面 | 无返回栈 → 选城页缺系统返回处理 |
| 定位只用 `LocationManager` | 不引入 Play Services，减小包体与合规面 | 部分机型无 last-known，靠 8s 超时兜底 |

### 6.3 模块与文件清单

| 层 | 包 | 文件数 | 职责 |
|---|---|---|---|
| 应用装配 | `app/` | 1（`AppContainer.kt`，含 `OnionApp`） | DI、OkHttp、WorkManager 注册 |
| 数据 | `data/` | 8 | provider 抽象、两个源、地理、定位、快照持久化、领域数据模型 |
| 算法适配 | `domain/` | 5 | `ClothingPlanner`、`OutfitPresentation`、`WearProfile`、`UserSettings`、`WeatherText` |
| 算法本体 | `domain/outfit/` | 20 | `config/` 2 + `engine/` 13 + `model/` 5 |
| 界面 | `ui/` | 7 | Activity、ViewModel、UI state、首页、示意图、选城、主题 |
| 组件 | `widget/` | 2 | Glance 组件与刷新 Worker |
| 测试 | `test/` | 9 | `domain/outfit/` 7（含 `TestWeather` 夹具）+ `domain/UserSettingsTest` + `data/qweather/QWeatherSourceTest` |

主源码 43 个 Kotlin 文件，约 7.6k 行（其中 `domain/outfit/` 占大头）。

### 6.4 技术栈与版本

AGP 9.2.1 · Kotlin 2.2.20 · Compose BOM 2026.09.00 · Glance 1.1.1 · Retrofit 2.11.0 + kotlinx-serialization converter · OkHttp 4.12.0 · DataStore 1.1.7 · WorkManager 2.10.2 · coroutines 1.10.2 · lifecycle 2.9.1 · JUnit 4.13.2。JVM target 17。

---

## 7. 算法系统设计（摘要，权威见 `design.md`）

### 7.1 调用链

`ClothingPlanner`（`domain/ClothingPlanner.kt`）对外四个入口：

| 入口 | 输入 | 输出 |
|---|---|---|
| `plan(report, settings, inventory)` | 天气报告 + `UserSettings` + 服装库 | `ClothingAdvice`（界面用文案模型） |
| `recommend(..., date, now)` | 同上 + 日期时刻 | `OutfitRecommendation`（结构化结果） |
| `planTomorrow(report, tomorrow, settings)` | 明日样本，固定 07:30 | 一句话建议 |
| `dayparts(report)` | 天气报告 | 早/午/晚三段 |

`UserSettings`（`domain/UserSettings.kt`）= `profile` + `activity` + `outTime/homeTime`；只有同时填了出门与回家时间才产生日程，否则交回 `ScheduleEngine` 按太阳事件切分——**宁粗不用假时间窗污染结果**。

### 7.2 引擎流水线（`RecommendationEngine.recommend`，engine/RecommendationEngine.kt:54-146）

```
WeatherReport + date + now
   ↓ WeatherEngine.build          → WeatherContext（24 × HourlyEnvironment）
   ├─ SolarEngine                 → SolarContext / 太阳高度角 / 辐射 W·m⁻² / UV
   └─ Psychrometrics              → 水汽压 hPa
   ↓ PersonProfileEngine.resolve  → PersonProfile（5 档年龄 + 冷热偏好）
   ↓ ActivityEngine.resolve       → ResolvedActivity（代谢、自生风、雨 exposure…）
   ↓ ThermalComfortEngine.evaluate→ ThermalState（作用温度、所需 clo…）
   ↓ SafetyEngine.assess          → SafetyReport（先算，forcedDemands 只上调）
   ↓ RequirementEngine.build      → OutfitRequirement（六维 DemandVector）★核心中间结果
   ↓ LayeringEngine.plan          → LayerPlan（槽位与层角色）
   ↓ ClothingMatchingEngine       → List<OutfitAssembly>（候选组合，上限 480）
   ↓ OutfitScoringEngine.score    → OutfitScore（8 项加权 + 5 类惩罚 + 硬约束违规）
   ↓ OutfitScoringEngine.select   → Selection（best + 放宽阶梯 NONE→SHELL→ALL）
   ↓ ScheduleEngine + timelineOf  → PeriodRecommendation / TimelineEvent
   ↓ accessoriesOf                → List<Accessory>
= OutfitRecommendation
```

### 7.3 关键设计约束（实现必须守住）

1. **需求向量按各时刻的最坏值取**（保暖取最冷、防风取风最大…），因为产出是一套"全天携带"的组合。
2. **硬约束与软评分分离**：保暖不足、无可用防风壳、无可用防雨壳 = `hardViolations`，先过滤再评分；无解才走放宽阶梯，并把被放宽的 code 记回 `reasons`。
3. **安全只上调**：`SafetyEngine.forcedDemands` 与需求按 `max()` 合并，永不下调（SafetyEngine.kt:24-111 / RequirementEngine.kt:54-66）。
4. **层间不可简单相加**：clo 有递减与风穿透折损（`LayeringEngine` + `ScoringConfig`）。
5. **"设计时刻" = 全天 `requiredIntrinsicClo` 最高的小时**；全天出一套组合，`nowOutfit` 只决定这套里此刻穿几层。

### 7.4 领域模型清单

| 模型 | 关键字段 |
|---|---|
| `HourlyEnvironment` | temperatureC, humidityPercent, windSpeedMs, windDirectionDeg, precipitationMmPerHour, precipitationProbabilityPercent(-1=未知), kind, cloudCoverPercent(-1), uvIndex(-1), solarRadiationWm2, solarElevationDeg, isDay, vaporPressureHpa, sourceFeelsLikeC, fromForecast |
| `WeatherContext` | hourly(24), solar, dayMin/Max/RangeC, dayRainMm, dayRainChancePercent, dayKind, dayUvMax, windMaxMs, lat/lon, hasHourlyForecast, `span()`, `nowHour` |
| `PersonProfile` | age(5 档), preference, preferenceOffsetK, ageColdOffsetK, `comfortOffsetK` |
| `AgeThermalProfile` | coldSensitivity, heatSensitivity, activityAdjustment, overheatingRisk, temperatureChangeSensitivity, sunSensitivity |
| `ActivityProfile` | metabolicWm2, selfGeneratedWindMs, sunExposureGain, rainExposure, breathabilityDemand, removabilityPreference |
| `ClothingItem` | id, name, category(TOP/BOTTOM/OUTER), role(BASE/INSULATION/PROTECTION), insulationClo(0.06–1.20), wind/water/breathability/solar(0..1), weightGrams, removable, min/maxComfortC, shellGrade |
| `ThermalState` | operative/environmentOperative/apparent °C, radiantGainK, windChillK, humidityLoadK, vaporPressureHpa, convectiveCoeff, airInsulationClo, requiredTotalClo, requiredIntrinsicClo, warmth/coldLoad/heatLoad(0-100), effectiveMetabolicWm2, effectiveWindMs, comfortOffsetK |
| `OutfitRequirement` | `DemandVector`(WARMTH/WIND/RAIN/BREATHABILITY/SOLAR/REMOVABLE 各 0-100) + 4 布尔 + reasons |
| `OutfitAssembly` | layers[].items[]、nominal/effective/totalClo、wind/water/breath/solar、windLoss、wetLoss、weightGrams、removableCount |
| `OutfitRecommendation` | requirement, thermalState, dayOutfit, nowOutfit, wornNowCount, wornNowRoles, periods[], timeline[], accessories[], reasons(41 code), safety, dayScore, warnings |

### 7.5 明确不做的（避免误扩范围）

- 不做身高/体重/性别/体表面积建模（`Person` 中无这些字段）——年龄档 + 偏好已覆盖人群差异。
- 不引入第 4 个层角色：需要更厚时用第二个 INSULATION 槽。
- 不为"看起来复杂"增加无实际意义的参数（`design.md` 第 27 节）。

---

## 8. 数据与接口

### 8.1 外部接口

| 用途 | 端点 | 鉴权 | 关键参数 |
|---|---|---|---|
| 天气（默认） | `https://api.open-meteo.com/v1/forecast` | 无 | lat/lon + 11 个 `current` + 11 个 `hourly` + 9 个 `daily`，`timezone=auto`，`forecast_days=2` |
| 天气（和风） | `https://{QWEATHER_HOST}/v7/weather/now｜24h｜7d` | Header `X-QW-Api-Key` | `location = lon,lat`（2 位小数） |
| 城市搜索 | `https://geocoding-api.open-meteo.com/v1/search` | 无 | `name`, `count=12`, `language=zh` |
| 反向地理编码 | `https://api.bigdatacloud.net/data/reverse-geocode-client` | 无 | `latitude`,`longitude`，回退坐标城市 |

数据源选择：`BuildConfig.QWEATHER_KEY` 非空则用和风，否则 Open-Meteo（`AppContainer.kt:103-105`）。**无自动故障转移**（一个源失败即回退旧快照）。

### 8.2 语义约定

- `-1` = 上游未提供该指标（云量/UV/降水概率/辐射），下游引擎必须走估算路径，不得当作 0。
- 时间：Open-Meteo 返回已是当地时区，用 `timezone` 字段建 `ZoneId`；和风用 `obsTime` 偏移，取不到时用 UTC（潜在偏差）。
- `nowInZone()`：观测时间距今 <120min 才信任观测时钟，否则用设备时区当前时间。
- 昼夜：按当天日出日落判定；两源缺数据时兜底 06:30 / 18:30。
- 网络：connect 10s / read 20s / `retryOnConnectionFailure`，日志仅 DEBUG 下 BASIC。

### 8.3 持久化（DataStore）

- 文件名 `onion_wear`，**单个 key** `app_state`，值是 `AppSnapshot` 的 JSON。
- `AppSnapshot` 字段：`city`, `weather`, `profile`, `sensitivity`, `activity`, `outTime`, `homeTime`；`weather` 内嵌 `WeatherSnapshot`（含 lat/lon/cloudCover/uvIndex/radiationWm2/windDirectionDeg 等新字段，全部带默认值以兼容旧缓存）。
- 解码失败 → `AppState.EMPTY`（不崩、不残留脏数据）。
- 写入方式：`mutate { }` 读-改-写，`store.edit` 保证串行。

---

## 9. 配置体系

### 9.1 现有配置组（`domain/outfit/config/OutfitEngineConfig.kt`）

| 组 | 覆盖内容 | 对应 `design.md` |
|---|---|---|
| `ThermalConfig` | 目标皮温与降幅、代谢基准与指数、对流基准 5.5 / 风因子 8.6 / 指数 0.6、辐射 4.7、cloPerKm2W 0.155、clo 上限 2.6、太阳→MRT 增益 0.021、风寒与湿度加载门限、Steadman 0.33/0.7、冷敏感 K/档 6.0 | 八 |
| `SolarConfig` | 辐照与 UV 估算、云量衰减 | 六 |
| `DemandConfig` | 风的 onset/full、寒冷放大、降雨概率与量级、伞的风速限制、透气（代谢/水汽压）、可脱卸、硬壳门限 | 十一/十四 |
| `LayeringConfig` | maxLayers 4、保暖阈值、clo 权重与上限、各角色能力权重、温度窗口、候选数与 maxCandidates 480 | 十七/十八 |
| `ScoringConfig` | 8 项权重（合计 1.00）、层间递减、外壳与下装因子、风穿透、湿损、最低防风/防水要求、5 类惩罚系数 | 二十 |
| `SafetyConfig` | 分级阈值与预警码 | 二十二 |
| `AccessoryConfig` | 配饰触发条件 | 二十二 |
| `PreferenceConfig` | 怕冷/标准/怕热偏移 | 十三 |
| `AgeProfileConfig` | 5 档年龄热特征 | 十二 |
| `ActivityConfig` | 9 类活动代谢与暴露 | 十四 |

服装目录：`ClothingCatalog.items` 共 **45 件**（贴身上装 10 / 贴身下装 9 / 保温层 13 / 防护层 13），clo 值参照 ISO 9920 量级。

### 9.2 与 `design.md` 第 25 节的差距（必须收敛）

所有参数目前都是 **Kotlin 源码里的默认值**——无 `res/raw`、无 assets、无 DataStore 覆盖路径，因此**无法热调参、无法 A/B**。另有阈值散落在引擎里未进配置：

| 位置 | 内容 |
|---|---|
| SafetyEngine.kt:65-97 | 85 / 80 / 90 / 70 直接写在判定里 |
| RequirementEngine.kt:176-183 | 92 / 45 / 88 |
| RecommendationEngine.kt:192-206 | 4.0 / 80.0 / 10.0 / 12.0 |
| ClothingMatchingEngine.kt:232-251 | 2.6 / 1.2 / 1.0 / 0.8 / 0.6 / 1.4 / 0.5 / 0.35 / 0.6 / 0.02 |
| LayeringEngine.kt:123 · OutfitScoringEngine.kt:58-93 | 0.3 与各惩罚系数 |
| OutfitEngineConfig.kt:29 `catalog` | 字段从未被读取（匹配用的是入参 `inventory`）——死配置 |

---

## 10. 测试与验收标准

### 10.1 单元测试现状

最近一次**已记录**的运行：2026-09-23 11:31，6 个测试类 **71 个用例全绿**（failures=0 / errors=0）。
11:54–12:15 之间的改动（`WeatherEngine`、`Weather.kt`、`AppPreferences`、`MainUiState/ViewModel/Activity`、`HomeScreen`、`OnionWidget`、`ClothingPlanner`、`OutfitPresentation`、新增 `UserSettings`、新增 2 个测试类）**尚未重跑**，所以 71 绿不能当作当前基线（见 11.1-B1）。

| 测试类 | 用例 | 覆盖方向 |
|---|---|---|
| `ThermalComfortEngineTest` | 13 | 温度 −10…35 全段单调、风的单调性与"高温侧不降温"、湿度只在高温侧加载、太阳辐射不与气温重复、活动、年龄、偏好 |
| `RequirementEngineTest` | 9 | 六维逐项单调性、无风才建议伞、夜间无太阳辐射 |
| `LayeringAndMatchingTest` | 19 | 层角色正确、"层数既不塌也不爆"、层间非相加、防护层需真防风、硬约束拒绝与放宽阶梯非空 |
| `SafetyEngineTest` | 9 | 安全只上调需求 |
| `SolarEngineTest` | 7 | NOAA 太阳高度、极昼极夜、缺数据回退、云量衰减 |
| `RecommendationEngineTest` | 14 | 端到端、确定性、缺逐小时数据的降级、用户日程、界面契约 |
| `UserSettingsTest`（12:12 新增） | 未统计 | 日程派生规则：缺一半时间不给日程、回家不晚于出门不给日程、三段窗口切分正确 |
| `QWeatherSourceTest`（12:11 新增） | 未统计 | 和风响应解析（含 `-1` 未知字段与日出日落兜底路径） |

### 10.2 测试哲学（`design.md` 第 26 节，硬要求）

不写"20℃ 必须穿某件"式断言；只写**方向性**断言：输入变化时，需求/层数/评分是否按预期方向变化。新增参数必须能回答：影响什么 / 为什么 / 方向 / 如何归一化 / 如何避免重复计算。

### 10.3 覆盖缺口（补测优先级）

1. `ScheduleEngine` 无日程时的派生窗口与 `phaseAt`（随 FR-17 上线必测）。
2. `timelineOf` 的 ADD/REMOVE 派生（S2 场景的正确性来源）。
3. `WeatherEngine.syntheticTemperature` 的昼夜滞后曲线、露点/水汽路径。
4. `accessoriesOf` 阈值；`PersonProfileEngine` / `ActivityEngine` 直接单测。
5. `INFANT` / `TEEN` / `ELDERLY` 端到端（现仅到 requirement 层）。
6. `OutfitPresentation` 的 code→文案映射（防止"有结论没解释"）。
7. 风带 0/2/5/8 m/s 与湿度 30/50/70/90% 目前各只探 2 个点，未成 `design.md` 要求的网格。
8. **界面装配层仍无测试**：`MainUiState` 组装（六维需求条与层淡显的取数逻辑）、`AppPreferences` 编解码（旧缓存兼容）、`AppContainer` 的数据源选择分支。
9. `SettingsSheet` 交互（活动/时间步进）无 UI 测试；`DemandCard` 与需求向量的映射无契约测试。

### 10.4 验收标准

| # | 验收项 | 判据 |
|---|---|---|
| A1 | 算法复核 | `design.md` 第 27 节 10 项逐条能指出实现位置与对应测试（附录 C） |
| A2 | 方向性 | 温度/风/湿度/辐射扫段，结果单调且不重复计算 |
| A3 | 确定性 | 同输入 100 次调用结果完全一致（已有单测） |
| A4 | 降级 | 删除 hourly/UV/辐射字段后仍能出建议且带估算说明 |
| A5 | 闭环 | 冷启动 → 有数据 → 三层建议 → 换人群/活动/时间立即重算（不重复请求网络） |
| A6 | 离线 | 断网启动直接看到上次快照 + 时间标注 |
| A7 | 真机/模拟器 | 首页全部卡片（含需求条、未穿层淡显）+ 设定面板 + 选城页 + 组件，三种天气×昼夜目视通过；符合 NFR-10 |
| A8 | 构建 | `assembleRelease` 缺 keystore 时警告且产出可安装（但不标记为可上架） |
| A9 | 编译与回归 | `compileDebugKotlin` + `testDebugUnitTest` 全绿（当前不满足，见 11.1） |

---

## 11. 当前实现状态与差距

### 11.1 阻塞项（发版前必须处理）

| # | 问题 | 证据 | 影响 |
|---|---|---|---|
| B1 | **未验证的编译与回归**：`UserSettings` 贯穿重构（planner / MainUiState / MainViewModel / MainActivity / HomeScreen / OnionWidget / AppPreferences）在 12:05–12:15 期间完成，接口对齐看着是对的，但**尚未跑过 `compileDebugKotlin` 与单测** | `ClothingPlanner.kt:24,33,51` ↔ `MainUiState.kt:86,153`、`OnionWidget.kt:111` 均已传 `settings`；`test-results/` 停在 11:31 | 阻塞 A9；FR-16/17/35 无法宣布验收 |
| B2 | 新增能力只覆盖了单测层面的一半：`UserSettingsTest`、`QWeatherSourceTest` 写了但没跑过；界面装配层与 `ScheduleEngine` 派生窗口仍无测试 | 见 10.1 / 10.3 | 日程与组件路径的正确性靠目视 |
| B3 | 仓库**无任何 commit**（`.gitignore`/`keystore/` 已就位但工作未固化） | `git log`：no commits | 无法回滚、无法 diff 审查 |
| B4 | QWeather key 未配置，新数据源实际未在生产路径上跑过 | `local.properties` 无 `qweather.*`；`AppContainer.kt:103-105` | FR-02 未验证；`radiationWm2` 恒为 −1 的降级路径需实测 |

### 11.2 已知功能/健壮性缺口

| 类别 | 缺口 | 建议 |
|---|---|---|
| 交互 | 选城页无系统返回处理，返回即退出应用 | 加 `BackHandler { screen = "home" }` |
| 交互 | 无多城市、无首启引导；默认上海（31.2304, 121.4737）首启即写入快照，空状态几乎不可达 | M2 决定取舍；至少让首启走一次定位或选城 |
| 数据 | 无缓存 TTL / 陈旧判定；`WeatherRepository.cached()` 无人调用；`metaLine` 数据源名硬编码 | 定义最大可信时长（如 60min）+ 按 provider 动态显示 |
| 数据 | 无 provider 故障转移；和风 `sunrise/sunset` 与 Open-Meteo 都硬编码 06:30/18:30 兜底 | 失败切另一源；兜底改为按纬度估算 |
| 组件 | `updatePeriodMillis=1800000` 与 WorkManager 1h 双周期重复；Worker 无 `Constraints` 网络约束；无 `previewImage`/`minResize*` | 去掉 XML 周期或拉长，Worker 加 Network constraint |
| 算法可解释 | 41 个 `ReasonCode` 中存在从未产生的死 code（`LAYER_MUST_BE_ADDED`、`PERSONAL_THERMAL_PREFERENCE`、`SUN_PROTECTION_REQUIRED` 等）；`Accessory.widgetHeadline()` 未使用 | 要么接上，要么删除，避免"契约里的空承诺" |
| 配置 | 阈值散落 + `catalog` 死字段（9.2）；无外部化通道 | M3：`res/raw` JSON + DataStore 覆盖 + 校验器 |
| 性能 | NFR-04（<50ms）无实测数据；480 候选 × 45 件组合是主要开销 | 加基准测试（JVM 侧即可） |
| 无障碍 | 图标无 `contentDescription`；92sp 数字与自定义 Canvas 对 TalkBack 无语义；未测大字体/高对比 | M2 专项 |
| 本地化 | `strings.xml` 中 `layer_header`、`title_daypart`、`widget_*` 未引用，界面与组件中文硬编码 | 统一到资源 |
| 权限 | 无定位服务未开启检测（`isProviderEnabled`）、无拒绝后引导去设置 | 补 rationale |

### 11.3 与 `design.md` 的符合度小结

算法主体（模块拆分、六维需求、安全前置只上调、硬约束与评分分离、层间非相加、太阳不重复计算、可解释 code、方向性测试）**已符合** spec；主要偏离集中在两点：**配置化不足 / 参数外泄**（9.2），以及**参数调不了、衣橱不是自己的**（FR-24、M3）。用户可控输入（人群、体质、活动、日程）在 12:15 前已打通到界面。

---

## 12. 迭代规划

### M1 收尾（当前版本，1 周内）
1. 跑 `compileDebugKotlin` + `testDebugUnitTest`，把 12:05–12:15 的改动纳入绿灯基线（解 B1）。
2. 补 `ScheduleEngine` 派生窗口、`timelineOf` ADD/REMOVE、`MainUiState` 六维需求取数的单测（解 10.3-1/2/9）。
3. 模拟器目视验收：新"穿衣设定"面板（活动 + 出门/回家时间）、需求条配色、三层淡显对比度（解 A7、NFR-10）。
4. 首次提交并按模块划分 commit（解 B3）。
5. 补选城页 `BackHandler`、Worker 网络约束、去重双刷新周期。

### M2 可发布（1.0-release）
- QWeather key 配置与双源对比实测（含 `radiationWm2 = −1` 降级路径）；决定主源与故障转移策略。
- 无障碍专项（语义 + 大字体）、缓存 TTL 与陈旧标记、错误重试入口。
- 清理死 code / 死字段 / 未引用资源；文案进 `strings.xml`。
- release 签名流程文档化（`keytool` 步骤已在构建脚本注释中），隐私说明页。
- 性能基准（NFR-04）。

### M3 可调参（算法运营化）
- `OutfitEngineConfig` 外置：`res/raw` 默认 JSON + DataStore 覆盖 + 加载校验（缺失字段回落默认）。
- 剩余散落阈值全部迁入配置组（9.2 表逐条清空）。
- 参数变更的回归脚本：同一份天气样本 × 多组参数 → 输出对比表（支撑 `design.md` 要求的可 A/B）。

### M4 衣橱与个性化（下一个产品版本）
- 用户衣橱（FR-24）：从 45 件目录中选 + 自建衣物（12 属性表单），`ClothingInventory` 由用户数据构造；衣物照片可选。
- 多城市收藏与切换（FR-32）、明早降温通知（FR-33，需 POST_NOTIFICATIONS）。
- 理由全量透出（FR-25）：可展开的"为什么这么穿"面板。

---

## 13. 风险与待决策

| 风险 | 影响 | 应对 |
|---|---|---|
| 上游数据源免费额度/字段变更（云量、UV、辐射） | 太阳与防护维度退化到估算，建议偏保守 | 双源 + 显式降级标记；对外文案避免承诺精度 |
| 参数全部硬编码 | 调参要发版，无法 A/B | M3 外置，之前用样本回归脚本兜底 |
| 45 件固定目录 ≠ 用户真实衣柜 | 建议"对但不可执行"（推荐了没有的衣服） | M4 衣橱；M1 先在文案上弱化"必须有" |
| 单 JSON 快照 | 多城市/历史无法扩展 | M4 前不引入 DB，避免过度设计 |
| 热舒适模型对极端湿热/干冷的经验系数缺乏真人标定 | 个别用户"说得不对" | 记录反馈通道 + 参数外置后小范围调 |
| 无 commit / 无 CI | 任何改动都无回归护栏 | B3 + 建议加最小 CI（编译 + 单测） |

**需要用户拍板（影响 M1/M2 范围）**

1. 活动与日程已落地（默认 `WALKING` + 无日程）：是否要在首启引导里让用户填一次，还是保持"不填就按太阳事件切分"？
2. 主数据源定谁？和风需要 API key，是否值得作为默认？
3. 1.0 是否要求可上架（签名 + 隐私政策 + 无障碍），还是内部自用即可？
4. 衣橱（M4）是否提到 1.0？这会把范围从"看建议"扩到"管理数据"。
5. 参数外置（M3）是发布前置还是发布后第一优先？

---

## 附录 A：术语

| 术语 | 含义 |
|---|---|
| clo | 服装热阻单位；1 clo ≈ 在 21℃ 静坐舒适。目录值参照 ISO 9920（0.06–1.20） |
| MET / metabolicWm2 | 代谢产热，活动强度的核心影响通道 |
| 作用温度 operative temp | 气温与辐射的平均效应，热舒适计算的实际输入 |
| MRT / radiantGainK | 平均辐射温度及其带来的升温（太阳因素走这里，不改气温） |
| 风寒 windChillK | 风导致的降温量，低温侧模型与高温侧不同 |
| SWLR | 短波辐射，用于遮阳/防晒维度 |
| 需求向量 DemandVector | 六维 0–100：WARMTH / WIND / RAIN / BREATHABILITY / SOLAR / REMOVABLE |
| 层角色 LayerRole | BASE（贴身舒适与排汗）/ INSULATION（保温）/ PROTECTION（防风防雨防寒遮阳） |
| 设计时刻 | 全天 `requiredIntrinsicClo` 最高的小时，决定携带结构 |
| ReasonCode | 41 个结论溯源码，`OutfitPresentation` 唯一负责翻译为人话 |
| 硬约束 hardViolations | 不参与加权评分的否决项：保暖不足 / 无防风壳 / 无防雨壳 |

## 附录 B：需求 → 代码索引（节选）

| FR | 主要文件 |
|---|---|
| FR-01/02 | `data/openmeteo/OpenMeteoSource.kt`、`data/qweather/QWeatherSource.kt`、`AppContainer.kt:83-117` |
| FR-03/06 | `data/geo/CitySearch.kt`、`ui/picker/CityPickerScreen.kt` |
| FR-04/05 | `data/location/DeviceLocationProvider.kt`、`ui/MainActivity.kt:51-63` |
| FR-07/08/15 | `data/WeatherRepository.kt`、`ui/MainViewModel.kt:107-121` |
| FR-10~13/20/21 | `domain/outfit/engine/{Layering,ClothingMatching,OutfitScoring,Schedule,Recommendation}Engine.kt` |
| FR-14/15 | `domain/WearProfile.kt`、`domain/outfit/engine/PersonProfileEngine.kt`、`ui/home/HomeScreen.kt:217-306`（SettingsSheet） |
| FR-16/17 | `domain/UserSettings.kt`、`ui/home/HomeScreen.kt:256-286`、`data/local/AppPreferences.kt:127`、`ui/MainViewModel.kt:68-77`（改设置只重算不重下） |
| FR-35 | `ui/home/HomeScreen.kt:657-714`（DemandCard/DemandBar）、`ui/theme/OnionTheme.kt:69-79` |
| FR-18/19 | `domain/ClothingPlanner.kt`、`ui/MainUiState.kt:125-130`、`ui/home/HomeScreen.kt`（Daypart/Hours） |
| FR-22 | `domain/outfit/engine/SafetyEngine.kt` |
| FR-26~28 | `ui/MainActivity.kt`、`ui/home/HomeScreen.kt`、`ui/home/OnionDiagram.kt`、`ui/theme/OnionTheme.kt` |
| FR-29/30 | `widget/OnionWidget.kt`、`widget/WeatherRefreshWorker.kt`、`res/xml/onion_widget_info.xml` |

## 附录 C：`design.md` 第 27 节十项复核点 ↔ 实现 ↔ 测试

| # | 复核点 | 实现要点 | 测试 |
|---|---|---|---|
| 1 | 重复计算 | 太阳走 `radiantGainK` 抬作用温度，不改气温；湿度走独立 `humidityLoadK` | `ThermalComfortEngineTest`（solar-vs-operative separation） |
| 2 | 年龄与活动重复加权 | 年龄只改 `AgeThermalProfile` 敏感系数；活动只走代谢/自生风/暴露通道 | `ThermalComfortEngineTest`（activity、age 分组） |
| 3 | 湿度在低温被误读 | 湿度加载设高温门限，低温侧不加载 | `ThermalComfortEngineTest`（hot-side-only） |
| 4 | 风速冷热两侧不同模型 | 低温风寒系数、高温加速散热但受湿度限制；`windChillK` 与对流分开 | `ThermalComfortEngineTest`（风不降温于高温） |
| 5 | 雨水主要影响防护 | `RAIN` 维度驱动 PROTECTION 与 `Accessory`，不直接减温 | `RequirementEngineTest` |
| 6 | 辐射与气温重复 | 辐射仅在晴空与太阳高度角为正时加载，夜间归零 | `SolarEngineTest` + `RequirementEngineTest`（night solar） |
| 7 | 层数合理 | `LayeringConfig.maxLayers=4`，保暖阈值决定槽位；测试断言"不塌不爆" | `LayeringAndMatchingTest:58-113` |
| 8 | 服装组合冲突 | 层间 clo 递减 + 风穿透折损 + 下装因子 + 角色去重 | `LayeringAndMatchingTest:150,165` |
| 9 | 评分高但不安全 | 硬约束先过滤，安全需求只上调；放宽阶梯记录在案 | `SafetyEngineTest:98`、`LayeringAndMatchingTest:237,270` |
| 10 | 参数互相放大 | 各维度独立归一到 0–100 后取 max 而非乘积；权重合计 1.00 | `RequirementEngineTest` 单调性 + `RecommendationEngineTest` 确定性 |

> 第 7 项复核还有一条硬约束：任何新增参数必须写清"影响什么/为什么/方向/归一化/如何避免重复计算"，并配方向性测试——这是代码评审的准入门槛。