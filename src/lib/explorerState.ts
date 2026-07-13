import type { CameraMode, Country, Game, RegionId } from "../types/game";

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

const COUNTRY_REGION: Partial<Record<string, RegionId>> = {
  JP: "eastAsia", CN: "eastAsia", KR: "eastAsia",
  US: "northAmerica", CA: "northAmerica",
  MX: "latinAmerica", BR: "latinAmerica", AR: "latinAmerica", CL: "latinAmerica",
  AE: "middleEast", IL: "middleEast", IR: "middleEast", SA: "middleEast", TR: "middleEast",
  IN: "southAsia", PK: "southAsia", BD: "southAsia", LK: "southAsia",
  AU: "oceania", NZ: "oceania"
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
      return { ...state, selectedCountryCode: null, selectedGameId: null, selectionRevision: state.selectionRevision + 1 };
    }
    if (action.type === "clearGame") {
      return state.selectedGameId ? { ...state, selectedGameId: null } : state;
    }
    if (action.type === "selectRegion") {
      const country = state.selectedCountryCode ? countryByCode.get(state.selectedCountryCode) : null;
      const keepCountry = action.regionId === "global" || (country && getExplorationCountryRegion(country) === action.regionId);
      if (state.activeRegionId === action.regionId && keepCountry) return state;
      return {
        ...state,
        activeRegionId: action.regionId,
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
        activeRegionId: getExplorationCountryRegion(country),
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
      activeRegionId: getExplorationCountryRegion(country),
      selectedCountryCode: country.code,
      selectedGameId: game.id,
      selectionRevision: state.selectionRevision + 1
    };
  };
}

export function getExplorationCountryRegion(country: Country): RegionId {
  const override = COUNTRY_REGION[country.code];
  if (override) return override;
  return country.region.toLocaleLowerCase().includes("europe") ? "europe" : "global";
}
