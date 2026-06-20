# 01_PRODUCT_SPEC.md

## Product Name

Ludic Atlas / 游戏星图

## One-Sentence Positioning

Ludic Atlas / 游戏星图 is a global game culture discovery product that lets users explore games through space and time: Earth Explorer focuses on country-based 3D earth exploration, while Game Chronicle focuses on timeline-based game archive browsing.

## Product Type

Ludic Atlas is primarily a game culture discovery and recommendation product.

It is not intended to be a complete game database in the first MVP. It should first work as an interactive, visual, and explorable product prototype.

## Reference Product Logic

The reference product is Movie Globe.

Earth Explorer should learn from its functional structure:

- global map / earth as the main exploration space
- country-based content organization
- cover cards distributed by geography
- right-side country list and detail panel
- hover preview
- click-to-view detail
- year filter
- cover size control

Ludic Atlas does not need to copy Movie Globe's exact visual style.

## Product Language Policy

Ludic Atlas should use Chinese as the primary interface language.

UI titles, field labels, buttons, panel headings, empty states, and explanatory copy should be written in Chinese first. English can remain as supporting information for proper nouns such as game titles, studio / company names, publisher names, platform names, and English country names.

Display rules:

- Countries should prefer Chinese names and may show English names as secondary information, for example `日本 Japan`.
- Games should prefer `titleZh` when available and show the English title as a subtitle.
- Company names and platform names can remain in their official English form.
- Genre values may stay in raw mock data, but UI should map common genre labels to Chinese where practical.

## Target Users

### Primary Users

Users who are interested in games, game culture, and global game industry differences.

They may want to know:

- which countries have produced famous games
- what kinds of games are representative of each country
- how game styles differ across countries and regions
- what games to try if they are interested in a specific country's culture

### Secondary Users

- game industry learners
- students making game / digital humanities projects
- users interested in interactive data visualization
- portfolio reviewers evaluating product and frontend implementation ability

## Core User Scenarios

### Scenario 1: Explore games by country

A user clicks Japan, Poland, China, the United States, or South Korea and views representative games from that country.

### Scenario 2: Understand national game styles

A user checks the main genres, average rating, representative studios, and release years of games from a specific country.

### Scenario 3: Discover games visually

A user browses game covers on the globe and hovers over a cover to see the game name, rating, year, and genre.

### Scenario 4: Filter games by time

A user drags a year slider to explore games from different periods.

### Scenario 5: Browse the game chronology

A user opens Game Chronicle / 游戏编年馆 and browses the generated global game list through a retro digital archive hall, searchable collection index, film-style year timeline, title search, genre filters, platform filters, and rating sort. Clicking a year opens a large Year Exhibit / 年度展柜 modal for that year's games and dossier details.

### Scenario 6: Choose an exploration mode

A user opens the site and first sees Ludic Atlas / 游戏星图 with two independent entrances: Earth Explorer / 地球探索 and Game Chronicle / 游戏编年馆.

### Scenario 7: Use the experimental full-screen earth engine

A user opens Earth Explorer Pro / 游戏地球 Pro and explores the same local game-country data through a full-screen geospatial dashboard, using country / region presets and a collapsible detail panel while the legacy Earth Explorer remains available as a fallback.

## Country Mapping Rule

For the MVP, each game is mapped to the country or region of its main developer / studio.

Examples:

- Nintendo / FromSoftware / Capcom -> Japan
- CD Projekt Red -> Poland
- Rockstar Games / Valve / Naughty Dog -> United States
- Ubisoft Montreal -> Canada
- Supercell -> Finland
- miHoYo / Game Science / Tencent Games -> China

If a game involves multiple countries, MVP should use one primary country only.

## MVP Features

The first version should include:

1. 3D earth or interactive world map
2. country-based game distribution
3. game cover markers
4. right-side country list panel
5. country detail panel
6. game hover tooltip
7. game detail card
8. year filter
9. cover size control
10. local mock data
11. Ludic Atlas landing hub with Earth Explorer and Game Chronicle entrances
12. Game Chronicle horizontal timeline view for RAWG-generated global game records
13. Earth Explorer region mode with Global, Europe, East Asia, North America, Latin America, Middle East, South Asia, and Oceania camera presets
14. Premium black-gold atlas visual system for Earth Explorer, including Overview / Surface camera modes, deeper controlled globe zoom, region and key-country camera presets, country aggregate marker mode, high-rating game marker mode, region-scoped country list, sampled global markers, bottom zoom / reset / focus controls, and mobile three-state bottom-sheet panel behavior
15. Earth Explorer Pro experimental full-screen route at `/earth-pro`, using MapLibre GL JS plus deck.gl for a high-performance WebGL map / marker architecture, fixed camera presets, GPU scatter / icon / text marker layers, deterministic country marker distribution, and a mobile-collapsed bottom sheet.

RAWG batch data may also be previewed in a global right-panel gallery when no country is selected. This gallery is a validation surface for generated records and cover display, and does not replace the country-based exploration model.

Game Chronicle / 游戏编年馆 is the first dedicated global browsing surface for generated records whose `countryCode` is still `UNKNOWN`. It groups filtered games by `releaseYear`, shows film-style year cards with year counts and cover previews, supports title search, multi-select genre / platform OR filters, year-desc and rating-desc sorting, opens the selected year in a museum-style Year Exhibit modal, and shows a year overview plus the selected-game museum dossier card.

## MVP Data Fields

Each game should include at least:

- id
- title
- countryCode
- countryName
- developer
- publisher
- releaseYear
- genres
- platforms
- rating
- coverImage
- description

Each country should include at least:

- code
- name
- nameZh
- latitude
- longitude
- region

## Out of Scope for First MVP

Do not implement these unless explicitly requested:

- login
- account system
- favorite / collection system
- payment
- comments
- real recommendation algorithm
- backend database
- production-level API integration
- complex AI recommendation
- multiplayer / social features

## Success Criteria for MVP

The MVP is successful if:

1. users can open the app locally;
2. users can see a globe or map interface;
3. users can browse games by country;
4. users can click a country and view its games;
5. users can hover or click a game and view basic information;
6. users can filter games by year;
7. the project structure is clear enough for future iteration.
