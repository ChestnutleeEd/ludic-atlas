"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { IconLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import maplibregl, {
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type StyleSpecification
} from "maplibre-gl";
import {
  getCountryCodeFromFeature,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import {
  getEarthProCoverUrl,
  type EarthProCameraView,
  type EarthProCountryMarker,
  type EarthProGameMarker,
  type EarthProMarkerData
} from "@/lib/earthPro";
import {
  getCountryDisplayName,
  getGameDisplayTitle,
  getGameMarkerLabel,
  getGenreListLabel
} from "@/lib/localization";
import type { Country } from "@/types/game";

export type EarthProCameraCommand = {
  id: number;
  type: "focusSelected" | "reset" | "zoomIn" | "zoomOut";
};

type EarthProMapProps = {
  cameraCommand: EarthProCameraCommand | null;
  cameraView: EarthProCameraView;
  countries: Country[];
  markerData: EarthProMarkerData;
  selectedCountryCode: string | null;
  selectedGameId: string | null;
  onHoverCountry: (countryCode: string | null) => void;
  onHoverGame: (gameId: string | null) => void;
  onInteractionStart: () => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
};

const EMPTY_LAYERS: [] = [];
const MIN_ZOOM = 0.78;
const MAX_ZOOM = 7.4;

type EarthProMapTooltip = {
  meta: string;
  subtitle: string;
  title: string;
  x: number;
  y: number;
} | null;

export function EarthProMap({
  cameraCommand,
  cameraView,
  countries,
  markerData,
  selectedCountryCode,
  selectedGameId,
  onHoverCountry,
  onHoverGame,
  onInteractionStart,
  onSelectCountry,
  onSelectGame
}: EarthProMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const callbacksRef = useRef({
    onHoverCountry,
    onHoverGame,
    onInteractionStart,
    onSelectCountry,
    onSelectGame
  });
  const countryByCodeRef = useRef<Map<string, Country>>(new Map());
  const scopedCountriesRef = useRef(markerData.scopedCountries);
  const selectedCountryCodeRef = useRef(selectedCountryCode);
  const programmaticCameraRef = useRef(false);
  const programmaticCameraTimerRef = useRef<number | null>(null);
  const initialCameraViewRef = useRef(cameraView);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<EarthProMapTooltip>(null);
  const countryByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries]
  );

  useEffect(() => {
    callbacksRef.current = {
      onHoverCountry,
      onHoverGame,
      onInteractionStart,
      onSelectCountry,
      onSelectGame
    };
  }, [
    onHoverCountry,
    onHoverGame,
    onInteractionStart,
    onSelectCountry,
    onSelectGame
  ]);

  useEffect(() => {
    countryByCodeRef.current = countryByCode;
  }, [countryByCode]);

  useEffect(() => {
    scopedCountriesRef.current = markerData.scopedCountries;
    selectedCountryCodeRef.current = selectedCountryCode;
  }, [markerData.scopedCountries, selectedCountryCode]);

  const flyToView = useCallback((view: EarthProCameraView, duration = 900) => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    programmaticCameraRef.current = true;
    if (programmaticCameraTimerRef.current) {
      window.clearTimeout(programmaticCameraTimerRef.current);
    }

    map.stop();
    map.flyTo({
      bearing: view.bearing,
      center: view.center,
      duration,
      essential: true,
      pitch: view.pitch,
      zoom: clamp(view.zoom, MIN_ZOOM, MAX_ZOOM)
    });
    programmaticCameraTimerRef.current = window.setTimeout(() => {
      programmaticCameraRef.current = false;
      programmaticCameraTimerRef.current = null;
    }, duration + 80);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      bearing: initialCameraViewRef.current.bearing,
      canvasContextAttributes: {
        antialias: false,
        powerPreference: "high-performance"
      },
      center: initialCameraViewRef.current.center,
      container,
      dragRotate: true,
      maxPitch: 60,
      maxZoom: MAX_ZOOM,
      minPitch: 0,
      minZoom: MIN_ZOOM,
      pitch: initialCameraViewRef.current.pitch,
      renderWorldCopies: false,
      scrollZoom: { around: "center" },
      style: getEarthProMapStyle(),
      zoom: initialCameraViewRef.current.zoom
    });

    map.touchZoomRotate.enable();
    map.keyboard.enable();
    map.once("load", () => {
      map.setProjection({ type: "globe" });
      applyCountryPaint(
        map,
        selectedCountryCodeRef.current,
        scopedCountriesRef.current
      );
      map.resize();
    });

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: EMPTY_LAYERS,
      useDevicePixels: Math.min(window.devicePixelRatio, 1.5)
    });

    map.addControl(overlay as unknown as maplibregl.IControl);
    const handleUserInteractionStart = () => {
      if (programmaticCameraRef.current) {
        return;
      }

      map.stop();
      setTooltip(null);
      callbacksRef.current.onInteractionStart();
    };
    const handleMapResize = () => map.resize();
    const resizeObserver = new ResizeObserver(handleMapResize);

    resizeObserver.observe(container);
    window.addEventListener("resize", handleMapResize);
    window.visualViewport?.addEventListener("resize", handleMapResize);
    window.requestAnimationFrame(handleMapResize);
    map.on("dragstart", handleUserInteractionStart);
    map.on("zoomstart", handleUserInteractionStart);
    map.on("rotatestart", handleUserInteractionStart);
    map.on("pitchstart", handleUserInteractionStart);
    map.on("error", () => {
      setMapError("地图数据加载失败");
    });
    map.on("click", "earth-pro-country-fill", (event) => {
      const feature = event.features?.[0];
      const countryCode = feature ? getCountryCodeFromMapFeature(feature) : null;

      if (countryCode && countryByCodeRef.current.has(countryCode)) {
        callbacksRef.current.onSelectCountry(countryCode);
      }
    });
    map.on("mousemove", "earth-pro-country-fill", (event) => {
      const feature = event.features?.[0];
      const countryCode = feature ? getCountryCodeFromMapFeature(feature) : null;
      const country =
        countryCode && countryByCodeRef.current.has(countryCode)
          ? countryByCodeRef.current.get(countryCode) ?? null
          : null;

      callbacksRef.current.onHoverCountry(country?.code ?? null);
      map.getCanvas().style.cursor = country ? "pointer" : "";

      if (country) {
        setTooltip({
          meta: "点击查看国家游戏列表",
          subtitle: country.region,
          title: getCountryDisplayName(country),
          x: event.point.x,
          y: event.point.y
        });
      } else {
        setTooltip(null);
      }
    });
    map.on("mouseleave", "earth-pro-country-fill", () => {
      callbacksRef.current.onHoverCountry(null);
      map.getCanvas().style.cursor = "";
      setTooltip(null);
    });

    mapRef.current = map;
    overlayRef.current = overlay;

    return () => {
      if (programmaticCameraTimerRef.current) {
        window.clearTimeout(programmaticCameraTimerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleMapResize);
      window.visualViewport?.removeEventListener("resize", handleMapResize);
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    flyToView(cameraView);
  }, [cameraView, flyToView]);

  useEffect(() => {
    if (!cameraCommand || !mapRef.current) {
      return;
    }

    if (cameraCommand.type === "reset" || cameraCommand.type === "focusSelected") {
      flyToView(cameraView, 760);
      return;
    }

    const zoomDelta = cameraCommand.type === "zoomIn" ? 0.58 : -0.58;
    const zoom = clamp(mapRef.current.getZoom() + zoomDelta, MIN_ZOOM, MAX_ZOOM);

    programmaticCameraRef.current = true;
    if (programmaticCameraTimerRef.current) {
      window.clearTimeout(programmaticCameraTimerRef.current);
    }
    mapRef.current.stop();
    mapRef.current.easeTo({
      duration: 320,
      zoom
    });
    programmaticCameraTimerRef.current = window.setTimeout(() => {
      programmaticCameraRef.current = false;
      programmaticCameraTimerRef.current = null;
    }, 400);
  }, [cameraCommand, cameraView, flyToView]);

  useEffect(() => {
    return () => {
      if (programmaticCameraTimerRef.current) {
        window.clearTimeout(programmaticCameraTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    applyCountryPaint(map, selectedCountryCode, markerData.scopedCountries);
  }, [markerData.scopedCountries, selectedCountryCode]);

  useEffect(() => {
    overlayRef.current?.setProps({
      layers: buildDeckLayers({
        countryMarkers: markerData.countryMarkers,
        gameMarkers: markerData.gameMarkers,
        selectedCountryCode,
        selectedGameId,
        onHoverCountry,
        onHoverGame,
        onSelectCountry,
        onSelectGame,
        setTooltip
      })
    });
  }, [
    markerData,
    onHoverCountry,
    onHoverGame,
    onSelectCountry,
    onSelectGame,
    selectedCountryCode,
    selectedGameId
  ]);

  return (
    <div className="earth-pro-map-shell" aria-label="Earth Explorer Pro map">
      <div ref={containerRef} className="earth-pro-map-canvas" />
      <div className="earth-pro-vignette" aria-hidden="true" />
      {tooltip ? (
        <div
          className="earth-pro-map-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.title}</strong>
          <span>{tooltip.subtitle}</span>
          <small>{tooltip.meta}</small>
        </div>
      ) : null}
      {mapError ? <div className="earth-pro-map-error">{mapError}</div> : null}
    </div>
  );
}

function buildDeckLayers({
  countryMarkers,
  gameMarkers,
  selectedCountryCode,
  selectedGameId,
  onHoverCountry,
  onHoverGame,
  onSelectCountry,
  onSelectGame,
  setTooltip
}: {
  countryMarkers: EarthProCountryMarker[];
  gameMarkers: EarthProGameMarker[];
  selectedCountryCode: string | null;
  selectedGameId: string | null;
  onHoverCountry: (countryCode: string | null) => void;
  onHoverGame: (gameId: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  setTooltip: (tooltip: EarthProMapTooltip) => void;
}) {
  const aggregateLayer = new ScatterplotLayer<EarthProCountryMarker>({
    data: countryMarkers,
    getFillColor: (marker) =>
      marker.country.code === selectedCountryCode
        ? [255, 184, 0, 235]
        : [245, 239, 227, 138],
    getLineColor: [245, 239, 227, 210],
    getLineWidth: 1.5,
    getPosition: (marker) => marker.position,
    getRadius: (marker) => 24000 + Math.min(marker.gameCount, 24) * 7500,
    id: "earth-pro-country-aggregate-layer",
    lineWidthMinPixels: 1,
    onClick: ({ object }) => {
      if (object) {
        onSelectCountry(object.country.code);
        return true;
      }

      return false;
    },
    onHover: ({ object, x, y }) => {
      onHoverCountry(object?.country.code ?? null);
      setTooltip(
        object
          ? {
              meta: `${object.gameCount} 款游戏 · 平均评分 ${object.averageRating.toFixed(1)}`,
              subtitle: object.topGame
                ? `代表作：${getGameDisplayTitle(object.topGame)}`
                : object.country.region,
              title: getCountryDisplayName(object.country),
              x,
              y
            }
          : null
      );
    },
    pickable: true,
    radiusMaxPixels: 32,
    radiusMinPixels: 7,
    stroked: true
  });

  const dotLayer = new ScatterplotLayer<EarthProGameMarker>({
    data: gameMarkers.filter((marker) => marker.markerStyle === "dot"),
    getFillColor: (marker) =>
      marker.game.id === selectedGameId ? [255, 184, 0, 245] : [245, 239, 227, 184],
    getLineColor: [0, 0, 0, 220],
    getLineWidth: 1,
    getPosition: (marker) => marker.position,
    getRadius: (marker) => 12000 + marker.normalizedRating * 1800,
    id: "earth-pro-game-dot-layer",
    lineWidthMinPixels: 1,
    onClick: ({ object }) => {
      if (object) {
        onSelectGame(object.game.id);
        return true;
      }

      return false;
    },
    onHover: ({ object, x, y }) => {
      onHoverGame(object?.game.id ?? null);
      setTooltip(object ? getGameTooltip(object, x, y) : null);
    },
    pickable: true,
    radiusMaxPixels: 18,
    radiusMinPixels: 5,
    stroked: true
  });

  const coverLayer = new IconLayer<EarthProGameMarker>({
    alphaCutoff: 0.08,
    billboard: true,
    data: gameMarkers.filter((marker) => marker.markerStyle === "cover"),
    getColor: (marker) =>
      marker.game.id === selectedGameId ? [255, 255, 255, 255] : [235, 226, 210, 232],
    getIcon: (marker) => ({
      anchorY: 220,
      height: 220,
      url: getEarthProCoverUrl(marker),
      width: 160
    }),
    getPosition: (marker) => marker.position,
    getSize: (marker) => (marker.game.id === selectedGameId ? 50 : 38),
    id: "earth-pro-game-cover-layer",
    onClick: ({ object }) => {
      if (object) {
        onSelectGame(object.game.id);
        return true;
      }

      return false;
    },
    onHover: ({ object, x, y }) => {
      onHoverGame(object?.game.id ?? null);
      setTooltip(object ? getGameTooltip(object, x, y) : null);
    },
    pickable: true,
    sizeMaxPixels: 58,
    sizeMinPixels: 24
  });

  const labelLayer = new TextLayer<EarthProGameMarker | EarthProCountryMarker>({
    data: [
      ...countryMarkers.filter((marker) => marker.country.code === selectedCountryCode),
      ...gameMarkers
        .filter((marker) => marker.game.id === selectedGameId)
        .slice(0, 1)
    ],
    getAlignmentBaseline: "top",
    getColor: [245, 239, 227, 230],
    getPixelOffset: [0, 14],
    getPosition: (marker) => marker.position,
    getSize: 12,
    getText: (marker) =>
      "game" in marker
        ? getGameMarkerLabel(marker.game)
        : getCountryDisplayName(marker.country),
    getTextAnchor: "middle",
    id: "earth-pro-selected-label-layer",
    sizeMaxPixels: 16,
    sizeMinPixels: 10
  });

  return [aggregateLayer, dotLayer, coverLayer, labelLayer];
}

function getGameTooltip(
  marker: EarthProGameMarker,
  x: number,
  y: number
): NonNullable<EarthProMapTooltip> {
  return {
    meta: `${marker.game.releaseYear} · 评分 ${marker.game.rating} · ${getGenreListLabel(marker.game.genres)}`,
    subtitle: `${getCountryDisplayName(marker.country)} · ${marker.game.developer}`,
    title: getGameDisplayTitle(marker.game),
    x,
    y
  };
}

function getEarthProMapStyle(): StyleSpecification {
  return {
    layers: [
      {
        id: "earth-pro-background",
        paint: {
          "background-color": "#000000"
        },
        type: "background"
      },
      {
        id: "earth-pro-country-fill",
        paint: {
          "fill-color": "rgba(12, 14, 13, 0.62)",
          "fill-opacity": 0.78
        },
        source: "world",
        type: "fill"
      },
      {
        id: "earth-pro-country-line",
        paint: {
          "line-color": "rgba(245, 239, 227, 0.22)",
          "line-opacity": 0.78,
          "line-width": 0.75
        },
        source: "world",
        type: "line"
      }
    ],
    sources: {
      world: {
        data: "/data/world-countries-lite.geojson",
        type: "geojson"
      }
    },
    projection: {
      type: "globe"
    },
    version: 8
  };
}

function getCountryCodeFromMapFeature(feature: MapGeoJSONFeature) {
  return getCountryCodeFromFeature(feature as unknown as CountryGeoJsonFeature);
}

function getCountryFillExpression(
  selectedCountryCode: string | null,
  scopedCountries: Country[]
) {
  const scopedCodes = scopedCountries.map((country) => country.code);
  const scopedNames = scopedCountries.map((country) => country.name);
  const selectedCountryName =
    scopedCountries.find((country) => country.code === selectedCountryCode)?.name ?? "";

  return [
    "case",
    [
      "any",
      ["==", ["get", "ISO3166-1-Alpha-2"], selectedCountryCode ?? ""],
      ["==", ["get", "name"], selectedCountryName]
    ],
    "rgba(255, 184, 0, 0.28)",
    [
      "any",
      ["in", ["get", "ISO3166-1-Alpha-2"], ["literal", scopedCodes]],
      ["in", ["get", "name"], ["literal", scopedNames]]
    ],
    "rgba(245, 239, 227, 0.13)",
    "rgba(12, 14, 13, 0.58)"
  ];
}

function getCountryLineExpression(
  selectedCountryCode: string | null,
  scopedCountries: Country[]
) {
  const scopedCodes = scopedCountries.map((country) => country.code);
  const scopedNames = scopedCountries.map((country) => country.name);
  const selectedCountryName =
    scopedCountries.find((country) => country.code === selectedCountryCode)?.name ?? "";

  return [
    "case",
    [
      "any",
      ["==", ["get", "ISO3166-1-Alpha-2"], selectedCountryCode ?? ""],
      ["==", ["get", "name"], selectedCountryName]
    ],
    "rgba(255, 184, 0, 0.9)",
    [
      "any",
      ["in", ["get", "ISO3166-1-Alpha-2"], ["literal", scopedCodes]],
      ["in", ["get", "name"], ["literal", scopedNames]]
    ],
    "rgba(245, 239, 227, 0.45)",
    "rgba(245, 239, 227, 0.18)"
  ];
}

function applyCountryPaint(
  map: MapLibreMap,
  selectedCountryCode: string | null,
  scopedCountries: Country[]
) {
  map.setPaintProperty(
    "earth-pro-country-fill",
    "fill-color",
    getCountryFillExpression(selectedCountryCode, scopedCountries)
  );
  map.setPaintProperty(
    "earth-pro-country-line",
    "line-color",
    getCountryLineExpression(selectedCountryCode, scopedCountries)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
