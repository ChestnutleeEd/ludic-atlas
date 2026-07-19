"use client";

import { useEffect, useRef, useState } from "react";
import { CountryPanel } from "@/components/panels/CountryPanel";
import { CountryDetailPanel } from "@/components/panels/CountryDetailPanel";
import { GameDetailCard } from "@/components/panels/GameDetailCard";
import { getRegionLabel } from "@/lib/regions";
import type { RegionId } from "@/types/game";
import type { Country, Game, YearRange } from "@/types/game";

export type MobileSheetState = "collapsed" | "peek" | "expanded";

type RightPanelProps = {
  countries: Country[];
  games: Game[];
  activeRegionId: RegionId;
  selectedCountry: Country | null;
  selectedCountryCode: string | null;
  selectedGame: Game | null;
  selectedGameId: string | null;
  selectionRevision: number;
  sheetState: MobileSheetState;
  sheetSummary: string;
  isDesktopOpen: boolean;
  yearRange: YearRange;
  onSelectCountry: (countryCode: string) => void;
  onClearCountry: () => void;
  onSelectGame: (gameId: string | null) => void;
  onRequestClose: () => void;
  onSheetStateChange: (state: MobileSheetState) => void;
};

export function RightPanel({
  countries,
  games,
  activeRegionId,
  selectedCountry,
  selectedCountryCode,
  selectedGame,
  selectedGameId,
  selectionRevision,
  sheetState,
  sheetSummary,
  isDesktopOpen,
  yearRange,
  onSelectCountry,
  onClearCountry,
  onSelectGame,
  onRequestClose,
  onSheetStateChange
}: RightPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const gameDetailRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const suppressHandleClickRef = useRef(false);
  const [isWideViewport, setIsWideViewport] = useState(false);
  const isGameDetailOpen = Boolean(selectedGame);
  const panelTitle = selectedCountry
    ? `${selectedCountry.nameZh} ${selectedCountry.name} 国家详情`
    : `${getRegionLabel(activeRegionId)} 国家与地区总览`;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncViewport = () => setIsWideViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!isGameDetailOpen && !isDesktopOpen && sheetState === "collapsed") {
      return;
    }

    if (isGameDetailOpen) {
      panelRef.current?.scrollTo({ left: 0, top: 0 });
      requestAnimationFrame(() => {
        gameDetailRef.current?.querySelector<HTMLElement>("button")?.focus();
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isGameDetailOpen) {
          onSelectGame(null);
        } else if (isWideViewport) {
          onRequestClose();
        } else {
          onSheetStateChange("collapsed");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesktopOpen, isGameDetailOpen, isWideViewport, onRequestClose, onSelectGame, onSheetStateChange, sheetState]);

  return (
    <aside
      aria-label={panelTitle}
      aria-hidden={isWideViewport && !isDesktopOpen ? true : undefined}
      data-selection-revision={selectionRevision}
      data-sheet-state={sheetState}
      inert={isWideViewport && !isDesktopOpen ? true : undefined}
      id="earth-country-panel"
      ref={panelRef}
      className={`glass-panel right-panel-shell relative h-full min-h-0 p-4 ${
        isDesktopOpen ? "is-desktop-open" : ""
      } ${
        isGameDetailOpen ? "is-game-detail-open overflow-hidden" : "overflow-y-auto"
      }`}
    >
      <button
        aria-label="关闭国家目录"
        className="right-panel-close"
        onClick={onRequestClose}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div className="mobile-sheet-header">
        <button
          aria-label="切换底部面板展开状态"
          className="mobile-sheet-handle"
          onClick={() => {
            if (suppressHandleClickRef.current) {
              suppressHandleClickRef.current = false;
              return;
            }

            onSheetStateChange(
              sheetState === "expanded" ? "peek" : "expanded"
            );
          }}
          onPointerDown={(event) => {
            dragStartYRef.current = event.clientY;
          }}
          onPointerUp={(event) => {
            const startY = dragStartYRef.current;
            dragStartYRef.current = null;

            if (startY === null) {
              return;
            }

            const deltaY = event.clientY - startY;

            if (Math.abs(deltaY) < 48) {
              return;
            }

            suppressHandleClickRef.current = true;
            onSheetStateChange(
              deltaY > 0
                ? getPreviousSheetState(sheetState)
                : getNextSheetState(sheetState)
            );
          }}
          type="button"
        >
          <span />
        </button>
        <button
          className="mobile-sheet-summary"
          onClick={() =>
            onSheetStateChange(
              sheetState === "collapsed" ? "peek" : "collapsed"
            )
          }
          type="button"
        >
          <span>{sheetSummary}</span>
          <small>
            {selectedCountry ? "国家详情" : "国家总览"} / {games.length} 款游戏
          </small>
        </button>
        <div aria-label="底部面板高度" className="mobile-sheet-steps" role="group">
          <button
            aria-pressed={sheetState === "collapsed"}
            onClick={() => onSheetStateChange("collapsed")}
            type="button"
          >
            收起
          </button>
          <button
            aria-pressed={sheetState === "peek"}
            onClick={() => onSheetStateChange("peek")}
            type="button"
          >
            概览
          </button>
          <button
            aria-pressed={sheetState === "expanded"}
            onClick={() => onSheetStateChange("expanded")}
            type="button"
          >
            展开
          </button>
        </div>
      </div>

      <div
        aria-hidden={isGameDetailOpen}
        className="right-panel-content"
        inert={isGameDetailOpen ? true : undefined}
      >
        {selectedCountry ? (
          <CountryDetailPanel
            country={selectedCountry}
            games={games}
            selectedGameId={selectedGameId}
            yearRange={yearRange}
            onClearCountry={onClearCountry}
            onSelectGame={onSelectGame}
          />
        ) : (
          <>
            <CountryPanel
              countries={countries}
              games={games}
              activeRegionLabel={getRegionLabel(activeRegionId)}
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={onSelectCountry}
            />
          </>
        )}
      </div>

      {selectedGame ? (
        <div
          aria-label={`游戏详情：${selectedGame.titleZh || selectedGame.title}`}
          aria-modal="true"
          className="game-detail-layer"
          role="dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onSelectGame(null);
            }
          }}
        >
          <div
            className="game-detail-layer-card"
            data-selection-revision={selectionRevision}
            onMouseDown={(event) => event.stopPropagation()}
            ref={gameDetailRef}
          >
            <GameDetailCard
              game={selectedGame}
              key={selectedGame.id}
              onClose={() => onSelectGame(null)}
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function getNextSheetState(sheetState: MobileSheetState): MobileSheetState {
  if (sheetState === "collapsed") {
    return "peek";
  }

  if (sheetState === "peek") {
    return "expanded";
  }

  return "peek";
}

function getPreviousSheetState(sheetState: MobileSheetState): MobileSheetState {
  if (sheetState === "expanded") {
    return "peek";
  }

  return "collapsed";
}
