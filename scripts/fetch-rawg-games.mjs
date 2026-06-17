import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { rawgGameSeeds } from "./rawg-seeds.mjs";

const rawgApiBaseUrl = "https://api.rawg.io/api";
const outputPath = resolve("src/data/games.generated.ts");
const envLocalPath = resolve(".env.local");
const rawgRequestTimeoutMs = readEnvInteger("RAWG_REQUEST_TIMEOUT_MS", 8000);
const batchFilterKeywords = [
  "DLC",
  "Expansion",
  "Soundtrack",
  "Demo",
  "Beta",
  "Bundle",
  "Pack",
  "Collection"
];

main().catch((error) => {
  logErrorDetails(error);
  process.exitCode = 1;
});

async function main() {
  const apiKey = readRawgApiKey();
  setupProxyDispatcher();
  const fetchMode = process.env.RAWG_FETCH_MODE?.trim().toLowerCase();

  if (fetchMode === "batch") {
    const shouldMergeExisting = readEnvBoolean("RAWG_MERGE_EXISTING", false);
    const batchOptions = readBatchOptions();
    const recentOptions = readRecentOptions();
    const mainOptions = createMainPoolOptions(batchOptions, recentOptions);
    const existingGames = shouldMergeExisting ? readExistingGeneratedGames() : [];
    const mainResult = await fetchRawgGamesBatch(apiKey, mainOptions);
    const recentResult = recentOptions.enabled
      ? await fetchRawgRecentGames(apiKey, recentOptions)
      : createEmptyPoolResult();
    const mergedEntries = mergeGameEntries(
      mainResult.entries,
      recentResult.entries,
      batchOptions.maxGames
    );
    const batchGames = mergedEntries.map((entry) => entry.game);
    const mergeResult = shouldMergeExisting
      ? mergeExistingGeneratedGames(existingGames, batchGames)
      : {
          games: batchGames,
          existingLoaded: 0,
          batchFetched: batchGames.length,
          existingUpdated: 0,
          newAppended: 0
        };
    const games = mergeResult.games;

    writeGeneratedGames(games, {
      mode: "batch",
      filters: batchOptions,
      mainFilters: mainOptions,
      recent: recentOptions,
      ...(shouldMergeExisting ? { mergeExisting: true } : {})
    });

    logBatchSummary({
      batchOptions,
      mainOptions,
      recentOptions,
      mainResult,
      recentResult,
      games
    });
    if (shouldMergeExisting) {
      logExistingMergeSummary(mergeResult);
    }
    console.log(`Generated ${games.length} games at ${outputPath}`);
    return;
  }

  console.log(`Fetching ${rawgGameSeeds.length} RAWG game records...`);

  const games = [];

  for (const seed of rawgGameSeeds) {
    const rawgGame = await fetchRawgGame(seed, apiKey);
    games.push(mapRawgGameToGame(rawgGame, seed));
  }

  writeGeneratedGames(games, {
    mode: "seed"
  });
  console.log(`Generated ${games.length} games at ${outputPath}`);
}

function readRawgApiKey() {
  const fromEnv = process.env.RAWG_API_KEY?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  if (!existsSync(envLocalPath)) {
    throw new Error(
      "Missing RAWG_API_KEY. Create .env.local with RAWG_API_KEY=your_key, then run npm run data:rawg again."
    );
  }

  const envLocal = readFileSync(envLocalPath, "utf8");
  const match = envLocal.match(/^RAWG_API_KEY=(.+)$/m);
  const apiKey = match?.[1]?.replace(/^['"]|['"]$/g, "").trim();

  if (!apiKey) {
    throw new Error(
      "Missing RAWG_API_KEY in .env.local. Add RAWG_API_KEY=your_key, then run npm run data:rawg again."
    );
  }

  return apiKey;
}

async function fetchRawgGame(seed, apiKey) {
  if (seed.slug) {
    return fetchRawgGameDetail(seed.slug, apiKey);
  }

  const searchResult = await searchRawgGame(seed.search, apiKey);
  return fetchRawgGameDetail(searchResult.slug, apiKey);
}

async function searchRawgGame(search, apiKey) {
  const url = new URL(`${rawgApiBaseUrl}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", search);
  url.searchParams.set("page_size", "1");

  const payload = await fetchJson(url);
  const game = payload.results?.[0];

  if (!game?.slug) {
    throw new Error(`RAWG search returned no result for seed: ${search}`);
  }

  return game;
}

async function fetchRawgGameDetail(slug, apiKey) {
  const url = new URL(`${rawgApiBaseUrl}/games/${slug}`);
  url.searchParams.set("key", apiKey);

  return fetchJson(url);
}

function readBatchOptions() {
  return {
    startDate: readEnvString("RAWG_START_DATE", "2010-01-01"),
    endDate: readEnvString("RAWG_END_DATE", "2026-12-31"),
    minMetacritic: readEnvInteger("RAWG_MIN_METACRITIC", 80),
    maxMetacritic: readEnvInteger("RAWG_MAX_METACRITIC", 100),
    ordering: readEnvString("RAWG_ORDERING", "-metacritic"),
    pageSize: readEnvInteger("RAWG_PAGE_SIZE", 40),
    maxGames: readEnvInteger("RAWG_MAX_GAMES", 100)
  };
}

function readRecentOptions() {
  return {
    enabled: readEnvBoolean("RAWG_INCLUDE_RECENT", false),
    startDate: readEnvString("RAWG_RECENT_START_DATE", "2024-01-01"),
    endDate: readEnvString("RAWG_RECENT_END_DATE", "2026-12-31"),
    ordering: readEnvString("RAWG_RECENT_ORDERING", "-rating"),
    maxGames: readEnvInteger("RAWG_RECENT_MAX_GAMES", 100),
    minRating: readEnvNumber("RAWG_RECENT_MIN_RATING", 4.0),
    minRatingsCount: readEnvInteger("RAWG_RECENT_MIN_RATINGS_COUNT", 20),
    maxPages: readEnvInteger("RAWG_RECENT_MAX_PAGES", 25),
    pageSize: 40
  };
}

function readEnvString(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function readEnvBoolean(name, fallback) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return value === "true" || value === "1" || value === "yes";
}

function readEnvInteger(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readEnvNumber(name, fallback) {
  const value = Number.parseFloat(process.env[name] ?? "");
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function createMainPoolOptions(batchOptions, recentOptions) {
  if (!recentOptions.enabled) {
    return batchOptions;
  }

  return {
    ...batchOptions,
    maxGames: Math.max(batchOptions.maxGames - recentOptions.maxGames, 0)
  };
}

async function fetchRawgGamesBatch(apiKey, options) {
  const entries = [];
  const seenRawgIds = new Set();
  const seenTitleRelease = new Set();
  let page = 1;
  let pagesFetched = 0;
  let rawGamesReceived = 0;
  let rawgCount = null;

  while (entries.length < options.maxGames) {
    const payload = await fetchRawgGamePage(apiKey, options, page);
    const results = Array.isArray(payload.results) ? payload.results : [];

    pagesFetched += 1;
    rawGamesReceived += results.length;
    rawgCount ??= Number.isFinite(Number(payload.count)) ? Number(payload.count) : null;

    if (results.length === 0) {
      break;
    }

    for (const rawgGame of results) {
      if (entries.length >= options.maxGames) {
        break;
      }

      if (!shouldKeepBatchGame(rawgGame, seenRawgIds, seenTitleRelease)) {
        continue;
      }

      entries.push(mapRawgListGameToEntry(rawgGame));
    }

    console.log(
      `RAWG main page ${page} fetched: raw=${results.length}; kept=${entries.length}/${options.maxGames}`
    );

    if (!payload.next) {
      break;
    }

    page += 1;
  }

  return {
    entries,
    games: entries.map((entry) => entry.game),
    pagesFetched,
    rawGamesReceived,
    rawgCount
  };
}

async function fetchRawgGamePage(apiKey, options, page) {
  const url = new URL(`${rawgApiBaseUrl}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("dates", `${options.startDate},${options.endDate}`);
  url.searchParams.set("metacritic", `${options.minMetacritic},${options.maxMetacritic}`);
  url.searchParams.set("ordering", options.ordering);
  url.searchParams.set("page_size", String(options.pageSize));
  url.searchParams.set("page", String(page));

  return fetchJson(url);
}

async function fetchRawgRecentGames(apiKey, options) {
  const entries = [];
  const seenRawgIds = new Set();
  const seenTitleRelease = new Set();
  let page = 1;
  let pagesFetched = 0;
  let rawGamesReceived = 0;
  let rawgCount = null;
  let pagesWithoutNewGames = 0;

  while (entries.length < options.maxGames && page <= options.maxPages) {
    const keptBeforePage = entries.length;
    let payload;

    try {
      payload = await fetchRawgRecentGamePage(apiKey, options, page);
    } catch (error) {
      console.warn(`RAWG recent page ${page} skipped after error: ${formatRawgWarning(error)}`);
      break;
    }

    const results = Array.isArray(payload.results) ? payload.results : [];

    pagesFetched += 1;
    rawGamesReceived += results.length;
    rawgCount ??= Number.isFinite(Number(payload.count)) ? Number(payload.count) : null;

    if (results.length === 0) {
      break;
    }

    for (const rawgGame of results) {
      if (entries.length >= options.maxGames) {
        break;
      }

      if (!shouldKeepRecentGame(rawgGame, seenRawgIds, seenTitleRelease, options)) {
        continue;
      }

      entries.push(mapRawgListGameToEntry(rawgGame));
    }

    console.log(
      `RAWG recent page ${page} fetched: raw=${results.length}; kept=${entries.length}/${options.maxGames}`
    );

    pagesWithoutNewGames = entries.length === keptBeforePage ? pagesWithoutNewGames + 1 : 0;

    if (pagesWithoutNewGames >= 5) {
      console.log("RAWG recent pool stopped after 5 pages without new kept games.");
      break;
    }

    if (!payload.next) {
      break;
    }

    page += 1;
  }

  return {
    entries,
    games: entries.map((entry) => entry.game),
    pagesFetched,
    rawGamesReceived,
    rawgCount
  };
}

async function fetchRawgRecentGamePage(apiKey, options, page) {
  const url = new URL(`${rawgApiBaseUrl}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("dates", `${options.startDate},${options.endDate}`);
  url.searchParams.set("ordering", options.ordering);
  url.searchParams.set("page_size", String(options.pageSize));
  url.searchParams.set("page", String(page));

  return fetchJson(url);
}

function createEmptyPoolResult() {
  return {
    entries: [],
    games: [],
    pagesFetched: 0,
    rawGamesReceived: 0,
    rawgCount: null
  };
}

function shouldKeepBatchGame(rawgGame, seenRawgIds, seenTitleRelease) {
  if (!rawgGame?.background_image) {
    return false;
  }

  const title = String(rawgGame.name ?? "");

  if (hasExcludedBatchKeyword(title)) {
    return false;
  }

  const rawgId = rawgGame.id == null ? null : String(rawgGame.id);

  if (rawgId && seenRawgIds.has(rawgId)) {
    return false;
  }

  const titleReleaseKey = createTitleReleaseKey(title, rawgGame.released);

  if (titleReleaseKey && seenTitleRelease.has(titleReleaseKey)) {
    return false;
  }

  if (rawgId) {
    seenRawgIds.add(rawgId);
  }

  if (titleReleaseKey) {
    seenTitleRelease.add(titleReleaseKey);
  }

  return true;
}

function shouldKeepRecentGame(rawgGame, seenRawgIds, seenTitleRelease, options) {
  if (!rawgGame?.background_image) {
    return false;
  }

  const rating = Number(rawgGame.rating);
  const ratingsCount = Number(rawgGame.ratings_count);

  if (!Number.isFinite(rating) || rating < options.minRating) {
    return false;
  }

  if (!Number.isFinite(ratingsCount) || ratingsCount < options.minRatingsCount) {
    return false;
  }

  return shouldKeepBatchGame(rawgGame, seenRawgIds, seenTitleRelease);
}

function mergeGameEntries(mainEntries, recentEntries, maxGames) {
  const merged = [];
  const seenRawgIds = new Set();
  const seenTitleYears = new Set();

  for (const entry of [...mainEntries, ...recentEntries]) {
    if (merged.length >= maxGames) {
      break;
    }

    if (isDuplicateGameEntry(entry, seenRawgIds, seenTitleYears)) {
      continue;
    }

    merged.push(entry);
  }

  return merged;
}

function isDuplicateGameEntry(entry, seenRawgIds, seenTitleYears) {
  if (entry.rawgId) {
    if (seenRawgIds.has(entry.rawgId)) {
      return true;
    }

    seenRawgIds.add(entry.rawgId);
    return false;
  }

  if (entry.titleYearKey && seenTitleYears.has(entry.titleYearKey)) {
    return true;
  }

  if (entry.titleYearKey) {
    seenTitleYears.add(entry.titleYearKey);
  }

  return false;
}

function hasExcludedBatchKeyword(title) {
  const normalizedTitle = title.toLowerCase();

  return batchFilterKeywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`);
    return pattern.test(normalizedTitle);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createTitleReleaseKey(title, released) {
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalizedTitle || !released) {
    return null;
  }

  return `${normalizedTitle}|${released}`;
}

function createTitleYearKey(title, releaseYear) {
  const normalizedTitle = normalizeTitleForKey(title);

  if (!normalizedTitle || !releaseYear) {
    return null;
  }

  return `${normalizedTitle}|${releaseYear}`;
}

function normalizeTitleForKey(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchJson(url) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response;

    try {
      response = await fetchWithTimeout(url);
    } catch (error) {
      if (attempt < maxAttempts) {
        await wait(attempt * 500);
        continue;
      }

      throw createRawgRequestError("RAWG fetch failed before receiving a response.", {
        cause: error,
        url
      });
    }

    if (!response.ok) {
      const text = await response.text();
      const shouldRetry = response.status === 429 || response.status >= 500;

      if (shouldRetry && attempt < maxAttempts) {
        await wait(attempt * 500);
        continue;
      }

      throw createRawgRequestError(`RAWG request failed with HTTP ${response.status}.`, {
        body: text,
        cause: new Error(response.statusText || `HTTP ${response.status}`),
        status: response.status,
        url
      });
    }

    return response.json();
  }

  throw createRawgRequestError("RAWG request failed after retries.", { url });
}

function wait(ms) {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, ms);
  });
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, rawgRequestTimeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function setupProxyDispatcher() {
  const proxy = readProxyEnv();

  if (!proxy) {
    console.log("No proxy env detected for RAWG fetch.");
    return;
  }

  try {
    setGlobalDispatcher(new ProxyAgent(proxy.url));
    console.log(`Using proxy for RAWG fetch: ${redactProxyUrl(proxy.url)}`);
  } catch (error) {
    throw createRawgRequestError(`Invalid proxy URL in ${proxy.name}.`, {
      cause: error
    });
  }
}

function readProxyEnv() {
  const proxyVars = [
    ["HTTPS_PROXY", process.env.HTTPS_PROXY],
    ["HTTP_PROXY", process.env.HTTP_PROXY],
    ["ALL_PROXY", process.env.ALL_PROXY],
    ["https_proxy", process.env.https_proxy],
    ["http_proxy", process.env.http_proxy],
    ["all_proxy", process.env.all_proxy]
  ];

  for (const [name, value] of proxyVars) {
    const url = value?.trim();

    if (url) {
      return { name, url };
    }
  }

  return null;
}

function createRawgRequestError(message, options = {}) {
  const error = new Error(message, { cause: options.cause });
  error.name = "RawgRequestError";
  error.status = options.status;
  error.bodyPreview = options.body ? String(options.body).slice(0, 500) : undefined;
  error.url = options.url ? redactRawgUrl(options.url) : undefined;

  return error;
}

function logErrorDetails(error) {
  const normalized = error instanceof Error ? error : new Error(String(error));

  console.error("RAWG data script failed.");
  console.error(`err.name: ${normalized.name}`);
  console.error(`err.message: ${normalized.message}`);
  console.error(`err.cause: ${formatCause(normalized.cause)}`);

  if ("status" in normalized) {
    console.error(`HTTP status: ${normalized.status ?? "n/a"}`);
  } else {
    console.error("HTTP status: n/a");
  }

  if ("bodyPreview" in normalized) {
    console.error(`response body preview: ${normalized.bodyPreview ?? "n/a"}`);
  } else {
    console.error("response body preview: n/a");
  }

  if ("url" in normalized && normalized.url) {
    console.error(`request URL: ${normalized.url}`);
  }
}

function formatRawgWarning(error) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const details = [
    normalized.message,
    "status" in normalized ? `status=${normalized.status ?? "n/a"}` : null,
    "url" in normalized && normalized.url ? `url=${normalized.url}` : null
  ].filter(Boolean);

  return details.join("; ");
}

function formatCause(cause) {
  const messages = [];
  let current = cause;

  while (current) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
      continue;
    }

    messages.push(String(current));
    break;
  }

  return messages.length > 0 ? messages.join(" -> ") : "n/a";
}

function redactRawgUrl(url) {
  const redacted = new URL(url);

  if (redacted.searchParams.has("key")) {
    redacted.searchParams.set("key", "[REDACTED]");
  }

  return redacted.toString();
}

function redactProxyUrl(value) {
  const url = new URL(value);

  if (url.username) {
    url.username = "[REDACTED]";
  }

  if (url.password) {
    url.password = "[REDACTED]";
  }

  return url.toString();
}

function mapRawgGameToGame(rawgGame, seed) {
  const releaseYear = rawgGame.released
    ? Number.parseInt(String(rawgGame.released).slice(0, 4), 10)
    : 0;
  const title = rawgGame.name || seed.search || seed.slug || "Unknown";
  const id = createGameId(seed, rawgGame);

  return {
    id,
    title,
    titleZh: seed.titleZh ?? title,
    countryCode: seed.countryCode,
    countryName: seed.countryName,
    developer: firstName(rawgGame.developers) ?? seed.developer ?? "Unknown",
    publisher: firstName(rawgGame.publishers) ?? seed.publisher ?? "Unknown",
    releaseYear: Number.isFinite(releaseYear) && releaseYear > 0 ? releaseYear : 0,
    genres: names(rawgGame.genres),
    platforms: platformNames(rawgGame.platforms),
    rating: normalizeRating(rawgGame.rating),
    coverImage: rawgGame.background_image ?? "",
    description: cleanDescription(rawgGame.description_raw) ?? `${title} 的代表性游戏资料。`
  };
}

function mapRawgListGameToGame(rawgGame) {
  const releaseYear = rawgGame.released
    ? Number.parseInt(String(rawgGame.released).slice(0, 4), 10)
    : 0;
  const title = rawgGame.name || rawgGame.slug || String(rawgGame.id ?? "Unknown");
  const metacritic = Number(rawgGame.metacritic);
  const descriptionParts = ["RAWG API game record."];

  if (Number.isFinite(metacritic) && metacritic > 0) {
    descriptionParts.push(`Metacritic: ${metacritic}.`);
  }

  if (rawgGame.released) {
    descriptionParts.push(`Released: ${rawgGame.released}.`);
  }

  return {
    id: createBatchGameId(rawgGame),
    title,
    titleZh: title,
    countryCode: "UNKNOWN",
    countryName: "Global",
    developer: "Unknown",
    publisher: "Unknown",
    releaseYear: Number.isFinite(releaseYear) && releaseYear > 0 ? releaseYear : 0,
    genres: names(rawgGame.genres),
    platforms: platformNames(rawgGame.platforms),
    rating: normalizeRating(rawgGame.rating),
    coverImage: rawgGame.background_image ?? "",
    description: descriptionParts.join(" ")
  };
}

function mapRawgListGameToEntry(rawgGame) {
  const game = mapRawgListGameToGame(rawgGame);
  const rawgId = rawgGame.id == null ? null : String(rawgGame.id);

  return {
    game,
    rawgId,
    titleYearKey: createTitleYearKey(game.title, game.releaseYear)
  };
}

function createBatchGameId(rawgGame) {
  const slug = String(rawgGame.slug ?? "").trim();

  if (slug) {
    return slug;
  }

  const rawgId = rawgGame.id == null ? "" : String(rawgGame.id);
  const title = String(rawgGame.name ?? rawgId);
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedTitle || `rawg-${rawgId}`;
}

function createGameId(seed, rawgGame) {
  const source = seed.slug ?? rawgGame.slug ?? seed.search ?? rawgGame.name ?? String(rawgGame.id);

  return String(source)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstName(items) {
  return Array.isArray(items) && items[0]?.name ? items[0].name : null;
}

function names(items) {
  const values = Array.isArray(items)
    ? items.map((item) => item?.name).filter(Boolean)
    : [];

  return values.length > 0 ? values : ["Unknown"];
}

function platformNames(items) {
  const values = Array.isArray(items)
    ? items.map((item) => item?.platform?.name).filter(Boolean)
    : [];

  return values.length > 0 ? values : ["Unknown"];
}

function normalizeRating(rating) {
  const value = Number(rating);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 20) / 10;
}

function cleanDescription(description) {
  if (!description) {
    return null;
  }

  return String(description).replace(/\s+/g, " ").trim();
}

function readExistingGeneratedGames() {
  if (!existsSync(outputPath)) {
    return [];
  }

  const source = readFileSync(outputPath, "utf8");
  const match = source.match(/export const generatedGames:\s*Game\[\]\s*=\s*(\[[\s\S]*\]);?\s*$/);

  if (!match?.[1]) {
    throw new Error(`Could not parse existing generatedGames array from ${outputPath}.`);
  }

  const games = JSON.parse(match[1]);

  if (!Array.isArray(games)) {
    throw new Error(`Existing generatedGames in ${outputPath} is not an array.`);
  }

  return games;
}

function mergeExistingGeneratedGames(existingGames, batchGames) {
  const gamesById = new Map();
  const batchGamesById = new Map();
  let existingUpdated = 0;
  let newAppended = 0;

  for (const game of existingGames) {
    if (!game?.id || gamesById.has(game.id)) {
      continue;
    }

    gamesById.set(game.id, game);
  }

  for (const game of batchGames) {
    if (!game?.id || batchGamesById.has(game.id)) {
      continue;
    }

    batchGamesById.set(game.id, game);
  }

  const games = [...gamesById.values()].map((existingGame) => {
    const batchGame = batchGamesById.get(existingGame.id);

    if (!batchGame) {
      return existingGame;
    }

    existingUpdated += 1;
    return mergeGeneratedGameFields(existingGame, batchGame);
  });

  for (const batchGame of batchGamesById.values()) {
    if (gamesById.has(batchGame.id)) {
      continue;
    }

    games.push(batchGame);
    newAppended += 1;
  }

  return {
    games,
    existingLoaded: existingGames.length,
    batchFetched: batchGamesById.size,
    existingUpdated,
    newAppended
  };
}

function mergeGeneratedGameFields(existingGame, batchGame) {
  return {
    ...existingGame,
    ...batchGame,
    titleZh: shouldKeepExistingTitleZh(existingGame) ? existingGame.titleZh : batchGame.titleZh,
    countryCode: shouldKeepExistingCountryCode(existingGame)
      ? existingGame.countryCode
      : batchGame.countryCode,
    countryName: shouldKeepExistingCountryName(existingGame)
      ? existingGame.countryName
      : batchGame.countryName,
    developer: shouldKeepExistingNamedField(existingGame.developer)
      ? existingGame.developer
      : batchGame.developer,
    publisher: shouldKeepExistingNamedField(existingGame.publisher)
      ? existingGame.publisher
      : batchGame.publisher,
    coverImage: shouldKeepExistingCoverImage(existingGame.coverImage)
      ? existingGame.coverImage
      : batchGame.coverImage,
    description: shouldKeepExistingDescription(existingGame.description)
      ? existingGame.description
      : batchGame.description
  };
}

function shouldKeepExistingTitleZh(game) {
  const titleZh = normalizeFieldValue(game.titleZh);
  const title = normalizeFieldValue(game.title);

  return Boolean(titleZh && titleZh !== title);
}

function shouldKeepExistingCountryCode(game) {
  const countryCode = normalizeFieldValue(game.countryCode);

  return Boolean(countryCode && countryCode !== "UNKNOWN");
}

function shouldKeepExistingCountryName(game) {
  const countryName = normalizeFieldValue(game.countryName);

  return Boolean(countryName && countryName !== "Global" && countryName !== "Unknown");
}

function shouldKeepExistingNamedField(value) {
  const normalized = normalizeFieldValue(value);

  return Boolean(normalized && normalized !== "Unknown");
}

function shouldKeepExistingCoverImage(value) {
  return normalizeFieldValue(value).startsWith("/covers/rawg/");
}

function shouldKeepExistingDescription(value) {
  const description = normalizeFieldValue(value);

  return Boolean(description && !description.startsWith("RAWG API game record."));
}

function normalizeFieldValue(value) {
  return String(value ?? "").trim();
}

function writeGeneratedGames(games, metadata = {}) {
  const comments = createGeneratedFileComments(metadata);
  const file = `import type { Game } from "@/types/game";

${comments}
export const generatedGames: Game[] = ${JSON.stringify(games, null, 2)};
`;

  writeFileSync(outputPath, file, "utf8");
}

function createGeneratedFileComments(metadata) {
  if (metadata.mode === "batch") {
    return [
      "// Generated by `npm run data:rawg`.",
      "// Data comes from RAWG API. Do not edit by hand.",
      `// Generated at: ${new Date().toISOString()}`,
      "// fetch mode: batch",
      `// classic filters: ${formatClassicFilterParams(metadata.filters)}`,
      `// recent supplement: ${metadata.recent?.enabled ? "enabled" : "disabled"}`,
      `// recent filters: ${formatRecentParams(metadata.recent)}`,
      ...(metadata.mergeExisting ? ["// merge existing generated data: enabled"] : [])
    ].join("\n");
  }

  return [
    "// Generated by `npm run data:rawg`.",
    "// Data and image URLs are sourced from RAWG. Do not edit by hand.",
    `// Generated at: ${new Date().toISOString()}`,
    `// fetch mode: ${metadata.mode ?? "seed"}`
  ].join("\n");
}

function formatBatchParams(options) {
  return [
    formatClassicFilterParams(options),
    `page_size=${options.pageSize}`,
    `max_games=${options.maxGames}`
  ].join("; ");
}

function formatClassicFilterParams(options) {
  return [
    `dates=${options.startDate},${options.endDate}`,
    `metacritic=${options.minMetacritic},${options.maxMetacritic}`,
    `ordering=${options.ordering}`
  ].join("; ");
}

function formatRecentParams(options) {
  if (!options) {
    return "n/a";
  }

  return [
    `dates=${options.startDate},${options.endDate}`,
    `ordering=${options.ordering}`,
    `min_rating=${options.minRating}`,
    `min_ratings_count=${options.minRatingsCount}`,
    `max_recent_games=${options.maxGames}`,
    `max_recent_pages=${options.maxPages}`
  ].join("; ");
}

function logBatchSummary({
  batchOptions,
  mainOptions,
  recentOptions,
  mainResult,
  recentResult,
  games
}) {
  const yearSummary = summarizeYears(games);

  console.log(`RAWG batch request params: ${formatBatchParams(batchOptions)}`);
  console.log(`RAWG main pool request params: ${formatBatchParams(mainOptions)}`);
  console.log(
    `RAWG recent supplement: ${recentOptions.enabled ? "enabled" : "disabled"}; ${formatRecentParams(
      recentOptions
    )}`
  );
  console.log(`RAWG count for main pool: ${mainResult.rawgCount ?? "n/a"}`);
  console.log(`RAWG main pages fetched: ${mainResult.pagesFetched}`);
  console.log(`RAWG main raw fetched count: ${mainResult.rawGamesReceived}`);
  console.log(`RAWG main kept count: ${mainResult.entries.length}`);
  console.log(`RAWG recent pages fetched: ${recentResult.pagesFetched}`);
  console.log(`RAWG recent raw fetched count: ${recentResult.rawGamesReceived}`);
  console.log(`RAWG recent kept count: ${recentResult.entries.length}`);
  console.log(`RAWG final merged count: ${games.length}`);
  console.log(`RAWG final year range: ${yearSummary.range}`);
  console.log(`RAWG yearly distribution: ${formatYearDistribution(yearSummary.counts)}`);
  console.log(
    `RAWG recent years: 2023=${yearSummary.counts.get(2023) ?? 0}; 2024=${
      yearSummary.counts.get(2024) ?? 0
    }; 2025=${yearSummary.counts.get(2025) ?? 0}; 2026=${yearSummary.counts.get(2026) ?? 0}`
  );
}

function logExistingMergeSummary(mergeResult) {
  console.log(`Existing games loaded: ${mergeResult.existingLoaded}`);
  console.log(`New batch games fetched: ${mergeResult.batchFetched}`);
  console.log(`Existing games updated: ${mergeResult.existingUpdated}`);
  console.log(`New games appended: ${mergeResult.newAppended}`);
  console.log(`Final merged games: ${mergeResult.games.length}`);
}

function summarizeYears(games) {
  const counts = new Map();
  const years = [];

  for (const game of games) {
    if (!Number.isFinite(game.releaseYear) || game.releaseYear <= 0) {
      continue;
    }

    years.push(game.releaseYear);
    counts.set(game.releaseYear, (counts.get(game.releaseYear) ?? 0) + 1);
  }

  if (years.length === 0) {
    return {
      counts,
      range: "n/a"
    };
  }

  return {
    counts,
    range: `${Math.min(...years)}-${Math.max(...years)}`
  };
}

function formatYearDistribution(counts) {
  if (counts.size === 0) {
    return "n/a";
  }

  return [...counts.entries()]
    .sort(([leftYear], [rightYear]) => leftYear - rightYear)
    .map(([year, count]) => `${year}:${count}`)
    .join("; ");
}
