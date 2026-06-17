/* eslint-disable @next/next/no-img-element */

import { filterGamesByCountry } from "@/lib/filterGames";
import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage
} from "@/lib/gameCover";
import {
  getCountryDisplayName,
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel,
  getRegionLabel
} from "@/lib/localization";
import { getCountryStats } from "@/lib/stats";
import type { Country, Game, YearRange } from "@/types/game";

type CountryDetailPanelProps = {
  country: Country | null;
  games: Game[];
  selectedGameId: string | null;
  yearRange: YearRange;
  onClearCountry: () => void;
  onSelectGame: (gameId: string | null) => void;
};

const DETAIL_GAME_LIMIT = 9;

export function CountryDetailPanel({
  country,
  games,
  selectedGameId,
  yearRange,
  onClearCountry,
  onSelectGame
}: CountryDetailPanelProps) {
  if (!country) {
    return (
      <section className="country-detail-shell">
        <h2 className="text-lg font-semibold text-cyan-100">国家详情</h2>
        <p className="mt-3 text-sm text-cyan-50/60">
          选择一个国家或地区，查看代表性游戏。
        </p>
      </section>
    );
  }

  const countryGames = filterGamesByCountry(games, country.code);
  const displayedCountryGames = [...countryGames]
    .sort((gameA, gameB) => {
      const ratingDifference = gameB.rating - gameA.rating;

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      return gameB.releaseYear - gameA.releaseYear;
    })
    .slice(0, DETAIL_GAME_LIMIT);
  const stats = getCountryStats(country, games);
  const releaseYears = countryGames.map((game) => game.releaseYear);
  const countryYearRange =
    releaseYears.length > 0
      ? `${Math.min(...releaseYears)}-${Math.max(...releaseYears)}`
      : `${yearRange.min}-${yearRange.max}`;

  return (
    <section className="country-detail-shell">
      <div className="country-detail-topbar">
        <button
          className="country-detail-back"
          onClick={onClearCountry}
          type="button"
        >
          返回国家总览
        </button>
        <span>{country.code}</span>
      </div>

      <header className="country-detail-header">
        <div>
          <p>国家详情</p>
          <h2>{getCountryDisplayName(country)}</h2>
          <span>{getRegionLabel(country.region)}</span>
        </div>
      </header>

      <dl className="country-detail-stats">
        <div>
          <dt>游戏数量</dt>
          <dd>{stats.gameCount}</dd>
        </div>
        <div>
          <dt>平均评分</dt>
          <dd>{stats.averageRating.toFixed(1)}</dd>
        </div>
        <div>
          <dt>主要类型</dt>
          <dd>{stats.topGenre ? getGenreLabel(stats.topGenre) : "暂无"}</dd>
        </div>
        <div>
          <dt>年份范围</dt>
          <dd>{countryYearRange}</dd>
        </div>
      </dl>

      <div className="country-game-wall-section">
        <div className="country-game-wall-heading">
          <div>
            <h3>游戏封面墙</h3>
            <p>
              当前筛选年份：{yearRange.min}-{yearRange.max}
            </p>
          </div>
          <span>{countryGames.length} 款</span>
        </div>

        {countryGames.length === 0 ? (
          <p className="country-detail-empty">
            当前年份范围内没有匹配的游戏。
          </p>
        ) : (
          <div className="country-game-wall">
            {displayedCountryGames.map((game) => {
              const secondaryTitle = getGameSecondaryTitle(game);
              const isSelected = game.id === selectedGameId;
              const title = getGameDisplayTitle(game);
              const coverImage = getGameCoverImage(game);

              return (
                <button
                  className={`country-game-card ${isSelected ? "is-selected" : ""}`}
                  key={game.id}
                  onClick={() => onSelectGame(game.id)}
                  type="button"
                >
                  <span className="country-game-cover">
                    <img
                      alt={title}
                      loading="lazy"
                      onError={(event) => {
                        if (
                          !event.currentTarget.src.endsWith(
                            FALLBACK_GAME_COVER_IMAGE
                          )
                        ) {
                          event.currentTarget.src = FALLBACK_GAME_COVER_IMAGE;
                        }
                      }}
                      src={coverImage}
                    />
                  </span>
                  <span className="country-game-card-copy">
                    <strong>{title}</strong>
                    {secondaryTitle ? <em>{secondaryTitle}</em> : null}
                    <span>
                      {game.releaseYear} / 评分 {game.rating.toFixed(1)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="country-detail-game-dock">
        <p>点击游戏封面查看简介。</p>
      </div>
    </section>
  );
}
