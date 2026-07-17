"use client";

import type { ReactNode } from "react";
import { ArchiveCover } from "@/components/archive/ArchiveCover";
import { splitArchiveTags, type ArchiveYearGroup } from "@/lib/archiveModel";
import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";
import styles from "./GameArchiveView.module.css";

type ArchiveDossierProps = {
  group: ArchiveYearGroup;
  selectedGame: Game;
};

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : "—";
}

function safeText(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function ArchiveDossier({ group, selectedGame }: ArchiveDossierProps) {
  const title = safeText(
    getGameDisplayTitle(selectedGame),
    safeText(selectedGame.title, "未命名游戏")
  );
  const secondaryTitle = selectedGame.titleZh?.trim()
    ? getGameSecondaryTitle(selectedGame)
    : null;
  const genres = splitArchiveTags(selectedGame.genres).map(getGenreLabel).join(" / ");
  const platforms = splitArchiveTags(selectedGame.platforms).join(" / ");
  const country =
    selectedGame.countryCode === "UNKNOWN"
      ? "地区待归档"
      : safeText(selectedGame.countryName, safeText(selectedGame.countryCode, "地区未知"));

  return (
    <div className={styles.dossier} data-game-id={selectedGame.id}>
      <div className={styles.dossierCoverWrap}>
        <ArchiveCover
          alt={`${title} 封面`}
          className={styles.dossierCover}
          game={selectedGame}
          loading="eager"
          priority
          sizes="(max-width: 760px) 44vw, 15vw"
        />
        <span>{group.label}</span>
      </div>

      <div className={styles.dossierTitle}>
        <p>GE–CHR–{group.label}–{selectedGame.id}</p>
        <h3>{title}</h3>
        {secondaryTitle ? <span>{secondaryTitle}</span> : null}
      </div>

      <dl className={styles.dossierFacts}>
        <div><dt>发行年份</dt><dd>{selectedGame.releaseYear || "年份未知"}</dd></div>
        <div><dt>评分</dt><dd>{formatRating(selectedGame.rating)}</dd></div>
        <div><dt>地区</dt><dd>{country}</dd></div>
        <div><dt>年度馆藏</dt><dd>{group.games.length}</dd></div>
      </dl>

      <DossierSection title="制作与发行">
        {safeText(selectedGame.developer, "开发者未知")} / {safeText(selectedGame.publisher, "发行商未知")}
      </DossierSection>
      <DossierSection title="类型">{genres || "类型未知"}</DossierSection>
      <DossierSection title="平台">{platforms || "平台未知"}</DossierSection>
      <DossierSection title="档案简介" isLong>
        {safeText(selectedGame.description, "暂无简介")}
      </DossierSection>
    </div>
  );
}

function DossierSection({
  children,
  isLong = false,
  title
}: {
  children: ReactNode;
  isLong?: boolean;
  title: string;
}) {
  return (
    <section className={`${styles.dossierSection} ${isLong ? styles.dossierLong : ""}`}>
      <h4>{title}</h4>
      <p>{children}</p>
    </section>
  );
}
