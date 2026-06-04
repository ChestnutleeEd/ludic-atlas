import { getCountryStats } from "@/lib/stats";
import type { Country, Game } from "@/types/game";

type CountryPanelProps = {
  countries: Country[];
  games: Game[];
  selectedCountryCode: string;
  onSelectCountry: (countryCode: string) => void;
};

export function CountryPanel({
  countries,
  games,
  selectedCountryCode,
  onSelectCountry
}: CountryPanelProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-emerald-300">Countries</h2>
        <span className="text-xs text-emerald-50/50">{countries.length} total</span>
      </div>
      <div className="mt-4 grid gap-3">
        {countries.map((country) => {
          const stats = getCountryStats(country, games);
          const isSelected = country.code === selectedCountryCode;

          return (
            <button
              className={`border p-3 text-left transition-colors ${
                isSelected
                  ? "border-emerald-300 bg-emerald-400/10"
                  : "border-emerald-500/30 bg-black hover:border-emerald-400/70"
              }`}
              key={country.code}
              onClick={() => onSelectCountry(country.code)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-emerald-50">{country.name}</h3>
                  <p className="mt-1 text-xs text-emerald-50/50">
                    {country.region}
                  </p>
                </div>
                <span className="text-sm text-emerald-300">
                  {stats.gameCount} games
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-emerald-50/60">
                <div>
                  <dt>Average rating</dt>
                  <dd className="mt-1 text-emerald-300">
                    {stats.averageRating.toFixed(1)}
                  </dd>
                </div>
                <div>
                  <dt>Top Genre</dt>
                  <dd className="mt-1 text-emerald-300">
                    {stats.topGenre ?? "None"}
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}
