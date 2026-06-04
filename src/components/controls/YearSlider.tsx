import type { YearRange } from "@/types/game";

type YearSliderProps = {
  yearRange: YearRange;
  minYear: number;
  maxYear: number;
  onChange: (yearRange: YearRange) => void;
};

export function YearSlider({
  yearRange,
  minYear,
  maxYear,
  onChange
}: YearSliderProps) {
  function updateMin(value: number) {
    onChange({
      min: Math.min(value, yearRange.max),
      max: yearRange.max
    });
  }

  function updateMax(value: number) {
    onChange({
      min: yearRange.min,
      max: Math.max(value, yearRange.min)
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm text-emerald-300" htmlFor="year-min">
          Year filter
        </label>
        <span className="text-xs text-emerald-50/60">
          {yearRange.min}-{yearRange.max}
        </span>
      </div>
      <div className="mt-2 grid gap-3 border border-emerald-500/30 p-3 text-sm text-emerald-50/70">
        <input
          className="w-full accent-emerald-400"
          id="year-min"
          max={maxYear}
          min={minYear}
          onChange={(event) => updateMin(Number(event.target.value))}
          type="range"
          value={yearRange.min}
        />
        <input
          aria-label="Maximum release year"
          className="w-full accent-emerald-400"
          max={maxYear}
          min={minYear}
          onChange={(event) => updateMax(Number(event.target.value))}
          type="range"
          value={yearRange.max}
        />
      </div>
    </div>
  );
}
