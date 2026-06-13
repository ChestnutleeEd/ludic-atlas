# Ludic Atlas / 游戏星图

Ludic Atlas / 游戏星图 is a Next.js + TypeScript game culture atlas. It is not just a game list: it is a visual game culture map that lets people explore games through space and time.

游戏星图是一个“游戏文化地图 / 游戏地球 / Ludic Atlas”式的网站。用户可以从首页进入 3D 游戏地球，按国家或地区发现代表性游戏，也可以进入 Game Chronicle / 游戏编年馆，通过时间线浏览游戏档案。

## Screenshots / Preview

![Ludic Atlas Preview](docs/assets/preview.png)

## Features

- Home / Hub: Ludic Atlas landing hub with Earth Explorer and Game Chronicle entrances.
- Game Earth / 3D Globe: interactive 3D globe, country outlines, country focus, and game cover markers.
- Game Chronicle Archive / 游戏编年馆: timeline-based archive browsing, year drawers, filters, and game dossiers.
- Country / region game views: country list, country detail panel, representative games, ratings, genres, platforms, and developers.
- Game details: cover image, developer, publisher, release year, platforms, rating, and description.
- Year and display controls: release-year filtering and cover-size controls for globe exploration.
- RAWG data workflow: local static RAWG data generation, local cover cache, and reviewed country inference data.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- three.js
- react-globe.gl
- GSAP and Motion for selected interface animation
- RAWG API scripts for local data generation

## Data Pipeline / 数据来源与处理

本项目的数据不是官方结论，也不应被理解为完整、权威的国家游戏产业排名。当前数据主要用于文化展示、课程实践和作品集原型。

Current data is assembled from public game metadata, RAWG records, developer / publisher information, local cover caching, and local country inference workflows. The country or region mapping is based primarily on the developer or studio associated with a game. Some records may remain unknown or require manual review.

Browser pages do not call RAWG directly. RAWG data is generated locally into static TypeScript data, and cover images can be cached under `public/covers/rawg/`.

```bash
npm run data:rawg
npm run data:covers
npm run data:apply-countries
```

Use `.env.local` for local API keys only:

```bash
RAWG_API_KEY=your_rawg_api_key
```

`.env.local` is ignored by Git. Do not commit API keys, tokens, `.env` files, `.next/`, `node_modules/`, temporary files, or generated build output.

## Local Development

### macOS

Install Node.js LTS and npm first. Recommended options:

- Install from [nodejs.org](https://nodejs.org/)
- Or use a version manager such as `nvm`

Clone and run:

```bash
git clone https://github.com/ChestnutleeEd/ludic-atlas.git
cd ludic-atlas
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### Windows

Use PowerShell or the VS Code Terminal. Install Node.js LTS from [nodejs.org](https://nodejs.org/) first.

Clone and run:

```powershell
git clone https://github.com/ChestnutleeEd/ludic-atlas.git
cd ludic-atlas
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Quick Start / 快捷打开方式

The project includes a friendly local start alias:

```bash
npm run start:local
```

It starts the same Next.js development server as `npm run dev`. To keep the command stable on macOS and Windows, it does not force-open a browser automatically. After the server starts, open:

```text
http://localhost:3000
```

## Project Structure

```text
src/app/                  Next.js App Router pages, root layout, global styles
src/components/home/      Ludic Atlas landing hub
src/components/globe/     3D globe, country layer, cover markers, tooltip
src/components/archive/   Game Chronicle archive and timeline components
src/components/panels/    Country list, country detail, global gallery, game detail
src/components/controls/  Year slider, cover size slider, view controls
src/data/                 Country data, generated RAWG game data, mock fallback data
src/lib/                  Filtering, statistics, localization, geo helpers, search
src/types/                Shared TypeScript types
scripts/                  RAWG fetch, cover cache, country inference scripts
public/covers/rawg/       Git-tracked local RAWG cover cache
docs/                     Project docs, schema, architecture, preview assets
```

## Scripts

```bash
npm run dev
npm run start:local
npm run lint
npm run build
npm run typecheck
npm run data:rawg
npm run data:covers
npm run data:apply-countries
```

## Inspiration / 灵感来源

The Earth Explorer interaction references the broad functional idea of Movie Globe: exploring media through a world map, geographic grouping, cover markers, hover previews, and detail panels. Ludic Atlas adapts that idea for global game culture rather than film.

游戏地球部分的概念灵感部分来自小红书博主「麻省理工 Rui同学」关于用 AI 体验世界人文的内容方向。本项目仅作为个人学习与课程/作品集实践，不代表该博主参与、授权或背书本项目。

The Game Earth concept was partly inspired by the Xiaohongshu creator "麻省理工 Rui同学" and their content direction around using AI to explore global humanities. This project is a personal learning / portfolio project and does not imply participation, authorization, or endorsement by the creator.

## Roadmap / 后续计划

- Improve 3D globe performance and mobile interaction.
- Expand reviewed country / region game data.
- Improve local cover quality and fallback behavior.
- Add stronger country inference review tooling.
- Refine Game Chronicle browsing, filtering, and dossier views.
- Add more project screenshots and deployment notes.

## Repository

[https://github.com/ChestnutleeEd/ludic-atlas](https://github.com/ChestnutleeEd/ludic-atlas)

## License

No license has been selected yet.
