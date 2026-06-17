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
        <label className="block text-sm text-[#F0B65A]" htmlFor="year-min">
          年份筛选
        </label>
        <span className="text-xs text-[#A99D8B]">
          {yearRange.min}-{yearRange.max}
        </span>
      </div>
      <div className="atlas-control-box mt-2 grid gap-3 text-sm">
        <input
          aria-label="最小发行年份"
          className="atlas-range-input w-full"
          id="year-min"
          max={maxYear}
          min={minYear}
          onChange={(event) => updateMin(Number(event.target.value))}
          type="range"
          value={yearRange.min}
        />
        <input
          aria-label="最大发行年份"
          className="atlas-range-input w-full"
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
