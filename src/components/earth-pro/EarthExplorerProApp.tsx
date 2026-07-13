"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  EARTH_PRO_PRESETS,
  buildEarthProMarkerData,
  getEarthProCameraViewForCountry,
  getEarthProDisplayCoverImage,
  getEarthProPreset,
  getEarthProPresetForCountry,
  type EarthProPresetId
} from "@/lib/earthPro";
import {
  getCountryDisplayName,
  getGameDisplayTitle,
  getGameSecondaryTitle,
  getGenreListLabel
} from "@/lib/localization";
import { gameCatalog } from "@/data/gameCatalog";
import type { Country, Game } from "@/types/game";
import type { EarthProCameraCommand } from "@/components/earth-pro/EarthProMap";

const EarthProMap = dynamic(
  () => import("@/components/earth-pro/EarthProMap").then((mod) => mod.EarthProMap),
  {
    loading: () => <div className="earth-pro-loading">地图数据加载中</div>,
    ssr: false
  }
);
const { countries, games, totalStats } = gameCatalog;

export function EarthExplorerProApp() {
  const [activePresetId, setActivePresetId] =
    useState<EarthProPresetId>("global");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(
    null
  );
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [cameraCommand, setCameraCommand] =
    useState<EarthProCameraCommand | null>(null);
  const activePreset = useMemo(
    () => getEarthProPreset(activePresetId),
    [activePresetId]
  );
  const selectedCountry = useMemo(
    () =>
      selectedCountryCode
        ? gameCatalog.countryByCode.get(selectedCountryCode) ?? null
        : null,
    [selectedCountryCode]
  );
  const selectedGame = useMemo(
    () =>
      selectedGameId ? gameCatalog.gameById.get(selectedGameId) ?? null : null,
    [selectedGameId]
  );
  const cameraView = useMemo(
    () =>
      selectedCountry
        ? getEarthProCameraViewForCountry(selectedCountry)
        : activePreset.camera,
    [activePreset.camera, selectedCountry]
  );
  const markerData = useMemo(
    () =>
      buildEarthProMarkerData({
        countries,
        games,
        preset: activePreset,
        selectedCountryCode,
        selectedGameId
      }),
    [activePreset, selectedCountryCode, selectedGameId]
  );
  const visibleLabel = selectedCountry
    ? getCountryDisplayName(selectedCountry)
    : `${activePreset.labelZh} ${activePreset.label}`;
  const hoveredCountry = hoveredCountryCode
    ? gameCatalog.countryByCode.get(hoveredCountryCode) ?? null
    : null;
  const hoveredGame = hoveredGameId
    ? gameCatalog.gameById.get(hoveredGameId) ?? null
    : null;
  const panelCountry = selectedCountry ?? hoveredCountry;
  const panelGames = useMemo(
    () =>
      (panelCountry
        ? gameCatalog.gamesByCountry.get(panelCountry.code) ?? []
        : markerData.scopedGames
      )
        .toSorted((a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear)
        .slice(0, panelCountry ? 18 : 12),
    [markerData.scopedGames, panelCountry]
  );

  const selectPreset = useCallback((presetId: EarthProPresetId) => {
    const preset = getEarthProPreset(presetId);

    setActivePresetId(presetId);
    setSelectedGameId(null);
    setSelectedCountryCode(preset.kind === "country" ? preset.id : null);
    setPanelOpen(false);
  }, []);

  const selectCountry = useCallback((countryCode: string) => {
    const countryPreset = getEarthProPresetForCountry(countryCode);

    if (countryPreset) {
      setActivePresetId(countryPreset.id);
    }

    setSelectedCountryCode(countryCode);
    setSelectedGameId(null);
    setPanelOpen(true);
  }, []);

  const selectGame = useCallback((gameId: string) => {
    const game = gameCatalog.gameById.get(gameId);

    if (!game) {
      return;
    }

    const countryPreset = getEarthProPresetForCountry(game.countryCode);
    if (countryPreset) {
      setActivePresetId(countryPreset.id);
    }

    setSelectedCountryCode(game.countryCode);
    setSelectedGameId(gameId);
    setPanelOpen(true);
  }, []);

  const sendCameraCommand = useCallback((type: EarthProCameraCommand["type"]) => {
    setCameraCommand({
      id: Date.now(),
      type
    });
  }, []);
  const handleMapInteractionStart = useCallback(() => {
    setPanelOpen(false);
  }, []);

  return (
    <main className="earth-explorer-pro-shell">
      <EarthProMap
        cameraCommand={cameraCommand}
        cameraView={cameraView}
        countries={countries}
        markerData={markerData}
        selectedCountryCode={selectedCountryCode}
        selectedGameId={selectedGameId}
        onHoverCountry={setHoveredCountryCode}
        onHoverGame={setHoveredGameId}
        onInteractionStart={handleMapInteractionStart}
        onSelectCountry={selectCountry}
        onSelectGame={selectGame}
      />

      <header className="earth-pro-topbar">
        <div>
          <Link className="earth-pro-back-link" href="/">
            返回游戏星图
          </Link>
          <h1>Earth Explorer Pro / 地球探索</h1>
        </div>
        <dl>
          <div>
            <dt>当前焦点</dt>
            <dd>{visibleLabel}</dd>
          </div>
          <div>
            <dt>全球游戏</dt>
            <dd>{totalStats.totalGames}</dd>
          </div>
          <div>
            <dt>已识别国家</dt>
            <dd>{gameCatalog.recognizedCountryCount}</dd>
          </div>
          <div>
            <dt>可见游戏</dt>
            <dd>{markerData.scopedGames.length}</dd>
          </div>
        </dl>
      </header>

      <aside className="earth-pro-legend" aria-label="地图图例">
        <span>
          <b className="earth-pro-legend-dot earth-pro-legend-dot-aggregate" />
          聚合点
        </span>
        <span>
          <b className="earth-pro-legend-dot earth-pro-legend-dot-cover" />
          高评分游戏
        </span>
        <span>
          <b className="earth-pro-legend-dot earth-pro-legend-dot-selected" />
          当前选中
        </span>
      </aside>

      <section className="earth-pro-controls" aria-label="Earth Pro controls">
        <div className="earth-pro-camera-buttons">
          <button type="button" onClick={() => sendCameraCommand("zoomIn")}>
            放大
          </button>
          <button type="button" onClick={() => sendCameraCommand("zoomOut")}>
            缩小
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCountryCode(null);
              setSelectedGameId(null);
              setPanelOpen(false);
              setActivePresetId("global");
              sendCameraCommand("reset");
            }}
          >
            重置
          </button>
          <button type="button" onClick={() => sendCameraCommand("focusSelected")}>
            聚焦
          </button>
        </div>
        <div className="earth-pro-preset-grid">
          {EARTH_PRO_PRESETS.map((preset) => (
            <button
              className={preset.id === activePresetId ? "is-active" : ""}
              key={preset.id}
              title={`${preset.labelZh} ${preset.label}`}
              type="button"
              onClick={() => selectPreset(preset.id)}
            >
              <span>{preset.labelZh}</span>
              <small>{preset.label}</small>
            </button>
          ))}
        </div>
      </section>

      <EarthProDetailPanel
        country={panelCountry}
        games={panelGames}
        hoveredGame={hoveredGame}
        isOpen={panelOpen}
        selectedGame={selectedGame}
        totalGames={totalStats.totalGames}
        recognizedGameCount={gameCatalog.recognizedGameCount}
        visibleCountries={markerData.countryMarkers.length}
        onClose={() => setPanelOpen(false)}
        onOpen={() => setPanelOpen(true)}
        onSelectGame={selectGame}
      />
    </main>
  );
}

function EarthProDetailPanel({
  country,
  games: countryGames,
  hoveredGame,
  isOpen,
  selectedGame,
  totalGames,
  recognizedGameCount,
  visibleCountries,
  onClose,
  onOpen,
  onSelectGame
}: {
  country: Country | null;
  games: Game[];
  hoveredGame: Game | null;
  isOpen: boolean;
  selectedGame: Game | null;
  totalGames: number;
  recognizedGameCount: number;
  visibleCountries: number;
  onClose: () => void;
  onOpen: () => void;
  onSelectGame: (gameId: string) => void;
}) {
  const featuredGame = selectedGame ?? hoveredGame ?? countryGames[0] ?? null;

  return (
    <aside className={`earth-pro-detail-panel ${isOpen ? "is-open" : ""}`}>
      <button
        className="earth-pro-panel-tab"
        type="button"
        onClick={isOpen ? onClose : onOpen}
      >
        {isOpen ? "收起" : "详情"}
      </button>
      <div className="earth-pro-panel-body">
        <div className="earth-pro-panel-header">
          <div>
            <p>当前焦点</p>
            <h2>{country ? getCountryDisplayName(country) : "全球 Global"}</h2>
          </div>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <dl className="earth-pro-panel-stats">
          <div>
            <dt>国家 / 地区</dt>
            <dd>{country ? 1 : visibleCountries}</dd>
          </div>
          <div>
            <dt>当前列表</dt>
            <dd>{countryGames.length}</dd>
          </div>
          <div>
            <dt>本地数据</dt>
            <dd>
              {recognizedGameCount} / {totalGames}
            </dd>
          </div>
        </dl>

        {featuredGame ? (
          <article className="earth-pro-featured-game">
            <Image
              alt={getGameDisplayTitle(featuredGame)}
              height={235}
              loading="lazy"
              sizes="88px"
              src={getEarthProDisplayCoverImage(featuredGame)}
              width={176}
            />
            <div>
              <span>
                {featuredGame.releaseYear} · 评分 {featuredGame.rating}
              </span>
              <h3>{getGameDisplayTitle(featuredGame)}</h3>
              {getGameSecondaryTitle(featuredGame) ? (
                <p>{getGameSecondaryTitle(featuredGame)}</p>
              ) : null}
              <p>开发商：{featuredGame.developer}</p>
              <p>发行商：{featuredGame.publisher}</p>
              <p>{getGenreListLabel(featuredGame.genres)}</p>
            </div>
          </article>
        ) : (
          <div className="earth-pro-empty-state">当前区域暂无游戏记录</div>
        )}

        <div className="earth-pro-game-list">
          {countryGames.map((game) => (
            <button
              className={game.id === selectedGame?.id ? "is-selected" : ""}
              key={game.id}
              type="button"
              onClick={() => onSelectGame(game.id)}
            >
              <Image
                alt={getGameDisplayTitle(game)}
                height={117}
                loading="lazy"
                sizes="44px"
                src={getEarthProDisplayCoverImage(game)}
                width={88}
              />
              <span>
                <strong>{getGameDisplayTitle(game)}</strong>
                <small>
                  {game.releaseYear} · {getGenreListLabel(game.genres)}
                </small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
