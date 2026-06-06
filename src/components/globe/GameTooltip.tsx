import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreListLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";

type GameTooltipProps = {
  game: Game | null;
};

export function GameTooltip({ game }: GameTooltipProps) {
  if (!game) {
    return null;
  }

  const secondaryTitle = getGameSecondaryTitle(game);

  return (
    <div className="w-72 border border-cyan-100/45 bg-slate-950/88 p-3 text-left text-xs text-slate-100 shadow-[0_0_34px_rgba(0,240,255,0.34),0_0_70px_rgba(168,85,247,0.18)] backdrop-blur-xl">
      <p className="text-sm font-semibold leading-snug text-cyan-50">
        {getGameDisplayTitle(game)}
      </p>
      {secondaryTitle ? (
        <p className="mt-1 text-[11px] leading-snug text-cyan-50/55">
          {secondaryTitle}
        </p>
      ) : null}
      <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-cyan-50/52">
        <dt>年份</dt>
        <dd className="text-sky-100">{game.releaseYear}</dd>
        <dt>评分</dt>
        <dd className="text-sky-100">{game.rating.toFixed(1)}</dd>
        <dt>类型</dt>
        <dd className="text-sky-100">{getGenreListLabel(game.genres)}</dd>
      </dl>
    </div>
  );
}

export function getGameTooltipMarkup(game: Game) {
  const secondaryTitle = getGameSecondaryTitle(game);

  return `
    <div class="globe-game-tooltip">
      <p class="globe-game-tooltip-title">${escapeHtml(getGameDisplayTitle(game))}</p>
      ${
        secondaryTitle
          ? `<p class="globe-game-tooltip-secondary">${escapeHtml(secondaryTitle)}</p>`
          : ""
      }
      <dl class="globe-game-tooltip-list">
        <dt>年份</dt>
        <dd>${game.releaseYear}</dd>
        <dt>评分</dt>
        <dd>${game.rating.toFixed(1)}</dd>
        <dt>类型</dt>
        <dd>${escapeHtml(getGenreListLabel(game.genres))}</dd>
      </dl>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
