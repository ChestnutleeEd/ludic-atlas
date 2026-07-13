import { getGameTooltipMarkup } from "@/components/globe/GameTooltip";
import {
  getCountrySafeMarkerSlots,
  getDistributedGlobeCoordinates,
  type CountryGeoJsonFeature
} from "@/lib/geo";
import {
  FALLBACK_GAME_COVER_IMAGE,
  getGameCoverImage
} from "@/lib/gameCover";
import { selectStableMarkerGames } from "@/lib/globeMarkerModel";
import {
  getCountryDisplayName,
  getGameMarkerLabel,
  getGameSecondaryTitle
} from "@/lib/localization";
import type { Country, Game, RegionId, ViewMode } from "@/types/game";

export type GlobeGameMarker = {
  kind: "game";
  game: Game;
  lat: number;
  lng: number;
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
  countryFeatureByCode?: Map<string, CountryGeoJsonFeature>;
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
  onSelectCountry: (countryCode: string) => void;
  onSelectGame: (gameId: string) => void;
};

const GLOBAL_MARKERS_PER_COUNTRY = 1;
const REGION_MARKERS_PER_COUNTRY = 6;
const SELECTED_COUNTRY_MARKER_LIMIT = 12;
const HIGH_RATING_THRESHOLD_TEN_POINT = 9;
const HIGH_RATING_THRESHOLD_FIVE_POINT = 4.5;

export function buildGameMarkers({
  activeRegionId,
  countries,
  countryFeatureByCode,
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
  const markerLimit = selectedCountryCode
    ? SELECTED_COUNTRY_MARKER_LIMIT
    : activeRegionId === "global"
      ? GLOBAL_MARKERS_PER_COUNTRY
      : REGION_MARKERS_PER_COUNTRY;

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

      const safeSlots = selectedCountryCode && countryFeatureByCode?.get(country.code)
        ? getCountrySafeMarkerSlots(
            countryFeatureByCode.get(country.code)!,
            country,
            markerLimit
          )
        : null;
      const effectiveLimit = safeSlots ? Math.min(markerLimit, safeSlots.length) : markerLimit;
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
          markerStyle: markerLayer === "country-aggregate" ? "dot" : "card",
          markerLayer,
          selected,
          hovered: false,
          countryLabel: getCountryDisplayName(country),
          countryGameCount,
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
  coverSize,
  loadCoverImages = false,
  renderCoverMarkers = true,
  onHoverCountry,
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
      (marker.markerStyle === "card" || marker.selected);
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
      marker.markerLayer === "rating-highlight" ? "is-representative" : "",
      marker.selected ? "is-selected" : "",
      marker.hovered ? "is-hovered" : "",
      marker.sameCountrySelected ? "is-country-selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.title = getGameMarkerTitle(marker, markerTitle, secondaryTitle);
    element.dataset.markerLayer = marker.markerLayer;
    element.dataset.markerLat = marker.lat.toFixed(6);
    element.dataset.markerLng = marker.lng.toFixed(6);
    element.dataset.gameCount = String(marker.countryGameCount);
    element.dataset.overflowCount = String(marker.overflowCount);
    element.setAttribute(
      "aria-label",
      getGameMarkerAriaLabel(marker, markerTitle)
    );

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
    ? `<img class="globe-game-cover-image ${coverImage === FALLBACK_GAME_COVER_IMAGE ? "is-fallback" : ""}" alt="" width="160" height="220" data-fallback-src="${escapeAttribute(FALLBACK_GAME_COVER_IMAGE)}" decoding="async" loading="lazy" src="${escapeAttribute(coverImage)}">`
    : "";
  const tooltipMarkup =
    marker.showRichTooltip || marker.selected || marker.hovered
      ? getGameTooltipMarkup(marker.game)
      : "";

  return `
    <span class="globe-game-cover">
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
