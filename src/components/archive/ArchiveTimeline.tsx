"use client";

/* eslint-disable @next/next/no-img-element */

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
      className="chronicle-timeline chronicle-year-rail"
      aria-label="Game Chronicle timeline"
    >
      <div className="chronicle-rail" aria-hidden="true" />
      <div className="chronicle-year-track">
        {groups.map((group) => {
          const isActive = group.year === activeYear;

          return (
            <button
              className={`chronicle-year-node chronicle-year-node-large ${
                isActive ? "is-active" : ""
              }`}
              key={group.label}
              onClick={() => onSelectYear(group.year)}
              type="button"
            >
              <span className="brass-drawer-handle" aria-hidden="true" />
              <span className="chronicle-year-plaque brass-plaque">
                <span>Year Drawer</span>
                <strong>{group.year ?? "Unknown"}</strong>
              </span>
              <span className="chronicle-year-count">
                {group.games.length} records
              </span>
              <span className="chronicle-year-covers drawer-preview-stack">
                {group.previewGames.map((game) => (
                  <span className="chronicle-thumb" key={game.id}>
                    {game.coverImage ? (
                      <img
                        alt={`${game.titleZh || game.title} 封面`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        src={game.coverImage}
                      />
                    ) : null}
                  </span>
                ))}
              </span>
              <span className="chronicle-year-open-label">
                打开年份展柜
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
