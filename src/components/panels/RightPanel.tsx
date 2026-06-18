"use client";

import { useEffect, useRef } from "react";
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
  sheetState: MobileSheetState;
  sheetSummary: string;
  yearRange: YearRange;
  onSelectCountry: (countryCode: string) => void;
  onClearCountry: () => void;
  onSelectGame: (gameId: string | null) => void;
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
  sheetState,
  sheetSummary,
  yearRange,
  onSelectCountry,
  onClearCountry,
  onSelectGame,
  onSheetStateChange
}: RightPanelProps) {
  const dragStartYRef = useRef<number | null>(null);
  const suppressHandleClickRef = useRef(false);
  const isGameDetailOpen = Boolean(selectedGame);
  const panelTitle = selectedCountry
    ? `${selectedCountry.nameZh} ${selectedCountry.name} 国家详情`
    : `${getRegionLabel(activeRegionId)} 国家与地区总览`;

  useEffect(() => {
    if (!isGameDetailOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectGame(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameDetailOpen, onSelectGame]);

  return (
    <aside
      aria-label={panelTitle}
      data-sheet-state={sheetState}
      className={`glass-panel right-panel-shell relative min-h-[460px] max-h-[calc(100vh-180px)] p-4 ${
        isGameDetailOpen ? "is-game-detail-open overflow-hidden" : "overflow-y-auto"
      }`}
    >
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
            onMouseDown={(event) => event.stopPropagation()}
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
