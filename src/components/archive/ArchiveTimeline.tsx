"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "motion/react";
import type { SyntheticEvent } from "react";
import { FALLBACK_GAME_COVER_IMAGE, getGameCoverImage } from "@/lib/gameCover";
import { getGameDisplayTitle, getGenreLabel } from "@/lib/localization";
import type { Game } from "@/types/game";

export type ArchiveYearGroup = {
  games: Game[];
  label: string;
  previewGames: Game[];
  year: number | null;
};

type ArchiveTimelineProps = {
  activeYear: number | null;
  groups: ArchiveYearGroup[];
  onSelectYear: (year: number | null) => void;
};

function splitArchiveTags(values: string[]) {
  return values
    .flatMap((value) => value.split(/\s*\/\s*/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getTopGenreLabel(games: Game[]) {
  const counts = new Map<string, number>();

  for (const game of games) {
    for (const genre of splitArchiveTags(game.genres)) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  const [topGenre] =
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ??
    [];

  return topGenre ? getGenreLabel(topGenre) : "类型待归档";
}

function getAverageRating(games: Game[]) {
  if (games.length === 0) {
    return "0.0";
  }

  return (
    games.reduce((sum, game) => sum + (Number.isFinite(game.rating) ? game.rating : 0), 0) /
    games.length
  ).toFixed(1);
}

function getFeaturedGame(games: Game[]) {
  return [...games].sort(
    (a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear
  )[0];
}

function getArchiveNumber(year: number | null, index: number) {
  return `GE-${year ?? "UNKN"}-${String(index + 1).padStart(3, "0")}`;
}

function handleCoverError(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(FALLBACK_GAME_COVER_IMAGE)) {
    event.currentTarget.src = FALLBACK_GAME_COVER_IMAGE;
  }
}

export function ArchiveTimeline({
  activeYear,
  groups,
  onSelectYear
}: ArchiveTimelineProps) {
  if (groups.length === 0) {
    return (
      <div className="archive-v2-timeline-empty">
        没有符合当前筛选条件的年份。
      </div>
    );
  }

  return (
    <section className="archive-v2-timeline" aria-label="Game Chronicle timeline">
      <div className="archive-v2-film-rail" aria-hidden="true" />
      <div className="archive-v2-year-track">
        {groups.map((group, index) => {
          const isActive = group.year === activeYear;
          const topGenre = getTopGenreLabel(group.games);
          const averageRating = getAverageRating(group.games);
          const featuredGame = getFeaturedGame(group.games);
          const featuredTitle = featuredGame
            ? getGameDisplayTitle(featuredGame)
            : topGenre;

          return (
            <motion.button
              className={`archive-v2-year-card ${isActive ? "is-active" : ""}`}
              key={group.label}
              layout
              onClick={() => onSelectYear(group.year)}
              type="button"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="archive-v2-year-topline">
                <span>{getArchiveNumber(group.year, index)}</span>
                <span>{group.games.length} 份馆藏</span>
              </span>
              <span className="archive-v2-year-title">
                {group.year ?? "Unknown"}
              </span>
              <span className="archive-v2-year-summary">
                <small>代表作品</small>
                <strong title={featuredTitle}>{featuredTitle}</strong>
                <span>{topGenre}</span>
              </span>
              <span className="archive-v2-year-meta">
                <span>
                  <small>平均评分</small>
                  <strong>{averageRating}</strong>
                </span>
                <span>
                  <small>代表作品</small>
                  <strong title={featuredTitle}>{featuredTitle}</strong>
                </span>
              </span>
              <span className="archive-v2-cover-strip" aria-hidden="true">
                {group.previewGames.slice(0, 5).map((game) => (
                  <span className="archive-v2-mini-cover" key={game.id}>
                    <img
                      alt=""
                      loading="lazy"
                      onError={handleCoverError}
                      src={getGameCoverImage(game)}
                    />
                  </span>
                ))}
              </span>
              <span className="archive-v2-open-label">打开年度展柜</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
