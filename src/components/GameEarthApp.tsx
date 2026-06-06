"use client";

import { useMemo, useState } from "react";
import { BottomControls } from "@/components/controls/BottomControls";
import { GameGlobe } from "@/components/globe/GameGlobe";
import { GameGlobe2D } from "@/components/globe/GameGlobe2D";
import { RightPanel } from "@/components/panels/RightPanel";
import { countries } from "@/data/countries";
import { games } from "@/data/games";
import { filterGamesByCountry, filterGamesByYearRange } from "@/lib/filterGames";
import { getTotalStats } from "@/lib/stats";
import type { Country, Game, ViewMode, YearRange } from "@/types/game";

type GlobeRenderMode = "globe2d" | "globe3d";

export function GameEarthApp() {
  const totalStats = useMemo(() => getTotalStats(countries, games), []);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<YearRange>({
    min: totalStats.minReleaseYear,
    max: totalStats.maxReleaseYear
  });
  const [coverSize, setCoverSize] = useState(56);
  const [viewMode, setViewMode] = useState<ViewMode>("countries");
  const [globeMode, setGlobeMode] = useState<GlobeRenderMode>("globe3d");

  const selectedCountry = useMemo<Country | null>(
    () => countries.find((country) => country.code === selectedCountryCode) ?? null,
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
    setSelectedGameId(null);
  }

  function handleClearCountry() {
    setSelectedCountryCode(null);
    setSelectedGameId(null);
  }

  function handleSelectGameFromMap(gameId: string) {
    const game = yearFilteredGames.find((item) => item.id === gameId);

    if (game) {
      setSelectedCountryCode(game.countryCode);
    }

    setSelectedGameId(gameId);
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
    <main className="game-earth-shell min-h-screen overflow-x-hidden px-5 py-5 text-slate-100 md:px-8">
      <div className="deep-space-backdrop pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(245,250,255,0.08),transparent_28%),radial-gradient(circle_at_76%_16%,rgba(125,245,255,0.055),transparent_26%),radial-gradient(circle_at_52%_88%,rgba(245,250,255,0.045),transparent_34%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col gap-4">
        <header className="glass-panel relative overflow-hidden p-4">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-sky-50 drop-shadow-[0_0_22px_rgba(0,240,255,0.42)] md:text-5xl">
                游戏地球 Game Earth
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/70">
                按国家与地区探索全球代表性游戏。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm md:w-[32rem]">
              <div className="stat-tile p-3">
                <span className="block text-cyan-50/55">游戏</span>
                <strong className="text-2xl text-cyan-100">
                  {totalStats.totalGames}
                </strong>
              </div>
              <div className="stat-tile p-3">
                <span className="block text-cyan-50/55">国家 / 地区</span>
                <strong className="text-2xl text-cyan-100">
                  {totalStats.totalCountries}
                </strong>
              </div>
              <div className="stat-tile p-3">
                <span className="block text-cyan-50/55">当前可见</span>
                <strong className="text-2xl text-cyan-100">
                  {visibleGames.length}
                </strong>
              </div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {globeMode === "globe2d" ? (
            <GameGlobe2D
              countries={countries}
              games={yearFilteredGames}
              selectedCountry={selectedCountry}
              selectedGameId={selectedGameId}
              hoveredGameId={hoveredGameId}
              viewMode={viewMode}
              coverSize={coverSize}
              globeMode={globeMode}
              onGlobeModeChange={setGlobeMode}
              onSelectCountry={handleSelectCountry}
              onSelectGame={handleSelectGameFromMap}
              onHoverGame={setHoveredGameId}
            />
          ) : (
            <GameGlobe
              countries={countries}
              games={yearFilteredGames}
              selectedCountry={selectedCountry}
              selectedGameId={selectedGameId}
              hoveredGameId={hoveredGameId}
              viewMode={viewMode}
              coverSize={coverSize}
              globeMode={globeMode}
              onGlobeModeChange={setGlobeMode}
              onSelectCountry={handleSelectCountry}
              onSelectGame={handleSelectGameFromMap}
              onHoverGame={setHoveredGameId}
            />
          )}
          <RightPanel
            countries={countries}
            games={yearFilteredGames}
            selectedCountry={selectedCountry}
            selectedCountryCode={selectedCountryCode}
            selectedGame={selectedGame}
            selectedGameId={selectedGameId}
            yearRange={yearRange}
            onSelectCountry={handleSelectCountry}
            onClearCountry={handleClearCountry}
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
        <p className="px-1 text-[11px] leading-5 text-cyan-50/42">
          游戏资料与封面图片可由 RAWG 本地生成数据提供；页面运行时不直接请求 RAWG API。
        </p>
      </div>
    </main>
  );
}
