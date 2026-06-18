"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { ArchiveDossier } from "@/components/archive/ArchiveDossier";
import { FALLBACK_GAME_COVER_IMAGE, getGameCoverImage } from "@/lib/gameCover";
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

function handleCoverError(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(FALLBACK_GAME_COVER_IMAGE)) {
    event.currentTarget.src = FALLBACK_GAME_COVER_IMAGE;
  }
}

function getDossierCode(year: number | null) {
  return `GE-CHR-${year ?? "UNKN"}-DOSSIER`;
}

export function ArchiveYearModal({
  group,
  selectedGameId,
  onClose,
  onSelectGame
}: ArchiveYearModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const featuredGame = useMemo(
    () => [...group.games].sort((a, b) => b.rating - a.rating)[0] ?? null,
    [group.games]
  );
  const selectedGame = useMemo(
    () => group.games.find((game) => game.id === selectedGameId) ?? featuredGame,
    [featuredGame, group.games, selectedGameId]
  );
  const averageRating = useMemo(() => {
    if (group.games.length === 0) {
      return "0.0";
    }

    return (
      group.games.reduce(
        (sum, game) => sum + (Number.isFinite(game.rating) ? game.rating : 0),
        0
      ) / group.games.length
    ).toFixed(1);
  }, [group.games]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      activeElement?.focus();
    };
  }, [onClose]);

  const modal = (
    <motion.div
      animate={{ opacity: 1 }}
      className="archive-v2-modal"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-label={`${group.year ?? "Unknown Year"} 年度展柜`}
        aria-modal="true"
        className="archive-v2-modal-panel"
        exit={{ opacity: 0, y: 28, scale: 0.985 }}
        initial={{ opacity: 0, y: 42, scale: 0.985 }}
        role="dialog"
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="archive-v2-modal-header">
          <div className="min-w-0">
            <p className="archive-v2-kicker">{getDossierCode(group.year)}</p>
            <h3>{group.year ?? "Unknown Year"} 年度展柜</h3>
          </div>
          <dl className="archive-v2-modal-stats">
            <div>
              <dt>馆藏</dt>
              <dd>{group.games.length}</dd>
            </div>
            <div>
              <dt>均分</dt>
              <dd>{averageRating}</dd>
            </div>
          </dl>
          <button
            aria-label="关闭年度展柜"
            className="archive-v2-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            关闭
          </button>
        </header>

        <div className="archive-v2-modal-body">
          <section className="archive-v2-year-overview">
            <div className="min-w-0">
              <p className="archive-v2-kicker">Year Dossier / 年度概览</p>
              <h4>{group.year ?? "Unknown Year"} 馆藏目录</h4>
              <p>选择游戏卡片查看右侧卷宗。长标题、类型和平台会自动换行或截断。</p>
            </div>
            {selectedGame ? (
              <div className="archive-v2-current-focus">
                <span>当前查看 / CURRENT DOSSIER</span>
                <strong title={getGameDisplayTitle(selectedGame)}>
                  {getGameDisplayTitle(selectedGame)}
                </strong>
                <small>已选中的游戏档案</small>
              </div>
            ) : null}
          </section>

          <div className="archive-v2-exhibit-layout">
            <section className="archive-v2-card-grid" aria-label="年度游戏列表">
              {group.games.map((game, index) => (
                <ArchiveExhibitionCard
                  game={game}
                  index={index}
                  isSelected={game.id === selectedGame?.id}
                  key={game.id}
                  onSelectGame={onSelectGame}
                />
              ))}
            </section>

            <ArchiveDossier group={group} selectedGame={selectedGame} />
          </div>
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
  const genres = splitArchiveTags(game.genres).slice(0, 3);
  const platforms = splitArchiveTags(game.platforms).slice(0, 3);
  const genreLabel =
    genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知";
  const platformLabel = platforms.length > 0 ? platforms.join(" / ") : "平台未知";

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      aria-label={`查看 ${title} 档案`}
      aria-pressed={isSelected}
      className={`archive-v2-game-card ${isSelected ? "is-selected" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      onClick={() => onSelectGame(game.id)}
      title={title}
      transition={{ delay: Math.min(index * 0.018, 0.2), duration: 0.28 }}
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      {isSelected ? <span className="archive-v2-selected-chip">展陈中</span> : null}
      <span className="archive-v2-card-cover">
        <img
          alt={`${title} 封面`}
          loading="lazy"
          onError={handleCoverError}
          src={getGameCoverImage(game)}
        />
      </span>
      <span className="archive-v2-card-copy">
        <strong title={title}>{title}</strong>
        {secondaryTitle ? <em title={secondaryTitle}>{secondaryTitle}</em> : null}
        <span className="archive-v2-card-meta">
          <span>{game.releaseYear || "年份未知"}</span>
          <span>评分 {formatRating(game.rating)}</span>
        </span>
        <span className="archive-v2-card-row" title={genreLabel}>
          <small>类型</small>
          <span>{genreLabel}</span>
        </span>
        <span className="archive-v2-card-row" title={platformLabel}>
          <small>平台</small>
          <span>{platformLabel}</span>
        </span>
      </span>
    </motion.button>
  );
}
