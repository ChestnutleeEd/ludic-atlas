"use client";

/* eslint-disable @next/next/no-img-element */

import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import type { ArchiveYearGroup } from "./ArchiveTimeline";

type ArchiveYearDrawerProps = {
  group: ArchiveYearGroup | null;
  selectedGameId: string | null;
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

export function ArchiveYearDrawer({
  group,
  selectedGameId,
  onSelectGame
}: ArchiveYearDrawerProps) {
  if (!group) {
    return (
      <section className="chronicle-drawer chronicle-drawer-empty">
        没有符合当前筛选条件的游戏。
      </section>
    );
  }

  return (
    <section className="chronicle-drawer">
      <div className="chronicle-drawer-face">
        <span className="wood-drawer-handle" aria-hidden="true" />
        <div className="brass-plaque">
          <span>ARCHIVE DOSSIER</span>
          <strong>{group.year ?? "Unknown Year"} / 年度馆藏</strong>
        </div>
        <span className="chronicle-drawer-count">{group.games.length} 款游戏</span>
      </div>

      <div className="chronicle-display-shelf">
        {group.games.map((game) => (
          <ArchiveDisplayCard
            game={game}
            isSelected={game.id === selectedGameId}
            key={game.id}
            onSelectGame={onSelectGame}
          />
        ))}
      </div>
    </section>
  );
}

function ArchiveDisplayCard({
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
