"use client";

/* eslint-disable @next/next/no-img-element */

import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";

type GlobalGameGalleryProps = {
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string | null) => void;
};

const MAX_VISIBLE_GAMES = 24;

export function GlobalGameGallery({
  games,
  selectedGameId,
  onSelectGame
}: GlobalGameGalleryProps) {
  const visibleGames = games.slice(0, MAX_VISIBLE_GAMES);

  if (visibleGames.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 border border-white/15 bg-black/60 p-3 shadow-[inset_0_1px_0_rgba(245,250,255,0.07)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-cyan-50">
            RAWG 全球游戏画廊
          </h2>
          <p className="mt-1 text-xs leading-5 text-cyan-50/45">
            未选择国家时，直接预览批量生成数据的封面。
          </p>
        </div>
        <span className="shrink-0 text-xs text-cyan-50/50">
          {visibleGames.length} / {games.length}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {visibleGames.map((game) => {
          const title = getGameDisplayTitle(game);
          const secondaryTitle = getGameSecondaryTitle(game);
          const genres = game.genres.slice(0, 2);
          const platforms = game.platforms.slice(0, 2);
          const isSelected = game.id === selectedGameId;

          return (
            <button
              className={`group min-w-0 border bg-black/70 p-2 text-left text-slate-100 transition duration-150 hover:-translate-y-0.5 hover:border-cyan-100/70 hover:bg-slate-950/95 focus-visible:-translate-y-0.5 focus-visible:border-cyan-100/80 focus-visible:outline-none ${
                isSelected
                  ? "border-cyan-100/90 shadow-[0_0_24px_rgba(0,240,255,0.22),inset_0_0_18px_rgba(125,245,255,0.12)]"
                  : "border-white/14"
              }`}
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              type="button"
            >
              <span className="relative block aspect-[3/4] overflow-hidden border border-white/18 bg-[radial-gradient(circle_at_26%_14%,rgba(255,255,255,0.24),transparent_24%),linear-gradient(145deg,rgba(245,250,255,0.14),rgba(52,76,80,0.28)_34%,rgba(8,10,11,0.96)_75%,#000000)]">
                <span className="absolute inset-0 flex items-end p-2 text-xs font-semibold leading-tight text-white/82">
                  {title}
                </span>
                {game.coverImage ? (
                  <img
                    alt={`${title} 封面`}
                    className="relative z-10 h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={game.coverImage}
                  />
                ) : null}
                <span className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/88 via-black/8 to-white/8" />
              </span>

              <span className="mt-2 block min-w-0">
                <strong className="line-clamp-2 block text-sm leading-tight text-white">
                  {title}
                </strong>
                {secondaryTitle ? (
                  <em className="mt-1 block truncate text-[11px] not-italic text-cyan-50/45">
                    {secondaryTitle}
                  </em>
                ) : null}
                <span className="mt-2 flex flex-wrap gap-1 text-[10px] leading-none text-cyan-50/68">
                  <span className="border border-cyan-100/20 bg-cyan-300/6 px-1.5 py-1">
                    {game.releaseYear || "年份未知"}
                  </span>
                  <span className="border border-cyan-100/20 bg-cyan-300/6 px-1.5 py-1">
                    评分 {game.rating.toFixed(1)}
                  </span>
                </span>
                <span className="mt-2 block truncate text-[11px] leading-4 text-cyan-50/54">
                  {genres.length > 0
                    ? genres.map(getGenreLabel).join(" / ")
                    : "类型未知"}
                </span>
                <span className="block truncate text-[11px] leading-4 text-cyan-50/38">
                  {platforms.length > 0 ? platforms.join(" / ") : "平台未知"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
