"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "motion/react";
import { getGenreLabel } from "@/lib/localization";
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

function getCoverFallbackLabel(game: Game) {
  const title = game.titleZh || game.title || "No Cover";

  return title.trim().charAt(0).toUpperCase() || "No Cover";
}

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

export function ArchiveTimeline({
  activeYear,
  groups,
  onSelectYear
}: ArchiveTimelineProps) {
  if (groups.length === 0) {
    return (
      <div className="chronicle-timeline chronicle-timeline-empty">
        没有符合当前筛选条件的年份。
      </div>
    );
  }

  return (
    <section
      className="chronicle-timeline chronicle-year-story"
      aria-label="Game Chronicle timeline"
    >
      <div className="chronicle-story-line" aria-hidden="true" />
      <div className="chronicle-year-track chronicle-story-track">
        {groups.map((group) => {
          const isActive = group.year === activeYear;
          const topGenre = getTopGenreLabel(group.games);
          const averageRating = getAverageRating(group.games);

          return (
            <motion.button
              data-year-node
              className={`chronicle-year-node chronicle-year-node-large ${
                isActive ? "is-active" : ""
              }`}
              key={group.label}
              layout
              onClick={() => onSelectYear(group.year)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.985 }}
              type="button"
            >
              <span className="chronicle-era-marker" aria-hidden="true" />
              <span className="chronicle-year-plaque">
                <span>年份档案柜</span>
                <strong>{group.year ?? "Unknown"}</strong>
              </span>
              <span className="chronicle-year-summary">
                <strong>{topGenre}</strong>
                <span>平均评分 {averageRating}</span>
              </span>
              <span className="chronicle-year-count">
                {group.games.length} 份馆藏记录
              </span>
              <span
                className="chronicle-year-covers drawer-preview-stack"
                style={{
                  gridTemplateColumns: `repeat(${group.previewGames.length}, minmax(0, 1fr))`
                }}
              >
                {group.previewGames.map((game) => (
                  <span className="chronicle-thumb" key={game.id}>
                    <span className="chronicle-thumb-fallback">
                      {getCoverFallbackLabel(game)}
                    </span>
                    {game.coverImage ? (
                      <img
                        alt={`${game.titleZh || game.title} 封面`}
                        height={120}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        src={game.coverImage}
                        width={80}
                      />
                    ) : null}
                  </span>
                ))}
              </span>
              <span className="chronicle-year-open-label">打开档案抽屉</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
