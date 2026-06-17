import { CoverSizeSlider } from "@/components/controls/CoverSizeSlider";
import { ViewModeToggle } from "@/components/controls/ViewModeToggle";
import { YearSlider } from "@/components/controls/YearSlider";
import { getCameraModeLabel } from "@/lib/regions";
import type { CameraMode, ViewMode, YearRange } from "@/types/game";

type BottomControlsProps = {
  yearRange: YearRange;
  minYear: number;
  maxYear: number;
  coverSize: number;
  cameraMode: CameraMode;
  viewMode: ViewMode;
  activeRegionLabel: string;
  countriesCount: number;
  isRotateEnabled: boolean;
  totalGames: number;
  onYearRangeChange: (yearRange: YearRange) => void;
  onCoverSizeChange: (coverSize: number) => void;
  onCameraModeChange: (cameraMode: CameraMode) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onRotateChange: (isEnabled: boolean) => void;
};

const cameraModes: CameraMode[] = ["overview", "surface"];

export function BottomControls({
  yearRange,
  minYear,
  maxYear,
  coverSize,
  cameraMode,
  viewMode,
  activeRegionLabel,
  countriesCount,
  isRotateEnabled,
  totalGames,
  onYearRangeChange,
  onCoverSizeChange,
  onCameraModeChange,
  onViewModeChange,
  onRotateChange
}: BottomControlsProps) {
  return (
    <section className="glass-panel atlas-bottom-controls grid gap-3 p-4 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr]">
      <dl className="atlas-control-stats">
        <div>
          <dt>Total Games</dt>
          <dd>{totalGames}</dd>
        </div>
        <div>
          <dt>Countries</dt>
          <dd>{countriesCount}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{activeRegionLabel}</dd>
        </div>
      </dl>
      <YearSlider
        yearRange={yearRange}
        minYear={minYear}
        maxYear={maxYear}
        onChange={onYearRangeChange}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <CoverSizeSlider coverSize={coverSize} onChange={onCoverSizeChange} />
        <label className="atlas-toggle-control">
          <span>Rotate</span>
          <input
            checked={isRotateEnabled}
            name="rotate-globe"
            onChange={(event) => onRotateChange(event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>
      <div>
        <label className="block text-sm text-[#F0B65A]">镜头模式</label>
        <div className="atlas-control-box mt-2 grid grid-cols-2 gap-2 text-sm">
          {cameraModes.map((mode) => (
            <button
              className={`atlas-segment-button ${
                mode === cameraMode ? "is-active" : ""
              }`}
              key={mode}
              onClick={() => onCameraModeChange(mode)}
              type="button"
            >
              {getCameraModeLabel(mode)}
            </button>
          ))}
        </div>
      </div>
      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
    </section>
  );
}
