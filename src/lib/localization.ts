import type { Country, Game, ViewMode } from "@/types/game";

const genreLabels: Record<string, string> = {
  Action: "动作",
  "Action Adventure": "动作冒险",
  "Action RPG": "动作角色扮演",
  Adventure: "冒险",
  "Battle Royale": "大逃杀",
  "City Builder": "城市建造",
  "Co-op": "合作",
  "First-Person Shooter": "第一人称射击",
  Horror: "恐怖",
  MMORPG: "大型多人在线角色扮演",
  "Monster Collecting": "怪物收集",
  Multiplayer: "多人",
  Narrative: "叙事",
  "Open World": "开放世界",
  Platformer: "平台跳跃",
  Puzzle: "解谜",
  RPG: "角色扮演",
  Racing: "竞速",
  Sandbox: "沙盒",
  "Sci-Fi": "科幻",
  Shooter: "射击",
  Simulation: "模拟",
  Stealth: "潜行",
  Strategy: "策略",
  Survival: "生存",
  "Turn-Based": "回合制"
};

const regionLabels: Record<string, string> = {
  "Central Europe": "中欧",
  "East Asia": "东亚",
  "Northern Europe": "北欧",
  "North America": "北美",
  "Western Europe": "西欧"
};

const viewModeLabels: Record<ViewMode, string> = {
  countries: "国家",
  games: "游戏"
};

export function getCountryDisplayName(country: Country) {
  return `${country.nameZh} ${country.name}`;
}

export function getRegionLabel(region: string) {
  return regionLabels[region] ?? region;
}

export function getGameDisplayTitle(game: Game) {
  return game.titleZh ?? game.title;
}

export function getGameSecondaryTitle(game: Game) {
  return game.titleZh ? game.title : null;
}

export function getGenreLabel(genre: string) {
  return genreLabels[genre] ?? genre;
}

export function getGenreListLabel(genres: string[]) {
  return genres.map(getGenreLabel).join("、");
}

export function getViewModeLabel(viewMode: ViewMode) {
  return viewModeLabels[viewMode] ?? viewMode;
}

export function getGameMarkerLabel(game: Game) {
  return game.titleZh ?? game.title;
}

export function getGameMarkerInitials(game: Game) {
  const label = getGameMarkerLabel(game);

  if (/[\u4e00-\u9fff]/.test(label)) {
    return label.replace(/[^\u4e00-\u9fff]/g, "").slice(0, 2);
  }

  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
