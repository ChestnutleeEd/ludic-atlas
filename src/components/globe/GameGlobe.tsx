"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  MeshPhongMaterial,
  type Object3D
} from "three";
import { buildGlobeBoundaryPositions } from "@/lib/globeBoundary";
import {
  buildCountryMarkers,
  buildGameMarkers,
  createGameMarkerElement,
  getGlobeGameMarkerIdentity,
  updateGameMarkerSelection,
  type GlobeGameMarker,
  type GlobeHtmlMarker
} from "@/components/globe/GameMarkers";
import {
  getCountryFeatureKey,
  indexCountryFeatures,
  isCoordinateInsideFeature,
  type GlobePointOfView,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import { geographyRepository, type GeographyResource } from "@/lib/geographyRepository";
import { applyScreenSpaceCollision } from "@/lib/markerLayout";
import {
  clampAggregateMarkerDiameter,
  reconcileMarkerDescriptors
} from "@/lib/markerContracts";
import { getCoverSizeLayoutBucket } from "@/lib/coverSize";
import {
  createGlobeCameraController,
  getCameraDuration,
  type GlobeCameraState
} from "@/lib/globeCamera";
import { resolveGlobeNavigationPoint } from "@/lib/globeNavigation";
import { getCountryDisplayName } from "@/lib/localization";
import {
  CAMERA_MODE_CONFIGS,
  REGION_CONFIGS,
  getRegionConfig
} from "@/lib/regions";
import type { CameraMode, Country, Game, RegionId, ViewMode } from "@/types/game";
import type {
  GlobeViewState,
  SafeViewport,
  SpatialNavigationIntent
} from "@/types/earth";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

const ReactGlobe = dynamic(() => import("react-globe.gl"), {
  loading: () => <GlobeLoadingState />,
  ssr: false
}) as React.ComponentType<
  GlobeProps & { ref?: React.MutableRefObject<GlobeMethods | undefined> }
>;

const MAX_RENDER_PIXEL_RATIO = 1;
const PERSISTENT_BOUNDARY_ALTITUDE = 0.0022;
const SELECTED_BOUNDARY_ALTITUDE = 0.0045;
const SELECTED_BOUNDARY_OPTIONS = {
  altitude: SELECTED_BOUNDARY_ALTITUDE,
  color: "#c49a58",
  opacity: 0.92,
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
  initialViewRevision: number;
  initialViewState: GlobeViewState;
  navigationIntent: SpatialNavigationIntent;
  safeViewport: SafeViewport;
  activeRegionId: RegionId;
  cameraMode: CameraMode;
  isRotateEnabled: boolean;
  selectedCountry: Country | null;
  selectedGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  coverSizeCommitRevision: number;
  onClearCountry: () => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onRegionChange: (regionId: RegionId) => void;
  onCameraModeChange: (cameraMode: CameraMode) => void;
  onInteractionStart?: () => void;
  onSettledViewState?: (viewState: GlobeViewState, revision: number) => void;
};

export function GameGlobe({
  countries,
  games,
  initialViewRevision,
  initialViewState,
  navigationIntent,
  safeViewport,
  activeRegionId,
  cameraMode,
  isRotateEnabled,
  selectedCountry,
  selectedGameId,
  viewMode,
  coverSize,
  coverSizeCommitRevision,
  onClearCountry,
  onSelectCountry,
  onSelectGame,
  onRegionChange,
  onCameraModeChange,
  onInteractionStart,
  onSettledViewState
}: GameGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const locationPickerRef = useRef<HTMLDetailsElement>(null);
  const sizeBoundaryRef = useRef<HTMLDivElement>(null);
  const interactionRestoreTimerRef = useRef<number | null>(null);
  const interactionTokenRef = useRef(0);
  const controlsCleanupRef = useRef<(() => void) | null>(null);
  const cameraControllerRef = useRef<ReturnType<typeof createGlobeCameraController> | null>(null);
  const isRendererReadyRef = useRef(false);
  const isMountedRef = useRef(false);
  const latestIntentRef = useRef(navigationIntent);
  const lastCameraPointOfViewRef = useRef<GlobePointOfView>(initialViewState);
  const settledViewStateCallbackRef = useRef(onSettledViewState);
  const geographyRequestRevisionRef = useRef(0);
  const [globalGeography, setGlobalGeography] = useState<GeographyResource | null>(null);
  const [regionGeography, setRegionGeography] = useState<GeographyResource | null>(null);
  const [countryGeography, setCountryGeography] = useState<GeographyResource | null>(null);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(
    null
  );
  const [activeWorldCountry, setActiveWorldCountry] = useState<{
    baseSelectedCountryCode: string | null;
    countryCode: string;
  } | null>(null);
  const [globeSize, setGlobeSize] = useState({ height: 1, width: 1 });
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);
  const [isGlobeInteracting, setIsGlobeInteracting] = useState(false);
  const [cameraState, setCameraState] = useState<GlobeCameraState>("idle");
  const [controlListenerCount, setControlListenerCount] = useState(0);
  const [expandedTinyCountryCode, setExpandedTinyCountryCode] = useState<string | null>(null);
  const [settledAltitude, setSettledAltitude] = useState(initialViewState.altitude);
  const [layoutCoverSize, setLayoutCoverSize] = useState(coverSize);
  const liveCoverSizeRef = useRef(coverSize);
  const activeRegionGeography = regionGeography?.key === activeRegionId ? regionGeography : null;
  const activeCountryGeography = countryGeography?.key === selectedCountry?.code ? countryGeography : null;
  const cameraModeConfig = CAMERA_MODE_CONFIGS[cameraMode];
  const countryByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries]
  );
  const countryFeatures = useMemo(() => {
    const merged = new Map<string, CountryGeoJsonFeature>();
    for (const resource of [globalGeography, activeRegionGeography, activeCountryGeography]) for (const feature of resource?.features ?? []) {
      const key = getCountryFeatureKey(feature); if (key) merged.set(key, feature);
    }
    return [...merged.values()];
  }, [activeCountryGeography, activeRegionGeography, globalGeography]);
  const countryFeatureByCode = useMemo(
    () => indexCountryFeatures(countryFeatures),
    [countryFeatures]
  );
  const normalizedFeatureByCode = useMemo(() => {
    const merged = new Map(globalGeography?.normalized ?? []);
    for (const [code, feature] of activeRegionGeography?.normalized ?? []) merged.set(code, feature);
    for (const [code, feature] of activeCountryGeography?.normalized ?? []) merged.set(code, feature);
    return merged;
  }, [activeCountryGeography, activeRegionGeography, globalGeography]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    settledViewStateCallbackRef.current = onSettledViewState;
  }, [onSettledViewState]);
  useEffect(() => {
    latestIntentRef.current = navigationIntent;
  }, [navigationIntent]);
  const coverSizeLayoutBucket = getCoverSizeLayoutBucket(coverSize);
  useEffect(() => {
    liveCoverSizeRef.current = coverSize;
  }, [coverSize]);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setLayoutCoverSize(liveCoverSizeRef.current));
    return () => cancelAnimationFrame(frameId);
  }, [coverSizeCommitRevision, coverSizeLayoutBucket]);
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

  const getCameraController = useCallback(() => {
    if (!cameraControllerRef.current) {
      cameraControllerRef.current = createGlobeCameraController({
        cancelFrame: (id) => window.cancelAnimationFrame(id),
        now: () => performance.now(),
        onSettle: (pointOfView, revision) => {
          if (!isMountedRef.current) return;
          setIsCameraAnimating(false);
          setSettledAltitude(pointOfView.altitude);
          settledViewStateCallbackRef.current?.(pointOfView, revision);
        },
        onStateChange: (nextState) => {
          if (!isMountedRef.current) return;
          setCameraState(nextState);
          setIsCameraAnimating(nextState === "programmatic-navigation");
        },
        read: getCurrentPointOfView,
        requestFrame: (callback) => window.requestAnimationFrame(callback),
        write: (pointOfView) => {
          lastCameraPointOfViewRef.current = pointOfView;
          if (containerRef.current) {
            containerRef.current.dataset.cameraAltitude = pointOfView.altitude.toFixed(3);
            containerRef.current.dataset.cameraLat = pointOfView.lat.toFixed(3);
            containerRef.current.dataset.cameraLng = pointOfView.lng.toFixed(3);
          }
          globeRef.current?.pointOfView(pointOfView, 0);
        }
      });
    }
    return cameraControllerRef.current;
  }, [getCurrentPointOfView]);

  const navigateCamera = useCallback(
    (intent: SpatialNavigationIntent, transitionMs: number, target?: GlobePointOfView) => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = getCameraDuration(transitionMs, reducedMotion);
      if (duration > 0 && containerRef.current) {
        delete containerRef.current.dataset.countryFocusX;
        delete containerRef.current.dataset.countryFocusY;
      }
      return getCameraController().navigate({
        duration,
        revision: intent.revision,
        target: target ?? resolveGlobeNavigationPoint({
          cameraMode,
          countryByCode,
          featureByCode: countryFeatureByCode,
          intent,
          markerFootprintPx: coverSize,
          safeViewport
        })
      });
    },
    [cameraMode, countryByCode, countryFeatureByCode, coverSize, getCameraController, safeViewport]
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
    let active = true;
    void geographyRepository.load("global", "global", countries).then((resource) => {
      if (active) setGlobalGeography(resource);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [countries]);

  useEffect(() => {
    if (!globalGeography || activeRegionId === "global") return;
    const revision = ++geographyRequestRevisionRef.current;
    void geographyRepository.loadWithFallback("region", activeRegionId, countries, globalGeography).then((resource) => {
      if (revision === geographyRequestRevisionRef.current) setRegionGeography(resource.lod === "region" ? resource : null);
    });
  }, [activeRegionId, countries, globalGeography]);

  useEffect(() => {
    if (!globalGeography || !selectedCountry?.code) return;
    const revision = ++geographyRequestRevisionRef.current;
    void geographyRepository.loadWithFallback("country", selectedCountry.code, countries, activeRegionGeography ?? globalGeography).then((resource) => {
      if (revision === geographyRequestRevisionRef.current) setCountryGeography(resource.lod === "country" ? resource : null);
    });
  }, [activeRegionGeography, countries, globalGeography, selectedCountry?.code]);

  useEffect(() => {
    const boundary = sizeBoundaryRef.current;

    if (!boundary) {
      return;
    }
    let resizeFrame: number | null = null;
    const measure = () => {
      resizeFrame = null;
      const style = getComputedStyle(boundary);
      const width = Math.max(1, Math.round(
        boundary.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      ));
      const height = Math.max(1, Math.round(
        boundary.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      ));
      setGlobeSize((currentSize) =>
        currentSize.height === height && currentSize.width === width
          ? currentSize
          : { height, width }
      );
    };
    const scheduleMeasure = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(boundary);
    measure();
    return () => {
      resizeObserver.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    };
  }, []);

  useEffect(() => {
    if (cameraControllerRef.current?.getSnapshot().disposed) {
      cameraControllerRef.current = null;
    }
    return () => {
      settledViewStateCallbackRef.current?.(
        getCurrentPointOfView(),
        latestIntentRef.current.revision
      );
      cameraControllerRef.current?.dispose();
      cameraControllerRef.current = null;
      if (interactionRestoreTimerRef.current) {
        window.clearTimeout(interactionRestoreTimerRef.current);
      }
    };
  }, [getCurrentPointOfView]);

  useEffect(() => {
    configureControls();
  }, [configureControls]);

  const navigationExecutorRef = useRef(navigateCamera);
  useEffect(() => {
    navigationExecutorRef.current = navigateCamera;
  }, [navigateCamera]);
  useEffect(() => {
    if (!isRendererReadyRef.current) return;
    if (
      navigationIntent.target.type === "game" &&
      navigationIntent.target.countryCode === selectedCountry?.code
    ) {
      return;
    }
    navigationExecutorRef.current(
      navigationIntent,
      navigationIntent.target.type === "country" || navigationIntent.target.type === "game"
        ? 680
        : 620
    );
  }, [cameraMode, navigationIntent, selectedCountry?.code]);

  const previousSafeViewportRef = useRef(safeViewport);
  useEffect(() => {
    const previous = previousSafeViewportRef.current;
    previousSafeViewportRef.current = safeViewport;
    const previousRightObstruction = previous.width - previous.right;
    const nextRightObstruction = safeViewport.width - safeViewport.right;
    const previousBottomObstruction = previous.height - previous.bottom;
    const nextBottomObstruction = safeViewport.height - safeViewport.bottom;
    const safeAreaShrank =
      nextRightObstruction > previousRightObstruction + 8 ||
      nextBottomObstruction > previousBottomObstruction + 8;
    if (!safeAreaShrank || !isRendererReadyRef.current) return;
    const frameId = requestAnimationFrame(() => {
      if (getCameraController().getSnapshot().state === "user-controlled") return;
      navigationExecutorRef.current(
        { ...latestIntentRef.current, source: "focus-control" },
        420
      );
    });
    return () => cancelAnimationFrame(frameId);
  }, [getCameraController, safeViewport]);

  useEffect(() => {
    if (
      isCameraAnimating ||
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
    if (!selectedCountry) return;
    onCameraModeChange("surface");
    navigationExecutorRef.current(
      { ...latestIntentRef.current, source: "focus-control" },
      680
    );
  }, [onCameraModeChange, selectedCountry]);

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

      navigateCamera(
        { ...latestIntentRef.current, source: "focus-control" },
        MANUAL_ZOOM_TRANSITION_MS,
        { ...pointOfView, altitude }
      );
    },
    [cameraModeConfig, getCurrentPointOfView, navigateCamera]
  );

  const handleGlobeInteractionStart = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    onInteractionStart?.();
    interactionTokenRef.current += 1;
    getCameraController().beginUserControl();
    setIsGlobeInteracting(true);
    setHoveredCountryCode(null);
  }, [getCameraController, onInteractionStart]);

  const handleGlobeInteractionEnd = useCallback(() => {
    if (interactionRestoreTimerRef.current) {
      window.clearTimeout(interactionRestoreTimerRef.current);
    }

    getCameraController().endUserControl();
    const ownToken = ++interactionTokenRef.current;
    interactionRestoreTimerRef.current = window.setTimeout(() => {
      if (ownToken !== interactionTokenRef.current) return;
      setIsGlobeInteracting(false);
    }, INTERACTION_RESTORE_DELAY_MS);
  }, [getCameraController]);
  const attachControlListeners = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controlsCleanupRef.current?.();
    configureControls();
    controls.addEventListener("start", handleGlobeInteractionStart);
    controls.addEventListener("end", handleGlobeInteractionEnd);
    if (isMountedRef.current) setControlListenerCount(2);
    controlsCleanupRef.current = () => {
      controls.removeEventListener("start", handleGlobeInteractionStart);
      controls.removeEventListener("end", handleGlobeInteractionEnd);
      controlsCleanupRef.current = null;
    };
  }, [configureControls, handleGlobeInteractionEnd, handleGlobeInteractionStart]);
  useEffect(() => {
    if (!isRendererReadyRef.current) return;
    attachControlListeners();
    return () => controlsCleanupRef.current?.();
  }, [attachControlListeners]);
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
        normalizedFeatureByCode,
        games,
        altitude: settledAltitude,
        coverSize: layoutCoverSize,
        performanceTier: getMarkerPerformanceTier(),
        safeViewport,
        // Keep a settled candidate model; the published HTML layout remains mounted
        // while the camera moves and is replaced only after the next settled pass.
        settled: true,
        expandedTinyCountryCode,
        selectedCountryCode,
        selectedGameId: null,
        viewMode
      }),
    [
      countries,
      normalizedFeatureByCode,
      games,
      activeRegionId,
      selectedCountryCode,
      viewMode,
      settledAltitude,
      layoutCoverSize,
      safeViewport,
      expandedTinyCountryCode
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
  const [publishedGameMarkers, setPublishedGameMarkers] = useState<typeof gameMarkers>(gameMarkers);
  const publishedContextRef = useRef(
    `${activeRegionId}:${selectedCountryCode ?? "global"}:${viewMode}:${expandedTinyCountryCode ?? "collapsed"}`
  );
  const lastCollisionCommitRevisionRef = useRef(coverSizeCommitRevision);
  useEffect(() => {
    if (isCameraAnimating || isGlobeInteracting) return;
    const frameId = requestAnimationFrame(() => {
      const nextContext = `${activeRegionId}:${selectedCountryCode ?? "global"}:${viewMode}:${expandedTinyCountryCode ?? "collapsed"}`;
      let nextMarkers = gameMarkers;
      if (selectedCountryCode || activeRegionId !== "global") {
        const globe = globeRef.current;
        if (!globe) return;
        const height = layoutCoverSize;
        const width = Math.round(layoutCoverSize * 0.76);
        const collision = applyScreenSpaceCollision({
          candidates: gameMarkers.flatMap((marker) => {
            const point = globe.getScreenCoords(marker.lat, marker.lng, 0.03);
            return point ? [{ height, id: marker.game.id, payload: marker, width, x: point.x, y: point.y }] : [];
          }),
          gap: selectedCountryCode ? 2 : 6,
          safeViewport
        });
        const lastByCountry = new Map<string, number>();
        const visibleByCountry = new Map<string, number>();
        collision.visible.forEach((candidate, index) => lastByCountry.set(candidate.payload.game.countryCode, index));
        collision.visible.forEach((candidate) => visibleByCountry.set(
          candidate.payload.game.countryCode,
          (visibleByCountry.get(candidate.payload.game.countryCode) ?? 0) + 1
        ));
        nextMarkers = collision.visible.map((candidate, index) => index === lastByCountry.get(candidate.payload.game.countryCode)
          ? {
              ...candidate.payload,
              overflowCount: Math.max(
                0,
                candidate.payload.countryGameCount -
                  (visibleByCountry.get(candidate.payload.game.countryCode) ?? 0)
              )
            }
          : candidate.payload);
        if (nextMarkers.length === 0 && gameMarkers.length > 0) {
          nextMarkers = [{
            ...gameMarkers[0],
            overflowCount: Math.max(0, gameMarkers[0].countryGameCount - 1)
          }];
        }
      }
      const isCommitPass = coverSizeCommitRevision !== lastCollisionCommitRevisionRef.current;
      if (
        !isCommitPass &&
        nextContext === publishedContextRef.current &&
        publishedGameMarkers.length > 0 &&
        Math.abs(nextMarkers.length - publishedGameMarkers.length) <= 1
      ) {
        return;
      }
      lastCollisionCommitRevisionRef.current = coverSizeCommitRevision;
      publishedContextRef.current = nextContext;
      setPublishedGameMarkers(reconcileMarkerDescriptors(
        markerDescriptorRegistryRef.current,
        nextMarkers,
        getGlobeGameMarkerIdentity
      ));
    });
    return () => cancelAnimationFrame(frameId);
  }, [
    activeRegionId,
    coverSizeCommitRevision,
    expandedTinyCountryCode,
    gameMarkers,
    isCameraAnimating,
    isGlobeInteracting,
    layoutCoverSize,
    publishedGameMarkers,
    safeViewport,
    selectedCountryCode,
    viewMode
  ]);
  const markerDescriptorRegistryRef = useRef(new Map<string, GlobeGameMarker>());
  const visibleGameMarkers = publishedGameMarkers;
  useEffect(() => () => markerDescriptorRegistryRef.current.clear(), []);
  useEffect(() => {
    if (!containerRef.current) return;
    updateGameMarkerSelection(containerRef.current, selectedGameId, visibleGameMarkers);
  }, [selectedGameId, visibleGameMarkers]);
  const globeHtmlMarkers = useMemo<GlobeHtmlMarker[]>(
    () => [...countryMarkers, ...visibleGameMarkers],
    [countryMarkers, visibleGameMarkers]
  );
  const createMarkerElement = useMemo(
    () => createGameMarkerElement({
      loadCoverImages: true,
      renderCoverMarkers: true,
      onHoverCountry: handleHoverCountry,
      onSelectCountry: handleSelectGlobeCountry,
      onSelectGame,
      onToggleTinyCluster: (countryCode) => setExpandedTinyCountryCode((current) => current === countryCode ? null : countryCode)
    }),
    [handleHoverCountry, handleSelectGlobeCountry, onSelectGame]
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
        color: "#07110f",
        emissive: "#0b1713",
        emissiveIntensity: 0.18,
        shininess: 7,
        specular: "#59685a"
      }),
    []
  );
  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);
  const persistentBoundaryMesh = useMemo(
    () =>
      countryFeatures.length > 0
        ? buildBoundaryMesh(countryFeatures, {
            altitude: PERSISTENT_BOUNDARY_ALTITUDE,
            cacheKey: `boundaries:${globalGeography?.key ?? "none"}:${activeRegionGeography?.key ?? "none"}:${activeCountryGeography?.key ?? "none"}`,
            color: "#6f897c",
            opacity: 0.5,
            renderOrder: 1
          })
        : null,
    [activeCountryGeography?.key, activeRegionGeography?.key, countryFeatures, globalGeography?.key]
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
  const persistentBoundaryMaxArc = persistentBoundaryMesh
    ? Number(persistentBoundaryMesh.geometry.userData.maxRenderedArcDegrees ?? 0)
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
      { ...SELECTED_BOUNDARY_OPTIONS, cacheKey: selectedFeature ? `selected:${activeCountryCode}:${activeCountryGeography?.key ?? activeRegionGeography?.key ?? globalGeography?.key}` : undefined }
    );
    selectedBoundaryMesh.geometry.copy(nextMesh.geometry);
    nextMesh.geometry.dispose();
    nextMesh.material.dispose();
  }, [activeCountryCode, activeCountryGeography?.key, activeRegionGeography?.key, countryFeatureByCode, globalGeography?.key, selectedBoundaryMesh]);
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
  const forceRendererFallback =
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    window.__forceEarthGlobeFallback === true;

  return (
    <section
      className="glass-panel atlas-globe-panel relative h-full min-h-0 overflow-hidden"
      data-earth-renderer="globe"
    >
      <div className="earth-globe-backdrop absolute inset-0" />
      <div
        aria-hidden="true"
        className="earth-atmosphere-fallback pointer-events-none absolute inset-0"
        data-earth-atmosphere="archive-material"
      >
        <picture className="earth-atmosphere-picture">
          <source
            media="(max-width: 1366px)"
            srcSet="/images/earth/earth-atmosphere-archive-1280.webp"
          />
          <img
            alt=""
            className="earth-atmosphere-image"
            decoding="async"
            fetchPriority="low"
            height={941}
            loading="eager"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            src="/images/earth/earth-atmosphere-archive-1672.webp"
            width={1672}
          />
        </picture>
      </div>
      <div className="earth-globe-chart-grid absolute inset-0" />
      <div className="relative z-10 h-full min-h-0 min-w-0 p-2" ref={sizeBoundaryRef}>
        <div
          className={`real-globe-stage relative min-h-0 flex-1 overflow-hidden ${
            isGlobeInteracting ? "is-globe-interacting" : ""
          } ${isLowDetailRendering ? "is-globe-low-detail" : ""}`}
          data-camera-travelling={isCameraAnimating}
          data-camera-controller-state={cameraState}
          data-camera-controller-count="1"
          data-camera-raf-active={cameraState === "programmatic-navigation"}
          data-control-listener-count={controlListenerCount}
          data-resize-observer-count="1"
          data-camera-mode={cameraMode}
          data-country-picking="globe-coordinates"
          data-runtime-boundary-sampling="false"
          data-world-boundary-segment-count={persistentBoundarySegmentCount}
          data-world-boundary-max-arc-degrees={persistentBoundaryMaxArc.toFixed(3)}
          data-world-country-count={countryFeatures.length}
          data-geography-fetch-count={geographyRepository.getDiagnostics().fetches}
          data-geography-parse-count={geographyRepository.getDiagnostics().parses}
          data-selected-geography-lod={activeCountryGeography?.lod ?? activeRegionGeography?.lod ?? globalGeography?.lod ?? "pending"}
          data-marker-candidate-count={gameMarkers.length}
          data-marker-visible-count={visibleGameMarkers.length}
          data-world-boundaries-visible={Boolean(persistentBoundaryMesh)}
          data-safe-viewport-bottom={safeViewport.bottom.toFixed(2)}
          data-safe-viewport-left={safeViewport.left.toFixed(2)}
          data-safe-viewport-right={safeViewport.right.toFixed(2)}
          data-safe-viewport-top={safeViewport.top.toFixed(2)}
          ref={containerRef}
          style={{
            "--earth-aggregate-size": `${clampAggregateMarkerDiameter(coverSize)}px`,
            "--earth-cover-height": `${coverSize}px`,
            "--earth-cover-width": `${Math.round(coverSize * 0.76)}px`
          } as React.CSSProperties}
        >
          <div className="earth-globe-orbit-halo pointer-events-none absolute left-1/2 top-1/2 h-[min(94vw,920px)] w-[min(94vw,920px)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
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
          {forceRendererFallback ? <GlobeUnavailableState /> : (
          <GlobeRendererBoundary>
          <ReactGlobe
            ref={globeRef}
            atmosphereAltitude={0.14}
            atmosphereColor="#78978d"
            backgroundColor="rgba(0,0,0,0)"
            customLayerData={persistentBoundaryLayerData}
            onCustomLayerClick={handleCustomBoundaryClick}
            customThreeObject={getPersistentBoundaryObject}
            enablePointerInteraction={!isCameraAnimating && !isRotateEnabled}
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

              if (controls) attachControlListeners();
              isRendererReadyRef.current = true;
              if (initialViewRevision === latestIntentRef.current.revision) {
                navigateCamera(
                  { ...latestIntentRef.current, motion: "immediate", source: "restore" },
                  0,
                  initialViewState
                );
              } else {
                navigationExecutorRef.current(latestIntentRef.current, 0);
              }
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
          </GlobeRendererBoundary>
          )}
          {countryFeatures.length === 0 ? (
            <div
              aria-live="polite"
              className="earth-renderer-status pointer-events-none absolute inset-0 grid place-items-center text-sm"
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

class GlobeRendererBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <GlobeUnavailableState />;
    }
    return this.props.children;
  }
}

function GlobeUnavailableState() {
  return (
    <div className="absolute inset-0 grid place-items-center px-8 text-center">
      <div role="alert">
        <strong className="earth-title block text-base">地球渲染器暂不可用</strong>
        <p className="earth-muted mt-2 text-sm">
          当前浏览器无法初始化 WebGL。请使用顶部返回按钮退出地球探索。
        </p>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __forceEarthGlobeFallback?: boolean;
  }
}

function getNumberOrFallback(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

type BoundaryMeshOptions = {
  altitude: number;
  cacheKey?: string;
  color: string;
  opacity: number;
  renderOrder: number;
};

function buildBoundaryMesh(
  countryFeatures: CountryGeoJsonFeature[],
  options: BoundaryMeshOptions
) {
  const geometry = options.cacheKey
    ? geographyRepository.getOrCreateGeometry(options.cacheKey, () => buildBoundaryGeometry(countryFeatures, options.altitude)).clone()
    : buildBoundaryGeometry(countryFeatures, options.altitude);
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

function buildBoundaryGeometry(countryFeatures: CountryGeoJsonFeature[], altitude: number) {
  const boundary = buildGlobeBoundaryPositions(countryFeatures, altitude);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(boundary.positions, 3));
  geometry.userData.maxRenderedArcDegrees = boundary.maxRenderedArcDegrees;
  geometry.userData.maxSourceArcDegrees = boundary.maxSourceArcDegrees;
  geometry.userData.ringCount = boundary.ringCount;
  return geometry;
}

function getMarkerPerformanceTier(): "low" | "medium" | "high" {
  if (typeof navigator === "undefined") return "high";
  const cores = navigator.hardwareConcurrency || 4;
  const memory = "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) : 4;
  return cores <= 4 || memory <= 4 ? "low" : cores <= 8 || memory <= 8 ? "medium" : "high";
}

function GlobeLoadingState() {
  return (
    <div className="earth-renderer-status grid min-h-[430px] place-items-center text-sm">
      正在启动 3D 地球…
    </div>
  );
}
