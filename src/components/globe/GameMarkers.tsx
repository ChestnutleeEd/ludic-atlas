import { getGameTooltipMarkup } from "@/components/globe/GameTooltip";
import {
  getDistributedGlobeCoordinates
} from "@/lib/geo";
import {
  getComponentAwareMarkerSlots,
  type NormalizedGeographicFeature
} from "@/lib/geography";
import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage
} from "@/lib/gameCover";
import { selectStableMarkerGames } from "@/lib/globeMarkerModel";
import {
  calculateMarkerBudget,
  estimateProjectedCountryArea,
  type MarkerPerformanceTier
} from "@/lib/markerLayout";
import {
  getCountryDisplayName,
  getGameMarkerLabel,
  getGameSecondaryTitle
} from "@/lib/localization";
import { getMarkerSemanticIdentity } from "@/lib/markerContracts";
import type { Country, Game, RegionId, ViewMode } from "@/types/game";
import type { SafeViewport } from "@/types/earth";

export type GlobeGameMarker = {
  kind: "game";
  game: Game;
  lat: number;
  lng: number;
  layoutIdentity: string;
  markerStyle: "card" | "dot";
  markerLayer:
    | "country-aggregate"
    | "rating-highlight"
    | "selected-country"
    | "selected-game";
  selected: boolean;
  hovered: boolean;
  countryLabel: string;
  countryGameCount: number;
  overflowCount: number;
  clusterState: "none" | "collapsed" | "expanded";
  sameCountryIndex: number;
  sameCountrySelected: boolean;
  selectsCountry: boolean;
  showRichTooltip: boolean;
  viewMode: ViewMode;
};

export type GlobeCountryMarker = {
  kind: "country";
  country: Country;
  hovered: boolean;
  lat: number;
  lng: number;
  selected: boolean;
};

export type GlobeHtmlMarker = GlobeCountryMarker | GlobeGameMarker;

type BuildGameMarkersOptions = {
  activeRegionId: RegionId;
  countries: Country[];
  games: Game[];
  normalizedFeatureByCode?: Map<string, NormalizedGeographicFeature>;
  altitude?: number;
  coverSize?: number;
  performanceTier?: MarkerPerformanceTier;
  safeViewport?: SafeViewport;
  settled?: boolean;
  expandedTinyCountryCode?: string | null;
  selectedCountryCode: string | null;
  selectedGameId: string | null;
  viewMode: ViewMode;
};

type BuildCountryMarkersOptions = {
  countries: Country[];
  hoveredCountryCode: string | null;
  selectedCountryCode: string | null;
};

type CreateGameMarkerElementOptions = {
  loadCoverImages?: boolean;
  renderCoverMarkers?: boolean;
  onHoverCountry: (countryCode: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
  onToggleTinyCluster?: (countryCode: string) => void;
};

const HIGH_RATING_THRESHOLD_TEN_POINT = 9;
const HIGH_RATING_THRESHOLD_FIVE_POINT = 4.5;

export function buildGameMarkers({
  activeRegionId,
  countries,
  normalizedFeatureByCode,
  altitude = 1.36,
  coverSize = 72,
  performanceTier = "high",
  safeViewport = { availableHeight: 720, availableWidth: 1280, bottom: 0, centerX: 640, centerY: 360, height: 720, left: 0, right: 0, top: 0, width: 1280 },
  settled = true,
  expandedTinyCountryCode = null,
  games,
  selectedCountryCode,
  selectedGameId,
  viewMode
}: BuildGameMarkersOptions) {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const gamesByCountry = games.reduce<Map<string, Game[]>>((acc, game) => {
    if (!countryByCode.has(game.countryCode)) {
      return acc;
    }

    const countryGames = acc.get(game.countryCode);

    if (countryGames) {
      countryGames.push(game);
    } else {
      acc.set(game.countryCode, [game]);
    }

    return acc;
  }, new Map());
  const sortedCountryGroups = [...gamesByCountry.entries()].map(
    ([countryCode, countryGames]) => ({
      countryCode,
      sortedGames: selectStableMarkerGames(countryGames, countryGames.length, null)
    })
  );

  return sortedCountryGroups.flatMap<GlobeGameMarker>(
    ({ countryCode, sortedGames }) => {
      if (selectedCountryCode && countryCode !== selectedCountryCode) {
        return [];
      }

      const country = countryByCode.get(countryCode);

      if (!country) {
        return [];
      }
      const normalizedFeature = normalizedFeatureByCode?.get(country.code);
      const geographicArea = normalizedFeature?.components.reduce((sum, component) => sum + component.area, 0) ?? 8;
      const projectedAreaPx = estimateProjectedCountryArea({ altitude, geographicArea, safeViewport });
      const markerBudget = calculateMarkerBudget({
        altitude,
        coverSize,
        explorationLevel: selectedCountryCode ? "country" : activeRegionId === "global" ? "global" : "region",
        filteredGameCount: sortedGames.length,
        geographicArea,
        performanceTier,
        projectedAreaPx,
        projectionMode: "globe",
        settled
      });
      const isExpandedTiny = markerBudget.sizeClass === "tiny" && expandedTinyCountryCode === country.code;
      const effectiveLimit = markerBudget.sizeClass === "tiny" && !isExpandedTiny
        ? Math.min(1, markerBudget.budget)
        : markerBudget.budget;
      const safeSlots = normalizedFeature
        ? getComponentAwareMarkerSlots(normalizedFeature, effectiveLimit, markerBudget.candidateLimit)
        : null;
      const representativeGames = selectStableMarkerGames(
        sortedGames,
        effectiveLimit,
        selectedGameId
      );
      const total = representativeGames.length;
      const countryGameCount = sortedGames.length;
      const spreadMode = selectedCountryCode
        ? "country"
        : activeRegionId === "global"
          ? "global"
          : "region";

      return representativeGames.map((game, index) => {
        const coordinates = safeSlots?.[index] ?? getDistributedGlobeCoordinates({
          country,
          gameId: game.id,
          index,
          mode: spreadMode,
          total
        });

        const selected = game.id === selectedGameId;
        const sameCountrySelected = game.countryCode === selectedCountryCode;
        const markerLayer = getGameMarkerLayer({
          game,
          index,
          sameCountrySelected,
          selected,
          viewMode
        });

        return {
          kind: "game",
          game,
          lat: coordinates.lat,
          lng: coordinates.lng,
          layoutIdentity: `${country.code}:${game.id}:${coordinates.lat.toFixed(6)}:${coordinates.lng.toFixed(6)}`,
          markerStyle: markerLayer === "country-aggregate" ? "dot" : "card",
          markerLayer,
          selected,
          hovered: false,
          countryLabel: getCountryDisplayName(country),
          countryGameCount,
          clusterState: markerBudget.sizeClass === "tiny"
            ? isExpandedTiny ? "expanded" : "collapsed"
            : "none",
          overflowCount:
            index === representativeGames.length - 1
              ? Math.max(0, countryGameCount - representativeGames.length)
              : 0,
          sameCountrySelected,
          sameCountryIndex: index,
          selectsCountry:
            markerLayer === "country-aggregate" && viewMode === "countries",
          showRichTooltip:
            markerLayer === "selected-country" ||
            markerLayer === "selected-game" ||
            markerLayer === "rating-highlight",
          viewMode
        };
      });
    }
  );
}

export function buildCountryMarkers({
  countries,
  hoveredCountryCode,
  selectedCountryCode
}: BuildCountryMarkersOptions): GlobeCountryMarker[] {
  return countries.map((country) => ({
    country,
    hovered: country.code === hoveredCountryCode,
    kind: "country",
    lat: country.latitude,
    lng: country.longitude,
    selected: country.code === selectedCountryCode
  }));
}

export function createGameMarkerElement({
  loadCoverImages = false,
  renderCoverMarkers = true,
  onHoverCountry,
  onSelectCountry,
  onSelectGame,
  onToggleTinyCluster
}: CreateGameMarkerElementOptions) {
  return (markerObject: object) => {
    const marker = markerObject as GlobeHtmlMarker;

    if (marker.kind === "country") {
      return createCountryMarkerElement({
        marker,
        onHoverCountry,
        onSelectCountry
      });
    }

    const markerTitle = getGameMarkerLabel(marker.game);
    const secondaryTitle = getGameSecondaryTitle(marker.game);
    const isCoverMarker =
      renderCoverMarkers &&
      (marker.markerStyle === "card" || marker.selected);
    const element = document.createElement("button");

    element.type = "button";
    element.className = [
      "globe-game-marker",
      isCoverMarker ? "is-cover" : "is-dot",
      marker.markerLayer === "rating-highlight" ? "is-representative" : "",
      marker.selected ? "is-selected" : "",
      marker.hovered ? "is-hovered" : "",
      marker.sameCountrySelected ? "is-country-selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    element.title = getGameMarkerTitle(marker, markerTitle, secondaryTitle);
    element.dataset.markerIdentity = getGlobeGameMarkerIdentity(marker);
    element.dataset.markerLayer = marker.markerLayer;
    element.dataset.baseMarkerLayer = marker.markerLayer;
    element.dataset.countryCode = marker.game.countryCode;
    element.dataset.gameId = marker.game.id;
    element.dataset.markerLat = marker.lat.toFixed(6);
    element.dataset.markerLng = marker.lng.toFixed(6);
    element.dataset.markerLayoutId = marker.layoutIdentity;
    element.dataset.gameCount = String(marker.countryGameCount);
    element.dataset.overflowCount = String(marker.overflowCount);
    element.dataset.clusterState = marker.clusterState;
    if (marker.clusterState !== "none") element.setAttribute("aria-expanded", String(marker.clusterState === "expanded"));
    element.setAttribute(
      "aria-label",
      getGameMarkerAriaLabel(marker, markerTitle)
    );
    element.setAttribute("aria-pressed", String(marker.selected));

    if (isCoverMarker) {
      element.innerHTML = getCoverMarkerMarkup(
        marker,
        loadCoverImages
      );
      installCoverFallback(element);
    } else {
      element.innerHTML = `<span class="globe-game-dot-core"></span>`;
    }

    element.addEventListener("pointerdown", stopMarkerPointerEvent);
    element.addEventListener("mousedown", stopMarkerPointerEvent);
    element.addEventListener("touchstart", stopMarkerPointerEvent);
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (marker.clusterState !== "none" && marker.overflowCount > 0 && onToggleTinyCluster) {
        onToggleTinyCluster(marker.game.countryCode);
        return;
      }
      if (marker.selectsCountry) {
        onSelectCountry(marker.game.countryCode);
        return;
      }

      onSelectGame(marker.game.id);
    });
    element.addEventListener("mouseenter", () => {
      if (marker.selectsCountry) {
        onHoverCountry(marker.game.countryCode);
      }
    });
    element.addEventListener("mouseleave", () => {
      if (marker.selectsCountry) {
        onHoverCountry(null);
      }
    });
    element.addEventListener("focus", () => {
      if (marker.selectsCountry) {
        onHoverCountry(marker.game.countryCode);
      }
    });
    element.addEventListener("blur", () => {
      if (marker.selectsCountry) {
        onHoverCountry(null);
      }
    });

    return element;
  };
}

/** Updates selection in place so three-globe does not recreate cover and image nodes. */
export function updateGameMarkerSelection(
  container: HTMLElement,
  selectedGameId: string | null,
  markers?: readonly GlobeGameMarker[]
) {
  const markerByIdentity = new Map(
    markers?.map((marker) => [getGlobeGameMarkerIdentity(marker), marker]) ?? []
  );
  for (const marker of container.querySelectorAll<HTMLElement>(".globe-game-marker[data-game-id]")) {
    const descriptor = markerByIdentity.get(marker.dataset.markerIdentity ?? "");
    if (descriptor) updateGameMarkerElement(marker, descriptor, selectedGameId);
    const selected = marker.dataset.gameId === selectedGameId;
    marker.classList.toggle("is-selected", selected);
    marker.setAttribute("aria-pressed", String(selected));
    marker.dataset.markerLayer = selected
      ? "selected-game"
      : marker.dataset.baseMarkerLayer ?? "selected-country";
  }
}

export function getGlobeGameMarkerIdentity(marker: GlobeGameMarker) {
  return marker.markerStyle === "dot"
    ? getMarkerSemanticIdentity({
        kind: "aggregate",
        countryCode: marker.game.countryCode,
        layoutIdentity: marker.layoutIdentity
      })
    : getMarkerSemanticIdentity({
        kind: "game",
        gameId: marker.game.id,
        layoutIdentity: marker.layoutIdentity
      });
}

function updateGameMarkerElement(
  element: HTMLElement,
  marker: GlobeGameMarker,
  selectedGameId: string | null
) {
  const markerTitle = getGameMarkerLabel(marker.game);
  const selected = marker.game.id === selectedGameId;
  element.classList.toggle("is-selected", selected);
  element.classList.toggle("is-hovered", marker.hovered);
  element.classList.toggle("is-country-selected", marker.sameCountrySelected);
  element.classList.toggle("is-representative", marker.markerLayer === "rating-highlight");
  element.dataset.baseMarkerLayer = marker.markerLayer;
  element.dataset.markerLayer = selected ? "selected-game" : marker.markerLayer;
  element.dataset.markerLat = marker.lat.toFixed(6);
  element.dataset.markerLng = marker.lng.toFixed(6);
  element.dataset.gameCount = String(marker.countryGameCount);
  element.dataset.overflowCount = String(marker.overflowCount);
  element.dataset.clusterState = marker.clusterState;
  element.title = getGameMarkerTitle(
    marker,
    markerTitle,
    getGameSecondaryTitle(marker.game)
  );
  element.setAttribute("aria-label", getGameMarkerAriaLabel(marker, markerTitle));
  element.setAttribute("aria-pressed", String(selected));
  if (marker.clusterState === "none") {
    element.removeAttribute("aria-expanded");
  } else {
    element.setAttribute("aria-expanded", String(marker.clusterState === "expanded"));
  }
  const cover = element.querySelector<HTMLElement>(".globe-game-cover");
  const overflow = cover?.querySelector<HTMLElement>(".globe-marker-overflow");
  if (marker.overflowCount > 0 && cover) {
    const badge = overflow ?? document.createElement("span");
    badge.className = "globe-marker-overflow";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = `+${marker.overflowCount}`;
    if (!overflow) cover.append(badge);
  } else {
    overflow?.remove();
  }
}

function createCountryMarkerElement({
  marker,
  onHoverCountry,
  onSelectCountry
}: {
  marker: GlobeCountryMarker;
  onHoverCountry: (countryCode: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
}) {
  const element = document.createElement("button");
  const label = getCountryDisplayName(marker.country);

  element.type = "button";
  element.className = [
    "globe-country-marker",
    marker.selected ? "is-selected" : "",
    marker.hovered ? "is-hovered" : ""
  ]
    .filter(Boolean)
    .join(" ");
  element.textContent = label;
  element.title = label;
  element.setAttribute("aria-label", `选择国家：${label}`);
  element.addEventListener("pointerdown", stopMarkerPointerEvent);
  element.addEventListener("mousedown", stopMarkerPointerEvent);
  element.addEventListener("touchstart", stopMarkerPointerEvent);
  element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectCountry(marker.country.code);
  });
  element.addEventListener("mouseenter", () => onHoverCountry(marker.country.code));
  element.addEventListener("mouseleave", () => onHoverCountry(null));
  element.addEventListener("focus", () => onHoverCountry(marker.country.code));
  element.addEventListener("blur", () => onHoverCountry(null));

  return element;
}

function stopMarkerPointerEvent(event: Event) {
  event.stopPropagation();
}

function getCoverMarkerMarkup(
  marker: GlobeGameMarker,
  loadCoverImages: boolean
) {
  const coverImage = getGameCoverImage(marker.game);
  const loadingMode = marker.selected || marker.sameCountryIndex < 3 ? "eager" : "lazy";
  const coverImageMarkup = loadCoverImages
    ? `<img class="globe-game-cover-image ${coverImage === FALLBACK_GAME_COVER_IMAGE ? "is-fallback" : ""}" alt="" width="160" height="220" data-fallback-src="${escapeAttribute(FALLBACK_GAME_COVER_IMAGE)}" decoding="async" loading="${loadingMode}" src="${escapeAttribute(coverImage)}">`
    : "";
  const tooltipMarkup =
    marker.showRichTooltip || marker.selected || marker.hovered
      ? getGameTooltipMarkup(marker.game)
      : "";

  return `
    <span class="globe-game-cover">
      <span class="globe-game-cover-fallback" aria-hidden="true">${escapeHtml(getGameMarkerLabel(marker.game).slice(0, 2).toLocaleUpperCase())}</span>
      ${coverImageMarkup}
      <span class="globe-game-cover-shine"></span>
      ${marker.overflowCount > 0 ? `<span class="globe-marker-overflow" aria-hidden="true">+${marker.overflowCount}</span>` : ""}
      ${tooltipMarkup}
    </span>
  `;
}

function getGameMarkerLayer({
  game,
  index,
  sameCountrySelected,
  selected,
  viewMode
}: {
  game: Game;
  index: number;
  sameCountrySelected: boolean;
  selected: boolean;
  viewMode: ViewMode;
}): GlobeGameMarker["markerLayer"] {
  if (selected) {
    return "selected-game";
  }

  if (sameCountrySelected) {
    return "selected-country";
  }

  if (viewMode === "games" && index === 0 && isHighRatedGame(game)) {
    return "rating-highlight";
  }

  return "country-aggregate";
}

function isHighRatedGame(game: Game) {
  const threshold =
    game.rating <= 5
      ? HIGH_RATING_THRESHOLD_FIVE_POINT
      : HIGH_RATING_THRESHOLD_TEN_POINT;

  return game.rating >= threshold;
}

function getGameMarkerAriaLabel(marker: GlobeGameMarker, markerTitle: string) {
  if (marker.selectsCountry) {
    return `查看国家：${marker.countryLabel}，${marker.countryGameCount} 款游戏，代表作：${markerTitle}`;
  }

  return marker.overflowCount > 0
    ? `选择游戏：${markerTitle}，另有 ${marker.overflowCount} 款游戏可在国家详情中查看`
    : `选择游戏：${markerTitle}`;
}

function getGameMarkerTitle(
  marker: GlobeGameMarker,
  markerTitle: string,
  secondaryTitle: string | null
) {
  if (marker.selectsCountry) {
    return `${marker.countryLabel} · ${marker.countryGameCount} 款游戏 · 代表作：${markerTitle}`;
  }

  return secondaryTitle ? `${markerTitle} / ${secondaryTitle}` : markerTitle;
}

function installCoverFallback(element: HTMLElement) {
  const image = element.querySelector<HTMLImageElement>(".globe-game-cover-image");

  if (!image) {
    return;
  }

  image.addEventListener("error", () => {
    const fallbackSource = image.dataset.fallbackSrc;

    if (!fallbackSource || image.dataset.fallbackApplied === "true") {
      element.classList.add("is-cover-failed");
      image.style.display = "none";
      return;
    }

    image.dataset.fallbackApplied = "true";
    image.classList.add("is-fallback");
    image.src = fallbackSource;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
