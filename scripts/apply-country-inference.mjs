import { readFile, writeFile } from "node:fs/promises";

const PREVIEW_PATH = new URL("../data/country-inference-preview.json", import.meta.url);
const GAMES_PATH = new URL("../src/data/games.generated.ts", import.meta.url);
const DRY_RUN = process.env.APPLY_COUNTRIES_DRY_RUN === "true";

const validSources = new Set(["developer", "publisher", "title", "unknown"]);

function extractGeneratedGames(source) {
  const marker = "export const generatedGames: Game[] = ";
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error("Could not find generatedGames export in games.generated.ts.");
  }

  const assignmentStart = source.indexOf("=", start);
  const arrayStart = source.indexOf("[", assignmentStart);
  const arrayEnd = source.lastIndexOf("];");

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    throw new Error("Could not locate generatedGames array boundaries.");
  }

  return {
    games: JSON.parse(source.slice(arrayStart, arrayEnd + 1)),
    prefix: source.slice(0, start),
    suffix: source.slice(arrayEnd + 2)
  };
}

function normalizeSource(value) {
  return validSources.has(value) ? value : "unknown";
}

const [previewSource, gamesSource] = await Promise.all([
  readFile(PREVIEW_PATH, "utf8"),
  readFile(GAMES_PATH, "utf8")
]);

const preview = JSON.parse(previewSource);
const highConfidenceById = new Map(
  (preview.items ?? [])
    .filter((item) => item.confidence === "high")
    .map((item) => [item.id, item])
);
const { games, prefix, suffix } = extractGeneratedGames(gamesSource);
const gameIds = new Set(games.map((game) => game.id));
let updatedCount = 0;

const nextGames = games.map((game) => {
  const inference = highConfidenceById.get(game.id);

  if (!inference) {
    return game;
  }

  updatedCount += 1;

  return {
    ...game,
    countryCode: inference.inferredCountryCode,
    countryName: inference.inferredCountryName,
    countrySource: normalizeSource(inference.basis),
    countryConfidence: inference.confidence,
    countryReason: inference.reason
  };
});

const unknownCount = nextGames.filter(
  (game) => game.countryCode === "UNKNOWN" || game.countryName === "Global"
).length;
const missingGameIds = [...highConfidenceById.keys()].filter(
  (id) => !gameIds.has(id)
);

console.log(`High-confidence country inferences available: ${highConfidenceById.size}`);
console.log(`Games updated: ${updatedCount}`);
console.log(`Games still UNKNOWN / Global: ${unknownCount}`);

if (missingGameIds.length > 0) {
  console.log(`Preview ids not found in generated games: ${missingGameIds.length}`);
}

if (DRY_RUN) {
  console.log("Dry run enabled; src/data/games.generated.ts was not modified.");
} else {
  const nextSource = `${prefix}export const generatedGames: Game[] = ${JSON.stringify(nextGames, null, 2)};${suffix}`;

  await writeFile(GAMES_PATH, nextSource);
  console.log("Applied country inference to src/data/games.generated.ts.");
}
