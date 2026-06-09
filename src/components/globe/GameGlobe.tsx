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
  getGlobalPointOfView,
  type CountryDotPoint,
  type CountryGeoJson,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import { getCountryDisplayName, getViewModeLabel } from "@/lib/localization";
import type { Country, Game, ViewMode } from "@/types/game";
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
  selectedCountry: Country | null;
  selectedGameId: string | null;
  hoveredGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onHoverGame: (gameId: string | null) => void;
};

export function GameGlobe({
  countries,
  games,
  selectedCountry,
  selectedGameId,
  hoveredGameId,
  viewMode,
  coverSize,
  onSelectCountry,
  onSelectGame,
  onHoverGame
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
    globeRef.current.pointOfView(getCountryFocusPointOfView(selectedCountry), 780);
  }, [selectedCountry]);

  const handleFocusSelectedCountry = useCallback(() => {
    if (!selectedCountry) {
      globeRef.current?.pointOfView(getGlobalPointOfView(), 650);
      return;
    }

    globeRef.current?.pointOfView(getCountryFocusPointOfView(selectedCountry), 720);
  }, [selectedCountry]);

  const handleResetGlobalView = useCallback(() => {
    globeRef.current?.pointOfView(getGlobalPointOfView(), 720);
  }, []);

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
  const countryLayerProps = useMemo(
    () =>
      getCountryLayerProps({
        countries,
        countryDots,
        countryFeatures,
        hoveredCountryCode,
        selectedCountryCode: activeCountryCode,
        onHoverCountry: handleHoverCountry,
        onSelectCountry: handleSelectGlobeCountry
      }),
    [
      countries,
      countryDots,
      countryFeatures,
      hoveredCountryCode,
      activeCountryCode,
      handleHoverCountry,
      handleSelectGlobeCountry
    ]
  );
  const gameMarkers = useMemo(
    () =>
      buildGameMarkers({
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
    if (selectedCountryCode) {
      return gameMarkers
        .filter((marker) => marker.game.countryCode === selectedCountryCode)
        .map((marker) => ({
          ...marker,
          markerStyle: isGlobeInteracting ? "dot" as const : "card" as const
        }));
    }

    const representativeMarkers = new Map<string, GlobeHtmlMarker>();

    for (const marker of gameMarkers) {
      if (marker.kind !== "game") {
        continue;
      }

      const currentMarker = representativeMarkers.get(marker.game.countryCode);

      if (
        !currentMarker ||
        (currentMarker.kind === "game" &&
          marker.game.rating > currentMarker.game.rating)
      ) {
        representativeMarkers.set(marker.game.countryCode, {
          ...marker,
          markerStyle: isGlobeInteracting ? "dot" : "card"
        });
      }
    }

    return [...representativeMarkers.values()];
  }, [gameMarkers, isGlobeInteracting, selectedCountryCode]);
  const globeHtmlMarkers = useMemo<GlobeHtmlMarker[]>(
    () => [...countryMarkers, ...visibleGameMarkers],
    [countryMarkers, visibleGameMarkers]
  );
  const createMarkerElement = useMemo(
    () =>
      createGameMarkerElement({
        coverSize,
        renderCoverMarkers: !isGlobeInteracting,
        onHoverCountry: handleHoverCountry,
        onHoverGame,
        onSelectCountry: handleSelectGlobeCountry,
        onSelectGame
      }),
    [
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
        color: "#010202",
        emissive: "#000000",
        emissiveIntensity: 0.08,
        shininess: 4,
        specular: "#8ff6ff"
      }),
    []
  );

  return (
    <section className="glass-panel relative min-h-[690px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,0.035),transparent_28%),linear-gradient(135deg,rgba(0,0,0,0.96),rgba(4,6,7,0.9))]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(245,250,255,0.72)_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(245,250,255,0.025)_50%,rgba(125,245,255,0.025)_52%,transparent_59%)]" />
      <div className="relative z-10 flex h-full min-h-[690px] flex-col justify-between gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-cyan-100 drop-shadow-[0_0_14px_rgba(0,240,255,0.42)]">
              真实 3D 世界地球
            </p>
            <p className="mt-1 text-xs text-cyan-50/55">
              react-globe.gl {REACT_GLOBE_GL_VERSION}，完整世界轮廓，手动拖拽旋转和缩放。
            </p>
          </div>
          <div className="grid gap-2 md:w-[31rem]">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="stat-tile p-2">
                <dt className="text-cyan-50/50">当前国家</dt>
                <dd className="mt-1 text-cyan-200">
                  {selectedCountry ? getCountryDisplayName(selectedCountry) : "未选择"}
                </dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-cyan-50/50">展示模式</dt>
                <dd className="mt-1 text-cyan-200">{getViewModeLabel(viewMode)}</dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-cyan-50/50">世界轮廓</dt>
                <dd className="mt-1 text-cyan-200">{countryFeatures.length}</dd>
              </div>
              <div className="stat-tile p-2">
                <dt className="text-cyan-50/50">地图游戏标记</dt>
                <dd className="mt-1 text-cyan-200">{visibleGameMarkers.length}</dd>
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
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(86vw,760px)] w-[min(86vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,250,255,0.055),rgba(96,225,245,0.026)_42%,transparent_68%)] blur-2xl" />
          <div className="pointer-events-none absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent" />
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
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
          </div>
          <ReactGlobe
            ref={globeRef}
            {...countryLayerProps}
            atmosphereAltitude={0.18}
            atmosphereColor="#00f0ff"
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
                controls.autoRotate = false;
                controls.autoRotateSpeed = 0;
                controls.enableDamping = true;
                controls.dampingFactor = 0.07;
                controls.enablePan = false;
                controls.enableZoom = true;
                controls.minDistance = 120;
                controls.maxDistance = 880;
                controls.zoomSpeed = 0.72;
                controls.rotateSpeed = 0.62;
                controls.addEventListener("start", handleGlobeInteractionStart);
                controls.addEventListener("end", handleGlobeInteractionEnd);
              }

              lastFocusedCountryCodeRef.current = selectedCountry?.code ?? null;
              globeRef.current?.pointOfView(getGlobalPointOfView(), 0);
            }}
            polygonCapCurvatureResolution={2}
            rendererConfig={rendererConfig}
            showAtmosphere={false}
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
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-cyan-50/60">
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
    <div className="grid min-h-[430px] place-items-center text-sm text-cyan-50/60">
      正在启动 3D 地球…
    </div>
  );
}
