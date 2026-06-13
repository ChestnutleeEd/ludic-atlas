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

function getCoverFallbackLabel(title: string) {
  return title.trim().charAt(0).toUpperCase() || "No Cover";
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

  if (!selectedGame) {
    return (
      <aside className="chronicle-modal-dossier chronicle-dossier archive-paper-dossier archive-dossier archive-dossier-empty">
        <DossierYearSummary
          averageRating={averageRating}
          group={group}
          topGenres={topGenres}
          topPlatforms={topPlatforms}
        />
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
      <DossierYearSummary
        averageRating={averageRating}
        group={group}
        topGenres={topGenres}
        topPlatforms={topPlatforms}
      />
      <p className="archive-brass-label archive-kicker">游戏档案卡</p>
      <div className="archive-dossier-cover">
        <span className="archive-cover-fallback">
          {getCoverFallbackLabel(title)}
        </span>
        {selectedGame.coverImage ? (
          <img
            alt={`${title} 封面`}
            height={560}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src={selectedGame.coverImage}
            width={420}
          />
        ) : null}
      </div>
      <h3>{title}</h3>
      {secondaryTitle ? <p className="archive-dossier-subtitle">{secondaryTitle}</p> : null}
      <dl className="archive-dossier-grid">
        <div>
          <dt>馆藏编号</dt>
          <dd>{selectedGame.id}</dd>
        </div>
        <div>
          <dt>发行年份</dt>
          <dd>{selectedGame.releaseYear || "Unknown Year"}</dd>
        </div>
        <div>
          <dt>评分</dt>
          <dd>{formatRating(selectedGame.rating)}</dd>
        </div>
        <div>
          <dt>地区</dt>
          <dd>{selectedGame.countryName || selectedGame.countryCode}</dd>
        </div>
      </dl>
      <div className="archive-dossier-section">
        <p>制作与发行</p>
        <div>
          {selectedGame.developer || "Unknown"} /{" "}
          {selectedGame.publisher || "Unknown"}
        </div>
      </div>
      <div className="archive-dossier-section">
        <p>馆藏标签</p>
        <div>{genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知"}</div>
      </div>
      <div className="archive-dossier-section">
        <p>平台索引</p>
        <div>{platforms.length > 0 ? platforms.join(" / ") : "平台未知"}</div>
      </div>
      <div className="archive-dossier-section">
        <p>档案简介</p>
        {selectedGame.description ? (
          <div>{selectedGame.description}</div>
        ) : (
          <div className="archive-description-empty">
            <span aria-hidden="true" />
            <strong>暂无简介</strong>
            <em>该位置保留为后续策展注记，不使用虚构内容填充。</em>
          </div>
        )}
      </div>
    </aside>
  );
}

function DossierYearSummary({
  averageRating,
  group,
  topGenres,
  topPlatforms
}: {
  averageRating: number;
  group: ArchiveYearGroup;
  topGenres: string[];
  topPlatforms: string[];
}) {
  return (
    <section className="archive-dossier-year-summary">
      <p className="archive-brass-label archive-kicker">年度概览</p>
      <h3>{group.year ?? "Unknown Year"} 年</h3>
      <dl className="archive-dossier-grid">
        <div>
          <dt>馆藏记录</dt>
          <dd>{group.games.length}</dd>
        </div>
        <div>
          <dt>平均评分</dt>
          <dd>{formatRating(averageRating)}</dd>
        </div>
      </dl>
      <div className="archive-dossier-section">
        <p>主要类型</p>
        <div>
          {topGenres.length > 0 ? topGenres.map(getGenreLabel).join(" / ") : "类型未知"}
        </div>
      </div>
      <div className="archive-dossier-section">
        <p>主要平台</p>
        <div>{topPlatforms.length > 0 ? topPlatforms.join(" / ") : "平台未知"}</div>
      </div>
    </section>
  );
}
