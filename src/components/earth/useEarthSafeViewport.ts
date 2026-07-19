"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { createSafeViewport, isSafeViewportEquivalent } from "@/lib/safeViewport";
import type { SafeViewport } from "@/types/earth";
import type { MobileSheetState } from "@/components/panels/RightPanel";

type Input = {
  isActive: boolean;
  isDesktopPanelOpen: boolean;
  mobileSheetState: MobileSheetState;
  workspaceRef: RefObject<HTMLElement | null>;
};

/** Layout-owned measurement contract consumed by either spatial renderer. */
export function useEarthSafeViewport({
  isActive,
  isDesktopPanelOpen,
  mobileSheetState,
  workspaceRef
}: Input) {
  const [viewport, setViewport] = useState<SafeViewport>(() =>
    createSafeViewport({ height: 1, width: 1 })
  );

  useLayoutEffect(() => {
    if (!isActive) return;
    const workspace = workspaceRef.current;
    if (!workspace) return;
    let frameId: number | null = null;
    const measure = () => {
      frameId = null;
      const workspaceBounds = workspace.getBoundingClientRect();
      const isDesktop = window.innerWidth > 1023;
      const panel = workspace.querySelector<HTMLElement>(".right-panel-shell");
      const shell = workspace.closest<HTMLElement>(".game-earth-shell");
      const command = shell?.querySelector<HTMLElement>(".earth-command-bar");
      const filters = shell?.querySelector<HTMLElement>(".atlas-bottom-controls");
      const commandBounds = command?.getBoundingClientRect();
      const filterBounds = filters?.getBoundingClientRect();
      const rightInset = isDesktop && isDesktopPanelOpen
        ? Math.min(panel?.offsetWidth ?? 390, workspaceBounds.width * 0.46)
        : 0;
      const sheetBottomInset = !isDesktop && mobileSheetState !== "collapsed"
        ? Math.min(panel?.offsetHeight ?? 0, workspaceBounds.height * 0.82)
        : 0;
      const filterOverlapsBottom = Boolean(
        filterBounds &&
        filterBounds.top < workspaceBounds.bottom &&
        filterBounds.width > workspaceBounds.width * 0.55
      );
      const filterBottomInset = filterOverlapsBottom && filterBounds
        ? Math.max(0, workspaceBounds.bottom - filterBounds.top)
        : 0;
      const commandTopInset = commandBounds && commandBounds.bottom > workspaceBounds.top
        ? Math.max(0, commandBounds.bottom - workspaceBounds.top)
        : 0;
      const next = createSafeViewport({
        bottomInset: Math.max(sheetBottomInset, filterBottomInset),
        height: workspaceBounds.height,
        rightInset,
        topInset: commandTopInset,
        width: workspaceBounds.width
      });
      setViewport((current) =>
        isSafeViewportEquivalent(current, next) ? current : next
      );
    };
    const scheduleMeasure = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(workspace);
    const panel = workspace.querySelector<HTMLElement>(".right-panel-shell");
    if (panel) observer.observe(panel);
    const shell = workspace.closest<HTMLElement>(".game-earth-shell");
    for (const overlay of shell?.querySelectorAll<HTMLElement>(
      ".earth-command-bar, .atlas-bottom-controls"
    ) ?? []) observer.observe(overlay);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [isActive, isDesktopPanelOpen, mobileSheetState, workspaceRef]);

  return viewport;
}
