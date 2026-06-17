"use client";

import { useCallback, useMemo, useState } from "react";
import { GameArchiveView } from "@/components/archive/GameArchiveView";
import { BottomControls } from "@/components/controls/BottomControls";
import { GameGlobe } from "@/components/globe/GameGlobe";
import { LandingHub } from "@/components/home/LandingHub";
import { RightPanel } from "@/components/panels/RightPanel";
import { countries } from "@/data/countries";
import { games } from "@/data/games";
import { filterGamesByCountry, filterGamesByYearRange } from "@/lib/filterGames";
import {
  filterCountriesByRegion,
  filterGamesByRegion,
  getRegionLabel,
  isCountryInRegion
} from "@/lib/regions";
import { getTotalStats } from "@/lib/stats";
import type {
  CameraMode,
  Country,
  Game,
  RegionId,
  ViewMode,
  YearRange
} from "@/types/game";

type MainViewMode = "hub" | "earth" | "archive";

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
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>("hub");
  const [activeRegionId, setActiveRegionId] = useState<RegionId>("global");
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");
  const [isRotateEnabled, setIsRotateEnabled] = useState(false);

  const selectedCountry = useMemo<Country | null>(
    () => countries.find((country) => country.code === selectedCountryCode) ?? null,
    [selectedCountryCode]
  );
  const yearFilteredGames = useMemo(
    () => filterGamesByYearRange(games, yearRange),
    [yearRange]
  );
  const regionCountries = useMemo(
    () => filterCountriesByRegion(countries, activeRegionId),
    [activeRegionId]
  );
  const regionFilteredGames = useMemo(
    () => filterGamesByRegion(yearFilteredGames, countries, activeRegionId),
    [activeRegionId, yearFilteredGames]
  );
  const visibleGames = useMemo<Game[]>(() => {
    if (!selectedCountryCode) {
      return regionFilteredGames;
    }

    return filterGamesByCountry(regionFilteredGames, selectedCountryCode);
  }, [regionFilteredGames, selectedCountryCode]);
  const selectedGame = selectedGameId
    ? games.find((game) => game.id === selectedGameId) ?? null
    : null;

  const handleSelectCountry = useCallback((countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedGameId(null);
  }, []);

  const handleRegionChange = useCallback((regionId: RegionId) => {
    setActiveRegionId(regionId);
    setHoveredGameId(null);
    setSelectedGameId(null);
    setSelectedCountryCode((currentCountryCode) => {
      if (!currentCountryCode || regionId === "global") {
        return currentCountryCode;
      }

      const currentCountry = countries.find(
        (country) => country.code === currentCountryCode
      );

      return currentCountry && isCountryInRegion(currentCountry, regionId)
        ? currentCountryCode
        : null;
    });
  }, []);

  const handleClearCountry = useCallback(() => {
    setSelectedCountryCode(null);
    setSelectedGameId(null);
  }, []);

  const handleSelectGameFromMap = useCallback((gameId: string) => {
    const game = yearFilteredGames.find((item) => item.id === gameId);

    if (game) {
      setSelectedCountryCode(game.countryCode);
    }

    setSelectedGameId(gameId);
  }, [yearFilteredGames]);

  const handleYearRangeChange = useCallback((nextRange: YearRange) => {
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
  }, []);

  return (
    <main
      className={`game-earth-shell min-h-screen overflow-x-hidden ${
        mainViewMode === "archive" ? "p-0" : "px-5 py-5 md:px-8"
      }`}
    >
      <div className="deep-space-backdrop pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_42%_18%,rgba(217,154,50,0.08),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(196,122,36,0.055),transparent_24%),radial-gradient(circle_at_52%_90%,rgba(245,239,227,0.035),transparent_34%)]" />
      <div
        className={`relative z-10 mx-auto flex flex-col gap-4 ${
          mainViewMode === "archive"
            ? "min-h-screen w-full max-w-none"
            : "min-h-[calc(100vh-40px)] max-w-7xl"
        }`}
      >
        {mainViewMode === "hub" ? (
          <LandingHub
            totalGames={totalStats.totalGames}
            yearRange={{
              max: totalStats.maxReleaseYear,
              min: totalStats.minReleaseYear
            }}
            onOpenArchive={() => setMainViewMode("archive")}
            onOpenEarth={() => setMainViewMode("earth")}
          />
        ) : (
          <>
        {mainViewMode === "earth" ? (
        <header className="glass-panel atlas-header relative overflow-hidden p-4">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D99A32]/70 to-transparent" />
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <button
                className="atlas-ghost-button mb-3"
                onClick={() => setMainViewMode("hub")}
                type="button"
              >
                返回游戏星图
              </button>
              <h1 className="text-3xl font-semibold tracking-normal text-[#F5EFE3] md:text-5xl">
                Earth Explorer / 地球探索
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A99D8B]">
                以电影式地球镜头浏览不同国家与地区的代表性游戏。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm md:w-[32rem]">
              <div className="stat-tile p-3">
                <span className="block text-[#A99D8B]">游戏</span>
                <strong className="text-2xl text-[#F0B65A]">
                  {totalStats.totalGames}
                </strong>
              </div>
              <div className="stat-tile p-3">
                <span className="block text-[#A99D8B]">国家 / 地区</span>
                <strong className="text-2xl text-[#F0B65A]">
                  {totalStats.totalCountries}
                </strong>
              </div>
              <div className="stat-tile p-3">
                <span className="block text-[#A99D8B]">当前可见</span>
                <strong className="text-2xl text-[#F0B65A]">
                  {visibleGames.length}
                </strong>
              </div>
            </div>
          </div>
        </header>
        ) : null}

        {mainViewMode === "earth" ? (
          <section className="grid flex-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <GameGlobe
              countries={countries}
              games={regionFilteredGames}
              activeRegionId={activeRegionId}
              cameraMode={cameraMode}
              isRotateEnabled={isRotateEnabled}
              selectedCountry={selectedCountry}
              selectedGameId={selectedGameId}
              hoveredGameId={hoveredGameId}
              viewMode={viewMode}
              coverSize={coverSize}
              onSelectCountry={handleSelectCountry}
              onSelectGame={handleSelectGameFromMap}
              onHoverGame={setHoveredGameId}
              onRegionChange={handleRegionChange}
            />
            <RightPanel
              countries={regionCountries}
              games={regionFilteredGames}
              activeRegionId={activeRegionId}
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
        ) : (
          <GameArchiveView
            games={games}
            onBackToHub={() => setMainViewMode("hub")}
            selectedGameId={selectedGameId}
            onSelectGame={setSelectedGameId}
          />
        )}

        {mainViewMode === "earth" ? (
          <BottomControls
            yearRange={yearRange}
            minYear={totalStats.minReleaseYear}
            maxYear={totalStats.maxReleaseYear}
            coverSize={coverSize}
            viewMode={viewMode}
            activeRegionLabel={getRegionLabel(activeRegionId)}
            cameraMode={cameraMode}
            countriesCount={regionCountries.length}
            isRotateEnabled={isRotateEnabled}
            totalGames={visibleGames.length}
            onYearRangeChange={handleYearRangeChange}
            onCoverSizeChange={setCoverSize}
            onCameraModeChange={setCameraMode}
            onViewModeChange={setViewMode}
            onRotateChange={setIsRotateEnabled}
          />
        ) : null}
        <p className="px-1 text-[11px] leading-5 text-[#A99D8B]/60">
          游戏资料与封面图片可由 RAWG 本地生成数据提供；页面运行时不直接请求 RAWG API。
        </p>
          </>
        )}
      </div>
    </main>
  );
}
