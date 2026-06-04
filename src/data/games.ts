import type { Game } from "@/types/game";

export const games: Game[] = [
  {
    id: "zelda-botw",
    title: "The Legend of Zelda: Breath of the Wild",
    titleZh: "塞尔达传说：旷野之息",
    countryCode: "JP",
    countryName: "Japan",
    developer: "Nintendo",
    publisher: "Nintendo",
    releaseYear: 2017,
    genres: ["Action Adventure", "Open World"],
    platforms: ["Nintendo Switch", "Wii U"],
    rating: 9.7,
    coverImage: "/covers/zelda-botw.jpg",
    description:
      "An open-world action-adventure game known for systemic exploration and player freedom."
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    titleZh: "艾尔登法环",
    countryCode: "JP",
    countryName: "Japan",
    developer: "FromSoftware",
    publisher: "Bandai Namco Entertainment",
    releaseYear: 2022,
    genres: ["Action RPG", "Open World"],
    platforms: ["PC", "PlayStation", "Xbox"],
    rating: 9.6,
    coverImage: "/covers/elden-ring.jpg",
    description:
      "A fantasy action RPG that expands FromSoftware's design into an open world."
  },
  {
    id: "half-life-2",
    title: "Half-Life 2",
    titleZh: "半衰期 2",
    countryCode: "US",
    countryName: "United States",
    developer: "Valve",
    publisher: "Valve",
    releaseYear: 2004,
    genres: ["First-Person Shooter", "Sci-Fi"],
    platforms: ["PC", "Xbox", "PlayStation"],
    rating: 9.5,
    coverImage: "/covers/half-life-2.jpg",
    description:
      "A first-person shooter recognized for physics-driven play and environmental storytelling."
  },
  {
    id: "the-last-of-us",
    title: "The Last of Us",
    titleZh: "最后生还者",
    countryCode: "US",
    countryName: "United States",
    developer: "Naughty Dog",
    publisher: "Sony Computer Entertainment",
    releaseYear: 2013,
    genres: ["Action Adventure", "Survival"],
    platforms: ["PlayStation", "PC"],
    rating: 9.4,
    coverImage: "/covers/the-last-of-us.jpg",
    description:
      "A story-focused action adventure game centered on survival and character drama."
  },
  {
    id: "the-witcher-3",
    title: "The Witcher 3: Wild Hunt",
    titleZh: "巫师 3：狂猎",
    countryCode: "PL",
    countryName: "Poland",
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    releaseYear: 2015,
    genres: ["RPG", "Open World"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    rating: 9.6,
    coverImage: "/covers/the-witcher-3.jpg",
    description:
      "A narrative open-world RPG based on Polish fantasy literature."
  },
  {
    id: "frostpunk",
    title: "Frostpunk",
    titleZh: "冰汽时代",
    countryCode: "PL",
    countryName: "Poland",
    developer: "11 bit studios",
    publisher: "11 bit studios",
    releaseYear: 2018,
    genres: ["City Builder", "Survival"],
    platforms: ["PC", "PlayStation", "Xbox"],
    rating: 8.7,
    coverImage: "/covers/frostpunk.jpg",
    description:
      "A survival city-builder about managing heat, resources, and social choices."
  }
];
