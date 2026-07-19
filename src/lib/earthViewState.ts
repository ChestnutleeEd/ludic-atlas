import type { ExplorationState } from "@/lib/explorerState";
import type { Country, Game } from "@/types/game";
import type {
  EarthProjectionMode,
  EarthViewState,
  GlobeViewState,
  SpatialNavigationIntent
} from "@/types/earth";

export const DEFAULT_GLOBE_VIEW_STATE: GlobeViewState = {
  altitude: 1.36,
  lat: 24,
  lng: 38
};

export const DEFAULT_ATLAS_VIEW_STATE = {
  centerLat: 20,
  centerLng: 0,
  zoom: 1
} as const;

export function createInitialEarthViewState(): EarthViewState {
  return {
    atlasViewState: { ...DEFAULT_ATLAS_VIEW_STATE },
    globeViewRevision: 0,
    globeViewState: { ...DEFAULT_GLOBE_VIEW_STATE },
    projectionMode: "globe"
  };
}

export function setEarthProjectionMode(
  state: EarthViewState,
  projectionMode: EarthProjectionMode
): EarthViewState {
  return state.projectionMode === projectionMode
    ? state
    : { ...state, projectionMode };
}

type DeriveSpatialNavigationIntentInput = {
  countryByCode: ReadonlyMap<string, Country>;
  exploration: ExplorationState;
  gameById: ReadonlyMap<string, Game>;
  motion?: SpatialNavigationIntent["motion"];
  source?: SpatialNavigationIntent["source"];
};

/** Derives one semantic target from the authoritative Earth selection state. */
export function deriveSpatialNavigationIntent({
  countryByCode,
  exploration,
  gameById,
  motion = "animate",
  source = "selection"
}: DeriveSpatialNavigationIntentInput): SpatialNavigationIntent {
  const selectedGame = exploration.selectedGameId
    ? gameById.get(exploration.selectedGameId)
    : null;
  const selectedGameCountry = selectedGame
    ? countryByCode.get(selectedGame.countryCode)
    : null;

  if (selectedGame && selectedGameCountry) {
    return {
      motion,
      revision: exploration.selectionRevision,
      source,
      target: {
        countryCode: selectedGameCountry.code,
        gameId: selectedGame.id,
        type: "game"
      }
    };
  }

  const selectedCountry = exploration.selectedCountryCode
    ? countryByCode.get(exploration.selectedCountryCode)
    : null;

  if (selectedCountry) {
    return {
      motion,
      revision: exploration.selectionRevision,
      source,
      target: { countryCode: selectedCountry.code, type: "country" }
    };
  }

  if (exploration.activeRegionId !== "global") {
    return {
      motion,
      revision: exploration.selectionRevision,
      source,
      target: { regionId: exploration.activeRegionId, type: "region" }
    };
  }

  return {
    motion,
    revision: exploration.selectionRevision,
    source,
    target: { type: "global" }
  };
}

export function isSpatialNavigationIntentStale(
  intent: SpatialNavigationIntent,
  currentSelectionRevision: number
) {
  return intent.revision < currentSelectionRevision;
}
