import { getMarkerPosition } from "@/lib/geo";
import type { Country, Game, ViewMode } from "@/types/game";

type GameMarkersProps = {
  games: Game[];
  countries: Country[];
  coverSize: number;
  selectedGameId: string | null;
  hoveredGameId: string | null;
  viewMode: ViewMode;
  onSelectGame: (gameId: string) => void;
  onHoverGame: (gameId: string | null) => void;
};

export function GameMarkers({
  games,
  countries,
  coverSize,
  selectedGameId,
  hoveredGameId,
  viewMode,
  onSelectGame,
  onHoverGame
}: GameMarkersProps) {
  return (
    <div className="absolute inset-0">
      {games.map((game, index) => {
        const country = countries.find((item) => item.code === game.countryCode);

        if (!country) {
          return null;
        }

        const position = getMarkerPosition(country);
        const isActive = game.id === selectedGameId;
        const isHovered = game.id === hoveredGameId;
        const offset = index * 10;

        return (
          <button
            className={`absolute border bg-black text-left text-[10px] leading-tight transition-colors ${
              isActive || isHovered
                ? "border-emerald-300 text-emerald-300"
                : "border-emerald-500/40 text-emerald-50/70 hover:border-emerald-400"
            }`}
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            onMouseEnter={() => onHoverGame(game.id)}
            onMouseLeave={() => onHoverGame(null)}
            style={{
              height: viewMode === "games" ? `${coverSize}px` : "18px",
              width: viewMode === "games" ? `${coverSize}px` : "18px",
              left: `calc(${position.x}% + ${offset}px)`,
              top: `calc(${position.y}% + ${offset}px)`,
              transform: "translate(-50%, -50%)"
            }}
            title={game.title}
            type="button"
          >
            {viewMode === "games" ? (
              <span className="flex h-full w-full flex-col justify-between p-1">
                <span className="line-clamp-2">{game.title}</span>
                <span className="text-emerald-50/45">{game.releaseYear}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
