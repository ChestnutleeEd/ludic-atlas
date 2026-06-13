"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ArchiveDossier } from "@/components/archive/ArchiveDossier";
import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import type { ArchiveYearGroup } from "./ArchiveTimeline";

type ArchiveYearModalProps = {
  group: ArchiveYearGroup;
  selectedGameId: string | null;
  onClose: () => void;
  onSelectGame: (gameId: string | null) => void;
};

function splitArchiveTags(values: string[]) {
  return values
    .flatMap((value) => value.split(/\s*\/\s*/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
}

function getCoverFallbackLabel(title: string) {
  return title.trim().charAt(0).toUpperCase() || "No Cover";
}

export function ArchiveYearModal({
  group,
  selectedGameId,
  onClose,
  onSelectGame
}: ArchiveYearModalProps) {
  const featuredGame = useMemo(
    () => [...group.games].sort((a, b) => b.rating - a.rating)[0] ?? null,
    [group.games]
  );
  const selectedGame = useMemo(
    () =>
      group.games.find((game) => game.id === selectedGameId) ??
      featuredGame,
    [featuredGame, group.games, selectedGameId]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const modal = (
    <motion.div
      className="chronicle-year-modal"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <motion.section
        aria-label={`${group.year ?? "Unknown Year"} 年份展柜`}
        aria-modal="true"
        className="chronicle-year-modal-panel chronicle-year-drawer-panel"
        exit={{ opacity: 0, x: 80, rotateY: -4 }}
        initial={{ opacity: 0, x: 110, rotateY: -6 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
      >
        <header className="chronicle-modal-header">
          <span className="brass-drawer-handle" aria-hidden="true" />
          <div>
            <p className="archive-brass-label archive-kicker">年份档案抽屉</p>
            <h3>
              {group.year ?? "Unknown Year"} 年馆藏
            </h3>
          </div>
          <div className="chronicle-modal-count">
            <span>{group.games.length}</span>
            <strong>records</strong>
          </div>
          <button
            aria-label="关闭年份展柜"
            className="chronicle-modal-close"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </header>

        <div className="chronicle-modal-body">
          <section className="chronicle-year-exhibit-hero">
            <div>
              <p className="archive-brass-label archive-kicker">年度展陈</p>
              <h4>{group.year ?? "Unknown Year"} · 时光展柜</h4>
              <p>
                默认聚焦该年份评分最高的馆藏作品。选择封面卡片可切换右侧游戏档案。
              </p>
            </div>
            <div className="chronicle-year-exhibit-stat">
              <span>{group.games.length}</span>
              <strong>馆藏作品</strong>
            </div>
          </section>
          <div className="chronicle-exhibition-grid">
            {group.games.map((game, index) => (
              <ArchiveExhibitionCard
                game={game}
                isSelected={game.id === selectedGame?.id}
                key={game.id}
                onSelectGame={onSelectGame}
                index={index}
              />
            ))}
          </div>

          <ArchiveDossier group={group} selectedGame={selectedGame} />
        </div>
      </motion.section>
    </motion.div>
  );

  return createPortal(modal, document.body);
}

function ArchiveExhibitionCard({
  game,
  isSelected,
  index,
  onSelectGame
}: {
  game: Game;
  isSelected: boolean;
  index: number;
  onSelectGame: (gameId: string | null) => void;
}) {
  const title = getGameDisplayTitle(game);
  const secondaryTitle = getGameSecondaryTitle(game);
  const genres = splitArchiveTags(game.genres).slice(0, 2);
  const platforms = splitArchiveTags(game.platforms).slice(0, 2);
  const genreLabel =
    genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知";
  const platformLabel = platforms.length > 0 ? platforms.join(" / ") : "平台未知";

  return (
    <motion.button
      className={`chronicle-display-card ${isSelected ? "is-selected" : ""}`}
      aria-label={`查看 ${title} 档案`}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.28), duration: 0.32 }}
      onClick={() => onSelectGame(game.id)}
      title={title}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      type="button"
    >
      {isSelected ? <span className="archive-selected-chip">展陈中</span> : null}
      <span className="archive-cover-frame chronicle-card-cover">
        <span className="archive-cover-fallback">
          {getCoverFallbackLabel(title)}
        </span>
        {game.coverImage ? (
          <img
            alt={`${title} 封面`}
            height={500}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={game.coverImage}
            width={400}
          />
        ) : null}
      </span>
      <span className="chronicle-card-label">
        <strong title={title}>{title}</strong>
        {secondaryTitle ? <em title={secondaryTitle}>{secondaryTitle}</em> : null}
        <span className="chronicle-card-meta">
          <span>{game.releaseYear || "年份未知"}</span>
          <span>评分 {formatRating(game.rating)}</span>
        </span>
        <span className="chronicle-card-tags chronicle-card-genre" title={genreLabel}>
          <small>类型</small>
          <span>{genreLabel}</span>
        </span>
        <span
          className="chronicle-card-tags chronicle-card-platform"
          title={platformLabel}
        >
          <small>平台</small>
          <span>{platformLabel}</span>
        </span>
      </span>
    </motion.button>
  );
}
