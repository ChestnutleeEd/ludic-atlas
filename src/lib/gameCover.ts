import type { Game } from "@/types/game";

export const FALLBACK_GAME_COVER_IMAGE = "/covers/fallback-game-cover.svg";

type GameCoverSource = Game & {
  background_image?: unknown;
  backgroundImage?: unknown;
  cover?: unknown;
  coverUrl?: unknown;
  fallbackCoverImage?: unknown;
  image?: unknown;
};

const COVER_FIELD_ORDER: (keyof GameCoverSource)[] = [
  "coverImage",
  "background_image",
  "backgroundImage",
  "coverUrl",
  "cover",
  "image",
  "fallbackCoverImage"
];

export function getGameCoverImage(game: Game): string {
  const source = game as GameCoverSource;
  const cover = COVER_FIELD_ORDER.map((field) => source[field]).find(
    isUsableImageSource
  );

  return cover ?? FALLBACK_GAME_COVER_IMAGE;
}

export function hasRealGameCover(game: Game): boolean {
  return getGameCoverImage(game) !== FALLBACK_GAME_COVER_IMAGE;
}

function isUsableImageSource(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const source = value.trim();

  return (
    source.length > 0 &&
    source !== "#" &&
    !source.startsWith("data:text/html") &&
    !source.toLowerCase().includes("undefined") &&
    !source.toLowerCase().includes("null")
  );
}
