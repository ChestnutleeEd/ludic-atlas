import { GameDetailCard } from "@/components/panels/GameDetailCard";
import { filterGamesByCountry } from "@/lib/filterGames";
import type { Country, Game, YearRange } from "@/types/game";

type CountryDetailPanelProps = {
  country: Country | null;
  games: Game[];
  selectedGame: Game | null;
  selectedGameId: string | null;
  yearRange: YearRange;
  onSelectGame: (gameId: string) => void;
};

export function CountryDetailPanel({
  country,
  games,
  selectedGame,
  selectedGameId,
  yearRange,
  onSelectGame
}: CountryDetailPanelProps) {
  if (!country) {
    return (
      <section className="border border-emerald-500/30 p-4">
        <h2 className="text-lg font-semibold text-emerald-300">Country detail</h2>
        <p className="mt-3 text-sm text-emerald-50/60">
          Select a country to view representative games.
        </p>
      </section>
    );
  }

  const countryGames = filterGamesByCountry(games, country.code);

  return (
    <section className="min-h-0 border border-emerald-500/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-300">
            {country.name}
          </h2>
          <p className="mt-1 text-xs text-emerald-50/50">
            {country.nameZh} · {country.region}
          </p>
        </div>
        <span className="border border-emerald-500/30 px-2 py-1 text-xs text-emerald-50/70">
          {country.code}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-emerald-50/60">
        <div className="border border-emerald-500/20 p-2">
          <dt>Latitude</dt>
          <dd className="mt-1 text-emerald-300">{country.latitude}</dd>
        </div>
        <div className="border border-emerald-500/20 p-2">
          <dt>Longitude</dt>
          <dd className="mt-1 text-emerald-300">{country.longitude}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-emerald-300">
            Games in range
          </h3>
          <span className="text-xs text-emerald-50/50">
            {yearRange.min}-{yearRange.max}
          </span>
        </div>
        <div className="mt-3 grid gap-2">
          {countryGames.length === 0 ? (
            <p className="border border-emerald-500/20 p-3 text-sm text-emerald-50/60">
              No games match the selected year range.
            </p>
          ) : (
            countryGames.map((game) => (
              <button
                className={`border p-3 text-left text-sm transition-colors ${
                  game.id === selectedGameId
                    ? "border-emerald-300 bg-emerald-400/10"
                    : "border-emerald-500/25 bg-black hover:border-emerald-400/70"
                }`}
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                type="button"
              >
                <span className="block font-semibold text-emerald-50">
                  {game.title}
                </span>
                <span className="mt-1 block text-xs text-emerald-50/50">
                  {game.releaseYear} · {game.developer}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-5">
        {selectedGame ? (
          <GameDetailCard game={selectedGame} />
        ) : (
          <p className="border border-emerald-500/20 p-3 text-sm text-emerald-50/60">
            Select a game to view details.
          </p>
        )}
      </div>
    </section>
  );
}
