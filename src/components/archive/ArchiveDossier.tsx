"use client";

/* eslint-disable @next/next/no-img-element */

import { FALLBACK_GAME_COVER_IMAGE, getGameCoverImage } from "@/lib/gameCover";
import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import type { ReactNode, SyntheticEvent } from "react";
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

function getDossierCode(year: number | null, gameId?: string) {
  return `GE-CHR-${year ?? "UNKN"}-${gameId ?? "YEAR"}`;
}

function handleCoverError(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(FALLBACK_GAME_COVER_IMAGE)) {
    event.currentTarget.src = FALLBACK_GAME_COVER_IMAGE;
  }
}

export function ArchiveDossier({ group, selectedGame }: ArchiveDossierProps) {
  const averageRating =
    group.games.length > 0
      ? group.games.reduce(
          (sum, game) => sum + (Number.isFinite(game.rating) ? game.rating : 0),
          0
        ) / group.games.length
      : 0;
  const topGenres = getTopValues(
    group.games.flatMap((game) => splitArchiveTags(game.genres))
  );
  const topPlatforms = getTopValues(
    group.games.flatMap((game) => splitArchiveTags(game.platforms))
  );

  if (!selectedGame) {
    return (
      <aside className="archive-v2-dossier archive-v2-dossier-empty">
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
    <aside className="archive-v2-dossier">
      <DossierYearSummary
        averageRating={averageRating}
        group={group}
        topGenres={topGenres}
        topPlatforms={topPlatforms}
      />

      <div className="archive-v2-dossier-divider" aria-hidden="true" />

      <p className="archive-v2-kicker">{getDossierCode(group.year, selectedGame.id)}</p>
      <div className="archive-v2-dossier-cover">
        <img
          alt={`${title} 封面`}
          loading="lazy"
          onError={handleCoverError}
          src={getGameCoverImage(selectedGame)}
        />
      </div>

      <div className="archive-v2-dossier-title">
        <h3>{title}</h3>
        {secondaryTitle ? <p>{secondaryTitle}</p> : null}
      </div>

      <dl className="archive-v2-dossier-meta">
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
          <dd>{selectedGame.countryName || selectedGame.countryCode || "未知"}</dd>
        </div>
      </dl>

      <DossierSection title="制作与发行">
        {selectedGame.developer || "Unknown"} / {selectedGame.publisher || "Unknown"}
      </DossierSection>
      <DossierSection title="馆藏标签">
        {genres.length > 0 ? genres.map(getGenreLabel).join(" / ") : "类型未知"}
      </DossierSection>
      <DossierSection title="平台索引">
        {platforms.length > 0 ? platforms.join(" / ") : "平台未知"}
      </DossierSection>
      <DossierSection title="档案简介" isLongText>
        {selectedGame.description || "暂无简介"}
      </DossierSection>
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
    <section className="archive-v2-year-summary-panel">
      <p className="archive-v2-kicker">年度概览</p>
      <h3>{group.year ?? "Unknown Year"} 年</h3>
      <dl className="archive-v2-dossier-meta">
        <div>
          <dt>馆藏记录</dt>
          <dd>{group.games.length}</dd>
        </div>
        <div>
          <dt>平均评分</dt>
          <dd>{formatRating(averageRating)}</dd>
        </div>
      </dl>
      <DossierSection title="主要类型">
        {topGenres.length > 0 ? topGenres.map(getGenreLabel).join(" / ") : "类型未知"}
      </DossierSection>
      <DossierSection title="主要平台">
        {topPlatforms.length > 0 ? topPlatforms.join(" / ") : "平台未知"}
      </DossierSection>
    </section>
  );
}

function DossierSection({
  children,
  isLongText = false,
  title
}: {
  children: ReactNode;
  isLongText?: boolean;
  title: string;
}) {
  return (
    <section className={`archive-v2-dossier-section ${isLongText ? "is-long" : ""}`}>
      <p>{title}</p>
      <div>{children}</div>
    </section>
  );
}
