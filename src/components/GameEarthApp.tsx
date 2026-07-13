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
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(false);
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
    dispatchExploration({ type: "setCameraMode", cameraMode: "surface" });
    if (window.innerWidth > 1023) {
      setIsDesktopPanelOpen(true);
    }
    setMobileSheetStateIfSmallViewport("peek");
  }, [setMobileSheetStateIfSmallViewport]);

  const handleRegionChange = useCallback((regionId: RegionId) => {
    dispatchExploration({ type: "selectRegion", regionId });
    dispatchExploration({ type: "setCameraMode", cameraMode: "overview" });
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
          <header className="earth-command-bar" aria-label="地球探索导航">
            <button
              aria-label="返回游戏星图"
              className="earth-icon-button earth-home-button"
              onClick={() => setMainViewMode("hub")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m14.5 6-6 6 6 6" />
              </svg>
            </button>
            <div className="earth-brand-lockup">
              <span>LUDIC ATLAS</span>
              <h1>地球探索</h1>
            </div>
            <div className="earth-current-context" aria-live="polite">
              <span>{cameraMode === "surface" ? "近地聚焦" : "全球巡览"}</span>
              <strong>
                {selectedCountry
                  ? `${selectedCountry.nameZh} ${selectedCountry.name}`
                  : getRegionLabel(activeRegionId)}
              </strong>
            </div>
            <button
              aria-label="打开或收起国家目录"
              aria-controls="earth-country-panel"
              aria-expanded={isDesktopPanelOpen || mobileSheetState !== "collapsed"}
              className="earth-directory-button"
              onClick={() => {
                if (window.innerWidth <= 1023) {
                  setMobileSheetState((state) =>
                    state === "collapsed" ? "expanded" : "collapsed"
                  );
                  return;
                }
                setIsDesktopPanelOpen((isOpen) => !isOpen);
              }}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5S14.2 18.2 12 20.5M12 3.5C9.8 5.8 8.7 8.6 8.7 12s1.1 6.2 3.3 8.5" />
              </svg>
              <span>国家目录</span>
            </button>
          </header>
        ) : null}

        {mainViewMode === "earth" ? (
          <section className="earth-workspace-grid">
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
              onCameraModeChange={(nextCameraMode) =>
                dispatchExploration({ type: "setCameraMode", cameraMode: nextCameraMode })
              }
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
              isDesktopOpen={isDesktopPanelOpen}
              yearRange={yearRange}
              onSelectCountry={handleSelectCountry}
              onClearCountry={handleClearCountry}
              onSelectGame={handleSelectGameFromPanel}
              onRequestClose={() => setIsDesktopPanelOpen(false)}
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
          </>
        )}
      </div>
    </main>
  );
}
