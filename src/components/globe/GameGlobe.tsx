import { CountryLayer } from "@/components/globe/CountryLayer";
import { GameMarkers } from "@/components/globe/GameMarkers";
import type { Country, Game, ViewMode } from "@/types/game";

type GameGlobeProps = {
  countries: Country[];
  games: Game[];
  selectedCountry: Country | null;
  selectedGameId: string | null;
  hoveredGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  onSelectGame: (gameId: string) => void;
  onHoverGame: (gameId: string | null) => void;
};

export function GameGlobe({
  countries,
  games,
  selectedCountry,
  selectedGameId,
  hoveredGameId,
  viewMode,
  coverSize,
  onSelectGame,
  onHoverGame
}: GameGlobeProps) {
  return (
    <section className="relative min-h-[460px] overflow-hidden border border-emerald-500/40 bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,230,118,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,230,118,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-x-8 bottom-16 top-24 border border-emerald-400/30 bg-black/70" />
      <div className="absolute left-8 right-8 top-1/2 border-t border-emerald-500/25" />
      <div className="absolute bottom-16 left-1/2 top-24 border-l border-emerald-500/25" />
      <div className="relative z-10 flex h-full min-h-[460px] flex-col justify-between p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-emerald-50/60">Globe / map panel</p>
            <p className="mt-1 text-xs text-emerald-50/45">
              Interactive placeholder for country points and game markers.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs md:w-96">
            <div className="border border-emerald-500/25 p-2">
              <dt className="text-emerald-50/50">Selected country</dt>
              <dd className="mt-1 text-emerald-300">
                {selectedCountry?.name ?? "None"}
              </dd>
            </div>
            <div className="border border-emerald-500/25 p-2">
              <dt className="text-emerald-50/50">Filtered games</dt>
              <dd className="mt-1 text-emerald-300">{games.length}</dd>
            </div>
            <div className="border border-emerald-500/25 p-2">
              <dt className="text-emerald-50/50">View mode</dt>
              <dd className="mt-1 text-emerald-300">{viewMode}</dd>
            </div>
            <div className="border border-emerald-500/25 p-2">
              <dt className="text-emerald-50/50">Cover size</dt>
              <dd className="mt-1 text-emerald-300">{coverSize}px</dd>
            </div>
          </dl>
        </div>
        <div className="relative min-h-80">
          <CountryLayer countries={countries} selectedCountry={selectedCountry} />
          <GameMarkers
            games={games}
            countries={countries}
            coverSize={coverSize}
            selectedGameId={selectedGameId}
            hoveredGameId={hoveredGameId}
            viewMode={viewMode}
            onSelectGame={onSelectGame}
            onHoverGame={onHoverGame}
          />
        </div>
      </div>
    </section>
  );
}
