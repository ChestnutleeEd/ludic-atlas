import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const generatedGamesPath = resolve("src/data/games.generated.ts");
const coversDir = resolve("public/covers/rawg");
const backupRootDir = resolve("backups");
const localCoverPathPrefix = "/covers/rawg/";
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const removableSourceExtensions = new Set([".jpg", ".jpeg", ".png"]);
const maxDimension = 1000;
const webpQuality = 80;

main().catch((error) => {
  console.error("RAWG cover compression failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  if (!existsSync(coversDir)) {
    throw new Error(`Missing RAWG cover directory: ${coversDir}`);
  }

  const beforeStats = collectCoverStats();
  const backupDir = createBackup(beforeStats);

  console.log(`Backup created: ${backupDir}`);
  printStats("Before compression", beforeStats);

  const groups = groupCoverFilesByBaseName(beforeStats.files);
  const results = {
    compressed: 0,
    deletedSources: 0,
    failed: 0
  };

  for (const group of groups.values()) {
    try {
      await compressCoverGroup(group);
      results.compressed += 1;
      results.deletedSources += deleteOldSources(group);
    } catch (error) {
      results.failed += 1;
      console.warn(`FAILED ${group.baseName}: ${formatError(error)}`);
    }

    const done = results.compressed + results.failed;
    if (done === groups.size || done % 100 === 0) {
      console.log(
        `Compression progress: ${done}/${groups.size}; compressed=${results.compressed}; failed=${results.failed}; deleted_old_sources=${results.deletedSources}`
      );
    }
  }

  if (results.failed > 0) {
    throw new Error(`Compression failed for ${results.failed} cover groups.`);
  }

  const games = readGeneratedGames();
  const updatedGames = updateCoverReferences(games);
  writeGeneratedGames(updatedGames);

  const afterStats = collectCoverStats();
  const validation = validateGeneratedCoverReferences(updatedGames);

  printStats("After compression", afterStats);
  console.log(`Compressed cover groups: ${results.compressed}`);
  console.log(`Deleted old jpg/jpeg/png files: ${results.deletedSources}`);
  console.log(
    `games.generated.ts coverImage references all exist: ${validation.missing.length === 0 ? "yes" : "no"}`
  );

  if (validation.missing.length > 0) {
    console.warn("Missing coverImage files:");
    for (const missing of validation.missing) {
      console.warn(`- ${missing.id}: ${missing.coverImage}`);
    }
    throw new Error(`Missing ${validation.missing.length} generated coverImage files.`);
  }
}

function createBackup(beforeStats) {
  const timestamp = createTimestamp();
  const backupDir = resolve(backupRootDir, `covers-before-compress-${timestamp}`);

  mkdirSync(backupDir, { recursive: true });
  copyFileSync(generatedGamesPath, join(backupDir, "games.generated.ts"));
  writeFileSync(
    join(backupDir, "rawg-cover-files-before.json"),
    JSON.stringify(beforeStats.files, null, 2),
    "utf8"
  );
  writeFileSync(
    join(backupDir, "rawg-cover-summary-before.txt"),
    formatStatsText("Before compression", beforeStats),
    "utf8"
  );

  return backupDir;
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function collectCoverStats() {
  const files = readdirSync(coversDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const extension = extname(entry.name).toLowerCase();
      const filePath = join(coversDir, entry.name);
      const stat = statSync(filePath);

      return {
        name: entry.name,
        path: filePath,
        extension,
        size: stat.size
      };
    })
    .filter((file) => supportedExtensions.has(file.extension))
    .sort((left, right) => left.name.localeCompare(right.name));

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const largest = [...files].sort((left, right) => right.size - left.size).slice(0, 20);

  return {
    count: files.length,
    totalBytes,
    totalHuman: formatBytes(totalBytes),
    files,
    largest
  };
}

function groupCoverFilesByBaseName(files) {
  const groups = new Map();

  for (const file of files) {
    const baseName = basename(file.name, file.extension);
    const group = groups.get(baseName) ?? {
      baseName,
      files: []
    };

    group.files.push(file);
    groups.set(baseName, group);
  }

  for (const group of groups.values()) {
    group.files.sort(compareCompressionSourcePreference);
    group.source = group.files[0];
    group.outputPath = join(coversDir, `${group.baseName}.webp`);
  }

  return groups;
}

function compareCompressionSourcePreference(left, right) {
  const leftWebp = left.extension === ".webp";
  const rightWebp = right.extension === ".webp";

  if (leftWebp !== rightWebp) {
    return leftWebp ? 1 : -1;
  }

  return right.size - left.size;
}

async function compressCoverGroup(group) {
  const temporaryPath = `${group.outputPath}.tmp-${process.pid}`;

  try {
    await sharp(group.source.path)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: webpQuality })
      .toFile(temporaryPath);

    copyFileSync(temporaryPath, group.outputPath);
  } finally {
    if (existsSync(temporaryPath)) {
      unlinkSync(temporaryPath);
    }
  }
}

function deleteOldSources(group) {
  let deleted = 0;

  for (const file of group.files) {
    if (!removableSourceExtensions.has(file.extension)) {
      continue;
    }

    if (!existsSync(group.outputPath)) {
      throw new Error(`Expected compressed file before deleting source: ${group.outputPath}`);
    }

    if (existsSync(file.path)) {
      unlinkSync(file.path);
      deleted += 1;
    }
  }

  return deleted;
}

function readGeneratedGames() {
  const content = readFileSync(generatedGamesPath, "utf8");
  const match = content.match(/export const generatedGames:\s*Game\[\]\s*=\s*(\[[\s\S]*\]);?\s*$/);

  if (!match?.[1]) {
    throw new Error(`Could not parse generatedGames array from ${generatedGamesPath}.`);
  }

  return JSON.parse(match[1]);
}

function updateCoverReferences(games) {
  return games.map((game) => {
    const coverImage = String(game.coverImage ?? "");

    if (!coverImage.startsWith(localCoverPathPrefix)) {
      return game;
    }

    const extension = extname(coverImage).toLowerCase();

    if (!supportedExtensions.has(extension)) {
      return game;
    }

    const basePath = coverImage.slice(0, -extension.length);
    return {
      ...game,
      coverImage: `${basePath}.webp`
    };
  });
}

function writeGeneratedGames(games) {
  const currentFile = readFileSync(generatedGamesPath, "utf8");
  const header = extractGeneratedFileHeader(currentFile);
  const comments = appendCompressionComment(header);
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

function appendCompressionComment(header) {
  const lines = header
    .split("\n")
    .filter((line) => !line.startsWith("// covers compressed to webp"));

  lines.push(`// covers compressed to webp: ${new Date().toISOString()}`);

  return lines.join("\n");
}

function validateGeneratedCoverReferences(games) {
  const missing = [];

  for (const game of games) {
    const coverImage = String(game.coverImage ?? "");

    if (!coverImage.startsWith(localCoverPathPrefix)) {
      continue;
    }

    const fileName = coverImage.slice(localCoverPathPrefix.length);
    const filePath = join(coversDir, fileName);

    if (!existsSync(filePath)) {
      missing.push({
        id: game.id,
        coverImage
      });
    }
  }

  return { missing };
}

function printStats(label, stats) {
  console.log(`\n=== ${label} ===`);
  console.log(`public/covers/rawg total size: ${stats.totalHuman} (${stats.totalBytes} bytes)`);
  console.log(`public/covers/rawg file count: ${stats.count}`);
  console.log("Largest 20 files:");

  for (const file of stats.largest) {
    console.log(`- ${file.name}: ${formatBytes(file.size)} (${file.size} bytes)`);
  }
}

function formatStatsText(label, stats) {
  const lines = [
    `=== ${label} ===`,
    `public/covers/rawg total size: ${stats.totalHuman} (${stats.totalBytes} bytes)`,
    `public/covers/rawg file count: ${stats.count}`,
    "Largest 20 files:",
    ...stats.largest.map((file) => `- ${file.name}: ${formatBytes(file.size)} (${file.size} bytes)`)
  ];

  return `${lines.join("\n")}\n`;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
