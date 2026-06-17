import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const gamesFilePath = resolve("src/data/games.generated.ts");
const cacheFilePath = resolve("data/country-inference-cache.json");
const previewFilePath = resolve("data/country-inference-preview.json");
const emptyResponseDebugFilePath = resolve("data/ollama-empty-response-debug.json");
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const model = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const concurrentLimit = 1;
const inferLimit = Number.parseInt(process.env.OLLAMA_INFER_LIMIT ?? "", 10) || Infinity;
const requestTimeoutMs =
  Number.parseInt(process.env.OLLAMA_REQUEST_TIMEOUT_MS ?? "", 10) || 120000;

const reviewItems = [];

main().catch((error) => {
  console.error("Country inference script failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  console.log(`Ollama model: ${model}`);
  console.log(`Ollama endpoint: ${ollamaBaseUrl}/api/chat`);

  const games = readGeneratedGames();
  const cache = loadCache();

  // Find UNKNOWN countryCode games
  const unknownGames = games.filter((g) => g.countryCode === "UNKNOWN");

  // Split: review (both Unknown) vs candidates (at least one known)
  const review = [];
  const candidates = [];

  for (const game of unknownGames) {
    if (game.developer === "Unknown" && game.publisher === "Unknown") {
      review.push({
        id: game.id,
        title: game.title,
        developer: game.developer,
        publisher: game.publisher,
        reason: "No developer or publisher available",
      });
    } else {
      candidates.push(game);
    }
  }

  console.log(`Total games: ${games.length}`);
  console.log(`UNKNOWN countryCode: ${unknownGames.length}`);
  console.log(`Review (both Unknown): ${review.length}`);
  console.log(`Candidates for Ollama: ${candidates.length}`);

  // Deduplicate by dev|pub key to count unique combos
  const uniqueKeys = new Set(
    candidates.map((g) => `${g.developer}|${g.publisher}`)
  );
  console.log(`Unique developer|publisher combos: ${uniqueKeys.size}`);

  // Check cache hits
  let cacheHits = 0;
  let ollamaCalls = 0;

  // Collect unique (dev, pub) pairs not in cache
  const pairsToInfer = [];
  const seenPairs = new Set();
  for (const game of candidates) {
    const key = `${game.developer}|${game.publisher}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);

    if (cache[key]) {
      cacheHits += 1;
    } else {
      pairsToInfer.push({ developer: game.developer, publisher: game.publisher, key });
    }
  }

  console.log(`Cache hits: ${cacheHits}`);
  console.log(`To infer via Ollama: ${pairsToInfer.length}`);

  // Apply OLLAMA_INFER_LIMIT to cap uncached pairs processed this run
  if (Number.isFinite(inferLimit) && pairsToInfer.length > inferLimit) {
    console.log(`OLLAMA_INFER_LIMIT=${inferLimit}: capping to ${inferLimit} pairs (${pairsToInfer.length - inferLimit} skipped)`);
    pairsToInfer.length = inferLimit;
  }

  // Process unique pairs with concurrency limit
  for (let i = 0; i < pairsToInfer.length; i += concurrentLimit) {
    const batch = pairsToInfer.slice(i, i + concurrentLimit);
    const results = await Promise.allSettled(
      batch.map((pair) => inferCountry(pair))
    );

    for (let j = 0; j < batch.length; j += 1) {
      const pair = batch[j];
      const result = results[j];
      if (result.status === "fulfilled") {
        ollamaCalls += 1;
        cache[pair.key] = result.value;
        const inferred = result.value;
        console.log(
          `  OK ${pair.key}: ${inferred.countryCode}/${inferred.countryName} (${inferred.confidence}, ${inferred.basis})`
        );
      } else {
        console.warn(`  FAIL ${pair.key}: ${result.reason}`);
      }
    }

    const done = Math.min(i + concurrentLimit, pairsToInfer.length);
    if (done % 10 === 0 || done === pairsToInfer.length) {
      console.log(`  Progress: ${done}/${pairsToInfer.length} unique pairs`);
    }
  }

  // Build items by applying cached results to each candidate
  const items = [];
  const summary = { high: 0, medium: 0, low: 0, unknown: 0 };

  for (const game of candidates) {
    const key = `${game.developer}|${game.publisher}`;
    const result = cache[key];

    if (!result) {
      // This shouldn't happen if we processed all pairs, but guard anyway
      review.push({
        id: game.id,
        title: game.title,
        developer: game.developer,
        publisher: game.publisher,
        reason: `Inference failed for key: ${key}`,
      });
      continue;
    }

    const inferred = result;
    summary[inferred.confidence] = (summary[inferred.confidence] ?? 0) + 1;

    items.push({
      id: game.id,
      title: game.title,
      developer: game.developer,
      publisher: game.publisher,
      currentCountryCode: "UNKNOWN",
      inferredCountryCode: inferred.countryCode,
      inferredCountryName: inferred.countryName,
      basis: inferred.basis,
      confidence: inferred.confidence,
      reason: inferred.reason,
    });
  }

  // Sort items by confidence then title
  const confidenceOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
  items.sort(
    (a, b) =>
      (confidenceOrder[a.confidence] ?? 4) - (confidenceOrder[b.confidence] ?? 4) ||
      a.title.localeCompare(b.title)
  );

  // Combine review list
  const allReview = [
    ...review,
    ...reviewItems.map((r) => ({
      id: r.id,
      title: r.title,
      developer: r.developer,
      publisher: r.publisher,
      reason: r.reason,
    })),
  ];

  const preview = {
    generatedAt: new Date().toISOString(),
    model,
    summary: {
      totalGames: games.length,
      candidates: candidates.length,
      high: summary.high ?? 0,
      medium: summary.medium ?? 0,
      low: summary.low ?? 0,
      unknown: summary.unknown ?? 0,
      reviewCount: allReview.length,
    },
    items,
    review: allReview,
  };

  writeFileSync(previewFilePath, JSON.stringify(preview, null, 2), "utf8");
  writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), "utf8");

  console.log(`\n=== Inference Summary ===`);
  console.log(`Total games: ${games.length}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Ollama calls: ${ollamaCalls}`);
  console.log(`Cache hits: ${cacheHits}`);
  console.log(`high: ${summary.high ?? 0}`);
  console.log(`medium: ${summary.medium ?? 0}`);
  console.log(`low: ${summary.low ?? 0}`);
  console.log(`unknown: ${summary.unknown ?? 0}`);
  console.log(`review: ${allReview.length}`);
  console.log(`Preview written to: ${previewFilePath}`);
  console.log(`Cache written to: ${cacheFilePath}`);
  console.log(`games.generated.ts: NOT modified (dry-run)`);
}

async function inferCountry(pair) {
  const { developer, publisher } = pair;

  const prompt = `You are a game industry expert. Given a game's developer and publisher, infer the country where the game was primarily developed.

Rules:
- Determine the country based on the developer's headquarters location.
- If the developer is not well-known, use the publisher's headquarters location.
- Do NOT guess based on the game's theme, art style, or genre.
- If you are unsure, return "UNKNOWN" for countryCode and "Unknown" for countryName, with confidence "unknown".
- Only use well-established, widely-known facts about game companies.
- countryCode MUST be ISO 3166-1 alpha-2 format (e.g., JP, US, GB, FR, PL, BE, SE, FI, CN, KR, CA, AU).

Examples:
- Nintendo → JP (Japan)
- Valve Software → US (United States)
- CD PROJEKT RED → PL (Poland)
- Larian Studios → BE (Belgium)
- FromSoftware → JP (Japan)
- Capcom → JP (Japan)
- Ubisoft → FR (France)
- Rockstar Games → US (United States)
- Electronic Arts → US (United States)
- Square Enix → JP (Japan)
- SEGA → JP (Japan)
- Bandai Namco Entertainment → JP (Japan)
- Bethesda Softworks → US (United States)
- Naughty Dog → US (United States)
- Guerrilla Games → NL (Netherlands)
- DICE → SE (Sweden)
- Mojang → SE (Sweden)
- Playdead → DK (Denmark)
- Supercell → FI (Finland)
- Bloober Team → PL (Poland)
- Techland → PL (Poland)
- Warhorse Studios → CZ (Czech Republic)
- GSC Game World → UA (Ukraine)
- Grinding Gear Games → NZ (New Zealand)
- Platinum Games → JP (Japan)
- Kojima Productions → JP (Japan)
- Game Freak → JP (Japan)

Game:
- Developer: ${developer}
- Publisher: ${publisher}

Output JSON only.`;

  const schema = {
    type: "object",
    properties: {
      countryCode: {
        type: "string",
        description: "ISO 3166-1 alpha-2 country code, or 'UNKNOWN' if uncertain",
      },
      countryName: {
        type: "string",
        description: "Full country name, or 'Unknown' if uncertain",
      },
      basis: {
        type: "string",
        enum: ["developer", "publisher", "title", "unknown"],
        description: "Which field was used to determine the country",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low", "unknown"],
        description: "Confidence level of the inference",
      },
      reason: {
        type: "string",
        description: "Brief reason for the inference (1 short sentence)",
      },
    },
    required: ["countryCode", "countryName", "basis", "confidence", "reason"],
  };

  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    think: false,
    stream: false,
    keep_alive: "30m",
    format: schema,
    options: {
      temperature: 0,
    },
  };

  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.message?.content?.trim() ?? "";

  if (!content) {
    writeFileSync(emptyResponseDebugFilePath, JSON.stringify(data, null, 2), "utf8");
    throw new Error(
      `Ollama returned empty message.content. Full response written to: ${emptyResponseDebugFilePath}`
    );
  }

  // Try to parse the JSON from the response
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Try to extract JSON from code fences or surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(`Failed to parse Ollama response as JSON: ${content.slice(0, 200)}`);
      }
    } else {
      throw new Error(`No JSON object found in Ollama response: ${content.slice(0, 200)}`);
    }
  }

  // Validate required fields
  const required = ["countryCode", "countryName", "basis", "confidence", "reason"];
  for (const field of required) {
    if (!(field in parsed)) {
      parsed[field] = field === "countryCode" ? "UNKNOWN" : field === "countryName" ? "Unknown" : field === "confidence" ? "unknown" : "unknown";
    }
  }

  // Normalize basis
  if (!["developer", "publisher", "title", "unknown"].includes(parsed.basis)) {
    parsed.basis = "unknown";
  }

  // Normalize confidence
  if (!["high", "medium", "low", "unknown"].includes(parsed.confidence)) {
    parsed.confidence = "unknown";
  }

  // Normalize countryCode
  if (parsed.countryCode === "UNKNOWN" || !parsed.countryCode) {
    parsed.countryCode = "UNKNOWN";
    parsed.countryName = "Unknown";
    parsed.confidence = "unknown";
  }

  return {
    countryCode: parsed.countryCode,
    countryName: parsed.countryName,
    basis: parsed.basis,
    confidence: parsed.confidence,
    reason: parsed.reason || "",
  };
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
  const endMatch = arrayText.match(/;\s*$/m);
  const jsonText = endMatch
    ? arrayText.slice(0, endMatch.index).trim()
    : arrayText.trim().replace(/;$/, "");

  return JSON.parse(jsonText);
}

function loadCache() {
  try {
    const raw = readFileSync(cacheFilePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
