import type { RegionId, ViewMode, YearRange } from "@/types/game";

export type EarthProjectionMode = "globe" | "atlas";
export type ProjectionMode = EarthProjectionMode;

export type GlobeViewState = {
  altitude: number;
  lat: number;
  lng: number;
};

export type AtlasViewState = {
  centerLat: number;
  centerLng: number;
  zoom: number;
};

/** Settled renderer snapshots only; imperative renderer handles stay local. */
export type EarthViewState = {
  atlasViewState: AtlasViewState;
  /** Selection revision represented by the last settled Globe snapshot. */
  globeViewRevision: number;
  globeViewState: GlobeViewState;
  projectionMode: EarthProjectionMode;
};

export type RatingRange = {
  max: number;
  min: number;
};

export type EarthFilterState = {
  coverSize: number;
  ratingRange: RatingRange;
  viewMode: ViewMode;
  yearRange: YearRange;
};

export type SafeViewport = {
  availableHeight: number;
  availableWidth: number;
  bottom: number;
  centerX: number;
  centerY: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

export type SpatialNavigationTarget =
  | { type: "global" }
  | { regionId: RegionId; type: "region" }
  | { countryCode: string; type: "country" }
  | { countryCode: string; gameId: string; type: "game" };

export type SpatialNavigationIntent = {
  motion: "animate" | "immediate";
  revision: number;
  source:
    | "selection"
    | "focus-control"
    | "restore"
    | "projection-switch";
  target: SpatialNavigationTarget;
};
