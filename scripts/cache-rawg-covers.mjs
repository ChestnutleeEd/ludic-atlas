import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const generatedGamesPath = resolve("src/data/games.generated.ts");
const coversOutputDir = resolve("public/covers/rawg");
const localCoverPathPrefix = "/covers/rawg";
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const defaultExtension = ".jpg";
const downloadConcurrency = readPositiveIntegerEnv("RAWG_COVER_CONCURRENCY", 5);
const requestTimeoutMs = readPositiveIntegerEnv("RAWG_COVER_TIMEOUT_MS", 20000);

main().catch((error) => {
  console.error("RAWG cover cache script failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  setupProxyDispatcher();
  mkdirSync(coversOutputDir, { recursive: true });

  const { generatedGames } = await importGeneratedGames();
  const remoteGames = generatedGames.filter((game) => isRemoteUrl(game.coverImage));
  const failures = [];
  const results = {
    downloaded: 0,
    failed: 0,
    skippedExisting: 0,
    totalRemote: remoteGames.length
  };
  const updatedCoverById = new Map();

  console.log(`RAWG cover cache: total covers=${remoteGames.length}`);
  console.log(`RAWG cover cache: concurrency=${downloadConcurrency}`);

  await runWithConcurrency(remoteGames, downloadConcurrency, async (game, index) => {
    const result = await cacheGameCover(game);

    if (result.status === "downloaded") {
      results.downloaded += 1;
      updatedCoverById.set(game.id, result.localPath);
    } else if (result.status === "skipped") {
      results.skippedExisting += 1;
      updatedCoverById.set(game.id, result.localPath);
    } else {
      results.failed += 1;
      failures.push({
        id: game.id,
        reason: result.reason,
        url: game.coverImage
      });
    }

    const done = results.downloaded + results.skippedExisting + results.failed;

    if (done === remoteGames.length || done % 25 === 0 || index === 0) {
      console.log(
        `RAWG cover cache progress: ${done}/${remoteGames.length}; downloaded=${results.downloaded}; skipped=${results.skippedExisting}; failed=${results.failed}`
      );
    }
  });

  const updatedGames = generatedGames.map((game) => {
    const cachedCover = updatedCoverById.get(game.id);

    return cachedCover ? { ...game, coverImage: cachedCover } : game;
  });

  writeGeneratedGames(updatedGames);

  console.log(`RAWG cover cache summary: total covers=${results.totalRemote}`);
  console.log(`RAWG cover cache summary: skipped existing=${results.skippedExisting}`);
  console.log(`RAWG cover cache summary: downloaded=${results.downloaded}`);
  console.log(`RAWG cover cache summary: failed=${results.failed}`);

  if (failures.length > 0) {
    console.warn("RAWG cover cache failures:");

    for (const failure of failures) {
      console.warn(`- ${failure.id}: ${failure.reason}; ${failure.url}`);
    }
  }
}

async function importGeneratedGames() {
  const url = pathToFileURL(generatedGamesPath);
  url.searchParams.set("cacheBust", String(Date.now()));

  return import(url.href);
}

async function cacheGameCover(game) {
  const safeBaseName = createSafeFileBaseName(game.id);
  const existing = findExistingLocalCover(safeBaseName);

  if (existing) {
    return {
      localPath: `${localCoverPathPrefix}/${existing}`,
      status: "skipped"
    };
  }

  let response;

  try {
    response = await fetchWithTimeout(game.coverImage);
  } catch (error) {
    return {
      reason: formatError(error),
      status: "failed"
    };
  }

  if (!response.ok) {
    return {
      reason: `HTTP ${response.status}`,
      status: "failed"
    };
  }

  const extension = inferExtension(game.coverImage, response.headers.get("content-type"));
  const fileName = `${safeBaseName}${extension}`;
  const outputPath = resolve(coversOutputDir, fileName);

  try {
    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.byteLength === 0) {
      return {
        reason: "empty response body",
        status: "failed"
      };
    }

    writeFileSync(outputPath, bytes);
  } catch (error) {
    return {
      reason: formatError(error),
      status: "failed"
    };
  }

  return {
    localPath: `${localCoverPathPrefix}/${fileName}`,
    status: "downloaded"
  };
}

function findExistingLocalCover(baseName) {
  for (const extension of allowedExtensions) {
    const fileName = `${baseName}${extension}`;
    const filePath = resolve(coversOutputDir, fileName);

    if (existsSync(filePath) && statSync(filePath).size > 0) {
      return fileName;
    }
  }

  return null;
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

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runNext())
  );
}

function writeGeneratedGames(games) {
  const currentFile = readFileSync(generatedGamesPath, "utf8");
  const header = extractGeneratedFileHeader(currentFile);
  const comments = appendCacheComment(header);
  const file = `${comments}
export const generatedGames: Game[] = ${JSON.stringify(games, null, 2)};
`;

  writeFileSync(generatedGamesPath, file, "utf8");
}

function extractGeneratedFileHeader(file) {
  const exportIndex = file.indexOf("export const generatedGames");

  if (exportIndex === -1) {
    throw new Error("Could not find generatedGames export in src/data/games.generated.ts.");
  }

  return file.slice(0, exportIndex).trimEnd();
}

function appendCacheComment(header) {
  const lines = header
    .split("\n")
    .filter((line) => !line.startsWith("// covers cached locally"));

  lines.push(`// covers cached locally: ${new Date().toISOString()}`);

  return lines.join("\n");
}

function createSafeFileBaseName(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "rawg-cover";
}

function inferExtension(url, contentType) {
  const urlExtension = getExtensionFromUrl(url);

  if (urlExtension) {
    return urlExtension;
  }

  const contentTypeExtension = getExtensionFromContentType(contentType);

  return contentTypeExtension ?? defaultExtension;
}

function getExtensionFromUrl(value) {
  try {
    const url = new URL(value);
    const extension = extname(basename(url.pathname)).toLowerCase();

    return allowedExtensions.has(extension) ? extension : null;
  } catch {
    return null;
  }
}

function getExtensionFromContentType(contentType) {
  const normalized = String(contentType ?? "").split(";")[0].trim().toLowerCase();

  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return ".jpg";
  }

  if (normalized === "image/png") {
    return ".png";
  }

  if (normalized === "image/webp") {
    return ".webp";
  }

  return null;
}

function setupProxyDispatcher() {
  const proxy = readProxyEnv();

  if (!proxy) {
    console.log("No proxy env detected for RAWG cover cache.");
    return;
  }

  try {
    setGlobalDispatcher(new ProxyAgent(proxy.url));
    console.log(`Using proxy for RAWG cover cache: ${redactProxyUrl(proxy.url)}`);
  } catch (error) {
    throw new Error(`Invalid proxy URL in ${proxy.name}: ${formatError(error)}`);
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

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function readPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
