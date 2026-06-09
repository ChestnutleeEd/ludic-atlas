"use client";

/* eslint-disable @next/next/no-img-element */

import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import type { ArchiveYearGroup } from "./ArchiveTimeline";

type ArchiveDossierProps = {
  group: ArchiveYearGroup;
  selectedGame: Game | null;
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

function getTopValues(values: string[], limit = 4) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

export function ArchiveDossier({
  group,
  selectedGame
}: ArchiveDossierProps) {
  if (!selectedGame) {
    const averageRating =
      group.games.length > 0
        ? group.games.reduce((sum, game) => sum + game.rating, 0) /
          group.games.length
        : 0;
    const topGenres = getTopValues(
      group.games.flatMap((game) => splitArchiveTags(game.genres))
    );
    const topPlatforms = getTopValues(
      group.games.flatMap((game) => splitArchiveTags(game.platforms))
    );

    return (
      <aside className="chronicle-modal-dossier chronicle-dossier archive-paper-dossier archive-dossier archive-dossier-empty">
        <div className="archive-dossier-tab" aria-hidden="true" />
        <p className="archive-brass-label archive-kicker">Year Overview</p>
        <h3>{group.year ?? "Unknown Year"} 年概览</h3>
        <p>
          选择一张馆藏卡片查看详情。
        </p>
        <dl className="archive-dossier-grid">
          <div>
            <dt>Records</dt>
            <dd>{group.games.length}</dd>
          </div>
          <div>
            <dt>Average Rating</dt>
            <dd>{formatRating(averageRating)}</dd>
          </div>
        </dl>
        <div className="archive-dossier-section">
          <p>Top Genres</p>
          <div>
            {topGenres.length > 0 ? topGenres.map(getGenreLabel).join(" / ") : "类型未知"}
          </div>
        </div>
        <div className="archive-dossier-section">
          <p>Top Platforms</p>
          <div>{topPlatforms.length > 0 ? topPlatforms.join(" / ") : "平台未知"}</div>
        </div>
      </aside>
    );
  }

  const title = getGameDisplayTitle(selectedGame);
  const secondaryTitle = getGameSecondaryTitle(selectedGame);
  const genres = splitArchiveTags(selectedGame.genres);
  const platforms = splitArchiveTags(selectedGame.platforms);

  return (
    <aside className="chronicle-modal-dossier chronicle-dossier archive-paper-dossier archive-dossier">
      <div className="archive-dossier-tab" aria-hidden="true" />
      <p className="archive-brass-label archive-kicker">Dossier / 馆藏资料卡</p>
      <div className="archive-dossier-cover">
        {selectedGame.coverImage ? (
          <img
            alt={`${title} 封面`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={selectedGame.coverImage}
          />
        ) : null}
      </div>
      <h3>{title}</h3>
      {secondaryTitle ? <p className="archive-dossier-subtitle">{secondaryTitle}</p> : null}
      <dl className="archive-dossier-grid">
        <div>
          <dt>Archive ID</dt>
          <dd>{selectedGame.id}</dd>
        </div>
        <div>
          <dt>Release Year</dt>
          <dd>{selectedGame.releaseYear || "Unknown Year"}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{formatRating(selectedGame.rating)}</dd>
        </div>
      </dl>
      <div className="archive-dossier-section">
        <p>Genre Tags</p>
        <div>{genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知"}</div>
      </div>
      <div className="archive-dossier-section">
        <p>Platform Index</p>
        <div>{platforms.length > 0 ? platforms.join(" / ") : "平台未知"}</div>
      </div>
      <div className="archive-dossier-section">
        <p>Description</p>
        <div>{selectedGame.description || "暂无简介。"}</div>
      </div>
    </aside>
  );
}
