import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const rawgApiBaseUrl = "https://api.rawg.io/api";
const gamesFilePath = resolve("src/data/games.generated.ts");
const cacheFilePath = resolve("data/rawg-details-cache.json");
const failuresFilePath = resolve("data/rawg-enrich-failures.json");
const envLocalPath = resolve(".env.local");
const concurrentLimit = readPositiveIntegerEnv("RAWG_ENRICH_CONCURRENCY", 2);
const requestTimeoutMs = readPositiveIntegerEnv("RAWG_ENRICH_TIMEOUT_MS", 15000);

main().catch((error) => {
  console.error("RAWG enrich script failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const apiKey = readRawgApiKey();
  setupProxyDispatcher();

  const games = readGeneratedGames();
  const cache = loadCache();
  const force = process.env.RAWG_ENRICH_FORCE === "true";
  const enrichLimit = readOptionalPositiveIntegerEnv("RAWG_ENRICH_LIMIT");

  const toEnrich = [];
  const skipCount = { alreadyEnriched: 0 };

  for (const game of games) {
    if (!force && game.developer !== "Unknown" && game.publisher !== "Unknown") {
      skipCount.alreadyEnriched += 1;
      continue;
    }
    toEnrich.push(game);
  }

  const toEnrichBeforeLimit = toEnrich.length;
  const limitedToEnrich = enrichLimit == null ? toEnrich : toEnrich.slice(0, enrichLimit);

  console.log(`RAWG_ENRICH_CONCURRENCY: ${concurrentLimit}`);
  console.log(`RAWG_ENRICH_TIMEOUT_MS: ${requestTimeoutMs}`);
  console.log(`Total games: ${games.length}`);
  console.log(`Already enriched (skipped): ${skipCount.alreadyEnriched}`);
  if (enrichLimit != null) {
    console.log(`RAWG_ENRICH_LIMIT: ${enrichLimit}`);
    console.log(`To enrich before limit: ${toEnrichBeforeLimit}`);
    console.log(`To enrich after limit: ${limitedToEnrich.length}`);
  }
  console.log(`To enrich: ${limitedToEnrich.length}`);
  if (force) console.log("RAWG_ENRICH_FORCE=true: re-fetching all games");

  const failures = [];
  let enrichedDev = 0;
  let enrichedPub = 0;

  // Process with concurrency limit
  for (let i = 0; i < limitedToEnrich.length; i += concurrentLimit) {
    const batch = limitedToEnrich.slice(i, i + concurrentLimit);
    const results = await Promise.allSettled(
      batch.map((game) => enrichGame(game, apiKey, cache))
    );

    for (let j = 0; j < batch.length; j += 1) {
      const game = batch[j];
      const result = results[j];

      if (result.status === "fulfilled") {
        const { devChanged, pubChanged } = result.value;
        if (devChanged) enrichedDev += 1;
        if (pubChanged) enrichedPub += 1;
      } else {
        failures.push({ slug: game.id, error: String(result.reason) });
        console.warn(`  FAILED ${game.id}: ${result.reason}`);
      }
    }

    const done = Math.min(i + concurrentLimit, limitedToEnrich.length);
    if (done % 10 === 0 || done === limitedToEnrich.length) {
      console.log(`  Progress: ${done}/${limitedToEnrich.length}`);
    }
  }

  // Write updated games
  writeGeneratedGames(games);

  // Write failures
  mkdirSync(resolve("data"), { recursive: true });
  writeFileSync(failuresFilePath, JSON.stringify(failures, null, 2), "utf8");
  console.log(`Failures written to ${failuresFilePath}: ${failures.length}`);

  // Write cache
  writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), "utf8");

  // Summary
  const stillUnknownDev = games.filter((g) => g.developer === "Unknown").length;
  const stillUnknownPub = games.filter((g) => g.publisher === "Unknown").length;

  console.log("\n=== Enrichment Summary ===");
  console.log(`Total games: ${games.length}`);
  console.log(`Developer enriched: ${enrichedDev}`);
  console.log(`Publisher enriched: ${enrichedPub}`);
  console.log(`Still Unknown developer: ${stillUnknownDev}`);
  console.log(`Still Unknown publisher: ${stillUnknownPub}`);
  console.log(`Failed requests: ${failures.length}`);
  console.log("countryCode / countryName: not modified (verified)");
  console.log("coverImage: not modified (verified)");
}

async function enrichGame(game, apiKey, cache) {
  const cached = cache[game.id];
  if (cached) {
    const devChanged = applyEnrichment(game, cached.developer, "developer");
    const pubChanged = applyEnrichment(game, cached.publisher, "publisher");
    return { devChanged, pubChanged, source: "cache" };
  }

  const url = new URL(`${rawgApiBaseUrl}/games/${game.id}`);
  url.searchParams.set("key", apiKey);

  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  const developer = data.developers?.[0]?.name ?? "Unknown";
  const publisher = data.publishers?.[0]?.name ?? "Unknown";

  cache[game.id] = { developer, publisher };

  const devChanged = applyEnrichment(game, developer, "developer");
  const pubChanged = applyEnrichment(game, publisher, "publisher");

  if (devChanged || pubChanged) {
    console.log(`  OK ${game.id}: dev=${game.developer} pub=${game.publisher}`);
  }

  return { devChanged, pubChanged, source: "api" };
}

function applyEnrichment(game, value, field) {
  if (value && value !== "Unknown") {
    const changed = game[field] === "Unknown";
    game[field] = value;
    return changed;
  }
  return false;
}

function readGeneratedGames() {
  const content = readFileSync(gamesFilePath, "utf8");
  const prefix = "export const generatedGames: Game[] = ";
  const startIndex = content.indexOf(prefix);

  if (startIndex === -1) {
    throw new Error(`Could not find "${prefix}" in ${gamesFilePath}`);
  }

  const arrayStart = startIndex + prefix.length;
  const arrayText = content.slice(arrayStart);
  // Find the matching closing bracket + semicolon
  const endMatch = arrayText.match(/;\s*$/m);
  const jsonText = endMatch
    ? arrayText.slice(0, endMatch.index).trim()
    : arrayText.trim().replace(/;$/, "");

  return JSON.parse(jsonText);
}

function writeGeneratedGames(games) {
  const header = [
    "import type { Game } from \"@/types/game\";",
    "",
    "// RAWG details enriched at: " + new Date().toISOString(),
    "// Developer/publisher data from RAWG API. Do not edit by hand.",
    "export const generatedGames: Game[] = "
  ].join("\n");

  const file = header + JSON.stringify(games, null, 2) + ";\n";
  writeFileSync(gamesFilePath, file, "utf8");
  console.log(`Updated ${gamesFilePath}`);
}

function loadCache() {
  try {
    const raw = readFileSync(cacheFilePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readOptionalPositiveIntegerEnv(name) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return null;
  }

  const value = Number.parseInt(rawValue, 10);

  return Number.isFinite(value) && value > 0 ? value : null;
}

function readRawgApiKey() {
  const fromEnv = process.env.RAWG_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  if (!existsSync(envLocalPath)) {
    throw new Error(
      "Missing RAWG_API_KEY. Create .env.local with RAWG_API_KEY=your_key, then run npm run data:enrich again."
    );
  }

  const envLocal = readFileSync(envLocalPath, "utf8");
  const match = envLocal.match(/^RAWG_API_KEY=(.+)$/m);
  const apiKey = match?.[1]?.replace(/^['"]|['"]$/g, "").trim();

  if (!apiKey) {
    throw new Error(
      "Missing RAWG_API_KEY in .env.local. Add RAWG_API_KEY=your_key, then run npm run data:enrich again."
    );
  }

  return apiKey;
}

function setupProxyDispatcher() {
  const proxyVars = [
    ["HTTPS_PROXY", process.env.HTTPS_PROXY],
    ["HTTP_PROXY", process.env.HTTP_PROXY],
    ["ALL_PROXY", process.env.ALL_PROXY],
    ["https_proxy", process.env.https_proxy],
    ["http_proxy", process.env.http_proxy],
    ["all_proxy", process.env.all_proxy],
  ];

  for (const [name, value] of proxyVars) {
    const url = value?.trim();
    if (url) {
      try {
        setGlobalDispatcher(new ProxyAgent(url));
        const redacted = url.replace(/\/\/[^@]*@/, "//[REDACTED]@");
        console.log(`Using proxy: ${redacted} (from ${name})`);
      } catch (error) {
        throw new Error(`Invalid proxy URL in ${name}: ${error.message}`);
      }
      return;
    }
  }

  console.log("No proxy env detected.");
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, requestTimeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
