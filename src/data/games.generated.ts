import { mockGames } from "@/data/games.mock";
import type { Game } from "@/types/game";

// This file is overwritten by `npm run data:rawg`.
// Until RAWG data is generated locally, keep the stable mock dataset active.
export const generatedGames: Game[] = mockGames;
