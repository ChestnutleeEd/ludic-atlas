"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo } from "react";
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

export function ArchiveYearModal({
  group,
  selectedGameId,
  onClose,
  onSelectGame
}: ArchiveYearModalProps) {
  const selectedGame = useMemo(
    () => group.games.find((game) => game.id === selectedGameId) ?? null,
    [group.games, selectedGameId]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="chronicle-year-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-label={`${group.year ?? "Unknown Year"} 年份展柜`}
        className="chronicle-year-modal-panel"
        role="dialog"
      >
        <header className="chronicle-modal-header">
          <span className="brass-drawer-handle" aria-hidden="true" />
          <div>
            <p className="archive-brass-label archive-kicker">Year Exhibition</p>
            <h3>
              Year Exhibition · {group.year ?? "Unknown Year"} /{" "}
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
            Close
          </button>
        </header>

        <div className="chronicle-modal-body">
          <div className="chronicle-exhibition-grid">
            {group.games.map((game) => (
              <ArchiveExhibitionCard
                game={game}
                isSelected={game.id === selectedGame?.id}
                key={game.id}
                onSelectGame={onSelectGame}
              />
            ))}
          </div>

          <ArchiveDossier group={group} selectedGame={selectedGame} />
        </div>
      </section>
    </div>
  );
}

function ArchiveExhibitionCard({
  game,
  isSelected,
  onSelectGame
}: {
  game: Game;
  isSelected: boolean;
  onSelectGame: (gameId: string | null) => void;
}) {
  const title = getGameDisplayTitle(game);
  const secondaryTitle = getGameSecondaryTitle(game);
  const genres = splitArchiveTags(game.genres).slice(0, 2);
  const platforms = splitArchiveTags(game.platforms).slice(0, 2);

  return (
    <button
      className={`chronicle-display-card ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelectGame(game.id)}
      type="button"
    >
      {isSelected ? <span className="archive-selected-chip">On Display</span> : null}
      <span className="archive-cover-frame chronicle-card-cover">
        <span className="archive-cover-fallback">{title}</span>
        {game.coverImage ? (
          <img
            alt={`${title} 封面`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={game.coverImage}
          />
        ) : null}
      </span>
      <span className="chronicle-card-label">
        <strong>{title}</strong>
        {secondaryTitle ? <em>{secondaryTitle}</em> : null}
        <span className="chronicle-card-meta">
          <span>{game.releaseYear || "年份未知"}</span>
          <span>评分 {formatRating(game.rating)}</span>
        </span>
        <span className="chronicle-card-tags">
          {genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知"}
        </span>
        <span className="chronicle-card-tags">
          {platforms.length > 0 ? platforms.join(" / ") : "平台未知"}
        </span>
      </span>
    </button>
  );
}
