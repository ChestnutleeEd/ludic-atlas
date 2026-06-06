"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GameTooltip,
  getGameTooltipMarkup
} from "@/components/globe/GameTooltip";
import {
  GLOBE_2D_HEIGHT,
  GLOBE_2D_WIDTH,
  getClusteredGlobe2DPosition,
  getCountry2DViewBox,
  getCountryCodeFromFeature,
  getGeoJsonFeaturePath,
  getGlobal2DViewBox,
  type CountryGeoJson,
  type CountryGeoJsonFeature,
  type Globe2DViewBox,
  type SvgPosition
} from "@/lib/geo";
import {
  getCountryDisplayName,
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getViewModeLabel
} from "@/lib/localization";
import type { Country, Game, ViewMode } from "@/types/game";

type GlobeRenderMode = "globe2d" | "globe3d";

type GameGlobe2DProps = {
  countries: Country[];
  games: Game[];
  selectedCountry: Country | null;
  selectedGameId: string | null;
  hoveredGameId: string | null;
  viewMode: ViewMode;
  coverSize: number;
  globeMode: GlobeRenderMode;
  onGlobeModeChange: (mode: GlobeRenderMode) => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onHoverGame: (gameId: string | null) => void;
};

type Game2DMarker = {
  game: Game;
  position: SvgPosition;
  selected: boolean;
  hovered: boolean;
  sameCountrySelected: boolean;
};

export function GameGlobe2D({
  countries,
  games,
  selectedCountry,
  selectedGameId,
  hoveredGameId,
  viewMode,
  coverSize,
  globeMode,
  onGlobeModeChange,
  onSelectCountry,
  onSelectGame,
  onHoverGame
}: GameGlobe2DProps) {
  const [countryFeatures, setCountryFeatures] = useState<CountryGeoJsonFeature[]>(
    []
  );
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(
    null
  );
  const [globalViewCountryCode, setGlobalViewCountryCode] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function loadCountryFeatures() {
      try {
        const response = await fetch("/data/mock-countries.geojson");

        if (!response.ok) {
          throw new Error(`GeoJSON request failed with ${response.status}`);
        }

        const geoJson = (await response.json()) as CountryGeoJson;

        if (active) {
          setCountryFeatures(geoJson.features);
        }
      } catch {
        if (active) {
          setCountryFeatures([]);
        }
      }
    }

    void loadCountryFeatures();

    return () => {
      active = false;
    };
  }, []);

  const selectedCountryCode = selectedCountry?.code ?? null;
  const isFocused = Boolean(
    selectedCountry && globalViewCountryCode !== selectedCountry.code
  );
  const countryByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries]
  );
  const supportedCountryCodes = useMemo(
    () => new Set(countries.map((country) => country.code)),
    [countries]
  );
  const countryPaths = useMemo(
    () =>
      countryFeatures.flatMap((feature) => {
        const countryCode = getCountryCodeFromFeature(feature);

        if (!countryCode || !supportedCountryCodes.has(countryCode)) {
          return [];
        }

        return [
          {
            country: countryByCode.get(countryCode) ?? null,
            countryCode,
            path: getGeoJsonFeaturePath(feature)
          }
        ];
      }),
    [countryByCode, countryFeatures, supportedCountryCodes]
  );
  const viewBox = useMemo<Globe2DViewBox>(() => {
    if (isFocused && selectedCountry) {
      return getCountry2DViewBox(selectedCountry);
    }

    return getGlobal2DViewBox();
  }, [isFocused, selectedCountry]);
  const viewBoxValue = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  const gameMarkers = useMemo<Game2DMarker[]>(() => {
    const gamesByCountry = games.reduce<Record<string, Game[]>>((acc, game) => {
      acc[game.countryCode] = [...(acc[game.countryCode] ?? []), game];
      return acc;
    }, {});

    return games.flatMap((game) => {
      const country = countryByCode.get(game.countryCode);

      if (!country) {
        return [];
      }

      const countryGames = gamesByCountry[game.countryCode] ?? [];
      const clusterIndex = countryGames.findIndex((item) => item.id === game.id);

      return [
        {
          game,
          hovered: game.id === hoveredGameId,
          position: getClusteredGlobe2DPosition(
            country,
            clusterIndex,
            countryGames.length
          ),
          sameCountrySelected: game.countryCode === selectedCountryCode,
          selected: game.id === selectedGameId
        }
      ];
    });
  }, [countryByCode, games, hoveredGameId, selectedCountryCode, selectedGameId]);
  const selectedCountryMarkers = useMemo(
    () => gameMarkers.filter((marker) => marker.sameCountrySelected),
    [gameMarkers]
  );
  const otherCountryMarkers = useMemo(
    () => gameMarkers.filter((marker) => !marker.sameCountrySelected),
    [gameMarkers]
  );
  const hoveredMarker = useMemo(
    () => gameMarkers.find((marker) => marker.game.id === hoveredGameId) ?? null,
    [gameMarkers, hoveredGameId]
  );
  const hoveredTooltipPosition = hoveredMarker
    ? getOverlayPosition(hoveredMarker.position, viewBox)
    : null;
  const coverWidth = Math.max(74, Math.round(coverSize * 1.45));
  const coverHeight = Math.max(98, Math.round(coverSize * 1.92));
  const dotRadius = Math.max(4, Math.round(coverSize * 0.08));

  const handleGlobalView = useCallback(
    () => setGlobalViewCountryCode(selectedCountryCode),
    [selectedCountryCode]
  );
  const handleFocusSelectedCountry = useCallback(
    () => setGlobalViewCountryCode(null),
    []
  );

  return (
    <section className="glass-panel relative min-h-[690px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(0,240,255,0.2),transparent_28%),radial-gradient(circle_at_78%_24%,rgba(255,0,110,0.13),transparent_30%),radial-gradient(circle_at_48%_78%,rgba(168,85,247,0.2),transparent_42%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(226,246,255,0.72)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="globe2d-scanlines pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex h-full min-h-[690px] flex-col justify-between gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-cyan-100 drop-shadow-[0_0_14px_rgba(0,240,255,0.42)]">
              2.5D 星球地图
            </p>
            <p className="mt-1 text-xs text-cyan-50/55">
              点击国家轮廓聚焦区域，当前国家游戏以封面卡展示。
            </p>
          </div>
          <div className="grid gap-2 md:w-[31rem]">
            <div className="globe-mode-toggle">
              <button
                className={globeMode === "globe2d" ? "is-active" : ""}
                onClick={() => onGlobeModeChange("globe2d")}
                type="button"
              >
                2.5D 星球地图
              </button>
              <button
                className={globeMode === "globe3d" ? "is-active" : ""}
                onClick={() => onGlobeModeChange("globe3d")}
                type="button"
              >
                3D 实验模式
              </button>
            </div>
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
            </dl>
          </div>
        </div>

        <div className="globe2d-stage relative min-h-[560px] flex-1 overflow-hidden">
          <div className="absolute left-4 top-4 z-30 flex flex-wrap gap-2">
            <button
              className="globe-view-button"
              onClick={handleGlobalView}
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

          <svg
            aria-label="2.5D 星球国家地图"
            className="globe2d-map"
            role="img"
            viewBox={viewBoxValue}
          >
            <defs>
              <clipPath id="globe2dClip">
                <ellipse
                  cx={GLOBE_2D_WIDTH / 2}
                  cy={GLOBE_2D_HEIGHT / 2}
                  rx={GLOBE_2D_WIDTH / 2 - 10}
                  ry={GLOBE_2D_HEIGHT / 2 - 10}
                />
              </clipPath>
              <radialGradient id="globe2dOcean" cx="50%" cy="42%" r="70%">
                <stop offset="0%" stopColor="#143c7a" />
                <stop offset="48%" stopColor="#081f55" />
                <stop offset="100%" stopColor="#05051c" />
              </radialGradient>
            </defs>
            <ellipse
              className="globe2d-ocean"
              cx={GLOBE_2D_WIDTH / 2}
              cy={GLOBE_2D_HEIGHT / 2}
              rx={GLOBE_2D_WIDTH / 2 - 10}
              ry={GLOBE_2D_HEIGHT / 2 - 10}
            />
            <g className="globe2d-grid" clipPath="url(#globe2dClip)">
              {Array.from({ length: 11 }, (_, index) => (
                <path
                  d={`M 20 ${70 + index * 42} C 250 ${35 + index * 14}, 750 ${
                    35 + index * 70
                  }, 980 ${70 + index * 42}`}
                  key={`lat-${index}`}
                />
              ))}
              {Array.from({ length: 13 }, (_, index) => (
                <path
                  d={`M ${80 + index * 70} 24 C ${28 + index * 78} 190, ${
                    28 + index * 78
                  } 370, ${80 + index * 70} 536`}
                  key={`lng-${index}`}
                />
              ))}
            </g>
            <g clipPath="url(#globe2dClip)">
              {countryPaths.map(({ country, countryCode, path }) => {
                const isSelected = countryCode === selectedCountryCode;
                const isHovered = countryCode === hoveredCountryCode;

                return (
                  <path
                    className={[
                      "globe2d-country",
                      isSelected ? "is-selected" : "",
                      isHovered ? "is-hovered" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    d={path}
                    data-country-code={countryCode}
                    key={countryCode}
                    onClick={() => onSelectCountry(countryCode)}
                    onMouseEnter={() => setHoveredCountryCode(countryCode)}
                    onMouseLeave={() => setHoveredCountryCode(null)}
                    role="button"
                    tabIndex={0}
                  >
                    <title>
                      {country ? getCountryDisplayName(country) : countryCode}
                    </title>
                  </path>
                );
              })}
              {otherCountryMarkers.map((marker) => (
                <circle
                  className={[
                    "globe2d-game-dot",
                    marker.selected ? "is-selected" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  cx={marker.position.x}
                  cy={marker.position.y}
                  data-game-id={marker.game.id}
                  key={marker.game.id}
                  onClick={() => onSelectGame(marker.game.id)}
                  onMouseEnter={() => onHoverGame(marker.game.id)}
                  onMouseLeave={() => onHoverGame(null)}
                  onMouseOut={() => onHoverGame(null)}
                  onMouseOver={() => onHoverGame(marker.game.id)}
                  r={dotRadius}
                >
                  <title>{getGameDisplayTitle(marker.game)}</title>
                </circle>
              ))}
              {selectedCountryMarkers.map((marker) => (
                <foreignObject
                  className="globe2d-marker-object"
                  height={coverHeight}
                  key={marker.game.id}
                  width={coverWidth}
                  x={marker.position.x - coverWidth / 2}
                  y={marker.position.y - coverHeight / 2}
                >
                  <button
                    className={[
                      "globe2d-cover-marker",
                      marker.selected ? "is-selected" : "",
                      marker.hovered ? "is-hovered" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelectGame(marker.game.id)}
                    onFocus={() => onHoverGame(marker.game.id)}
                    onBlur={() => onHoverGame(null)}
                    onMouseEnter={() => onHoverGame(marker.game.id)}
                    onMouseLeave={() => onHoverGame(null)}
                    onMouseOut={() => onHoverGame(null)}
                    onMouseOver={() => onHoverGame(marker.game.id)}
                    data-game-id={marker.game.id}
                    type="button"
                  >
                    <span className="globe2d-cover-shine" />
                    <span className="globe2d-cover-title">
                      {getGameDisplayTitle(marker.game)}
                    </span>
                    {getGameSecondaryTitle(marker.game) ? (
                      <span className="globe2d-cover-subtitle">
                        {getGameSecondaryTitle(marker.game)}
                      </span>
                    ) : null}
                    <span className="globe2d-cover-meta">
                      <span>{marker.game.releaseYear}</span>
                      <span>{marker.game.rating.toFixed(1)}</span>
                    </span>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: getGameTooltipMarkup(marker.game)
                      }}
                    />
                  </button>
                </foreignObject>
              ))}
              {countries.map((country) => {
                const position = getClusteredGlobe2DPosition(country, 0, 1);

                return (
                  <text
                    className={[
                      "globe2d-country-label",
                      country.code === selectedCountryCode ? "is-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={country.code}
                    x={position.x}
                    y={position.y - 16}
                  >
                    {getCountryDisplayName(country)}
                  </text>
                );
              })}
            </g>
          </svg>
          {hoveredMarker && hoveredTooltipPosition ? (
            <div
              className="pointer-events-none absolute z-40"
              style={{
                left: `${hoveredTooltipPosition.x}%`,
                top: `${hoveredTooltipPosition.y}%`,
                transform: "translate(14px, -50%)"
              }}
            >
              <GameTooltip game={hoveredMarker.game} />
            </div>
          ) : null}
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

function getOverlayPosition(position: SvgPosition, viewBox: Globe2DViewBox) {
  return {
    x: ((position.x - viewBox.x) / viewBox.width) * 100,
    y: ((position.y - viewBox.y) / viewBox.height) * 100
  };
}
