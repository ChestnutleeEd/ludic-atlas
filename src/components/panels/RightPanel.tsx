"use client";

import { useEffect } from "react";
import { CountryPanel } from "@/components/panels/CountryPanel";
import { CountryDetailPanel } from "@/components/panels/CountryDetailPanel";
import { GameDetailCard } from "@/components/panels/GameDetailCard";
import { getRegionLabel } from "@/lib/regions";
import type { RegionId } from "@/types/game";
import type { Country, Game, YearRange } from "@/types/game";

type RightPanelProps = {
  countries: Country[];
  games: Game[];
  activeRegionId: RegionId;
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
  activeRegionId,
  selectedCountry,
  selectedCountryCode,
  selectedGame,
  selectedGameId,
  yearRange,
  onSelectCountry,
  onClearCountry,
  onSelectGame
}: RightPanelProps) {
  const isGameDetailOpen = Boolean(selectedGame);
  const panelTitle = selectedCountry
    ? `${selectedCountry.nameZh} ${selectedCountry.name} 国家详情`
    : `${getRegionLabel(activeRegionId)} 国家与地区总览`;

  useEffect(() => {
    if (!isGameDetailOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectGame(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameDetailOpen, onSelectGame]);

  return (
    <aside
      aria-label={panelTitle}
      className={`glass-panel right-panel-shell relative min-h-[460px] max-h-[calc(100vh-180px)] p-4 ${
        isGameDetailOpen ? "is-game-detail-open overflow-hidden" : "overflow-y-auto"
      }`}
    >
      <div
        aria-hidden={isGameDetailOpen}
        className="right-panel-content"
        inert={isGameDetailOpen ? true : undefined}
      >
        {selectedCountry ? (
          <CountryDetailPanel
            country={selectedCountry}
            games={games}
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
              activeRegionLabel={getRegionLabel(activeRegionId)}
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={onSelectCountry}
            />
          </>
        )}
      </div>

      {selectedGame ? (
        <div
          aria-label={`游戏详情：${selectedGame.titleZh || selectedGame.title}`}
          aria-modal="true"
          className="game-detail-layer"
          role="dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onSelectGame(null);
            }
          }}
        >
          <div
            className="game-detail-layer-card"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <GameDetailCard
              game={selectedGame}
              key={selectedGame.id}
              onClose={() => onSelectGame(null)}
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
