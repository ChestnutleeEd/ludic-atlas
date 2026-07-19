import type { SafeViewport } from "@/types/earth";

type SafeViewportInput = {
  bottomInset?: number;
  height: number;
  leftInset?: number;
  rightInset?: number;
  topInset?: number;
  width: number;
};

export function createSafeViewport({
  bottomInset = 0,
  height,
  leftInset = 0,
  rightInset = 0,
  topInset = 0,
  width
}: SafeViewportInput): SafeViewport {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const left = clamp(leftInset, 0, safeWidth - 1);
  const right = clamp(safeWidth - rightInset, left + 1, safeWidth);
  const top = clamp(topInset, 0, safeHeight - 1);
  const bottom = clamp(safeHeight - bottomInset, top + 1, safeHeight);

  return {
    availableHeight: bottom - top,
    availableWidth: right - left,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    height: safeHeight,
    left,
    right,
    top,
    width: safeWidth
  };
}

export function isSafeViewportEquivalent(a: SafeViewport, b: SafeViewport) {
  return (
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.right - b.right) < 1 &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.bottom - b.bottom) < 1
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
