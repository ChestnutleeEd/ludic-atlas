import type { Game } from "@/types/game";

type GameTooltipProps = {
  game: Game | null;
};

export function GameTooltip({ game }: GameTooltipProps) {
  if (!game) {
    return null;
  }

  return (
    <div className="border border-emerald-500/40 bg-black p-3 text-sm text-emerald-50">
      <p className="font-semibold text-emerald-300">{game.title}</p>
      <p className="mt-1 text-emerald-50/60">
        {game.releaseYear} · {game.genres[0]} · {game.rating.toFixed(1)}
      </p>
    </div>
  );
}
