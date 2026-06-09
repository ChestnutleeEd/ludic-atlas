import { CountryPanel } from "@/components/panels/CountryPanel";
import { CountryDetailPanel } from "@/components/panels/CountryDetailPanel";
import { GlobalGameGallery } from "@/components/panels/GlobalGameGallery";
import type { Country, Game, YearRange } from "@/types/game";

type RightPanelProps = {
  countries: Country[];
  games: Game[];
  selectedCountry: Country | null;
  selectedCountryCode: string | null;
  selectedGame: Game | null;
  selectedGameId: string | null;
  yearRange: YearRange;
  onSelectCountry: (countryCode: string) => void;
  onClearCountry: () => void;
  onSelectGame: (gameId: string | null) => void;
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
  onClearCountry,
  onSelectGame
}: RightPanelProps) {
  return (
    <aside className="glass-panel right-panel-shell min-h-[460px] max-h-[calc(100vh-180px)] overflow-y-auto p-4">
      {selectedCountry ? (
        <CountryDetailPanel
          country={selectedCountry}
          games={games}
          selectedGame={selectedGame}
          selectedGameId={selectedGameId}
          yearRange={yearRange}
          onClearCountry={onClearCountry}
          onSelectGame={onSelectGame}
        />
      ) : (
        <>
          <CountryPanel
            countries={countries}
            games={games}
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={onSelectCountry}
          />
          {games.length > 0 ? (
            <GlobalGameGallery
              games={games}
              selectedGameId={selectedGameId}
              onSelectGame={onSelectGame}
            />
          ) : null}
        </>
      )}
    </aside>
  );
}
