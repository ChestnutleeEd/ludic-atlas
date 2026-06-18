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
  type GlobePointOfView,
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

const MAX_RENDER_PIXEL_RATIO = 1.25;
const INTERACTION_RESTORE_DELAY_MS = 200;
const MANUAL_ZOOM_TRANSITION_MS = 360;
const COUNTRY_FOCUS_PRESET_CODES = [
  "JP",
  "CN",
  "US",
  "KR",
  "GB",
  "NL",
  "BE",
  "CH",
  "DK"
] as const;
const ZOOM_ALTITUDE_MULTIPLIER = {
  in: 0.82,
  out: 1.18
} as const;

export type GlobeCameraCommand = {
  id: number;
  type: "focusSelected" | "reset" | "zoomIn" | "zoomOut";
};

type GameGlobeProps = {
  countries: Country[];
  games: Game[];
  activeRegionId: RegionId;
  cameraMode: CameraMode;
  isRotateEnabled: boolean;
  selectedCountry: Country | null;
  selectedGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  cameraCommand: GlobeCameraCommand | null;
  onClearCountry: () => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onRegionChange: (regionId: RegionId) => void;
  onInteractionStart?: () => void;
};

export function GameGlobe({
  countries,
  games,
  activeRegionId,
  cameraMode,
  isRotateEnabled,
  selectedCountry,
  selectedGameId,
  viewMode,
  coverSize,
  cameraCommand,
  onClearCountry,
  onSelectCountry,
  onSelectGame,
  onRegionChange,
  onInteractionStart
}: GameGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionRestoreTimerRef = useRef<number | null>(null);
  const lastCameraPointOfViewRef = useRef<GlobePointOfView>(
    selectedCountry
      ? getCountryFocusPointOfView(selectedCountry, cameraMode)
      : getRegionPointOfView(activeRegionId, cameraMode)
  );
  const [countryFeatures, setCountryFeatures] = useState<CountryGeoJsonFeature[]>(
    []
  );
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(
    null
  );
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [activeWorldCountry, setActiveWorldCountry] = useState<{
    baseSelectedCountryCode: string | null;
    countryCode: string;
  } | null>(null);
  const [globeSize, setGlobeSize] = useState({ height: 720, width: 920 });
  const [isGlobeInteracting, setIsGlobeInteracting] = useState(false);
  const cameraModeConfig = CAMERA_MODE_CONFIGS[cameraMode];

  const setGlobePointOfView = useCallback(
    (pointOfView: GlobePointOfView, transitionMs: number) => {
      lastCameraPointOfViewRef.current = pointOfView;
      globeRef.current?.pointOfView(pointOfView, transitionMs);
    },
    []
  );

  const getCurrentPointOfView = useCallback((): GlobePointOfView => {
    const currentPointOfView = globeRef.current?.pointOfView();
    const fallbackPointOfView = lastCameraPointOfViewRef.current;

    return {
      altitude: getNumberOrFallback(
        currentPointOfView?.altitude,
        fallbackPointOfView.altitude
      ),
      lat: getNumberOrFallback(currentPointOfView?.lat, fallbackPointOfView.lat),
      lng: getNumberOrFallback(currentPointOfView?.lng, fallbackPointOfView.lng)
    };
  }, []);

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
    configureControls();
  }, [configureControls]);

  useEffect(() => {
    if (!globeRef.current) {
      return;
    }

    const pointOfView = selectedCountry
      ? getCountryFocusPointOfView(selectedCountry, cameraMode)
      : getRegionPointOfView(activeRegionId, cameraMode);

    setGlobePointOfView(pointOfView, 820);
  }, [activeRegionId, cameraMode, selectedCountry, setGlobePointOfView]);

  const handleFocusSelectedCountry = useCallback(() => {
    if (!selectedCountry) {
      setGlobePointOfView(
        getRegionPointOfView(activeRegionId, cameraMode),
        650
      );
      return;
    }

    setGlobePointOfView(
      getCountryFocusPointOfView(selectedCountry, cameraMode),
      720
    );
  }, [activeRegionId, cameraMode, selectedCountry, setGlobePointOfView]);

  const handleResetGlobalView = useCallback(() => {
    onClearCountry();
    setActiveWorldCountry(null);
    onRegionChange("global");
    setGlobePointOfView(getRegionPointOfView("global", cameraMode), 720);
  }, [cameraMode, onClearCountry, onRegionChange, setGlobePointOfView]);

  const handleSelectRegion = useCallback(
    (regionId: RegionId) => {
      onRegionChange(regionId);
    },
    [onRegionChange]
  );

  const handleZoomCamera = useCallback(
    (direction: keyof typeof ZOOM_ALTITUDE_MULTIPLIER) => {
      const pointOfView = getCurrentPointOfView();
      const altitude = clamp(
        pointOfView.altitude * ZOOM_ALTITUDE_MULTIPLIER[direction],
        cameraModeConfig.minAltitude,
        cameraModeConfig.maxAltitude
      );

      setGlobePointOfView(
        {
          ...pointOfView,
          altitude
        },
        MANUAL_ZOOM_TRANSITION_MS
      );
    },
    [cameraModeConfig, getCurrentPointOfView, setGlobePointOfView]
  );

  useEffect(() => {
    if (!cameraCommand) {
      return;
    }

    if (cameraCommand.type === "reset") {
      setGlobePointOfView(getRegionPointOfView("global", cameraMode), 720);
      return;
    }

    if (cameraCommand.type === "focusSelected") {
      handleFocusSelectedCountry();
      return;
    }

    handleZoomCamera(cameraCommand.type === "zoomIn" ? "in" : "out");
  }, [
    cameraCommand,
    cameraMode,
    handleFocusSelectedCountry,
    handleZoomCamera,
    setGlobePointOfView
  ]);

  const handleGlobeInteractionStart = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    onInteractionStart?.();
    setIsGlobeInteracting(true);
    setHoveredCountryCode(null);
  }, [onInteractionStart]);

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
          coverSize * (activeRegionId === "global" ? 0.72 : 0.92)
        ),
        loadCoverImages: true,
        renderCoverMarkers: !isGlobeInteracting,
        onHoverCountry: handleHoverCountry,
        onHoverGame: setHoveredGameId,
        onSelectCountry: handleSelectGlobeCountry,
        onSelectGame
      }),
    [
      activeRegionId,
      coverSize,
      handleHoverCountry,
      handleSelectGlobeCountry,
      isGlobeInteracting,
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
  const activeCameraLabel = selectedCountry
    ? getCountryDisplayName(selectedCountry)
    : `${activeRegion.labelZh} ${activeRegion.label}`;
  const focusPresetCountries = useMemo(
    () =>
      COUNTRY_FOCUS_PRESET_CODES.map((countryCode) =>
        countries.find((country) => country.code === countryCode)
      ).filter((country): country is Country => Boolean(country)),
    [countries]
  );

  return (
    <section className="glass-panel atlas-globe-panel relative min-h-[690px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_46%,rgba(217,154,50,0.052),transparent_30%),linear-gradient(135deg,rgba(3,3,3,0.98),rgba(11,10,8,0.9))]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle,rgba(240,182,90,0.42)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(245,239,227,0.018)_50%,rgba(217,154,50,0.026)_52%,transparent_59%)]" />
      <div className="relative z-10 flex h-full min-h-[690px] flex-col justify-between gap-4 p-4">
        <div className="atlas-globe-status grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-[#F0B65A]">
              当前镜头 / {getCameraModeLabel(cameraMode)}
            </p>
            <p className="mt-1 text-xs text-[#A99D8B]">
              {activeCameraLabel} · {visibleGameMarkers.length} 个地图标记 · 按开发商 / 工作室国家归属。
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
                <dt className="text-[#A99D8B]">国家边界</dt>
                <dd className="mt-1 text-[#F0B65A]">{countryFeatures.length}</dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-[#A99D8B]">地图标记</dt>
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
              aria-label="重置为全球视角"
              className="globe-view-button"
              onClick={handleResetGlobalView}
              type="button"
            >
              重置 Reset
            </button>
            <button
              aria-label="放大地球镜头"
              className="globe-view-button"
              onClick={() => handleZoomCamera("in")}
              type="button"
            >
              放大
            </button>
            <button
              aria-label="缩小地球镜头"
              className="globe-view-button"
              onClick={() => handleZoomCamera("out")}
              type="button"
            >
              缩小
            </button>
            <button
              aria-label="聚焦当前选中国家"
              disabled={!selectedCountry}
              className="globe-view-button"
              onClick={handleFocusSelectedCountry}
              type="button"
            >
              聚焦 Focus
            </button>
            <div className="region-preset-group" aria-label="地区镜头" role="group">
              {REGION_CONFIGS.map((regionConfig) => (
                <button
                  aria-pressed={regionConfig.id === activeRegionId}
                  className={regionConfig.id === activeRegionId ? "is-active" : ""}
                  key={regionConfig.id}
                  onClick={() => handleSelectRegion(regionConfig.id)}
                  type="button"
                >
                  {regionConfig.label}
                </button>
              ))}
            </div>
            <div
              aria-label="重点国家镜头"
              className="region-preset-group focus-preset-group"
              role="group"
            >
              {focusPresetCountries.map((country) => (
                <button
                  aria-pressed={country.code === selectedCountryCode}
                  className={country.code === selectedCountryCode ? "is-active" : ""}
                  key={country.code}
                  onClick={() => onSelectCountry(country.code)}
                  type="button"
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
          <div className="globe-map-legend" aria-label="地图图例">
            <span>
              <i className="legend-pin" />
              代表游戏
            </span>
            <span>
              <i className="legend-dot" />
              国家热点
            </span>
            <span>
              <i className="legend-ring" />
              选中区域
            </span>
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

              setGlobePointOfView(
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
            <div
              aria-live="polite"
              className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[#A99D8B]"
            >
              正在加载国家边界…
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNumberOrFallback(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function GlobeLoadingState() {
  return (
    <div className="grid min-h-[430px] place-items-center text-sm text-[#A99D8B]">
      正在启动 3D 地球…
    </div>
  );
}
