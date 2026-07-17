"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArchiveCover, prefetchArchiveCovers } from "@/components/archive/ArchiveCover";
import { useArchiveReducedMotion } from "@/components/archive/useArchiveReducedMotion";
import { ArchiveTimeline } from "@/components/archive/ArchiveTimeline";
import { ArchiveYearModal } from "@/components/archive/ArchiveYearModal";
import {
  deriveArchiveModel,
  splitArchiveTags,
  type ArchiveSortMode,
  type ArchiveYearGroup,
  type ArchiveYearKey
} from "@/lib/archiveModel";
import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import styles from "./GameArchiveView.module.css";

type GameArchiveViewProps = {
  games: Game[];
  onBackToHub: () => void;
};

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : "—";
}

function safeTitle(game: Game) {
  return getGameDisplayTitle(game)?.trim() || game.title?.trim() || "未命名游戏";
}

export function GameArchiveView({ games, onBackToHub }: GameArchiveViewProps) {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<ArchiveSortMode>("year-desc");
  const [openYearKey, setOpenYearKey] = useState<ArchiveYearKey | null>(null);
  const [selectedArchiveGameId, setSelectedArchiveGameId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [yearDirection, setYearDirection] = useState(0);
  const reduceMotion = useArchiveReducedMotion();

  const model = useMemo(
    () =>
      deriveArchiveModel({
        games,
        openYearKey,
        query,
        selectedArchiveGameId,
        selectedGenres,
        selectedPlatforms,
        sortMode
      }),
    [
      games,
      openYearKey,
      query,
      selectedArchiveGameId,
      selectedGenres,
      selectedPlatforms,
      sortMode
    ]
  );

  const hasActiveFilters =
    query.trim().length > 0 || selectedGenres.size > 0 || selectedPlatforms.size > 0;
  const activeGroup = model.activeGroup;
  const representative = activeGroup?.representativeGame ?? null;
  const closeDossier = useCallback(() => setSelectedArchiveGameId(null), []);

  function clearFilters() {
    setQuery("");
    setSelectedGenres(new Set());
    setSelectedPlatforms(new Set());
    setOpenYearKey(null);
    setSelectedArchiveGameId(null);
    setYearDirection(0);
  }

  function selectYear(key: ArchiveYearKey) {
    const currentIndex = model.yearGroups.findIndex((group) => group.key === activeGroup?.key);
    const nextIndex = model.yearGroups.findIndex((group) => group.key === key);
    setYearDirection(currentIndex === nextIndex ? 0 : nextIndex > currentIndex ? 1 : -1);
    setOpenYearKey(key);
    setSelectedArchiveGameId(null);
  }

  return (
    <section className={`${styles.root} archive-v2`} data-testid="archive-reading-room">
      <header className={styles.masthead}>
        <button className={styles.backButton} onClick={onBackToHub} type="button">
          返回游戏星图
        </button>
        <div className={styles.brand}>
          <p>Game Chronicle</p>
          <h1>游戏编年馆</h1>
        </div>
        <dl className={styles.collectionSummary} aria-label="馆藏概览">
          <div>
            <dt>馆藏</dt>
            <dd>{model.filteredGames.length}</dd>
          </div>
          <div>
            <dt>年代</dt>
            <dd>
              {model.yearRange.min ?? "—"}–{model.yearRange.max ?? "—"}
            </dd>
          </div>
        </dl>
      </header>

      <section className={styles.tools} aria-label="馆藏检索工具" data-archive-region="tools">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>搜索游戏、开发者或发行商</span>
          <input
            autoComplete="off"
            name="archive-search"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpenYearKey(null);
              setSelectedArchiveGameId(null);
              setYearDirection(0);
            }}
            placeholder="搜索游戏、开发者或发行商"
            type="search"
            value={query}
          />
        </label>
        <label className={styles.sortField}>
          <span>排序</span>
          <select
            name="archive-sort"
            onChange={(event) => setSortMode(event.target.value as ArchiveSortMode)}
            value={sortMode}
          >
            <option value="year-desc">标题索引</option>
            <option value="rating-desc">馆藏评分优先</option>
          </select>
        </label>
        <button
          aria-controls="archive-filter-panel"
          aria-expanded={isFilterOpen}
          className={styles.filterButton}
          onClick={() => setIsFilterOpen((value) => !value)}
          type="button"
        >
          类型与平台
          {selectedGenres.size + selectedPlatforms.size > 0 ? (
            <span>{selectedGenres.size + selectedPlatforms.size}</span>
          ) : null}
        </button>
        {hasActiveFilters ? (
          <button className={styles.clearButton} onClick={clearFilters} type="button">
            清除筛选
          </button>
        ) : null}
        <p className={styles.resultAnnouncement} aria-live="polite" role="status">
          {model.filteredGames.length} 条结果，{model.yearGroups.length} 个年份
        </p>
      </section>

      {isFilterOpen ? (
        <section className={styles.filterPanel} id="archive-filter-panel">
          <TagFilter
            labels={model.genreOptions}
            onToggle={(genre) => {
              setSelectedGenres((current) => toggleSetValue(current, genre));
              setOpenYearKey(null);
              setSelectedArchiveGameId(null);
              setYearDirection(0);
            }}
            selectedLabels={selectedGenres}
            title="类型"
            transformLabel={getGenreLabel}
          />
          <TagFilter
            labels={model.platformOptions}
            onToggle={(platform) => {
              setSelectedPlatforms((current) => toggleSetValue(current, platform));
              setOpenYearKey(null);
              setSelectedArchiveGameId(null);
              setYearDirection(0);
            }}
            selectedLabels={selectedPlatforms}
            title="平台"
          />
        </section>
      ) : null}

      {activeGroup ? (
        <div className={styles.workspace} data-archive-region="workspace">
          <ArchiveTimeline
            activeYearKey={activeGroup.key}
            groups={model.yearGroups}
            onPreviewYear={(key) => {
              const group = model.yearGroups.find((candidate) => candidate.key === key);
              if (group) prefetchArchiveCovers(group.featureGames);
            }}
            onSelectYear={selectYear}
          />

          <motion.article
            aria-labelledby={`archive-year-heading-${activeGroup.key}`}
            className={styles.feature}
            id={`archive-year-panel-${activeGroup.key}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.986, x: yearDirection * 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            key={activeGroup.key}
          >
            <div
              className={styles.featureVisual}
              data-image-state={heroImageFailed ? "error" : "ready"}
              data-testid="archive-hero-visual"
              data-cover-signature={activeGroup.coverSignature}
              data-year-variant={activeGroup.yearVariant}
            >
              {!heroImageFailed ? (
                <Image
                  alt="复古游戏文化档案阅览桌"
                  className={styles.heroImage}
                  height={1600}
                  onError={() => setHeroImageFailed(true)}
                  preload
                  quality={72}
                  sizes="(max-width: 760px) 100vw, 42vw"
                  src="/images/archive/chronicle-reading-room.webp"
                  width={2400}
                />
              ) : null}
              <div className={styles.annualCollage} aria-label={`${activeGroup.label} 年度代表封面`}>
                {activeGroup.featureGames.map((game, index) => (
                  <button
                    aria-label={`打开 ${safeTitle(game)} 详情`}
                    className={styles.featureCoverButton}
                    data-cover-position={index + 1}
                    key={game.id}
                    onClick={() => setSelectedArchiveGameId(game.id)}
                    type="button"
                  >
                    <ArchiveCover
                      alt={`${safeTitle(game)} 封面`}
                      game={game}
                      loading="eager"
                      priority={index === 0}
                      sizes="(max-width: 760px) 34vw, 15vw"
                    />
                  </button>
                ))}
              </div>
              <div className={styles.featureFolio}>
                <span>年度档案</span>
                <strong id={`archive-year-heading-${activeGroup.key}`}>
                  {activeGroup.label}
                </strong>
                <small>{activeGroup.games.length} 份馆藏</small>
              </div>
            </div>

            {representative ? (
              <button
                aria-label={`打开 ${safeTitle(representative)} 详情`}
                className={styles.representative}
                onClick={() => setSelectedArchiveGameId(representative.id)}
                type="button"
              >
                <ArchiveCover
                  alt={`${safeTitle(representative)} 封面`}
                  className={styles.representativeCover}
                  game={representative}
                  loading="eager"
                  priority
                  sizes="(max-width: 760px) 34vw, 12vw"
                />
                <span className={styles.representativeCopy}>
                  <small>年度代表作品</small>
                  <strong>{safeTitle(representative)}</strong>
                  <span>
                    评分 {formatRating(representative.rating)} · {representative.developer || "开发者未知"}
                  </span>
                  <em>打开详情</em>
                </span>
              </button>
            ) : (
              <p className={styles.missingState}>该年度暂无可展示游戏。</p>
            )}
          </motion.article>

          <ArchiveCollection
            direction={yearDirection}
            group={activeGroup}
            key={`${activeGroup.key}:${query}:${sortMode}:${[...selectedGenres].join(",")}:${[...selectedPlatforms].join(",")}`}
            onSelectGame={setSelectedArchiveGameId}
            reduceMotion={Boolean(reduceMotion)}
            selectedGameId={selectedArchiveGameId}
          />
        </div>
      ) : (
        <section className={styles.emptyState} role="status">
          <p>没有符合当前条件的馆藏。</p>
          <button onClick={clearFilters} type="button">清除筛选</button>
        </section>
      )}

      {activeGroup && model.selectedGame ? (
        <ArchiveYearModal
          group={activeGroup}
          onClose={closeDossier}
          onSelectGame={setSelectedArchiveGameId}
          selectedGame={model.selectedGame}
        />
      ) : null}
    </section>
  );
}

const ARCHIVE_BATCH_SIZE = 8;

function ArchiveCollection({
  direction,
  group,
  onSelectGame,
  reduceMotion,
  selectedGameId
}: {
  direction: number;
  group: ArchiveYearGroup;
  onSelectGame: (gameId: string) => void;
  reduceMotion: boolean;
  selectedGameId: string | null;
}) {
  const [visibleCount, setVisibleCount] = useState(ARCHIVE_BATCH_SIZE);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLButtonElement | null>(null);
  const visibleGames = group.games.slice(0, visibleCount);
  const hasMore = visibleCount < group.games.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root || !hasMore || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + ARCHIVE_BATCH_SIZE, group.games.length));
        }
      },
      {
        root: window.matchMedia("(max-width: 760px)").matches ? null : root,
        rootMargin: "0px"
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [group.games.length, hasMore]);

  return (
    <motion.section
      animate={{ opacity: 1, x: 0 }}
      aria-labelledby="archive-collection-heading"
      className={styles.collection}
      data-archive-region="collection"
      initial={reduceMotion ? false : { opacity: 0, x: direction * 14 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.collectionHeading}>
        <div>
          <p>Annual Collection</p>
          <h2 id="archive-collection-heading">年度馆藏</h2>
        </div>
        <span>平均评分 {formatRating(group.averageRating)}</span>
      </div>
      <div className={styles.gameList} ref={listRef}>
        {visibleGames.map((game, index) => (
          <ArchiveGameCard
            game={game}
            index={index}
            isSelected={game.id === selectedGameId}
            key={game.id}
            onSelect={() => onSelectGame(game.id)}
            priority={index < 8}
            reduceMotion={reduceMotion}
          />
        ))}
        {hasMore ? (
          <button
            className={styles.loadMore}
            onClick={() =>
              setVisibleCount((count) => Math.min(count + ARCHIVE_BATCH_SIZE, group.games.length))
            }
            ref={sentinelRef}
            type="button"
          >
            继续载入馆藏 · {group.games.length - visibleCount}
          </button>
        ) : (
          <p className={styles.collectionEnd}>已显示本年度全部 {group.games.length} 份馆藏</p>
        )}
      </div>
    </motion.section>
  );
}

function ArchiveGameCard({
  game,
  index,
  isSelected,
  onSelect,
  priority,
  reduceMotion
}: {
  game: Game;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  priority: boolean;
  reduceMotion: boolean;
}) {
  const title = safeTitle(game);
  const secondaryTitle = game.titleZh?.trim() ? getGameSecondaryTitle(game) : null;
  const genres = splitArchiveTags(game.genres).slice(0, 2).map(getGenreLabel).join(" / ") || "类型未知";

  return (
    <motion.button
      aria-label={`打开 ${title} 详情`}
      aria-pressed={isSelected}
      className={`${styles.gameCard} ${isSelected ? styles.gameCardSelected : ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      transition={{
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.14),
        duration: reduceMotion ? 0 : 0.22,
        ease: [0.22, 1, 0.36, 1]
      }}
      type="button"
    >
      <ArchiveCover
        alt={`${title} 封面`}
        className={styles.gameCover}
        game={game}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        sizes="(max-width: 760px) 64px, (max-width: 1100px) 48px, 56px"
      />
      <span className={styles.gameCopy}>
        <strong>{title}</strong>
        {secondaryTitle ? <small>{secondaryTitle}</small> : null}
        <span>{genres}</span>
      </span>
      <span className={styles.gameRating}>{formatRating(game.rating)}</span>
    </motion.button>
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
    <fieldset className={styles.tagFieldset}>
      <legend>{title}</legend>
      <div className={styles.tagList}>
        {labels.length === 0 ? <p>暂无可用选项。</p> : null}
        {labels.map((label) => (
          <button
            aria-pressed={selectedLabels.has(label)}
            className={selectedLabels.has(label) ? styles.tagSelected : ""}
            key={label}
            onClick={() => onToggle(label)}
            type="button"
          >
            {transformLabel(label)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
