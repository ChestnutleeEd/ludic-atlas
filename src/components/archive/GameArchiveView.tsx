"use client";

import { useMemo, useState } from "react";
import {
  ArchiveTimeline,
  type ArchiveYearGroup
} from "@/components/archive/ArchiveTimeline";
import { ArchiveYearModal } from "@/components/archive/ArchiveYearModal";
import { getGenreLabel } from "@/lib/localization";
import type { Game } from "@/types/game";

type GameArchiveViewProps = {
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string | null) => void;
};

type ArchiveSortMode = "year-desc" | "rating-desc";

type ArchiveGameIndex = {
  game: Game;
  genreTags: string[];
  platformTags: string[];
  searchText: string;
};

function splitArchiveTags(values: string[]) {
  return values
    .flatMap((value) => value.split(/\s*\/\s*/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

export function GameArchiveView({
  games,
  selectedGameId,
  onSelectGame
}: GameArchiveViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [sortMode, setSortMode] = useState<ArchiveSortMode>("year-desc");
  const [openYear, setOpenYear] = useState<number | null>(null);

  const archiveIndex = useMemo<ArchiveGameIndex[]>(
    () =>
      games.map((game) => ({
        game,
        genreTags: splitArchiveTags(game.genres),
        platformTags: splitArchiveTags(game.platforms),
        searchText: `${game.title} ${game.titleZh}`.toLowerCase()
      })),
    [games]
  );
  const genreOptions = useMemo(
    () =>
      [...new Set(archiveIndex.flatMap((item) => item.genreTags))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [archiveIndex]
  );
  const platformOptions = useMemo(
    () =>
      [...new Set(archiveIndex.flatMap((item) => item.platformTags))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [archiveIndex]
  );
  const archiveYearRange = useMemo(() => {
    const validYears = games
      .map((game) => game.releaseYear)
      .filter((year) => Number.isFinite(year) && year > 0);

    return {
      max: Math.max(...validYears),
      min: Math.min(...validYears)
    };
  }, [games]);
  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return archiveIndex.flatMap(({ game, genreTags, platformTags, searchText }) => {
      const matchesSearch =
        normalizedQuery.length === 0 || searchText.includes(normalizedQuery);
      const matchesGenre =
        selectedGenres.size === 0 ||
        genreTags.some((genre) => selectedGenres.has(genre));
      const matchesPlatform =
        selectedPlatforms.size === 0 ||
        platformTags.some((platform) => selectedPlatforms.has(platform));

      return matchesSearch && matchesGenre && matchesPlatform ? [game] : [];
    });
  }, [archiveIndex, searchQuery, selectedGenres, selectedPlatforms]);
  const yearGroups = useMemo<ArchiveYearGroup[]>(() => {
    const groupedGames = new Map<number | null, Game[]>();

    for (const game of filteredGames) {
      const releaseYear =
        Number.isFinite(game.releaseYear) && game.releaseYear > 0
          ? game.releaseYear
          : null;

      const groupGames = groupedGames.get(releaseYear);

      if (groupGames) {
        groupGames.push(game);
      } else {
        groupedGames.set(releaseYear, [game]);
      }
    }

    return [...groupedGames.entries()]
      .sort(([yearA], [yearB]) => {
        if (yearA === null) {
          return 1;
        }

        if (yearB === null) {
          return -1;
        }

        return yearA - yearB;
      })
      .map(([year, groupGames]) => {
        const sortedGames = [...groupGames].sort((a, b) => {
          if (sortMode === "rating-desc") {
            return b.rating - a.rating || b.releaseYear - a.releaseYear;
          }

          return b.releaseYear - a.releaseYear || b.rating - a.rating;
        });
        const previewGames = [...groupGames]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);

        return {
          games: sortedGames,
          label: year === null ? "Unknown Year" : String(year),
          previewGames,
          year
        };
      });
  }, [filteredGames, sortMode]);
  const openGroup = useMemo(
    () => yearGroups.find((group) => group.year === openYear) ?? null,
    [openYear, yearGroups]
  );
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedGenres.size > 0 ||
    selectedPlatforms.size > 0;

  return (
    <section className="game-chronicle-shell chrono-archive-vintage chrono-archive-shell archive-shell glass-panel relative min-h-[690px] overflow-hidden">
      <div className="archive-wood-wash pointer-events-none absolute inset-0" />
      <div className="archive-star-grid pointer-events-none absolute inset-0" />
      <div className="archive-scanlines pointer-events-none absolute inset-0" />
      <div className="archive-layout relative z-10 grid min-h-[690px] gap-4 p-4">
        <div className="min-w-0">
          <div className="archive-desk archive-terminal">
            <div className="archive-terminal-header">
              <div>
                <p className="archive-brass-label archive-kicker">Archive</p>
                <h2>Game Chronicle / 游戏编年馆</h2>
                <p>
                  沿着 {archiveYearRange.min}-{archiveYearRange.max} 的时间轴浏览游戏馆藏。
                </p>
              </div>
              <dl className="archive-metrics">
                <div>
                  <dt>筛选结果</dt>
                  <dd>{filteredGames.length}</dd>
                </div>
                <div>
                  <dt>年份抽屉</dt>
                  <dd>{yearGroups.length}</dd>
                </div>
                <div>
                  <dt>总馆藏</dt>
                  <dd>{games.length}</dd>
                </div>
              </dl>
            </div>
            <div className="archive-terminal-spine" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="archive-terminal-controls">
              <label className="archive-field archive-search-field">
                <span>标题搜索</span>
                <input
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索游戏标题"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <label className="archive-field">
                <span>排序</span>
                <select
                  onChange={(event) =>
                    setSortMode(event.target.value as ArchiveSortMode)
                  }
                  value={sortMode}
                >
                  <option value="year-desc">年份倒序</option>
                  <option value="rating-desc">评分倒序</option>
                </select>
              </label>
            </div>

            <div className="archive-filter-grid">
              <TagFilter
                labels={genreOptions}
                onToggle={(genre) =>
                  setSelectedGenres((current) => toggleSetValue(current, genre))
                }
                selectedLabels={selectedGenres}
                title="Genre Tags"
                transformLabel={getGenreLabel}
              />
              <TagFilter
                labels={platformOptions}
                onToggle={(platform) =>
                  setSelectedPlatforms((current) =>
                    toggleSetValue(current, platform)
                  )
                }
                selectedLabels={selectedPlatforms}
                title="Platform Index"
              />
            </div>

            {hasActiveFilters ? (
              <button
                className="archive-clear-button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGenres(new Set());
                  setSelectedPlatforms(new Set());
                }}
                type="button"
              >
                清除筛选
              </button>
            ) : null}
          </div>

          <div className="chronicle-main-stage">
            <div className="chronicle-main-stage-heading">
              <div>
                <p className="archive-brass-label archive-kicker">
                  Timeline Cabinet
                </p>
                <h3>年份档案柜轨道</h3>
              </div>
              <p>
                点击年份抽屉打开年份展柜；主轨道只展示年份、数量和代表封面。
              </p>
            </div>
            <ArchiveTimeline
              activeYear={openGroup?.year ?? null}
              groups={yearGroups}
              onSelectYear={(year) => {
                setOpenYear(year);
                onSelectGame(null);
              }}
            />
          </div>
        </div>
      </div>
      {openGroup ? (
        <ArchiveYearModal
          group={openGroup}
          selectedGameId={selectedGameId}
          onClose={() => {
            setOpenYear(null);
            onSelectGame(null);
          }}
          onSelectGame={onSelectGame}
        />
      ) : null}
    </section>
  );
}

function TagFilter({
  labels,
  selectedLabels,
  title,
  transformLabel = (label) => label,
  onToggle
}: {
  labels: string[];
  selectedLabels: Set<string>;
  title: string;
  transformLabel?: (label: string) => string;
  onToggle: (label: string) => void;
}) {
  return (
    <section className="archive-filter-panel">
      <div className="archive-filter-heading">
        <h3>{title}</h3>
        <span>
          {selectedLabels.size > 0 ? `已选 ${selectedLabels.size}` : "OR 多选"}
        </span>
      </div>
      <div className="archive-tag-list">
        {labels.map((label) => {
          const isSelected = selectedLabels.has(label);

          return (
            <button
              className={`archive-tag-button ${isSelected ? "is-active" : ""}`}
              key={label}
              onClick={() => onToggle(label)}
              type="button"
            >
              {transformLabel(label)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
