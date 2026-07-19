"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { BottomControls } from "@/components/controls/BottomControls";
import { EarthProjectionViewport } from "@/components/earth/EarthProjectionViewport";
import { useEarthSafeViewport } from "@/components/earth/useEarthSafeViewport";
import { LandingHub } from "@/components/home/LandingHub";
import {
  RightPanel,
  type MobileSheetState
} from "@/components/panels/RightPanel";
import { gameCatalog } from "@/data/gameCatalog";
import {
  filterGamesByRatingRange,
  filterGamesByCountry,
  filterGamesByYearRange,
  isGameInRatingRange,
  isGameInYearRange
} from "@/lib/filterGames";
import {
  createInitialEarthViewState,
  deriveSpatialNavigationIntent
} from "@/lib/earthViewState";
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
import type {
  GlobeViewState,
  RatingRange
} from "@/types/earth";

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
    selectedGameId,
    selectionRevision
  } = exploration;
  const [earthViewState, setEarthViewState] = useState(
    createInitialEarthViewState
  );
  const { projectionMode } = earthViewState;
  const [yearRange, setYearRange] = useState<YearRange>({
    min: totalStats.minReleaseYear,
    max: totalStats.maxReleaseYear
  });
  const [ratingRange, setRatingRange] = useState<RatingRange>({ min: 0, max: 10 });
  const [coverSize, setCoverSize] = useState(56);
  const [viewMode, setViewMode] = useState<ViewMode>("countries");
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>("hub");
  const [isRotateEnabled, setIsRotateEnabled] = useState(false);
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(false);
  const [mobileSheetState, setMobileSheetState] =
    useState<MobileSheetState>("collapsed");
  const earthWorkspaceRef = useRef<HTMLElement>(null);
  const safeViewport = useEarthSafeViewport({
    isActive: mainViewMode === "earth",
    isDesktopPanelOpen,
    mobileSheetState,
    workspaceRef: earthWorkspaceRef
  });

  const selectedCountry = selectedCountryCode
    ? gameCatalog.countryByCode.get(selectedCountryCode) ?? null
    : null;
  const yearFilteredGames = useMemo(
    () => filterGamesByYearRange(games, yearRange),
    [yearRange]
  );
  const sharedFilteredGames = useMemo(
    () => filterGamesByRatingRange(yearFilteredGames, ratingRange),
    [ratingRange, yearFilteredGames]
  );
  const regionCountries = useMemo(
    () => filterCountriesByRegion(countries, activeRegionId),
    [activeRegionId]
  );
  const regionFilteredGames = useMemo(
    () => filterGamesByRegion(sharedFilteredGames, countries, activeRegionId),
    [activeRegionId, sharedFilteredGames]
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
  const navigationIntent = useMemo(
    () =>
      deriveSpatialNavigationIntent({
        countryByCode: gameCatalog.countryByCode,
        exploration,
        gameById: gameCatalog.gameById
      }),
    [exploration]
  );
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
    if (window.innerWidth > 1023) {
      setIsDesktopPanelOpen(true);
    }
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

    if (
      !game ||
      !isGameInYearRange(game, yearRange) ||
      !isGameInRatingRange(game, ratingRange)
    ) {
      return;
    }

    dispatchExploration({ type: "selectGame", gameId });
    setMobileSheetStateIfSmallViewport("peek");
  }, [ratingRange, setMobileSheetStateIfSmallViewport, yearRange]);

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
    if (
      !currentGame ||
      !isGameInYearRange(currentGame, nextRange) ||
      !isGameInRatingRange(currentGame, ratingRange)
    ) {
      dispatchExploration({ type: "clearGame" });
    }
  }, [ratingRange, selectedGameId]);

  const handleRatingRangeChange = useCallback((nextRange: RatingRange) => {
    setRatingRange(nextRange);
    const currentGame = selectedGameId
      ? gameCatalog.gameById.get(selectedGameId)
      : null;
    if (
      !currentGame ||
      !isGameInYearRange(currentGame, yearRange) ||
      !isGameInRatingRange(currentGame, nextRange)
    ) {
      dispatchExploration({ type: "clearGame" });
    }
  }, [selectedGameId, yearRange]);

  const handleSettledGlobeViewState = useCallback(
    (nextGlobeViewState: GlobeViewState, revision: number) => {
      setEarthViewState((currentState) => {
        const currentGlobeViewState = currentState.globeViewState;
        if (
          currentGlobeViewState.altitude === nextGlobeViewState.altitude &&
          currentGlobeViewState.lat === nextGlobeViewState.lat &&
          currentGlobeViewState.lng === nextGlobeViewState.lng &&
          currentState.globeViewRevision === revision
        ) {
          return currentState;
        }

        return {
          ...currentState,
          globeViewRevision: revision,
          globeViewState: nextGlobeViewState
        };
      });
    },
    []
  );

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
        mainViewMode === "earth" ? "px-5 py-5 md:px-8" : "p-0"
      }`}
      data-main-view={mainViewMode}
      data-mobile-sheet-state={mobileSheetState}
      data-earth-projection={mainViewMode === "earth" ? projectionMode : undefined}
      data-earth-selection-revision={
        mainViewMode === "earth" ? selectionRevision : undefined
      }
      data-earth-region={mainViewMode === "earth" ? activeRegionId : undefined}
      data-earth-country={
        mainViewMode === "earth" ? selectedCountryCode ?? "" : undefined
      }
      data-earth-game={
        mainViewMode === "earth" ? selectedGameId ?? "" : undefined
      }
      data-earth-year-range={
        mainViewMode === "earth" ? `${yearRange.min}:${yearRange.max}` : undefined
      }
      data-earth-rating-range={
        mainViewMode === "earth"
          ? `${ratingRange.min}:${ratingRange.max}`
          : undefined
      }
      data-earth-cover-size={mainViewMode === "earth" ? coverSize : undefined}
      data-earth-marker-view={mainViewMode === "earth" ? viewMode : undefined}
    >
      <div className="deep-space-backdrop pointer-events-none fixed inset-0" />
      {mainViewMode === "archive" ? (
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_36%_14%,rgba(0,255,255,0.10),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(255,0,110,0.08),transparent_26%),radial-gradient(circle_at_52%_92%,rgba(82,65,255,0.07),transparent_36%)]" />
      ) : null}
      <div
        className={`relative z-10 mx-auto flex flex-col gap-4 ${
          mainViewMode === "archive"
            ? "min-h-screen w-full max-w-none"
            : mainViewMode === "earth"
              ? "earth-shell-content max-w-[1800px]"
              : "h-[100dvh] w-full max-w-none"
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
              <span>ARCHIVE ORBITAL GLOBE</span>
              <h1>Ludic Atlas <em>地球探索</em></h1>
            </div>
            <div className="earth-current-context" aria-live="polite">
              <span>当前观测</span>
              <strong>{selectedCountry
                ? `${selectedCountry.nameZh} ${selectedCountry.name}`
                : getRegionLabel(activeRegionId)}</strong>
              <small>{cameraMode === "surface" ? "近地聚焦" : "轨道巡览"}</small>
            </div>
            <div className="earth-command-actions">
              <button
                aria-label="进入游戏编年馆"
                className="earth-chronicle-button"
                onClick={() => setMainViewMode("archive")}
                type="button"
              >
                <span>编年馆</span>
                <small>Chronicle</small>
              </button>
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
            </div>
          </header>
        ) : null}

        {mainViewMode === "earth" ? (
          <section className="earth-workspace-grid" ref={earthWorkspaceRef}>
            <EarthProjectionViewport
              navigationIntent={navigationIntent}
              projectionMode={projectionMode}
              renderGlobe={() => (
                <GameGlobe
                  countries={countries}
                  games={regionFilteredGames}
                  initialViewRevision={earthViewState.globeViewRevision}
                  initialViewState={earthViewState.globeViewState}
                  navigationIntent={navigationIntent}
                  safeViewport={safeViewport}
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
                  onSettledViewState={handleSettledGlobeViewState}
                />
              )}
            />
            <RightPanel
              countries={regionCountries}
              games={regionFilteredGames}
              activeRegionId={activeRegionId}
              selectedCountry={selectedCountry}
              selectedCountryCode={selectedCountryCode}
              selectedGame={selectedGame}
              selectedGameId={selectedGameId}
              selectionRevision={selectionRevision}
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
          />
        )}

        {mainViewMode === "earth" ? (
          <BottomControls
            yearRange={yearRange}
            ratingRange={ratingRange}
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
            onRatingRangeChange={handleRatingRangeChange}
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
