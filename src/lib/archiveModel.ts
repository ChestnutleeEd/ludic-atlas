import type { Game } from "@/types/game";

export const UNKNOWN_ARCHIVE_YEAR_KEY = "unknown" as const;

export type ArchiveYearKey = number | typeof UNKNOWN_ARCHIVE_YEAR_KEY;
export type ArchiveSortMode = "year-desc" | "rating-desc";

export type ArchiveYearGroup = {
  averageRating: number;
  coverSignature: string;
  featureGames: Game[];
  games: Game[];
  key: ArchiveYearKey;
  label: string;
  previewGames: Game[];
  representativeGame: Game | null;
  year: number | null;
  yearVariant: number;
};

export type ArchiveModel = {
  activeGroup: ArchiveYearGroup | null;
  activeYearKey: ArchiveYearKey | null;
  averageRating: number;
  filteredGames: Game[];
  genreOptions: string[];
  platformOptions: string[];
  selectedGame: Game | null;
  yearGroups: ArchiveYearGroup[];
  yearRange: { max: number | null; min: number | null };
};

type ArchiveModelOptions = {
  games: Game[];
  openYearKey: ArchiveYearKey | null;
  query: string;
  selectedArchiveGameId: string | null;
  selectedGenres: ReadonlySet<string>;
  selectedPlatforms: ReadonlySet<string>;
  sortMode: ArchiveSortMode;
};

type ArchiveIndexEntry = {
  game: Game;
  genres: string[];
  platforms: string[];
  searchText: string;
};

export function splitArchiveTags(values: string[] | null | undefined) {
  return (values ?? [])
    .flatMap((value) => value.split(/\s*\/\s*/))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getArchiveYearKey(game: Game): ArchiveYearKey {
  return Number.isFinite(game.releaseYear) && game.releaseYear > 0
    ? game.releaseYear
    : UNKNOWN_ARCHIVE_YEAR_KEY;
}

export function getArchiveAverageRating(games: Game[]) {
  if (games.length === 0) {
    return 0;
  }

  return (
    games.reduce(
      (total, game) => total + (Number.isFinite(game.rating) ? game.rating : 0),
      0
    ) / games.length
  );
}

export function getArchiveRepresentative(games: Game[]) {
  return [...games].sort(compareGamesByRating)[0] ?? null;
}

export function deriveArchiveModel({
  games,
  openYearKey,
  query,
  selectedArchiveGameId,
  selectedGenres,
  selectedPlatforms,
  sortMode
}: ArchiveModelOptions): ArchiveModel {
  const index = games.map(buildIndexEntry);
  const genreOptions = uniqueSorted(index.flatMap((entry) => entry.genres));
  const platformOptions = uniqueSorted(index.flatMap((entry) => entry.platforms));
  const normalizedQuery = normalizeSearchText(query);
  const filteredGames = index
    .filter((entry) => {
      const matchesQuery =
        normalizedQuery.length === 0 || entry.searchText.includes(normalizedQuery);
      const matchesGenre =
        selectedGenres.size === 0 ||
        entry.genres.some((genre) => selectedGenres.has(genre));
      const matchesPlatform =
        selectedPlatforms.size === 0 ||
        entry.platforms.some((platform) => selectedPlatforms.has(platform));

      return matchesQuery && matchesGenre && matchesPlatform;
    })
    .map((entry) => entry.game);
  const grouped = new Map<ArchiveYearKey, Game[]>();

  for (const game of filteredGames) {
    const key = getArchiveYearKey(game);
    const yearGames = grouped.get(key);

    if (yearGames) {
      yearGames.push(game);
    } else {
      grouped.set(key, [game]);
    }
  }

  const yearGroups = [...grouped.entries()]
    .sort(([keyA], [keyB]) => compareArchiveYearKeys(keyA, keyB))
    .map(([key, yearGames]) => {
      const sortedGames = [...yearGames].sort(
        sortMode === "rating-desc" ? compareGamesByRating : compareGamesByTitle
      );
      const featureGames = [...yearGames].sort(compareGamesByRating).slice(0, 3);

      return {
        averageRating: getArchiveAverageRating(yearGames),
        coverSignature: featureGames.map((game) => game.id).join("|"),
        featureGames,
        games: sortedGames,
        key,
        label: key === UNKNOWN_ARCHIVE_YEAR_KEY ? "年份未知" : String(key),
        previewGames: sortedGames.slice(0, 5),
        representativeGame: getArchiveRepresentative(yearGames),
        year: key === UNKNOWN_ARCHIVE_YEAR_KEY ? null : key,
        yearVariant:
          key === UNKNOWN_ARCHIVE_YEAR_KEY
            ? 0
            : Math.abs(key + featureGames.reduce((total, game) => total + game.id.length, 0)) % 4
      } satisfies ArchiveYearGroup;
    });

  const requestedGroup = yearGroups.find((group) => group.key === openYearKey);
  const activeGroup = requestedGroup ?? yearGroups[0] ?? null;
  const selectedGame =
    activeGroup?.games.find((game) => game.id === selectedArchiveGameId) ?? null;
  const validYears = games
    .map((game) => game.releaseYear)
    .filter((year) => Number.isFinite(year) && year > 0);

  return {
    activeGroup,
    activeYearKey: activeGroup?.key ?? null,
    averageRating: getArchiveAverageRating(filteredGames),
    filteredGames,
    genreOptions,
    platformOptions,
    selectedGame,
    yearGroups,
    yearRange: {
      max: validYears.length > 0 ? Math.max(...validYears) : null,
      min: validYears.length > 0 ? Math.min(...validYears) : null
    }
  };
}

export function compareArchiveYearKeys(
  keyA: ArchiveYearKey,
  keyB: ArchiveYearKey
) {
  if (keyA === UNKNOWN_ARCHIVE_YEAR_KEY) {
    return keyB === UNKNOWN_ARCHIVE_YEAR_KEY ? 0 : 1;
  }

  if (keyB === UNKNOWN_ARCHIVE_YEAR_KEY) {
    return -1;
  }

  return keyB - keyA;
}

function buildIndexEntry(game: Game): ArchiveIndexEntry {
  return {
    game,
    genres: splitArchiveTags(game.genres),
    platforms: splitArchiveTags(game.platforms),
    searchText: normalizeSearchText(
      [game.title, game.titleZh, game.developer, game.publisher]
        .filter(Boolean)
        .join(" ")
    )
  };
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function compareGamesByRating(gameA: Game, gameB: Game) {
  return (
    safeRating(gameB.rating) - safeRating(gameA.rating) ||
    compareGamesByTitle(gameA, gameB)
  );
}

function compareGamesByTitle(gameA: Game, gameB: Game) {
  return (
    (gameA.titleZh || gameA.title).localeCompare(gameB.titleZh || gameB.title) ||
    gameA.id.localeCompare(gameB.id)
  );
}

function safeRating(rating: number) {
  return Number.isFinite(rating) ? rating : 0;
}
