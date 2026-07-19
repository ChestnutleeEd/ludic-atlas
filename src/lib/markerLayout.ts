import type { EarthProjectionMode, SafeViewport } from "../types/earth.ts";

export type MarkerPerformanceTier = "low" | "medium" | "high";
export type MarkerExplorationLevel = "global" | "region" | "country";

export type MarkerBudgetInput = {
  altitude: number;
  coverSize: number;
  explorationLevel: MarkerExplorationLevel;
  filteredGameCount: number;
  geographicArea?: number;
  performanceTier: MarkerPerformanceTier;
  projectedAreaPx: number;
  projectionMode: EarthProjectionMode;
  settled: boolean;
};

export type MarkerBudget = {
  budget: number;
  candidateLimit: number;
  overflowCount: number;
  sizeClass: "global" | "large" | "medium" | "tiny";
};

const ABSOLUTE_COUNTRY_CAP = 24;

export function calculateMarkerBudget(input: MarkerBudgetInput): MarkerBudget {
  const games = Math.max(0, input.filteredGameCount);
  if (games === 0) return { budget: 0, candidateLimit: 0, overflowCount: 0, sizeClass: "tiny" };
  if (input.explorationLevel === "global") {
    const budget = Math.min(games, input.projectedAreaPx < 900 ? 0 : input.projectedAreaPx > 120_000 ? 2 : 1);
    return finishBudget(budget, games, "global");
  }

  const footprint = Math.max(28, input.coverSize) * Math.max(38, input.coverSize * 1.2);
  const capacity = Math.floor(input.projectedAreaPx / (footprint * 0.72));
  const performance = input.performanceTier === "high" ? 1 : input.performanceTier === "medium" ? 0.86 : 0.66;
  const projection = input.projectionMode === "atlas" ? 1.08 : 1;
  const zoom = Math.min(1.12, Math.max(0.72, 1.08 - quantize(input.altitude, 0.05) * 0.16));
  const desired = Math.floor(capacity * performance * projection * zoom);

  if (input.explorationLevel === "region") {
    const budget = Math.min(games, 8, Math.max(3, desired));
    return finishBudget(input.settled ? budget : Math.min(3, budget), games, "medium");
  }

  const sizeClass = (input.geographicArea ?? Infinity) < 8
    ? "tiny"
    : input.projectedAreaPx >= 72_000
      ? "large"
      : input.projectedAreaPx >= 12_000
        ? "medium"
        : "tiny";
  const limits = sizeClass === "large" ? [18, 24] : sizeClass === "medium" ? [10, 16] : [1, 4];
  const budget = Math.min(games, ABSOLUTE_COUNTRY_CAP, limits[1], Math.max(limits[0], desired));
  return finishBudget(input.settled ? budget : Math.min(sizeClass === "tiny" ? 1 : 4, budget), games, sizeClass);
}

function finishBudget(budget: number, games: number, sizeClass: MarkerBudget["sizeClass"]): MarkerBudget {
  const bounded = Math.max(0, Math.min(ABSOLUTE_COUNTRY_CAP, budget));
  return {
    budget: bounded,
    candidateLimit: Math.min(96, Math.max(bounded, bounded * 4)),
    overflowCount: Math.max(0, games - bounded),
    sizeClass
  };
}

export function estimateProjectedCountryArea({
  geographicArea,
  altitude,
  safeViewport
}: {
  geographicArea: number;
  altitude: number;
  safeViewport: SafeViewport;
}) {
  const viewportArea = safeViewport.availableWidth * safeViewport.availableHeight;
  return Math.max(0, geographicArea * viewportArea / (430 * Math.pow(Math.max(0.18, quantize(altitude, 0.05) + 0.35), 2)));
}

export function stabilizeMarkerBudget(previous: number | null, next: number) {
  if (previous === null) return next;
  return Math.abs(previous - next) <= 1 ? previous : next;
}

export type CollisionCandidate<T> = {
  height: number;
  id: string;
  payload: T;
  width: number;
  x: number;
  y: number;
};

export function applyScreenSpaceCollision<T>({
  candidates,
  gap = 6,
  protectedRects = [],
  safeViewport
}: {
  candidates: CollisionCandidate<T>[];
  gap?: number;
  protectedRects?: Array<{ bottom: number; left: number; right: number; top: number }>;
  safeViewport: SafeViewport;
}) {
  const cellSize = Math.max(24, ...candidates.map((candidate) => Math.max(candidate.width, candidate.height) + gap));
  const grid = new Map<string, Array<{ bottom: number; left: number; right: number; top: number }>>();
  const visible: CollisionCandidate<T>[] = [];
  const overflow: CollisionCandidate<T>[] = [];
  for (const candidate of candidates) {
    const rect = { left: candidate.x - candidate.width / 2 - gap, right: candidate.x + candidate.width / 2 + gap, top: candidate.y - candidate.height / 2 - gap, bottom: candidate.y + candidate.height / 2 + gap };
    const inside = rect.left >= safeViewport.left && rect.right <= safeViewport.right && rect.top >= safeViewport.top && rect.bottom <= safeViewport.bottom;
    const minX = Math.floor(rect.left / cellSize), maxX = Math.floor(rect.right / cellSize), minY = Math.floor(rect.top / cellSize), maxY = Math.floor(rect.bottom / cellSize);
    const nearby: typeof protectedRects = [...protectedRects];
    for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) nearby.push(...(grid.get(`${x}:${y}`) ?? []));
    if (!inside || nearby.some((other) => intersects(rect, other))) { overflow.push(candidate); continue; }
    visible.push(candidate);
    for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
      const key = `${x}:${y}`; const entries = grid.get(key) ?? []; entries.push(rect); grid.set(key, entries);
    }
  }
  return { overflow, visible };
}

export function quantizeSettledView(input: { altitude: number; coverSize: number; height: number; width: number }) {
  return { altitude: quantize(input.altitude, 0.05), coverSize: quantize(input.coverSize, 4), height: quantize(input.height, 32), width: quantize(input.width, 32) };
}

function intersects(a: { bottom: number; left: number; right: number; top: number }, b: { bottom: number; left: number; right: number; top: number }) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function quantize(value: number, step: number) { return Math.round(value / step) * step; }
