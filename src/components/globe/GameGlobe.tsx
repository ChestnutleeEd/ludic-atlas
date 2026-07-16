"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MeshPhongMaterial,
  type Object3D
} from "three";
import {
  buildCountryMarkers,
  buildGameMarkers,
  createGameMarkerElement,
  type GlobeHtmlMarker
} from "@/components/globe/GameMarkers";
import {
  getCountryFocusPointOfView,
  getCountryFeatureKey,
  indexCountryFeatures,
  isCoordinateInsideFeature,
  type GlobePointOfView,
  type CountryGeoJson,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import { createCameraAnimator, getCameraDuration } from "@/lib/globeCamera";
import { getCountryDisplayName } from "@/lib/localization";
import {
  CAMERA_MODE_CONFIGS,
  REGION_CONFIGS,
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

const MAX_RENDER_PIXEL_RATIO = 1;
const GLOBE_RADIUS = 100;
const PERSISTENT_BOUNDARY_ALTITUDE = 0.0022;
const MAX_PERSISTENT_BOUNDARY_POINTS_PER_RING = 144;
const SELECTED_BOUNDARY_ALTITUDE = 0.0045;
const MAX_SELECTED_BOUNDARY_POINTS_PER_RING = 240;
const SELECTED_BOUNDARY_OPTIONS = {
  altitude: SELECTED_BOUNDARY_ALTITUDE,
  color: "#ff006e",
  maxPointsPerRing: MAX_SELECTED_BOUNDARY_POINTS_PER_RING,
  opacity: 0.96,
  renderOrder: 2
} as const;
const INTERACTION_RESTORE_DELAY_MS = 200;
const MANUAL_ZOOM_TRANSITION_MS = 440;
const COUNTRY_FOCUS_PRESET_CODES = [
  "JP",
  "SE",
  "NO",
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
  onClearCountry: () => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onRegionChange: (regionId: RegionId) => void;
  onCameraModeChange: (cameraMode: CameraMode) => void;
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
  onClearCountry,
  onSelectCountry,
  onSelectGame,
  onRegionChange,
  onCameraModeChange,
  onInteractionStart
}: GameGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const locationPickerRef = useRef<HTMLDetailsElement>(null);
  const interactionRestoreTimerRef = useRef<number | null>(null);
  const cameraDetailRestoreTimerRef = useRef<number | null>(null);
  const controlsCleanupRef = useRef<(() => void) | null>(null);
  const cameraAnimatorRef = useRef<ReturnType<typeof createCameraAnimator> | null>(null);
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
  const [activeWorldCountry, setActiveWorldCountry] = useState<{
    baseSelectedCountryCode: string | null;
    countryCode: string;
  } | null>(null);
  const [globeSize, setGlobeSize] = useState({ height: 640, width: 920 });
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);
  const [isGlobeInteracting, setIsGlobeInteracting] = useState(false);
  const cameraModeConfig = CAMERA_MODE_CONFIGS[cameraMode];
  const getViewportAdjustedPointOfView = useCallback(
    (pointOfView: GlobePointOfView, isCountryFocus: boolean) => {
      const portraitRatio = globeSize.height / Math.max(1, globeSize.width);

      if (portraitRatio <= 1.25) {
        return pointOfView;
      }

      const altitudeFactor = isCountryFocus
        ? Math.min(1.32, 1 + (portraitRatio - 1) * 0.25)
        : Math.min(1.55, 1 + (portraitRatio - 1) * 0.5);

      return {
        ...pointOfView,
        altitude: pointOfView.altitude * altitudeFactor
      };
    },
    [globeSize.height, globeSize.width]
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

  const getCameraAnimator = useCallback(() => {
    if (!cameraAnimatorRef.current) {
      cameraAnimatorRef.current = createCameraAnimator({
        cancelFrame: (id) => window.cancelAnimationFrame(id),
        now: () => performance.now(),
        requestFrame: (callback) => window.requestAnimationFrame(callback),
        write: (pointOfView) => {
          lastCameraPointOfViewRef.current = pointOfView;
          if (containerRef.current) {
            containerRef.current.dataset.cameraAltitude = pointOfView.altitude.toFixed(3);
          }
          globeRef.current?.pointOfView(pointOfView, 0);
        }
      });
    }
    return cameraAnimatorRef.current;
  }, []);

  const setGlobePointOfView = useCallback(
    (pointOfView: GlobePointOfView, transitionMs: number) => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = getCameraDuration(transitionMs, reducedMotion);

      if (duration > 0 && containerRef.current) {
        delete containerRef.current.dataset.countryFocusX;
        delete containerRef.current.dataset.countryFocusY;
      }

      if (cameraDetailRestoreTimerRef.current) {
        window.clearTimeout(cameraDetailRestoreTimerRef.current);
        cameraDetailRestoreTimerRef.current = null;
      }

      setIsCameraAnimating(duration > 0);
      if (duration > 0) {
        cameraDetailRestoreTimerRef.current = window.setTimeout(() => {
          cameraDetailRestoreTimerRef.current = null;
          setIsCameraAnimating(false);
        }, duration + INTERACTION_RESTORE_DELAY_MS);
      }

      getCameraAnimator().animate(getCurrentPointOfView(), pointOfView, duration);
    },
    [getCameraAnimator, getCurrentPointOfView]
  );

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
    const controller = new AbortController();

    // Source: public/data/countries.geojson simplified into a lightweight
    // runtime world outline file so the base globe can show all countries.
    async function loadCountryFeatures() {
      try {
        const response = await fetch("/data/world-countries-lite.geojson", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Country GeoJSON request failed: ${response.status}`);
        }

        const geoJson = (await response.json()) as CountryGeoJson;
        setCountryFeatures(geoJson.features);
      } catch {
        if (!controller.signal.aborted) {
          setCountryFeatures([]);
        }
      }
    }

    void loadCountryFeatures();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.max(320, Math.round(entry.contentRect.width));
      const height = Math.max(320, Math.round(entry.contentRect.height));

      setGlobeSize((currentSize) =>
        currentSize.height === height && currentSize.width === width
          ? currentSize
          : { height, width }
      );
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(
    () => () => {
      cameraAnimatorRef.current?.cancel();
      controlsCleanupRef.current?.();
      if (interactionRestoreTimerRef.current) {
        window.clearTimeout(interactionRestoreTimerRef.current);
      }
      if (cameraDetailRestoreTimerRef.current) {
        window.clearTimeout(cameraDetailRestoreTimerRef.current);
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

    const targetPointOfView = selectedCountry
      ? getCountryFocusPointOfView(selectedCountry, cameraMode)
      : getRegionPointOfView(activeRegionId, cameraMode);
    const pointOfView = getViewportAdjustedPointOfView(
      targetPointOfView,
      Boolean(selectedCountry)
    );

    setGlobePointOfView(pointOfView, selectedCountry ? 680 : 620);
  }, [activeRegionId, cameraMode, getViewportAdjustedPointOfView, selectedCountry, setGlobePointOfView]);

  useEffect(() => {
    if (
      isCameraAnimating ||
      cameraDetailRestoreTimerRef.current !== null ||
      !selectedCountry ||
      !containerRef.current
    ) {
      return;
    }

    const screenPosition = globeRef.current?.getScreenCoords(
      selectedCountry.latitude,
      selectedCountry.longitude
    );
    if (screenPosition) {
      containerRef.current.dataset.countryFocusX = screenPosition.x.toFixed(2);
      containerRef.current.dataset.countryFocusY = screenPosition.y.toFixed(2);
    }
  }, [globeSize.height, globeSize.width, isCameraAnimating, selectedCountry]);

  const handleFocusSelectedCountry = useCallback(() => {
    if (!selectedCountry) {
      setGlobePointOfView(
        getViewportAdjustedPointOfView(
          getRegionPointOfView(activeRegionId, cameraMode),
          false
        ),
        520
      );
      return;
    }

    onCameraModeChange("surface");
    setGlobePointOfView(
      getViewportAdjustedPointOfView(
        getCountryFocusPointOfView(selectedCountry, "surface"),
        true
      ),
      680
    );
  }, [activeRegionId, cameraMode, getViewportAdjustedPointOfView, onCameraModeChange, selectedCountry, setGlobePointOfView]);

  const handleResetGlobalView = useCallback(() => {
    onClearCountry();
    setActiveWorldCountry(null);
    onRegionChange("global");
  }, [onClearCountry, onRegionChange]);

  const handleSelectRegion = useCallback(
    (regionId: RegionId) => {
      if (locationPickerRef.current) {
        locationPickerRef.current.open = false;
      }
      onRegionChange(regionId);
    },
    [onRegionChange]
  );

  const handleSelectFocusCountry = useCallback(
    (countryCode: string) => {
      if (locationPickerRef.current) {
        locationPickerRef.current.open = false;
      }
      onSelectCountry(countryCode);
    },
    [onSelectCountry]
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

  const handleGlobeInteractionStart = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    onInteractionStart?.();
    cameraAnimatorRef.current?.cancel();
    if (cameraDetailRestoreTimerRef.current) {
      window.clearTimeout(cameraDetailRestoreTimerRef.current);
      cameraDetailRestoreTimerRef.current = null;
    }
    setIsCameraAnimating(false);
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
  const updateHtmlElementVisibility = useCallback(
    (element: HTMLElement, isVisible: boolean) => {
      const nextVisibility = isVisible ? "visible" : "hidden";
      if (element.dataset.visibility === nextVisibility) return;
      element.dataset.visibility = nextVisibility;
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
  const handleSelectPickedCountry = useCallback(
    (countryCode: string) => {
      if (containerRef.current) {
        containerRef.current.dataset.lastSurfaceCountry = countryCode;
      }
      handleSelectGlobeCountry(countryCode);
    },
    [handleSelectGlobeCountry]
  );
  const countryFeatureByCode = useMemo(
    () => indexCountryFeatures(countryFeatures),
    [countryFeatures]
  );
  const handleGlobeSurfaceClick = useCallback(
    (coordinate: { lat: number; lng: number }) => {
      if (containerRef.current) {
        containerRef.current.dataset.lastGlobeLat = coordinate.lat.toFixed(4);
        containerRef.current.dataset.lastGlobeLng = coordinate.lng.toFixed(4);
      }
      const feature = countryFeatures.find((candidate) =>
        isCoordinateInsideFeature(candidate, coordinate)
      );
      const countryCode = feature ? getCountryFeatureKey(feature) : null;

      if (countryCode) {
        handleSelectPickedCountry(countryCode);
      }
    },
    [countryFeatures, handleSelectPickedCountry]
  );
  const handleCustomBoundaryClick = useCallback(
    (
      _object: object,
      _event: MouseEvent,
      coordinate: { lat: number; lng: number }
    ) => {
      handleGlobeSurfaceClick(coordinate);
    },
    [handleGlobeSurfaceClick]
  );
  const gameMarkers = useMemo(
    () =>
      buildGameMarkers({
        activeRegionId,
        countries,
        countryFeatureByCode,
        games,
        selectedCountryCode,
        selectedGameId,
        viewMode
      }),
    [
      countries,
      countryFeatureByCode,
      games,
      activeRegionId,
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
      }).filter((marker) => marker.hovered);
    },
    [countries, hoveredCountryCode, isGlobeInteracting, selectedCountryCode]
  );
  const visibleGameMarkers = gameMarkers;
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
        renderCoverMarkers: true,
        onHoverCountry: handleHoverCountry,
        onSelectCountry: handleSelectGlobeCountry,
        onSelectGame
      }),
    [
      activeRegionId,
      coverSize,
      handleHoverCountry,
      handleSelectGlobeCountry,
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
        color: "#030712",
        emissive: "#06111f",
        emissiveIntensity: 0.2,
        shininess: 5,
        specular: "#24505c"
      }),
    []
  );
  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);
  const persistentBoundaryMesh = useMemo(
    () =>
      countryFeatures.length > 0
        ? buildBoundaryMesh(countryFeatures, {
            altitude: PERSISTENT_BOUNDARY_ALTITUDE,
            color: "#168ba8",
            maxPointsPerRing: MAX_PERSISTENT_BOUNDARY_POINTS_PER_RING,
            opacity: 0.46,
            renderOrder: 1
          })
        : null,
    [countryFeatures]
  );
  const selectedBoundaryMesh = useMemo(
    () =>
      countryFeatures.length > 0
        ? buildBoundaryMesh([], SELECTED_BOUNDARY_OPTIONS)
        : null,
    [countryFeatures.length]
  );
  const persistentBoundaryLayerData = useMemo<Object3D[]>(() => {
    const meshes: Object3D[] = [];
    if (persistentBoundaryMesh) meshes.push(persistentBoundaryMesh);
    if (selectedBoundaryMesh) meshes.push(selectedBoundaryMesh);
    return meshes;
  }, [persistentBoundaryMesh, selectedBoundaryMesh]);
  const persistentBoundarySegmentCount = persistentBoundaryMesh
    ? persistentBoundaryMesh.geometry.getAttribute("position").count / 2
    : 0;
  const getPersistentBoundaryObject = useCallback(
    (object: object) => object as Object3D,
    []
  );
  useEffect(
    () => () => {
      persistentBoundaryMesh?.geometry.dispose();
      persistentBoundaryMesh?.material.dispose();
    },
    [persistentBoundaryMesh]
  );
  useEffect(
    () => () => {
      selectedBoundaryMesh?.geometry.dispose();
      selectedBoundaryMesh?.material.dispose();
    },
    [selectedBoundaryMesh]
  );
  useEffect(() => {
    if (!selectedBoundaryMesh) {
      return;
    }

    const selectedFeature = activeCountryCode
      ? countryFeatureByCode.get(activeCountryCode)
      : null;
    const nextMesh = buildBoundaryMesh(
      selectedFeature ? [selectedFeature] : [],
      SELECTED_BOUNDARY_OPTIONS
    );
    selectedBoundaryMesh.geometry.copy(nextMesh.geometry);
    nextMesh.geometry.dispose();
    nextMesh.material.dispose();
  }, [activeCountryCode, countryFeatureByCode, selectedBoundaryMesh]);
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
  const isLowDetailRendering =
    isCameraAnimating || isGlobeInteracting || isRotateEnabled;

  return (
    <section className="glass-panel atlas-globe-panel relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_46%,rgba(0,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(3,7,18,0.98),rgba(10,0,20,0.94))]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle,rgba(0,255,255,0.36)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(234,244,255,0.018)_50%,rgba(255,0,110,0.028)_52%,transparent_59%)]" />
      <div className="relative z-10 h-full min-h-0 p-2">
        <div
          className={`real-globe-stage relative min-h-0 flex-1 overflow-hidden ${
            isGlobeInteracting ? "is-globe-interacting" : ""
          } ${isLowDetailRendering ? "is-globe-low-detail" : ""}`}
          data-camera-travelling={isCameraAnimating}
          data-camera-mode={cameraMode}
          data-country-picking="globe-coordinates"
          data-world-boundary-point-limit={MAX_PERSISTENT_BOUNDARY_POINTS_PER_RING}
          data-world-boundary-segment-count={persistentBoundarySegmentCount}
          data-world-country-count={countryFeatures.length}
          data-world-boundaries-visible={Boolean(persistentBoundaryMesh)}
          ref={containerRef}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(94vw,920px)] w-[min(94vw,920px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,255,0.07),rgba(255,0,110,0.018)_46%,transparent_72%)] blur-2xl" />
          <div className="earth-camera-readout" aria-live="polite">
            <span>{cameraMode === "surface" ? "深度聚焦" : "轨道总览"}</span>
            <strong>{activeCameraLabel}</strong>
            <small>{visibleGameMarkers.length} 个游戏标记</small>
          </div>
          <div className="earth-map-tools" aria-label="镜头控制">
            <button
              aria-label="重置为全球视角"
              className="earth-tool-button"
              onClick={handleResetGlobalView}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4.6 9A8 8 0 1 1 4 14" />
                <path d="M4 4v5h5" />
              </svg>
              <span>全球</span>
            </button>
            <button
              aria-label="放大地球镜头"
              className="earth-tool-button"
              onClick={() => handleZoomCamera("in")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" />
              </svg>
              <span>拉近</span>
            </button>
            <button
              aria-label="缩小地球镜头"
              className="earth-tool-button"
              onClick={() => handleZoomCamera("out")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 21 21M7.5 10.5h6" />
              </svg>
              <span>拉远</span>
            </button>
            <button
              aria-label="聚焦当前选中国家"
              disabled={!selectedCountry}
              className="earth-tool-button is-focus"
              onClick={handleFocusSelectedCountry}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <span>聚焦</span>
            </button>
          </div>
          <details className="earth-location-picker" ref={locationPickerRef}>
            <summary>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span>选择地点</span>
              <small>{activeCameraLabel}</small>
            </summary>
            <div className="earth-location-menu">
              <div className="earth-location-heading">
                <span>区域镜头</span>
                <small>先选区域，再深入国家</small>
              </div>
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
              <div className="earth-location-heading">
                <span>快速聚焦</span>
                <small>选择后自动进入近地模式</small>
              </div>
              {focusPresetCountries.map((country) => (
                <button
                  aria-pressed={country.code === selectedCountryCode}
                  className={country.code === selectedCountryCode ? "is-active" : ""}
                  key={country.code}
                  onClick={() => handleSelectFocusCountry(country.code)}
                  type="button"
                >
                  {country.name}
                </button>
              ))}
            </div>
            </div>
          </details>
          <ReactGlobe
            ref={globeRef}
            atmosphereAltitude={0.14}
            atmosphereColor="#55BFC8"
            backgroundColor="rgba(0,0,0,0)"
            customLayerData={persistentBoundaryLayerData}
            onCustomLayerClick={handleCustomBoundaryClick}
            customThreeObject={getPersistentBoundaryObject}
            enablePointerInteraction={!isLowDetailRendering}
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
            onGlobeClick={handleGlobeSurfaceClick}
            onGlobeReady={() => {
              const controls = globeRef.current?.controls();
              const renderer = globeRef.current?.renderer();

              renderer?.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO)
              );

              if (controls) {
                controlsCleanupRef.current?.();
                configureControls();
                controls.addEventListener("start", handleGlobeInteractionStart);
                controls.addEventListener("end", handleGlobeInteractionEnd);
                controlsCleanupRef.current = () => {
                  controls.removeEventListener("start", handleGlobeInteractionStart);
                  controls.removeEventListener("end", handleGlobeInteractionEnd);
                };
              }

              setGlobePointOfView(
                getViewportAdjustedPointOfView(
                  selectedCountry
                    ? getCountryFocusPointOfView(selectedCountry, cameraMode)
                    : getRegionPointOfView(activeRegionId, cameraMode),
                  Boolean(selectedCountry)
                ),
                0
              );
            }}
            polygonsData={[]}
            rendererConfig={rendererConfig}
            showAtmosphere
            showGlobe
            showGraticules={false}
            showPointerCursor={(objectType) => {
              return objectType === "globe" || objectType === "html";
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

type BoundaryMeshOptions = {
  altitude: number;
  color: string;
  maxPointsPerRing: number;
  opacity: number;
  renderOrder: number;
};

function buildBoundaryMesh(
  countryFeatures: CountryGeoJsonFeature[],
  options: BoundaryMeshOptions
) {
  const positions: number[] = [];

  for (const feature of countryFeatures) {
    for (const sourceRing of getBoundaryRings(feature)) {
      const ring = sampleBoundaryRing(sourceRing, options.maxPointsPerRing);
      for (let index = 1; index < ring.length; index += 1) {
        const previous = ring[index - 1];
        const current = ring[index];

        if (Math.abs(current[0] - previous[0]) > 180) {
          continue;
        }

        const start = globeCoordinateToCartesian(
          previous[1],
          previous[0],
          options.altitude
        );
        const end = globeCoordinateToCartesian(
          current[1],
          current[0],
          options.altitude
        );
        positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const material = new LineBasicMaterial({
    color: options.color,
    opacity: options.opacity,
    transparent: true
  });

  const mesh = new LineSegments(geometry, material);
  mesh.frustumCulled = true;
  mesh.renderOrder = options.renderOrder;
  return mesh;
}

function sampleBoundaryRing(ring: number[][], maxPoints: number) {
  if (ring.length <= maxPoints) {
    return ring;
  }

  const lastIndex = ring.length - 1;
  const step = Math.ceil(
    lastIndex / (maxPoints - 1)
  );
  const sampled = ring.filter(
    (_position, index) => index === 0 || index === lastIndex || index % step === 0
  );

  if (sampled.at(-1) !== ring[lastIndex]) {
    sampled.push(ring[lastIndex]);
  }

  return sampled;
}

function getBoundaryRings(feature: CountryGeoJsonFeature): number[][][] {
  const coordinates = feature.geometry.coordinates;

  if (feature.geometry.type === "Polygon" && isPolygonCoordinates(coordinates)) {
    return coordinates;
  }

  if (
    feature.geometry.type === "MultiPolygon" &&
    Array.isArray(coordinates)
  ) {
    return coordinates.flatMap((polygon) =>
      isPolygonCoordinates(polygon) ? polygon : []
    );
  }

  return [];
}

function isPolygonCoordinates(value: unknown): value is number[][][] {
  return (
    Array.isArray(value) &&
    value.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.every(
          (position) =>
            Array.isArray(position) &&
            position.length >= 2 &&
            position.every((coordinate) => typeof coordinate === "number")
        )
    )
  );
}

function globeCoordinateToCartesian(lat: number, lng: number, altitude: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const radius = GLOBE_RADIUS * (1 + altitude);
  const phiSin = Math.sin(phi);

  return {
    x: radius * phiSin * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * phiSin * Math.sin(theta)
  };
}

function GlobeLoadingState() {
  return (
    <div className="grid min-h-[430px] place-items-center text-sm text-[#A99D8B]">
      正在启动 3D 地球…
    </div>
  );
}
