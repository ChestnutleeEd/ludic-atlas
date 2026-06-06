import { CoverSizeSlider } from "@/components/controls/CoverSizeSlider";
import { ViewModeToggle } from "@/components/controls/ViewModeToggle";
import { YearSlider } from "@/components/controls/YearSlider";
import type { ViewMode, YearRange } from "@/types/game";

type BottomControlsProps = {
  yearRange: YearRange;
  minYear: number;
  maxYear: number;
  coverSize: number;
  viewMode: ViewMode;
  onYearRangeChange: (yearRange: YearRange) => void;
  onCoverSizeChange: (coverSize: number) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
};

export function BottomControls({
  yearRange,
  minYear,
  maxYear,
  coverSize,
  viewMode,
  onYearRangeChange,
  onCoverSizeChange,
  onViewModeChange
}: BottomControlsProps) {
  return (
    <section className="glass-panel grid gap-3 p-4 md:grid-cols-3">
      <YearSlider
        yearRange={yearRange}
        minYear={minYear}
        maxYear={maxYear}
        onChange={onYearRangeChange}
      />
      <CoverSizeSlider coverSize={coverSize} onChange={onCoverSizeChange} />
      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
    </section>
  );
}
