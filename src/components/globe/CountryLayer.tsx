import { getMarkerPosition } from "@/lib/geo";
import type { Country } from "@/types/game";

type CountryLayerProps = {
  countries: Country[];
  selectedCountry: Country | null;
};

export function CountryLayer({ countries, selectedCountry }: CountryLayerProps) {
  return (
    <div className="absolute inset-0">
      {countries.map((country) => {
        const position = getMarkerPosition(country);
        const isSelected = country.code === selectedCountry?.code;

        return (
          <div
            className={`absolute min-w-20 border bg-black/80 px-2 py-1 text-xs ${
              isSelected
                ? "border-emerald-300 text-emerald-300"
                : "border-emerald-500/40 text-emerald-50/70"
            }`}
            key={country.code}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)"
            }}
          >
            {country.name}
          </div>
        );
      })}
    </div>
  );
}
