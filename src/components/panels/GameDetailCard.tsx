"use client";

import {
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreLabel
} from "@/lib/localization";
import type { Game } from "@/types/game";

type GameDetailCardProps = {
  game: Game;
  onClose?: () => void;
};

export function GameDetailCard({ game, onClose }: GameDetailCardProps) {
  const secondaryTitle = getGameSecondaryTitle(game);

  return (
    <article className="game-detail-card">
      <div className="game-detail-card-header">
        <div className="game-detail-cover" aria-hidden="true">
          <span>{getGameDisplayTitle(game)}</span>
          <strong>{game.releaseYear}</strong>
        </div>
        <div className="min-w-0">
          <h3>{getGameDisplayTitle(game)}</h3>
          {secondaryTitle ? <p>{secondaryTitle}</p> : null}
          <span>评分 {game.rating.toFixed(1)}</span>
        </div>
        {onClose ? (
          <button
            aria-label="关闭游戏简介"
            className="game-detail-close"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        ) : null}
      </div>

      <dl className="game-detail-meta">
        <div>
          <dt>开发商</dt>
          <dd>{game.developer}</dd>
        </div>
        <div>
          <dt>发行商</dt>
          <dd>{game.publisher}</dd>
        </div>
        <div>
          <dt>发行年份</dt>
          <dd>{game.releaseYear}</dd>
        </div>
        <div>
          <dt>类型</dt>
          <dd>
            {game.genres.map((genre) => (
              <span key={genre}>{getGenreLabel(genre)}</span>
            ))}
          </dd>
        </div>
        <div>
          <dt>平台</dt>
          <dd>
            {game.platforms.map((platform) => (
              <span key={platform}>{platform}</span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="game-detail-description">
        <h4>简介</h4>
        <p>{game.description}</p>
      </div>
    </article>
  );
}
