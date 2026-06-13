import { getGameTooltipMarkup } from "@/components/globe/GameTooltip";
import {
  getDistributedGlobeCoordinates
} from "@/lib/geo";
import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage,
  hasRealGameCover
} from "@/lib/gameCover";
import {
  getCountryDisplayName,
  getGameMarkerLabel,
  getGameSecondaryTitle
} from "@/lib/localization";
import type { Country, Game, ViewMode } from "@/types/game";

export type GlobeGameMarker = {
  kind: "game";
  game: Game;
  lat: number;
  lng: number;
  markerStyle: "card" | "dot";
  selected: boolean;
  hovered: boolean;
  sameCountryIndex: number;
  sameCountrySelected: boolean;
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
  countries: Country[];
  games: Game[];
  hoveredGameId: string | null;
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
  coverSize: number;
  loadCoverImages?: boolean;
  renderCoverMarkers?: boolean;
  onHoverCountry: (countryCode: string | null) => void;
  onHoverGame: (gameId: string | null) => void;
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
};

const GLOBAL_MARKERS_PER_COUNTRY = 1;
const SELECTED_COUNTRY_MARKER_LIMIT = 12;

export function buildGameMarkers({
  countries,
  games,
  hoveredGameId,
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
  const markerLimit = selectedCountryCode
    ? SELECTED_COUNTRY_MARKER_LIMIT
    : GLOBAL_MARKERS_PER_COUNTRY;

  return [...gamesByCountry.entries()].flatMap<GlobeGameMarker>(
    ([countryCode, countryGames]) => {
      if (selectedCountryCode && countryCode !== selectedCountryCode) {
        return [];
      }

      const country = countryByCode.get(countryCode);

      if (!country) {
        return [];
      }

      const representativeGames = getRepresentativeCountryGames({
        games: countryGames,
        limit: markerLimit,
        selectedGameId
      });
      const total = representativeGames.length;

      return representativeGames.map((game, index) => {
        const coordinates = getDistributedGlobeCoordinates({
          country,
          gameId: game.id,
          index,
          total
        });

        return {
          kind: "game",
          game,
          lat: coordinates.lat,
          lng: coordinates.lng,
          markerStyle: selectedCountryCode ? "card" : "dot",
          selected: game.id === selectedGameId,
          hovered: game.id === hoveredGameId,
          sameCountrySelected: game.countryCode === selectedCountryCode,
          sameCountryIndex: index,
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
  coverSize,
  loadCoverImages = false,
  renderCoverMarkers = true,
  onHoverCountry,
  onHoverGame,
  onSelectCountry,
  onSelectGame
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
      (marker.markerStyle === "card" ||
        marker.selected ||
        (marker.viewMode === "games" &&
          marker.sameCountrySelected &&
          marker.sameCountryIndex < 6));
    const width = isCoverMarker
      ? Math.max(46, Math.round(coverSize * 0.82))
      : Math.max(9, Math.round(coverSize * 0.18));
    const height = isCoverMarker
      ? Math.max(58, Math.round(coverSize * 1.08))
      : width;
    const element = document.createElement("button");

    element.type = "button";
    element.className = [
      "globe-game-marker",
      isCoverMarker ? "is-cover" : "is-dot",
      marker.markerStyle === "card" && !marker.sameCountrySelected
        ? "is-representative"
        : "",
      marker.selected ? "is-selected" : "",
      marker.hovered ? "is-hovered" : "",
      marker.sameCountrySelected ? "is-country-selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.title = secondaryTitle
      ? `${markerTitle} / ${secondaryTitle}`
      : markerTitle;
    element.setAttribute("aria-label", `选择游戏：${markerTitle}`);

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
      onSelectGame(marker.game.id);
    });
    element.addEventListener("mouseenter", () => onHoverGame(marker.game.id));
    element.addEventListener("mouseleave", () => onHoverGame(null));
    element.addEventListener("focus", () => onHoverGame(marker.game.id));
    element.addEventListener("blur", () => onHoverGame(null));

    return element;
  };
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
  const coverImageMarkup = loadCoverImages
    ? `<img class="globe-game-cover-image ${coverImage === FALLBACK_GAME_COVER_IMAGE ? "is-fallback" : ""}" alt="" data-fallback-src="${escapeAttribute(FALLBACK_GAME_COVER_IMAGE)}" loading="lazy" src="${escapeAttribute(coverImage)}">`
    : "";
  const tooltipMarkup =
    marker.sameCountrySelected || marker.selected || marker.hovered
      ? getGameTooltipMarkup(marker.game)
      : "";

  return `
    <span class="globe-game-cover">
      ${coverImageMarkup}
      <span class="globe-game-cover-shine"></span>
      <span class="globe-game-rating-badge">${marker.game.rating.toFixed(1)}</span>
      ${tooltipMarkup}
    </span>
  `;
}

function getRepresentativeCountryGames({
  games,
  limit,
  selectedGameId
}: {
  games: Game[];
  limit: number;
  selectedGameId: string | null;
}) {
  const sortedGames = [...games].sort((gameA, gameB) => {
    const ratingDifference = gameB.rating - gameA.rating;

    if (ratingDifference !== 0) {
      return ratingDifference;
    }

    if (hasRealGameCover(gameA) !== hasRealGameCover(gameB)) {
      return hasRealGameCover(gameA) ? -1 : 1;
    }

    return gameA.title.localeCompare(gameB.title);
  });
  const visibleGames = sortedGames.slice(0, limit);

  if (!selectedGameId || visibleGames.some((game) => game.id === selectedGameId)) {
    return visibleGames;
  }

  const selectedGame = sortedGames.find((game) => game.id === selectedGameId);

  if (!selectedGame) {
    return visibleGames;
  }

  return [...visibleGames.slice(0, Math.max(0, limit - 1)), selectedGame];
}

function installCoverFallback(element: HTMLElement) {
  const image = element.querySelector<HTMLImageElement>(".globe-game-cover-image");

  if (!image) {
    return;
  }

  image.addEventListener("error", () => {
    const fallbackSource = image.dataset.fallbackSrc;

    if (!fallbackSource || image.src.endsWith(fallbackSource)) {
      image.style.display = "none";
      return;
    }

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
