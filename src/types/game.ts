export type Country = {
  code: string;
  name: string;
  nameZh: string;
  region: string;
  latitude: number;
  longitude: number;
};

export type Game = {
  id: string;
  title: string;
  titleZh: string;
  countryCode: string;
  countryName: string;
  developer: string;
  publisher: string;
  releaseYear: number;
  genres: string[];
  platforms: string[];
  rating: number;
  coverImage: string;
  description: string;
};

export type ViewMode = "countries" | "games";

export type YearRange = {
  min: number;
  max: number;
};

export type CountryStats = {
  countryCode: string;
  gameCount: number;
  averageRating: number;
  topGenre: string | null;
};

export type TotalStats = {
  totalGames: number;
  totalCountries: number;
  minReleaseYear: number;
  maxReleaseYear: number;
};
