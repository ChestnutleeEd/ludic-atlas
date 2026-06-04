import { CountryPanel } from "@/components/panels/CountryPanel";
import { CountryDetailPanel } from "@/components/panels/CountryDetailPanel";
import type { Country, Game, YearRange } from "@/types/game";

type RightPanelProps = {
  countries: Country[];
  games: Game[];
  selectedCountry: Country | null;
  selectedCountryCode: string;
  selectedGame: Game | null;
  selectedGameId: string | null;
  yearRange: YearRange;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
};

export function RightPanel({
  countries,
  games,
  selectedCountry,
  selectedCountryCode,
  selectedGame,
  selectedGameId,
  yearRange,
  onSelectCountry,
  onSelectGame
}: RightPanelProps) {
  return (
    <aside className="grid min-h-[460px] gap-4 border border-emerald-500/40 bg-black p-4 lg:grid-rows-[auto_minmax(0,1fr)]">
      <CountryPanel
        countries={countries}
        games={games}
        selectedCountryCode={selectedCountryCode}
        onSelectCountry={onSelectCountry}
      />
      <CountryDetailPanel
        country={selectedCountry}
        games={games}
        selectedGame={selectedGame}
        selectedGameId={selectedGameId}
        yearRange={yearRange}
        onSelectGame={onSelectGame}
      />
    </aside>
  );
}
