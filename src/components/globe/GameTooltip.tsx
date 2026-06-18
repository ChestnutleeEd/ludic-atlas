import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreListLabel
} from "@/lib/localization";
import { Fragment } from "react";
import type { Game } from "@/types/game";
import type { CSSProperties } from "react";

type GameTooltipProps = {
  game: Game | null;
};

type GameTooltipField = {
  label: "年份" | "评分" | "国家" | "类型";
  value: string;
};

type GameTooltipContent = {
  fields: GameTooltipField[];
  secondaryTitle: string | null;
  title: string;
};

const clampTwoLineStyle: CSSProperties = {
  display: "-webkit-box",
  overflow: "hidden",
  overflowWrap: "anywhere",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2
};

const clampOneLineStyle: CSSProperties = {
  overflow: "hidden",
  overflowWrap: "anywhere",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

export function GameTooltip({ game }: GameTooltipProps) {
  if (!game) {
    return null;
  }

  const tooltip = getGameTooltipContent(game);

  return (
    <div className="globe-game-tooltip">
      <p className="globe-game-tooltip-title" style={clampTwoLineStyle}>
        {tooltip.title}
      </p>
      {tooltip.secondaryTitle ? (
        <p
          className="globe-game-tooltip-secondary"
          style={clampOneLineStyle}
        >
          {tooltip.secondaryTitle}
        </p>
      ) : null}
      <dl className="globe-game-tooltip-list">
        {tooltip.fields.map((field) => (
          <Fragment key={field.label}>
            <dt>{field.label}</dt>
            <dd style={clampTwoLineStyle}>
              {field.value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

export function getGameTooltipMarkup(game: Game) {
  const tooltip = getGameTooltipContent(game);

  return `
    <div class="globe-game-tooltip">
      <p class="globe-game-tooltip-title" style="${CLAMP_TWO_LINE_STYLE}">${escapeHtml(tooltip.title)}</p>
      ${
        tooltip.secondaryTitle
          ? `<p class="globe-game-tooltip-secondary" style="${CLAMP_ONE_LINE_STYLE}">${escapeHtml(tooltip.secondaryTitle)}</p>`
          : ""
      }
      <dl class="globe-game-tooltip-list">
        ${tooltip.fields
          .map(
            (field) => `
              <dt>${field.label}</dt>
              <dd style="${CLAMP_TWO_LINE_STYLE}">${escapeHtml(field.value)}</dd>
            `
          )
          .join("")}
      </dl>
    </div>
  `;
}

function getGameTooltipContent(game: Game): GameTooltipContent {
  return {
    title: getGameDisplayTitle(game),
    secondaryTitle: getGameSecondaryTitle(game),
    fields: [
      {
        label: "年份",
        value: String(game.releaseYear)
      },
      {
        label: "评分",
        value: formatRating(game.rating)
      },
      {
        label: "国家",
        value: game.countryName
      },
      {
        label: "类型",
        value: getGenreListLabel(game.genres)
      }
    ]
  };
}

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : "暂无";
}

const CLAMP_TWO_LINE_STYLE =
  "display:-webkit-box;overflow:hidden;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:2;";
const CLAMP_ONE_LINE_STYLE =
  "overflow:hidden;overflow-wrap:anywhere;text-overflow:ellipsis;white-space:nowrap;";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
