"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveTimeline,
  type ArchiveYearGroup
} from "@/components/archive/ArchiveTimeline";
import { ArchiveYearModal } from "@/components/archive/ArchiveYearModal";
import { getGenreLabel } from "@/lib/localization";
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

export function GameArchiveView({
  games,
  onBackToHub,
  selectedGameId,
  onSelectGame
}: GameArchiveViewProps) {
  const archiveRootRef = useRef<HTMLElement | null>(null);
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
        const sortByRating = (a: Game, b: Game) => b.rating - a.rating;
        const previewGames = [
          ...groupGames.filter((game) => game.coverImage).sort(sortByRating),
          ...groupGames.filter((game) => !game.coverImage).sort(sortByRating)
        ].slice(0, 5);

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

  useEffect(() => {
    let cleanup = () => {};

    async function runArchiveIntro() {
      const root = archiveRootRef.current;

      if (!root) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        return;
      }

      const { gsap } = await import("gsap");
      let observerCleanup = () => {};
      const context = gsap.context(() => {
        gsap.fromTo(
          "[data-archive-intro]",
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.86,
            ease: "power3.out",
            stagger: 0.12
          }
        );

        const yearNodes = gsap.utils.toArray<HTMLElement>("[data-year-node]");
        const seenNodes = new WeakSet<Element>();
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || seenNodes.has(entry.target)) {
                continue;
              }

              seenNodes.add(entry.target);
              gsap.fromTo(
                entry.target,
                { autoAlpha: 0, y: 44, scale: 0.98 },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.72,
                  ease: "power3.out"
                }
              );
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.16 }
        );

        yearNodes.forEach((node) => observer.observe(node));
        observerCleanup = () => observer.disconnect();
      }, root);

      cleanup = () => {
        observerCleanup();
        context.revert();
      };
    }

    runArchiveIntro();

    return () => cleanup();
  }, [yearGroups]);

  return (
    <section
      className="archive-redesign game-chronicle-shell chrono-archive-vintage chrono-archive-shell archive-shell glass-panel relative min-h-[690px] overflow-hidden"
      ref={archiveRootRef}
    >
      <div className="archive-wood-wash pointer-events-none absolute inset-0" />
      <div className="archive-cinematic-bg pointer-events-none absolute inset-0" />
      <div className="archive-spotlight pointer-events-none absolute inset-0" />
      <div className="archive-star-grid pointer-events-none absolute inset-0" />
      <div className="archive-scanlines pointer-events-none absolute inset-0" />
      <div className="archive-layout relative z-10 grid min-h-[690px] gap-4 p-4">
        <div className="min-w-0">
          <header className="archive-hero-panel" data-archive-intro>
            <div className="archive-hero-copy">
                <button
                  className="archive-back-button"
                  onClick={onBackToHub}
                  type="button"
                >
                  返回游戏星图
                </button>
              <p className="archive-brass-label archive-kicker">
                世界游戏文化档案
              </p>
              <h1>Game Chronicle / 游戏编年馆</h1>
                <p>
                沿着年份档案柜，浏览世界游戏文化的关键作品。
                </p>
              </div>
            <dl className="archive-metrics archive-hero-metrics">
                <div>
                  <dt>筛选结果</dt>
                  <dd>{filteredGames.length}</dd>
                </div>
                <div>
                <dt>年份档案柜</dt>
                  <dd>{yearGroups.length}</dd>
                </div>
                <div>
                  <dt>总馆藏</dt>
                  <dd>{games.length}</dd>
                </div>
              </dl>
          </header>

          <div className="archive-index-dock" data-archive-intro>
            <div className="archive-index-heading">
              <div>
                <p className="archive-brass-label archive-kicker">馆藏索引</p>
                <h2>年代索引与馆藏标签</h2>
              </div>
              <p>
                {archiveYearRange.min}-{archiveYearRange.max} · 使用标题、类型与平台收束展陈。
              </p>
            </div>

            <div className="archive-terminal-controls">
              <label className="archive-field archive-search-field">
                <span>标题搜索</span>
                <input
                  autoComplete="off"
                  name="archive-title-search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索游戏标题…"
                  type="search"
                  value={searchQuery}
                />
              </label>
              <label className="archive-field">
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

            <div className="archive-filter-grid">
              <TagFilter
                labels={genreOptions}
                onToggle={(genre) =>
                  setSelectedGenres((current) => toggleSetValue(current, genre))
                }
                selectedLabels={selectedGenres}
                title="馆藏标签"
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
                title="平台索引"
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

          <main className="chronicle-main-stage" data-archive-intro>
            <div className="chronicle-main-stage-heading">
              <div>
                <p className="archive-brass-label archive-kicker">
                  时光展柜
                </p>
                <h2>年份档案柜</h2>
              </div>
              <p>向下浏览年代展陈，点击年份打开大型档案抽屉。</p>
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
    <section className="archive-filter-panel">
      <div className="archive-filter-heading">
        <h3>{title}</h3>
        <span>
          {labels.length === 0
            ? "暂无索引"
            : selectedLabels.size > 0
              ? `已选 ${selectedLabels.size}`
              : "OR 多选"}
        </span>
      </div>
      <div className="archive-tag-list" role="list">
        {labels.length === 0 ? (
          <p className="archive-filter-empty">没有可用标签。</p>
        ) : null}
        {labels.map((label) => {
          const isSelected = selectedLabels.has(label);

          return (
            <motion.button
              layout
              className={`archive-tag-button ${isSelected ? "is-active" : ""}`}
              key={label}
              onClick={() => onToggle(label)}
              role="listitem"
              whileTap={{ scale: 0.96 }}
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
