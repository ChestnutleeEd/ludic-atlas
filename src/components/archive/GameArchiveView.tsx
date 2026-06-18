"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveTimeline,
  type ArchiveYearGroup
} from "@/components/archive/ArchiveTimeline";
import { ArchiveYearModal } from "@/components/archive/ArchiveYearModal";
import { getGameDisplayTitle, getGenreLabel } from "@/lib/localization";
import type { Game } from "@/types/game";

type GameArchiveViewProps = {
  games: Game[];
  onBackToHub: () => void;
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

function getAverageRating(games: Game[]) {
  if (games.length === 0) {
    return "0.0";
  }

  const sum = games.reduce(
    (total, game) => total + (Number.isFinite(game.rating) ? game.rating : 0),
    0
  );

  return (sum / games.length).toFixed(1);
}

function getTopGame(games: Game[]) {
  return [...games].sort(
    (a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear
  )[0];
}

function formatYearRange(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return "年份待归档";
  }

  return `${min}-${max}`;
}

export function GameArchiveView({
  games,
  onBackToHub,
  selectedGameId,
  onSelectGame
}: GameArchiveViewProps) {
  const archiveRootRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [sortMode, setSortMode] = useState<ArchiveSortMode>("year-desc");
  const [openYear, setOpenYear] = useState<number | null>(null);

  const archiveIndex = useMemo<ArchiveGameIndex[]>(
    () =>
      games.map((game) => {
        const genreTags = splitArchiveTags(game.genres);
        const platformTags = splitArchiveTags(game.platforms);

        return {
          game,
          genreTags,
          platformTags,
          searchText: `${game.title} ${game.titleZh} ${game.developer} ${game.publisher}`
            .trim()
            .toLowerCase()
        };
      }),
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
      max: validYears.length > 0 ? Math.max(...validYears) : Number.NaN,
      min: validYears.length > 0 ? Math.min(...validYears) : Number.NaN
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

        return sortMode === "year-desc" ? yearB - yearA : yearA - yearB;
      })
      .map(([year, groupGames]) => {
        const sortedGames = [...groupGames].sort((a, b) => {
          if (sortMode === "rating-desc") {
            return b.rating - a.rating || b.releaseYear - a.releaseYear;
          }

          return b.releaseYear - a.releaseYear || b.rating - a.rating;
        });
        const previewGames = [...groupGames]
          .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
          .slice(0, 8);

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
  const featuredGame = useMemo(() => getTopGame(filteredGames), [filteredGames]);
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedGenres.size > 0 ||
    selectedPlatforms.size > 0;

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    let cleanup = () => {};

    async function runArchiveIntro() {
      const root = archiveRootRef.current;

      if (!root) {
        return;
      }

      const { gsap } = await import("gsap");
      const context = gsap.context(() => {
        gsap.fromTo(
          "[data-archive-intro]",
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.74,
            ease: "power3.out",
            stagger: 0.08
          }
        );
      }, root);

      cleanup = () => context.revert();
    }

    runArchiveIntro();

    return () => cleanup();
  }, [shouldReduceMotion]);

  return (
    <section
      className="archive-v2 relative min-h-screen overflow-hidden"
      ref={archiveRootRef}
    >
      <div className="archive-v2-bg" aria-hidden="true" />
      <div className="archive-v2-scan" aria-hidden="true" />
      <div className="archive-v2-shell">
        <header className="archive-v2-hero" data-archive-intro>
          <div className="archive-v2-hero-copy">
            <button
              className="archive-v2-back"
              onClick={onBackToHub}
              type="button"
            >
              返回游戏星图
            </button>
            <p className="archive-v2-kicker">Game Chronicle / 游戏编年馆</p>
            <h1>复古数字游戏档案馆</h1>
            <p>
              按年份整理全球游戏馆藏，以胶片索引、年度展柜和游戏卷宗浏览代表作品。
            </p>
          </div>

          <div className="archive-v2-hero-board" aria-label="档案馆统计">
            <dl className="archive-v2-metrics">
              <div>
                <dt>筛选结果</dt>
                <dd>{filteredGames.length}</dd>
              </div>
              <div>
                <dt>年份档案</dt>
                <dd>{yearGroups.length}</dd>
              </div>
              <div>
                <dt>平均评分</dt>
                <dd>{getAverageRating(filteredGames)}</dd>
              </div>
            </dl>
            <div className="archive-v2-featured">
              <span>代表馆藏</span>
              <strong title={featuredGame ? getGameDisplayTitle(featuredGame) : ""}>
                {featuredGame ? getGameDisplayTitle(featuredGame) : "暂无结果"}
              </strong>
              <small>{formatYearRange(archiveYearRange.min, archiveYearRange.max)}</small>
            </div>
          </div>
        </header>

        <section className="archive-v2-index" data-archive-intro>
          <div className="archive-v2-section-heading">
            <div className="min-w-0">
              <p className="archive-v2-kicker">Archive Index / 馆藏索引</p>
              <h2>标题、类型与平台</h2>
            </div>
            {hasActiveFilters ? (
              <button
                className="archive-v2-clear"
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

          <div className="archive-v2-controls">
            <label className="archive-v2-field archive-v2-search">
              <span>标题搜索</span>
              <input
                autoComplete="off"
                name="archive-title-search"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索游戏、开发者或发行商"
                type="search"
                value={searchQuery}
              />
            </label>
            <label className="archive-v2-field">
              <span>排序</span>
              <select
                name="archive-sort"
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

          <div className="archive-v2-filter-grid">
            <TagFilter
              labels={genreOptions}
              onToggle={(genre) =>
                setSelectedGenres((current) => toggleSetValue(current, genre))
              }
              selectedLabels={selectedGenres}
              title="类型"
              transformLabel={getGenreLabel}
            />
            <TagFilter
              labels={platformOptions}
              onToggle={(platform) =>
                setSelectedPlatforms((current) => toggleSetValue(current, platform))
              }
              selectedLabels={selectedPlatforms}
              title="平台"
            />
          </div>
        </section>

        <main className="archive-v2-stage" data-archive-intro>
          <div className="archive-v2-section-heading">
            <div className="min-w-0">
              <p className="archive-v2-kicker">Cinematic Timeline / 年份胶片</p>
              <h2>年度档案柜</h2>
            </div>
            <p>点击年份打开年度展柜；当前选中年份会以琥珀边框和索引灯标记。</p>
          </div>
          <ArchiveTimeline
            activeYear={openGroup?.year ?? null}
            groups={yearGroups}
            onSelectYear={(year) => {
              setOpenYear(year);
              onSelectGame(null);
            }}
          />
        </main>
      </div>

      <AnimatePresence>
        {openGroup ? (
          <ArchiveYearModal
            group={openGroup}
            key={openGroup.label}
            selectedGameId={selectedGameId}
            onClose={() => {
              setOpenYear(null);
              onSelectGame(null);
            }}
            onSelectGame={onSelectGame}
          />
        ) : null}
      </AnimatePresence>
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
    <section className="archive-v2-filter-panel">
      <div className="archive-v2-filter-heading">
        <h3>{title}</h3>
        <span>
          {labels.length === 0
            ? "暂无索引"
            : selectedLabels.size > 0
              ? `已选 ${selectedLabels.size}`
              : "OR 多选"}
        </span>
      </div>
      <div className="archive-v2-tag-list" role="list">
        {labels.length === 0 ? (
          <p className="archive-v2-empty-small">没有可用标签。</p>
        ) : null}
        {labels.map((label) => {
          const isSelected = selectedLabels.has(label);

          return (
            <motion.button
              layout
              aria-pressed={isSelected}
              className={`archive-v2-tag ${isSelected ? "is-active" : ""}`}
              key={label}
              onClick={() => onToggle(label)}
              whileTap={{ scale: 0.98 }}
              type="button"
            >
              {transformLabel(label)}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
