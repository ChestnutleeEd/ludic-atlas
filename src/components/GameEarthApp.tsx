"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { BottomControls } from "@/components/controls/BottomControls";
import { LandingHub } from "@/components/home/LandingHub";
import {
  RightPanel,
  type MobileSheetState
} from "@/components/panels/RightPanel";
import { gameCatalog } from "@/data/gameCatalog";
import {
  filterGamesByCountry,
  filterGamesByYearRange,
  isGameInYearRange
} from "@/lib/filterGames";
import {
  createExplorationReducer,
  initialExplorationState
} from "@/lib/explorerState";
import {
  filterCountriesByRegion,
  filterGamesByRegion,
  getRegionLabel,
} from "@/lib/regions";
import type {
  Game,
  RegionId,
  ViewMode,
  YearRange
} from "@/types/game";

type MainViewMode = "hub" | "earth" | "archive";
const { countries, games, totalStats } = gameCatalog;
const explorationReducer = createExplorationReducer(countries, games);
const GameGlobe = dynamic(
  () => import("@/components/globe/GameGlobe").then((module) => module.GameGlobe),
  {
    loading: () => (
      <div className="glass-panel grid h-full min-h-[420px] place-items-center text-sm text-[#A99D8B]">
        地球引擎加载中…
      </div>
    ),
    ssr: false
  }
);
const GameArchiveView = dynamic(
  () =>
    import("@/components/archive/GameArchiveView").then(
      (module) => module.GameArchiveView
    ),
  {
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#050505] text-sm text-[#A99D8B]">
        编年馆加载中…
      </div>
    )
  }
);

export function GameEarthApp() {
  const [exploration, dispatchExploration] = useReducer(
    explorationReducer,
    initialExplorationState
  );
  const {
    activeRegionId,
    cameraMode,
    selectedCountryCode,
    selectedGameId
  } = exploration;
  const [yearRange, setYearRange] = useState<YearRange>({
    min: totalStats.minReleaseYear,
    max: totalStats.maxReleaseYear
  });
  const [coverSize, setCoverSize] = useState(56);
  const [viewMode, setViewMode] = useState<ViewMode>("countries");
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>("hub");
  const [isRotateEnabled, setIsRotateEnabled] = useState(false);
  const [mobileSheetState, setMobileSheetState] =
    useState<MobileSheetState>("collapsed");

  const selectedCountry = selectedCountryCode
    ? gameCatalog.countryByCode.get(selectedCountryCode) ?? null
    : null;
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
    ? gameCatalog.gameById.get(selectedGameId) ?? null
    : null;
  const sheetSummary = selectedGame
    ? selectedGame.titleZh || selectedGame.title
    : selectedCountry
      ? `${selectedCountry.nameZh} ${selectedCountry.name}`
      : getRegionLabel(activeRegionId);
  const setMobileSheetStateIfSmallViewport = useCallback(
    (nextState: MobileSheetState) => {
      if (window.innerWidth <= 1023) {
        setMobileSheetState(nextState);
      }
    },
    []
  );

  const handleSelectCountry = useCallback((countryCode: string) => {
    dispatchExploration({ type: "selectCountry", countryCode });
    setMobileSheetStateIfSmallViewport("peek");
  }, [setMobileSheetStateIfSmallViewport]);

  const handleRegionChange = useCallback((regionId: RegionId) => {
    dispatchExploration({ type: "selectRegion", regionId });
  }, []);

  const handleClearCountry = useCallback(() => {
    dispatchExploration({ type: "clearCountry" });
    setMobileSheetStateIfSmallViewport("collapsed");
  }, [setMobileSheetStateIfSmallViewport]);

  const handleGlobeInteractionStart = useCallback(() => {
    setMobileSheetStateIfSmallViewport("collapsed");
  }, [setMobileSheetStateIfSmallViewport]);

  const handleSelectGameFromMap = useCallback((gameId: string) => {
    const game = gameCatalog.gameById.get(gameId);

    if (!game || !isGameInYearRange(game, yearRange)) {
      return;
    }

    dispatchExploration({ type: "selectGame", gameId });
    setMobileSheetStateIfSmallViewport("peek");
  }, [setMobileSheetStateIfSmallViewport, yearRange]);

  const handleSelectGameFromPanel = useCallback(
    (gameId: string | null) => {
      dispatchExploration(gameId ? { type: "selectGame", gameId } : { type: "clearGame" });
      if (gameId) {
        setMobileSheetStateIfSmallViewport("expanded");
      }
    },
    [setMobileSheetStateIfSmallViewport]
  );

  const handleYearRangeChange = useCallback((nextRange: YearRange) => {
    setYearRange(nextRange);
    const currentGame = selectedGameId
      ? gameCatalog.gameById.get(selectedGameId)
      : null;
    if (!currentGame || !isGameInYearRange(currentGame, nextRange)) {
      dispatchExploration({ type: "clearGame" });
    }
  }, [selectedGameId]);

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [mainViewMode]);

  return (
    <main
      className={`game-earth-shell min-h-screen overflow-x-hidden ${
        mainViewMode === "archive"
          ? "is-archive-mode"
          : mainViewMode === "earth"
            ? "is-earth-mode"
            : "is-hub-mode"
      } ${
        mainViewMode === "archive" ? "p-0" : "px-5 py-5 md:px-8"
      }`}
      data-main-view={mainViewMode}
      data-mobile-sheet-state={mobileSheetState}
    >
      <div className="deep-space-backdrop pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_36%_14%,rgba(0,255,255,0.10),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(255,0,110,0.08),transparent_26%),radial-gradient(circle_at_52%_92%,rgba(82,65,255,0.07),transparent_36%)]" />
      <div
        className={`relative z-10 mx-auto flex flex-col gap-4 ${
          mainViewMode === "archive"
            ? "min-h-screen w-full max-w-none"
            : mainViewMode === "earth"
              ? "earth-shell-content max-w-[1800px]"
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
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF]/70 to-transparent" />
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
          <section className="earth-workspace-grid grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <GameGlobe
              countries={countries}
              games={regionFilteredGames}
              activeRegionId={activeRegionId}
              cameraMode={cameraMode}
              isRotateEnabled={isRotateEnabled}
              selectedCountry={selectedCountry}
              selectedGameId={selectedGameId}
              viewMode={viewMode}
              coverSize={coverSize}
              onClearCountry={handleClearCountry}
              onSelectCountry={handleSelectCountry}
              onSelectGame={handleSelectGameFromMap}
              onRegionChange={handleRegionChange}
              onInteractionStart={handleGlobeInteractionStart}
            />
            <RightPanel
              countries={regionCountries}
              games={regionFilteredGames}
              activeRegionId={activeRegionId}
              selectedCountry={selectedCountry}
              selectedCountryCode={selectedCountryCode}
              selectedGame={selectedGame}
              selectedGameId={selectedGameId}
              sheetState={mobileSheetState}
              sheetSummary={sheetSummary}
              yearRange={yearRange}
              onSelectCountry={handleSelectCountry}
              onClearCountry={handleClearCountry}
              onSelectGame={handleSelectGameFromPanel}
              onSheetStateChange={setMobileSheetState}
            />
          </section>
        ) : (
          <GameArchiveView
            games={games}
            onBackToHub={() => setMainViewMode("hub")}
            selectedGameId={selectedGameId}
            onSelectGame={(gameId) =>
              dispatchExploration(
                gameId ? { type: "selectGame", gameId } : { type: "clearGame" }
              )
            }
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
            onCameraModeChange={(nextCameraMode) =>
              dispatchExploration({ type: "setCameraMode", cameraMode: nextCameraMode })
            }
            onViewModeChange={setViewMode}
            onRotateChange={setIsRotateEnabled}
            regionStatusLabel={`区域筛选：${getRegionLabel(activeRegionId)}`}
            zoomStatusLabel={
              cameraMode === "surface"
                ? "近地镜头支持深度放大"
                : "总览镜头用于区域巡览"
            }
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
