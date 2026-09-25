# 洋葱穿搭 OnionFit

按天气告诉你今天怎么穿、穿几层、什么时候脱、出门带不带伞。

移动端优先的纯前端 PWA：输入城市（或定位），基于开源天气数据与确定性穿搭算法，给出「贴身层 + 保暖层 + 防护层」的完整搭配、逐时脱加层时间线和明日展望。

## 功能

- **完整穿搭推荐**：上下装分开推荐（贴身上装 + 贴身下装 + 保暖层 + 防护层），按全天最坏时刻设计
- **六维需求模型**：保暖 / 防风 / 防雨 / 透气 / 遮阳 / 可脱卸，逐时取最坏值驱动选衣
- **此刻怎么穿**：按当前热状态决定哪些层正穿、哪些层带着备用
- **什么时候脱 / 加**：基于逐时气温的加减层时间线
- **今天带伞吗**：把「出门带不带伞」量化为通勤两段暴露窗口的被淋概率，按 cost-loss 阈值给推荐 / 不推荐，大风与暴雨自动改判雨衣
- **个性化**：人群（儿童/成人/老人）、冷热偏好（怕冷/标准/怕热）、活动（居家/办公/步行/骑行/跑步等）、出门/回家时间
- **配置即存**：所有用户配置持久化在本地，重新打开沿用上次选择
- **PWA**：可安装到主屏，天气快照离线可看
- **下拉刷新 / 触感反馈 / iOS 风格交互**

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` + TypeScript） |
| 构建 | Vite 8 + vue-tsc |
| 状态 | Pinia（`useLocalStorage` 持久化用户设置） |
| 样式 | UnoCSS + Sass，玻璃拟态 + 天气渐变 |
| 工具库 | @vueuse/core（定位/深色/防抖/过渡/振动）、dayjs、@iconify/vue（图标本地化，零网络加载） |
| PWA | vite-plugin-pwa（prompt 更新策略） |
| 测试 | Vitest（`core/` 纯函数方向性断言，node 环境） |

## 快速开始

```bash
pnpm install
pnpm dev        # 本地开发 http://localhost:5173
pnpm build      # 类型检查 + 生产构建 → dist/
pnpm test       # 算法层单测（Vitest）
pnpm preview    # 本地预览生产构建
```

## 目录结构

```
src/
├── core/            # 算法层（纯 TS，无 Vue 依赖，可独立测试）
│   ├── engine/      # 需求/分层/匹配/评分/日程/安全等引擎
│   ├── catalog.ts   # 服装目录（ISO 9920 clo 量级）
│   ├── config.ts    # 全部阈值/系数集中配置
│   └── types.ts     # 领域模型
├── data/            # 数据层：WeatherProvider 抽象
│   ├── openmeteo/   # 默认实现（开源免费，无需 key）
│   └── qweather/   # 预留实现（接入 key 即可切换）
├── services/        # 天气/城市服务编排
├── stores/          # Pinia（天气快照 / 用户设置持久化）
├── presentation/    # 文案层（只翻译不决策）
├── composables/     # 下拉刷新 / 调色板 / 主题 / 触感
├── cards/           # 首页分区卡片
├── components/      # 基础组件（玻璃卡片 / 分段选择器 / 时间选择…）
└── views/           # 首页 / 选城页
```

## 天气数据

默认使用 [Open-Meteo](https://open-meteo.com/)：开源、免费、无需 API key。

数据源通过 `WeatherProvider` 接口抽象（`src/data/provider.ts`），将来接入和风天气等商业源时实现同一接口即可，算法与 UI 无需改动。

## 部署（GitHub Pages）

推送到 `main` 分支自动触发 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：pnpm 安装依赖 → 构建（`VITE_BASE=/onionfit/`）→ 官方 Pages 三件套部署。

**在线访问：<https://fwd001.github.io/onionfit/>**

一次性设置：仓库 **Settings → Pages → Source 选择 "GitHub Actions"**（若已选则无需操作）。

仓库名变更时同步修改 workflow 中的 `VITE_BASE`。
