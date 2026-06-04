import type { Game } from "@/types/game";

type GameDetailCardProps = {
  game: Game;
};

export function GameDetailCard({ game }: GameDetailCardProps) {
  return (
    <article className="border border-emerald-500/30 bg-black p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-emerald-50">{game.title}</h3>
          {game.titleZh ? (
            <p className="mt-1 text-xs text-emerald-50/50">{game.titleZh}</p>
          ) : null}
        </div>
        <span className="border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300">
          {game.rating.toFixed(1)}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-xs text-emerald-50/60">
        <div>
          <dt>Developer</dt>
          <dd className="mt-1 text-emerald-50">{game.developer}</dd>
        </div>
        <div>
          <dt>Publisher</dt>
          <dd className="mt-1 text-emerald-50">{game.publisher ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Release year</dt>
          <dd className="mt-1 text-emerald-50">{game.releaseYear}</dd>
        </div>
        <div>
          <dt>Genres</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <span className="border border-emerald-500/25 px-2 py-1" key={genre}>
                {genre}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Platforms</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {game.platforms.map((platform) => (
              <span
                className="border border-emerald-500/25 px-2 py-1"
                key={platform}
              >
                {platform}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-emerald-50/70">
        {game.description}
      </p>
    </article>
  );
}
