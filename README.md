# Ludic Atlas / 游戏星图

一个跨越地理与时间的 3D 全球游戏文化图谱。

Ludic Atlas / 游戏星图是一个游戏文化探索产品。它把游戏放进国家、地区、年份、开发者与媒介史语境中展示，而不是只做普通游戏列表。当前版本提供 3D 游戏地球、游戏编年馆、RAWG 本地数据生成、国家 / 地区推断与封面缓存流程。

> 当前项目是可运行 MVP。浏览器运行时只读取本地静态数据、本地 GeoJSON 和本地封面资源；不会在页面里直接请求 RAWG API，也不需要后端数据库。

## 项目是什么

Ludic Atlas 的核心体验分为三层：

- 地球探索：通过 3D 地球按国家 / 地区浏览代表性游戏。
- 游戏编年馆：通过年份时间线浏览生成的全球游戏档案。
- 数据引擎：通过本地脚本抓取 RAWG 数据、推断国家 / 地区、缓存封面，并输出静态 TypeScript 数据。

国家 / 地区映射规则基于游戏主要开发商或工作室所在国家 / 地区。这是用于文化探索与作品展示的项目级推断，不代表官方分类。

## 快速打开

### 下载 release 包后打开

1. 进入 GitHub Releases 页面，下载适合系统的压缩包。
2. 解压压缩包。
3. macOS 双击 `start-mac.command`；Windows 双击 `start-windows.bat`。
4. 脚本会检查 Node.js、安装依赖并启动本地服务。
5. 浏览器打开：

```text
http://localhost:3000
```

如果电脑没有安装 Node.js，请先安装 Node.js LTS：

- 下载地址：https://nodejs.org/
- 建议版本：Node.js 20 或更新的 LTS 版本。

说明：这是 Next.js + TypeScript 项目，不是原生桌面应用。当前 release 包会尽量做到“解压后双击启动”，但首次运行仍需要本机安装 Node.js，并可能需要联网下载 npm 依赖。

### 命令行打开

```bash
git clone https://github.com/ChestnutleeEd/ludic-atlas.git
cd ludic-atlas
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

常用命令：

```bash
npm run dev
npm run start:local
npm run lint
npm run typecheck
npm run build
```

## 功能

### 3D 游戏地球

- 使用 `react-globe.gl` 和 Three.js 渲染真实可交互 3D 地球。
- 使用本地轻量 GeoJSON 展示世界国家边界。
- 支持国家聚合点、代表性游戏封面标记、悬停提示与点击详情。
- 支持区域预设、国家聚焦、Overview / Surface 相机模式、缩放控制与移动端底部面板。
- 保留实验性 `/earth-pro` 路由，使用 MapLibre GL JS 和 deck.gl 验证更高性能的 GPU 图层架构。

### 游戏编年馆

- 以年份为中心组织生成的游戏档案。
- 年份卡片展示游戏数量、封面预览、平均评分、代表类型和平台。
- 支持标题搜索、类型筛选、平台筛选、年份排序和评分排序。
- 点击年份后打开年度展柜，查看年度概览与单个游戏档案。
- 视觉方向是复古档案馆 + 高级数字展厅，而不是普通列表页。

### 数据引擎

- `scripts/fetch-rawg-games.mjs` 从 RAWG 生成本地静态游戏数据。
- batch 模式按日期、Metacritic、排序、分页和最大数量抓取 RAWG 列表数据。
- seed 模式支持人工维护国家 / 地区映射。
- 国家推断流程会把高置信结果应用到生成数据。
- 封面缓存脚本会把 RAWG 远程封面下载到 `public/covers/rawg/`，并把数据里的 `coverImage` 改成本地路径。
- 当前生成数据规模约 1000 款游戏，并包含本地缓存封面与 fallback 封面。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `react-globe.gl`
- Three.js
- MapLibre GL JS / deck.gl
- GSAP / Motion
- RAWG API
- Node.js 本地数据脚本

## 数据流程

浏览器端不会直接访问 RAWG。数据先在本地生成，再作为静态文件进入前端。

```text
RAWG API
  -> scripts/fetch-rawg-games.mjs
  -> src/data/games.generated.ts
  -> scripts/cache-rawg-covers.mjs
  -> public/covers/rawg/
  -> scripts/apply-country-inference.mjs
  -> src/data/games.ts
  -> 地球探索 / 游戏编年馆
```

开发者更新数据时常用：

```bash
npm run data:rawg
npm run data:covers
npm run data:enrich
npm run data:apply-countries
npm run data:infer-countries:dry
```

只有重新抓取 RAWG 数据时才需要 `.env.local` 和 `RAWG_API_KEY`。普通用户运行已发布版本不需要 RAWG API Key。

## 截图

### 首页入口

![首页入口](docs/assets/readme/home-hub.png)

### 3D 游戏地球

![3D 游戏地球](docs/assets/readme/earth-globe.png)

### 国家详情面板

![国家详情面板](docs/assets/readme/country-detail.png)

### 游戏详情卡

![游戏详情卡](docs/assets/readme/game-detail-card.png)

### 游戏编年馆

![游戏编年馆](docs/assets/readme/game-archive.png)

## 目录结构

```text
src/app                 Next.js 路由、布局与全局样式
src/components/home     首页入口与产品入口组件
src/components/globe    3D 地球、国家层、标记与提示
src/components/archive  游戏编年馆时间线与档案界面
src/components/panels   国家列表、国家详情、游戏详情面板
src/components/controls 地球探索筛选与相机控制
src/components/earth-pro 实验性 MapLibre / deck.gl 探索界面
src/data                前端静态游戏与国家数据
src/lib                 筛选、统计、地理、封面、区域工具
src/types               TypeScript 数据契约
scripts                 RAWG 抓取、补全、推断、封面缓存脚本
public/covers           本地封面资源与 fallback 图
public/data             本地 GeoJSON 国家边界数据
docs                    产品、架构、数据结构与 release 文档
```

主要入口：

- `src/app/page.tsx`
- `src/components/GameEarthApp.tsx`
- `src/components/globe/GameGlobe.tsx`
- `src/components/archive/GameArchiveView.tsx`
- `src/app/earth-pro/page.tsx`

## 项目文档

- `docs/00_PROJECT_INDEX.md`：项目导航索引
- `docs/01_PRODUCT_SPEC.md`：产品范围与 MVP 规则
- `docs/02_FEATURE_MAP.md`：功能到文件的映射
- `docs/03_ARCHITECTURE.md`：技术架构
- `docs/04_DATA_SCHEMA.md`：数据结构与生成规则
- `docs/releases/v0.1.0.md`：v0.1.0 中文 release notes

## 当前状态

v0.1.0 是第一个正式 MVP release。它适合本地体验、作品集展示、课程展示和后续产品迭代；它不是完整商业游戏数据库。

当前尚未选择开源许可证。
