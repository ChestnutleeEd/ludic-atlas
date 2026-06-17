"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MeshPhongMaterial } from "three";
import { getCountryLayerProps } from "@/components/globe/CountryLayer";
import {
  buildCountryMarkers,
  buildGameMarkers,
  createGameMarkerElement,
  type GlobeHtmlMarker
} from "@/components/globe/GameMarkers";
import {
  buildCountryDotMatrix,
  getCountryFocusPointOfView,
  type CountryDotPoint,
  type CountryGeoJson,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import { getCountryDisplayName, getViewModeLabel } from "@/lib/localization";
import {
  CAMERA_MODE_CONFIGS,
  REGION_CONFIGS,
  filterCountriesByRegion,
  getCameraModeLabel,
  getRegionConfig,
  getRegionPointOfView
} from "@/lib/regions";
import type { CameraMode, Country, Game, RegionId, ViewMode } from "@/types/game";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

const ReactGlobe = dynamic(() => import("react-globe.gl"), {
  loading: () => <GlobeLoadingState />,
  ssr: false
}) as React.ComponentType<
  GlobeProps & { ref?: React.MutableRefObject<GlobeMethods | undefined> }
>;

const REACT_GLOBE_GL_VERSION = "2.38.0";
const MAX_RENDER_PIXEL_RATIO = 1.25;
const INTERACTION_RESTORE_DELAY_MS = 200;

type GameGlobeProps = {
  countries: Country[];
  games: Game[];
  activeRegionId: RegionId;
  cameraMode: CameraMode;
  isRotateEnabled: boolean;
  selectedCountry: Country | null;
  selectedGameId: string | null;
  hoveredGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onHoverGame: (gameId: string | null) => void;
  onRegionChange: (regionId: RegionId) => void;
};

export function GameGlobe({
  countries,
  games,
  activeRegionId,
  cameraMode,
  isRotateEnabled,
  selectedCountry,
  selectedGameId,
  hoveredGameId,
  viewMode,
  coverSize,
  onSelectCountry,
  onSelectGame,
  onHoverGame,
  onRegionChange
}: GameGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionRestoreTimerRef = useRef<number | null>(null);
  const lastFocusedCountryCodeRef = useRef<string | null>(
    selectedCountry?.code ?? null
  );
  const [countryFeatures, setCountryFeatures] = useState<CountryGeoJsonFeature[]>(
    []
  );
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(
    null
  );
  const [activeWorldCountry, setActiveWorldCountry] = useState<{
    baseSelectedCountryCode: string | null;
    countryCode: string;
  } | null>(null);
  const [globeSize, setGlobeSize] = useState({ height: 720, width: 920 });
  const [isGlobeInteracting, setIsGlobeInteracting] = useState(false);
  const cameraModeConfig = CAMERA_MODE_CONFIGS[cameraMode];

  const configureControls = useCallback(() => {
    const controls = globeRef.current?.controls();

    if (!controls) {
      return;
    }

    controls.autoRotate = isRotateEnabled;
    controls.autoRotateSpeed = isRotateEnabled ? 0.24 : 0;
    controls.enableDamping = true;
    controls.dampingFactor = cameraMode === "surface" ? 0.1 : 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = cameraModeConfig.minDistance;
    controls.maxDistance = cameraModeConfig.maxDistance;
    controls.zoomSpeed = cameraModeConfig.zoomSpeed;
    controls.rotateSpeed = cameraModeConfig.rotateSpeed;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
  }, [cameraMode, cameraModeConfig, isRotateEnabled]);

  useEffect(() => {
    let active = true;

    // Source: public/data/countries.geojson simplified into a lightweight
    // runtime world outline file so the base globe can show all countries.
    fetch("/data/world-countries-lite.geojson")
      .then((response) => response.json() as Promise<CountryGeoJson>)
      .then((geoJson) => {
        if (active) {
          setCountryFeatures(geoJson.features);
        }
      })
      .catch(() => {
        if (active) {
          setCountryFeatures([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.max(320, Math.round(entry.contentRect.width));
      const height = Math.min(
        760,
        Math.max(560, Math.round(entry.contentRect.height))
      );

      setGlobeSize({ height, width });
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (interactionRestoreTimerRef.current) {
        window.clearTimeout(interactionRestoreTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedCountry || !globeRef.current) {
      return;
    }

    if (selectedCountry.code === lastFocusedCountryCodeRef.current) {
      return;
    }

    lastFocusedCountryCodeRef.current = selectedCountry.code;
    globeRef.current.pointOfView(
      getCountryFocusPointOfView(selectedCountry, cameraMode),
      900
    );
  }, [cameraMode, selectedCountry]);

  useEffect(() => {
    if (!globeRef.current || selectedCountry) {
      return;
    }

    globeRef.current.pointOfView(
      getRegionPointOfView(activeRegionId, cameraMode),
      900
    );
  }, [activeRegionId, cameraMode, selectedCountry]);

  useEffect(() => {
    configureControls();
  }, [configureControls]);

  useEffect(() => {
    if (!globeRef.current) {
      return;
    }

    const pointOfView = selectedCountry
      ? getCountryFocusPointOfView(selectedCountry, cameraMode)
      : getRegionPointOfView(activeRegionId, cameraMode);

    globeRef.current.pointOfView(pointOfView, 820);
  }, [activeRegionId, cameraMode, selectedCountry]);

  const handleFocusSelectedCountry = useCallback(() => {
    if (!selectedCountry) {
      globeRef.current?.pointOfView(
        getRegionPointOfView(activeRegionId, cameraMode),
        650
      );
      return;
    }

    globeRef.current?.pointOfView(
      getCountryFocusPointOfView(selectedCountry, cameraMode),
      720
    );
  }, [activeRegionId, cameraMode, selectedCountry]);

  const handleResetGlobalView = useCallback(() => {
    onRegionChange("global");
    globeRef.current?.pointOfView(getRegionPointOfView("global", cameraMode), 720);
  }, [cameraMode, onRegionChange]);

  const handleSelectRegion = useCallback(
    (regionId: RegionId) => {
      onRegionChange(regionId);
      globeRef.current?.pointOfView(
        getRegionPointOfView(regionId, cameraMode),
        900
      );
    },
    [cameraMode, onRegionChange]
  );

  const handleGlobeInteractionStart = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    setIsGlobeInteracting(true);
    setHoveredCountryCode(null);
  }, []);

  const handleGlobeInteractionEnd = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    interactionRestoreTimerRef.current = window.setTimeout(() => {
      setIsGlobeInteracting(false);
    }, INTERACTION_RESTORE_DELAY_MS);
  }, []);
  const handleGlobeWheel = useCallback(() => {
    handleGlobeInteractionStart();
    handleGlobeInteractionEnd();
  }, [handleGlobeInteractionEnd, handleGlobeInteractionStart]);
  const updateHtmlElementVisibility = useCallback(
    (element: HTMLElement, isVisible: boolean) => {
      element.style.opacity = isVisible ? "1" : "0";
      element.style.pointerEvents = isVisible ? "auto" : "none";
    },
    []
  );

  const selectedCountryCode = selectedCountry?.code ?? null;
  const activeRegionCountryCodes = useMemo(
    () =>
      new Set(
        filterCountriesByRegion(countries, activeRegionId).map(
          (country) => country.code
        )
      ),
    [activeRegionId, countries]
  );
  const activeCountryCode =
    activeWorldCountry?.baseSelectedCountryCode === selectedCountryCode
      ? activeWorldCountry.countryCode
      : selectedCountryCode;
  const supportedCountryCodes = useMemo(
    () => new Set(countries.map((country) => country.code)),
    [countries]
  );
  const handleHoverCountry = useCallback((countryCode: string | null) => {
    setHoveredCountryCode((currentCountryCode) =>
      currentCountryCode === countryCode ? currentCountryCode : countryCode
    );
  }, []);
  const handleSelectGlobeCountry = useCallback(
    (countryCode: string) => {
      if (supportedCountryCodes.has(countryCode)) {
        setActiveWorldCountry(null);
        onSelectCountry(countryCode);
        return;
      }

      setActiveWorldCountry({
        baseSelectedCountryCode: selectedCountryCode,
        countryCode
      });
    },
    [onSelectCountry, selectedCountryCode, supportedCountryCodes]
  );
  const countryDots = useMemo<CountryDotPoint[]>(
    () => buildCountryDotMatrix(countryFeatures, countries),
    [countries, countryFeatures]
  );
  const gameCountryCodes = useMemo(
    () =>
      new Set(
        games
          .map((game) => game.countryCode)
          .filter((countryCode) => countryCode !== "UNKNOWN")
      ),
    [games]
  );
  const countryLayerProps = useMemo(
    () =>
      getCountryLayerProps({
        activeRegionCountryCodes,
        countries,
        countryDots,
        countryFeatures,
        gameCountryCodes,
        hoveredCountryCode,
        selectedCountryCode: activeCountryCode,
        onHoverCountry: handleHoverCountry,
        onSelectCountry: handleSelectGlobeCountry
      }),
    [
      activeRegionCountryCodes,
      countries,
      countryDots,
      countryFeatures,
      gameCountryCodes,
      hoveredCountryCode,
      activeCountryCode,
      handleHoverCountry,
      handleSelectGlobeCountry
    ]
  );
  const gameMarkers = useMemo(
    () =>
      buildGameMarkers({
        activeRegionId,
        countries,
        games,
        hoveredGameId,
        selectedCountryCode,
        selectedGameId,
        viewMode
      }),
    [
      countries,
      games,
      activeRegionId,
      hoveredGameId,
      selectedCountryCode,
      selectedGameId,
      viewMode
    ]
  );
  const countryMarkers = useMemo(
    () => {
      if (isGlobeInteracting) {
        return [];
      }

      return buildCountryMarkers({
        countries,
        hoveredCountryCode,
        selectedCountryCode
      }).filter((marker) => marker.hovered || marker.selected);
    },
    [countries, hoveredCountryCode, isGlobeInteracting, selectedCountryCode]
  );
  const visibleGameMarkers = useMemo(() => {
    return gameMarkers.map((marker) => ({
      ...marker,
      markerStyle: isGlobeInteracting ? "dot" as const : marker.markerStyle
    }));
  }, [gameMarkers, isGlobeInteracting]);
  const globeHtmlMarkers = useMemo<GlobeHtmlMarker[]>(
    () => [...countryMarkers, ...visibleGameMarkers],
    [countryMarkers, visibleGameMarkers]
  );
  const createMarkerElement = useMemo(
    () =>
      createGameMarkerElement({
        coverSize: Math.round(
          coverSize * (activeRegionId === "global" ? 0.82 : 1.08)
        ),
        loadCoverImages: true,
        renderCoverMarkers: !isGlobeInteracting,
        onHoverCountry: handleHoverCountry,
        onHoverGame,
        onSelectCountry: handleSelectGlobeCountry,
        onSelectGame
      }),
    [
      activeRegionId,
      coverSize,
      handleHoverCountry,
      handleSelectGlobeCountry,
      isGlobeInteracting,
      onHoverGame,
      onSelectGame
    ]
  );
  const rendererConfig = useMemo(
    () => ({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance" as const
    }),
    []
  );
  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: "#050505",
        emissive: "#050403",
        emissiveIntensity: 0.12,
        shininess: 4,
        specular: "#7A5A2A"
      }),
    []
  );
  const activeRegion = getRegionConfig(activeRegionId);
  const activeCameraPointOfView = selectedCountry
    ? getCountryFocusPointOfView(selectedCountry, cameraMode)
    : getRegionPointOfView(activeRegionId, cameraMode);
  const activeCameraLabel = selectedCountry
    ? getCountryDisplayName(selectedCountry)
    : `${activeRegion.labelZh} ${activeRegion.label}`;

  return (
    <section className="glass-panel atlas-globe-panel relative min-h-[690px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_46%,rgba(217,154,50,0.052),transparent_30%),linear-gradient(135deg,rgba(3,3,3,0.98),rgba(11,10,8,0.9))]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle,rgba(240,182,90,0.42)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(245,239,227,0.018)_50%,rgba(217,154,50,0.026)_52%,transparent_59%)]" />
      <div className="relative z-10 flex h-full min-h-[690px] flex-col justify-between gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-[#F0B65A]">
              Cinematic Camera / {getCameraModeLabel(cameraMode)}
            </p>
            <p className="mt-1 text-xs text-[#A99D8B]">
              react-globe.gl {REACT_GLOBE_GL_VERSION}，当前镜头：{activeCameraLabel}，altitude {activeCameraPointOfView.altitude.toFixed(2)}。
            </p>
          </div>
          <div className="grid gap-2 md:w-[31rem]">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="stat-tile p-2">
                <dt className="text-[#A99D8B]">当前国家</dt>
                <dd className="mt-1 text-[#F0B65A]">
                  {selectedCountry ? getCountryDisplayName(selectedCountry) : "未选择"}
                </dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-[#A99D8B]">展示模式</dt>
                <dd className="mt-1 text-[#F0B65A]">{getViewModeLabel(viewMode)}</dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-[#A99D8B]">世界轮廓</dt>
                <dd className="mt-1 text-[#F0B65A]">{countryFeatures.length}</dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-[#A99D8B]">地图游戏标记</dt>
                <dd className="mt-1 text-[#F0B65A]">{visibleGameMarkers.length}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div
          className="real-globe-stage relative min-h-[560px] flex-1 overflow-hidden"
          onPointerDown={handleGlobeInteractionStart}
          onPointerLeave={handleGlobeInteractionEnd}
          onPointerUp={handleGlobeInteractionEnd}
          onWheel={handleGlobeWheel}
          ref={containerRef}
        >
          <div className="pointer-events-none absolute left-[42%] top-1/2 h-[min(90vw,800px)] w-[min(90vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,182,90,0.05),rgba(122,90,42,0.032)_42%,transparent_68%)] blur-2xl" />
          <div className="pointer-events-none absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-[#D99A32]/55 to-transparent" />
          <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
            <button
              className="globe-view-button"
              onClick={handleResetGlobalView}
              type="button"
            >
              全球视角
            </button>
            <button
              className="globe-view-button"
              onClick={handleFocusSelectedCountry}
              type="button"
            >
              聚焦当前国家
            </button>
            <div className="region-preset-group" aria-label="地区镜头">
              {REGION_CONFIGS.map((regionConfig) => (
                <button
                  className={regionConfig.id === activeRegionId ? "is-active" : ""}
                  key={regionConfig.id}
                  onClick={() => handleSelectRegion(regionConfig.id)}
                  type="button"
                >
                  {regionConfig.label}
                </button>
              ))}
            </div>
          </div>
          <ReactGlobe
            ref={globeRef}
            {...countryLayerProps}
            atmosphereAltitude={0.18}
            atmosphereColor="#D99A32"
            backgroundColor="rgba(0,0,0,0)"
            enablePointerInteraction
            globeMaterial={globeMaterial}
            height={globeSize.height}
            htmlAltitude={(marker) =>
              (marker as GlobeHtmlMarker).kind === "country"
                ? 0.058
                : (marker as GlobeHtmlMarker).selected ||
                    ((marker as GlobeHtmlMarker).kind === "game" &&
                      (marker as Extract<GlobeHtmlMarker, { kind: "game" }>)
                        .sameCountrySelected)
                  ? 0.03
                  : 0.02
            }
            htmlElement={createMarkerElement}
            htmlElementVisibilityModifier={updateHtmlElementVisibility}
            htmlElementsData={globeHtmlMarkers}
            htmlLat={(marker) => (marker as GlobeHtmlMarker).lat}
            htmlLng={(marker) => (marker as GlobeHtmlMarker).lng}
            htmlTransitionDuration={0}
            onGlobeReady={() => {
              const controls = globeRef.current?.controls();
              const renderer = globeRef.current?.renderer();

              renderer?.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO)
              );

              if (controls) {
                configureControls();
                controls.addEventListener("start", handleGlobeInteractionStart);
                controls.addEventListener("end", handleGlobeInteractionEnd);
              }

              lastFocusedCountryCodeRef.current = selectedCountry?.code ?? null;
              globeRef.current?.pointOfView(
                selectedCountry
                  ? getCountryFocusPointOfView(selectedCountry, cameraMode)
                  : getRegionPointOfView(activeRegionId, cameraMode),
                0
              );
            }}
            polygonCapCurvatureResolution={2}
            rendererConfig={rendererConfig}
            showAtmosphere
            showGlobe
            showGraticules={false}
            showPointerCursor={(objectType, objectData) => {
              if (objectType === "polygon") {
                return Boolean(objectData);
              }

              return objectType === "html";
            }}
            width={globeSize.width}
          />
          {countryFeatures.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[#A99D8B]">
              正在加载国家边界…
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function GlobeLoadingState() {
  return (
    <div className="grid min-h-[430px] place-items-center text-sm text-[#A99D8B]">
      正在启动 3D 地球…
    </div>
  );
}
