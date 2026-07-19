import type { CameraMode, Country, Game, RegionId } from "../types/game";
import { getCountryRegionId } from "./regions.ts";

export type ExplorationState = {
  activeRegionId: RegionId;
  cameraMode: CameraMode;
  selectedCountryCode: string | null;
  selectedGameId: string | null;
  selectionRevision: number;
};

export type ExplorationAction =
  | { type: "selectCountry"; countryCode: string }
  | { type: "selectGame"; gameId: string }
  | { type: "selectRegion"; regionId: RegionId }
  | { type: "setCameraMode"; cameraMode: CameraMode }
  | { type: "clearGame" }
  | { type: "clearCountry" }
  | { type: "reset" };

export const initialExplorationState: ExplorationState = {
  activeRegionId: "global",
  cameraMode: "overview",
  selectedCountryCode: null,
  selectedGameId: null,
  selectionRevision: 0
};

export function createExplorationReducer(countries: Country[], games: Game[]) {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const gameById = new Map(games.map((game) => [game.id, game]));

  return (state: ExplorationState, action: ExplorationAction): ExplorationState => {
    if (action.type === "reset") return initialExplorationState;
    if (action.type === "setCameraMode") {
      return action.cameraMode === state.cameraMode ? state : { ...state, cameraMode: action.cameraMode };
    }
    if (action.type === "clearCountry") {
      if (!state.selectedCountryCode && !state.selectedGameId) return state;
      return {
        ...state,
        cameraMode: "overview",
        selectedCountryCode: null,
        selectedGameId: null,
        selectionRevision: state.selectionRevision + 1
      };
    }
    if (action.type === "clearGame") {
      return state.selectedGameId
        ? {
            ...state,
            selectedGameId: null,
            selectionRevision: state.selectionRevision + 1
          }
        : state;
    }
    if (action.type === "selectRegion") {
      const country = state.selectedCountryCode ? countryByCode.get(state.selectedCountryCode) : null;
      const keepCountry = action.regionId === "global" || (country && getCountryRegionId(country) === action.regionId);
      if (
        state.activeRegionId === action.regionId &&
        keepCountry &&
        state.cameraMode === "overview"
      ) return state;
      return {
        ...state,
        activeRegionId: action.regionId,
        cameraMode: "overview",
        selectedCountryCode: keepCountry ? state.selectedCountryCode : null,
        selectedGameId: keepCountry ? state.selectedGameId : null,
        selectionRevision: state.selectionRevision + 1
      };
    }
    if (action.type === "selectCountry") {
      const country = countryByCode.get(action.countryCode);
      if (!country) return state;
      return {
        ...state,
        activeRegionId: getCountryRegionId(country),
        cameraMode: "surface",
        selectedCountryCode: country.code,
        selectedGameId: null,
        selectionRevision: state.selectionRevision + 1
      };
    }
    const game = gameById.get(action.gameId);
    const country = game ? countryByCode.get(game.countryCode) : null;
    if (!game || !country) return state;
    return {
      ...state,
      activeRegionId: getCountryRegionId(country),
      cameraMode: "surface",
      selectedCountryCode: country.code,
      selectedGameId: game.id,
      selectionRevision: state.selectionRevision + 1
    };
  };
}
