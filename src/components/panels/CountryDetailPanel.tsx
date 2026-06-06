import { GameDetailCard } from "@/components/panels/GameDetailCard";
import { filterGamesByCountry } from "@/lib/filterGames";
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
  selectedGame: Game | null;
  selectedGameId: string | null;
  yearRange: YearRange;
  onClearCountry: () => void;
  onSelectGame: (gameId: string | null) => void;
};

export function CountryDetailPanel({
  country,
  games,
  selectedGame,
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
            {countryGames.map((game) => {
              const secondaryTitle = getGameSecondaryTitle(game);
              const isSelected = game.id === selectedGameId;

              return (
                <button
                  className={`country-game-card ${isSelected ? "is-selected" : ""}`}
                  key={game.id}
                  onClick={() => onSelectGame(game.id)}
                  type="button"
                >
                  <span className="country-game-cover">
                    <span>{getGameDisplayTitle(game)}</span>
                    <strong>{game.releaseYear}</strong>
                  </span>
                  <span className="country-game-card-copy">
                    <strong>{getGameDisplayTitle(game)}</strong>
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
        {selectedGame ? (
          <GameDetailCard
            game={selectedGame}
            key={selectedGame.id}
            onClose={() => onSelectGame(null)}
          />
        ) : (
          <p>点击游戏封面查看简介。</p>
        )}
      </div>
    </section>
  );
}
