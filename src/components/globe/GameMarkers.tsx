import { getGameTooltipMarkup } from "@/components/globe/GameTooltip";
import { getClusteredGlobeCoordinates } from "@/lib/geo";
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

export function buildGameMarkers({
  countries,
  games,
  hoveredGameId,
  selectedCountryCode,
  selectedGameId,
  viewMode
}: BuildGameMarkersOptions) {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const gamesByCountry = games.reduce<Record<string, Game[]>>((acc, game) => {
    acc[game.countryCode] = [...(acc[game.countryCode] ?? []), game];
    return acc;
  }, {});

  return games.flatMap<GlobeGameMarker>((game) => {
    const country = countryByCode.get(game.countryCode);

    if (!country) {
      return [];
    }

    const countryGames = gamesByCountry[game.countryCode] ?? [];
    const clusterIndex = countryGames.findIndex((item) => item.id === game.id);
    const coordinates = getClusteredGlobeCoordinates(
      country,
      clusterIndex,
      countryGames.length
    );

    return {
      kind: "game",
      game,
      lat: coordinates.lat,
      lng: coordinates.lng,
      markerStyle: "dot",
      selected: game.id === selectedGameId,
      hovered: game.id === hoveredGameId,
      sameCountrySelected: game.countryCode === selectedCountryCode,
      sameCountryIndex: clusterIndex,
      viewMode
    };
  });
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
        markerTitle,
        secondaryTitle,
        loadCoverImages
      );
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
  markerTitle: string,
  secondaryTitle: string | null,
  loadCoverImages: boolean
) {
  const escapedTitle = escapeHtml(markerTitle);
  const escapedSecondaryTitle = secondaryTitle ? escapeHtml(secondaryTitle) : "";
  const coverStyle = loadCoverImages && marker.game.coverImage
    ? ` style="background-image: linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.3) 36%, rgba(2,6,23,0.94) 100%), url('${escapeAttribute(marker.game.coverImage)}')"`
    : "";
  const tooltipMarkup =
    marker.sameCountrySelected || marker.selected || marker.hovered
      ? getGameTooltipMarkup(marker.game)
      : "";

  return `
    <span class="globe-game-cover"${coverStyle}>
      <span class="globe-game-cover-shine"></span>
      <span class="globe-game-cover-copy">
        <span class="globe-game-cover-title">${escapedTitle}</span>
        ${
          escapedSecondaryTitle
            ? `<span class="globe-game-cover-subtitle">${escapedSecondaryTitle}</span>`
            : ""
        }
        <span class="globe-game-cover-meta">
          <span>${marker.game.releaseYear}</span>
          <span>${marker.game.rating.toFixed(1)}</span>
        </span>
      </span>
      ${tooltipMarkup}
    </span>
  `;
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
