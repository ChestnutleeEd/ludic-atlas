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
        <span className="block text-sm text-[#F0B65A]" id="year-range-label">
          年份筛选
        </span>
        <span className="text-xs text-[#A99D8B]" id="year-range-summary">
          {yearRange.min}-{yearRange.max}
        </span>
      </div>
      <div
        aria-describedby="year-range-summary"
        aria-labelledby="year-range-label"
        className="atlas-control-box mt-2 grid gap-3 text-sm"
        role="group"
      >
        <label className="sr-only" htmlFor="year-min">
          最小发行年份
        </label>
        <input
          aria-valuetext={`最小发行年份 ${yearRange.min}`}
          className="atlas-range-input w-full"
          id="year-min"
          max={maxYear}
          min={minYear}
          onChange={(event) => updateMin(Number(event.target.value))}
          type="range"
          value={yearRange.min}
        />
        <label className="sr-only" htmlFor="year-max">
          最大发行年份
        </label>
        <input
          aria-valuetext={`最大发行年份 ${yearRange.max}`}
          className="atlas-range-input w-full"
          id="year-max"
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
