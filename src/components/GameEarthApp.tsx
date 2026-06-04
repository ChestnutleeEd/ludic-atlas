"use client";

import { useMemo, useState } from "react";
import { BottomControls } from "@/components/controls/BottomControls";
import { GameGlobe } from "@/components/globe/GameGlobe";
import { RightPanel } from "@/components/panels/RightPanel";
import { countries } from "@/data/countries";
import { games } from "@/data/games";
import { filterGamesByCountry, filterGamesByYearRange } from "@/lib/filterGames";
import { getTotalStats } from "@/lib/stats";
import type { Country, Game, ViewMode, YearRange } from "@/types/game";

export function GameEarthApp() {
  const totalStats = getTotalStats(countries, games);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    countries[0]?.code ?? ""
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<YearRange>({
    min: totalStats.minReleaseYear,
    max: totalStats.maxReleaseYear
  });
  const [coverSize, setCoverSize] = useState(56);
  const [viewMode, setViewMode] = useState<ViewMode>("countries");

  const selectedCountry = useMemo<Country | null>(
    () =>
      countries.find((country) => country.code === selectedCountryCode) ?? null,
    [selectedCountryCode]
  );
  const yearFilteredGames = useMemo(
    () => filterGamesByYearRange(games, yearRange),
    [yearRange]
  );
  const visibleGames = useMemo<Game[]>(() => {
    if (!selectedCountryCode) {
      return yearFilteredGames;
    }

    return filterGamesByCountry(yearFilteredGames, selectedCountryCode);
  }, [selectedCountryCode, yearFilteredGames]);
  const selectedGame = selectedGameId
    ? games.find((game) => game.id === selectedGameId) ?? null
    : null;

  function handleSelectCountry(countryCode: string) {
    setSelectedCountryCode(countryCode);
    const firstCountryGame = filterGamesByCountry(yearFilteredGames, countryCode)[0];
    setSelectedGameId(firstCountryGame?.id ?? null);
  }

  function handleYearRangeChange(nextRange: YearRange) {
    setYearRange(nextRange);
    setSelectedGameId((currentGameId) => {
      if (
        currentGameId &&
        filterGamesByYearRange(games, nextRange).some(
          (game) => game.id === currentGameId
        )
      ) {
        return currentGameId;
      }

      return null;
    });
  }

  return (
    <main className="min-h-screen bg-black px-5 py-5 text-emerald-50 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col gap-4">
        <header className="border border-emerald-500/40 bg-black/80 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-emerald-300 md:text-5xl">
                Game Earth
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/70">
                Explore representative games by country and region.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm md:w-[32rem]">
              <div className="border border-emerald-500/30 p-3">
                <span className="block text-emerald-50/60">Games</span>
                <strong className="text-2xl text-emerald-300">
                  {totalStats.totalGames}
                </strong>
              </div>
              <div className="border border-emerald-500/30 p-3">
                <span className="block text-emerald-50/60">Countries</span>
                <strong className="text-2xl text-emerald-300">
                  {totalStats.totalCountries}
                </strong>
              </div>
              <div className="border border-emerald-500/30 p-3">
                <span className="block text-emerald-50/60">Visible</span>
                <strong className="text-2xl text-emerald-300">
                  {visibleGames.length}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <GameGlobe
            countries={countries}
            games={visibleGames}
            selectedCountry={selectedCountry}
            selectedGameId={selectedGameId}
            hoveredGameId={hoveredGameId}
            viewMode={viewMode}
            coverSize={coverSize}
            onSelectGame={setSelectedGameId}
            onHoverGame={setHoveredGameId}
          />
          <RightPanel
            countries={countries}
            games={yearFilteredGames}
            selectedCountry={selectedCountry}
            selectedCountryCode={selectedCountryCode}
            selectedGame={selectedGame}
            selectedGameId={selectedGameId}
            yearRange={yearRange}
            onSelectCountry={handleSelectCountry}
            onSelectGame={setSelectedGameId}
          />
        </section>

        <BottomControls
          yearRange={yearRange}
          minYear={totalStats.minReleaseYear}
          maxYear={totalStats.maxReleaseYear}
          coverSize={coverSize}
          viewMode={viewMode}
          onYearRangeChange={handleYearRangeChange}
          onCoverSizeChange={setCoverSize}
          onViewModeChange={setViewMode}
        />
      </div>
    </main>
  );
}
