"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArchiveDossier } from "@/components/archive/ArchiveDossier";
import { useArchiveReducedMotion } from "@/components/archive/useArchiveReducedMotion";
import type { ArchiveYearGroup } from "@/lib/archiveModel";
import type { Game } from "@/types/game";
import styles from "./GameArchiveView.module.css";

type ArchiveYearModalProps = {
  group: ArchiveYearGroup;
  selectedGame: Game;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export function ArchiveYearModal({
  group,
  selectedGame,
  onClose,
  onSelectGame
}: ArchiveYearModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestCloseRef = useRef<() => void>(() => undefined);
  const [isClosing, setIsClosing] = useState(false);
  const reduceMotion = useArchiveReducedMotion();
  const selectedIndex = group.games.findIndex((game) => game.id === selectedGame.id);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (reduceMotion) {
      onClose();
      return;
    }
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, 240);
  }, [isClosing, onClose, reduceMotion]);

  useEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnTarget =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appShell = document.querySelector<HTMLElement>(".game-earth-shell");

    document.body.style.overflow = "hidden";
    if (appShell) appShell.inert = true;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])];
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (appShell) appShell.inert = false;
      window.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, []);

  return createPortal(
    <div
      className={`${styles.drawerBackdrop} ${isClosing ? styles.drawerBackdropClosing : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <aside
        aria-describedby="archive-drawer-description"
        aria-labelledby="archive-drawer-title"
        aria-modal="true"
        className={`${styles.drawer} ${isClosing ? styles.drawerClosing : ""}`}
        data-archive-region="dossier"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.drawerHeader}>
          <div>
            <p>{group.label} 年度馆藏</p>
            <h2 id="archive-drawer-title">游戏档案</h2>
          </div>
          <button
            aria-label="关闭游戏档案"
            className={styles.drawerClose}
            onClick={requestClose}
            ref={closeButtonRef}
            type="button"
          >
            关闭
          </button>
        </header>
        <p className={styles.srOnly} id="archive-drawer-description">
          当前年份仍保留在背景中。按 Escape 可关闭档案并返回触发游戏。
        </p>
        <nav aria-label="切换年度馆藏" className={styles.drawerNavigation}>
          <button
            disabled={selectedIndex <= 0}
            onClick={() => onSelectGame(group.games[selectedIndex - 1].id)}
            type="button"
          >
            上一份
          </button>
          <span>{selectedIndex + 1} / {group.games.length}</span>
          <button
            disabled={selectedIndex < 0 || selectedIndex >= group.games.length - 1}
            onClick={() => onSelectGame(group.games[selectedIndex + 1].id)}
            type="button"
          >
            下一份
          </button>
        </nav>
        <ArchiveDossier group={group} selectedGame={selectedGame} />
      </aside>
    </div>,
    document.body
  );
}
