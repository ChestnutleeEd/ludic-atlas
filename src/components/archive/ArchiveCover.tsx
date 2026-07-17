"use client";

import Image from "next/image";
import { useState } from "react";
import type { Game } from "@/types/game";
import styles from "./GameArchiveView.module.css";

type ArchiveCoverProps = {
  alt: string;
  className?: string;
  game: Game;
  loading?: "eager" | "lazy";
  priority?: boolean;
  sizes: string;
};

const prefetchedSources = new Set<string>();

export function ArchiveCover({
  alt,
  className = "",
  game,
  loading = "lazy",
  priority = false,
  sizes
}: ArchiveCoverProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const source = getArchiveCoverSource(game);

  return (
    <span
      className={`${styles.archiveCover} ${className}`}
      data-archive-cover-id={game.id}
      data-image-state={state}
      data-priority={priority ? "true" : "false"}
    >
      {state === "loading" ? (
        <span aria-hidden="true" className={styles.coverSkeleton} />
      ) : null}
      {state !== "error" ? (
        <Image
          alt={alt}
          className={styles.coverImage}
          fetchPriority={priority ? "high" : "auto"}
          height={720}
          loading={priority ? "eager" : loading}
          onError={() => setState("error")}
          onLoad={() => setState("ready")}
          quality={68}
          sizes={sizes}
          src={source}
          width={480}
        />
      ) : (
        <span aria-label={alt} className={styles.coverFallback} role="img">
          <span aria-hidden="true">LA</span>
          <small>封面待归档</small>
        </span>
      )}
    </span>
  );
}

export function prefetchArchiveCovers(games: Game[]) {
  if (typeof window === "undefined") return;

  for (const game of games.slice(0, 3)) {
    const source = getArchiveCoverSource(game);
    if (prefetchedSources.has(source)) continue;
    prefetchedSources.add(source);

    const image = new window.Image();
    image.decoding = "async";
    image.src = `/_next/image?url=${encodeURIComponent(source)}&w=256&q=68`;
  }
}

function getArchiveCoverSource(game: Game) {
  return `/covers/rawg/${encodeURIComponent(game.id)}.webp`;
}
