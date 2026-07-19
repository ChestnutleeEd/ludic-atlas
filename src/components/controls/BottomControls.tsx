import { CoverSizeSlider } from "@/components/controls/CoverSizeSlider";
import { ViewModeToggle } from "@/components/controls/ViewModeToggle";
import { YearSlider } from "@/components/controls/YearSlider";
import { getCameraModeLabel } from "@/lib/regions";
import type { CameraMode, ViewMode, YearRange } from "@/types/game";
import type { RatingRange } from "@/types/earth";

type BottomControlsProps = {
  yearRange: YearRange;
  ratingRange: RatingRange;
  minYear: number;
  maxYear: number;
  coverSize: number;
  cameraMode: CameraMode;
  viewMode: ViewMode;
  activeRegionLabel: string;
  countriesCount: number;
  isRotateEnabled: boolean;
  regionStatusLabel?: string;
  zoomStatusLabel?: string;
  totalGames: number;
  onYearRangeChange: (yearRange: YearRange) => void;
  onRatingRangeChange: (ratingRange: RatingRange) => void;
  onCoverSizeChange: (coverSize: number) => void;
  onCameraModeChange: (cameraMode: CameraMode) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onRotateChange: (isEnabled: boolean) => void;
};

const cameraModes: CameraMode[] = ["overview", "surface"];

export function BottomControls({
  yearRange,
  ratingRange,
  minYear,
  maxYear,
  coverSize,
  cameraMode,
  viewMode,
  activeRegionLabel,
  countriesCount,
  isRotateEnabled,
  regionStatusLabel,
  totalGames,
  zoomStatusLabel,
  onYearRangeChange,
  onRatingRangeChange,
  onCoverSizeChange,
  onCameraModeChange,
  onViewModeChange,
  onRotateChange
}: BottomControlsProps) {
  return (
    <details
      className="glass-panel atlas-bottom-controls"
    >
      <summary className="atlas-filter-tray-summary">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6" />
        </svg>
        <span>筛选与显示</span>
        <strong>{yearRange.min}–{yearRange.max}</strong>
        <small>{activeRegionLabel} · {totalGames} 款</small>
      </summary>
      <section
        aria-label="地球探索筛选与视图控制"
        className="atlas-filter-tray-body grid gap-3 p-3 xl:grid-cols-[1.05fr_1.15fr_1.05fr_1fr_1fr_1fr]"
      >
        <dl className="atlas-control-stats">
        <div>
          <dt>当前游戏</dt>
          <dd>{totalGames}</dd>
        </div>
        <div>
          <dt>国家 / 地区</dt>
          <dd>{countriesCount}</dd>
        </div>
        <div>
          <dt>当前区域</dt>
          <dd>{activeRegionLabel}</dd>
        </div>
      </dl>
      <YearSlider
        yearRange={yearRange}
        minYear={minYear}
        maxYear={maxYear}
        onChange={onYearRangeChange}
      />
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="earth-label block text-sm" id="rating-range-label">
            评分筛选
          </span>
          <span className="earth-muted text-xs" id="rating-range-summary">
            {ratingRange.min.toFixed(1)}–{ratingRange.max.toFixed(1)}
          </span>
        </div>
        <div
          aria-describedby="rating-range-summary"
          aria-labelledby="rating-range-label"
          className="atlas-control-box mt-2 grid gap-3 text-sm"
          role="group"
        >
          <label className="sr-only" htmlFor="rating-min">最低评分</label>
          <input
            aria-valuetext={`最低评分 ${ratingRange.min.toFixed(1)}`}
            className="atlas-range-input w-full"
            id="rating-min"
            max={10}
            min={0}
            onChange={(event) =>
              onRatingRangeChange({
                min: Math.min(Number(event.target.value), ratingRange.max),
                max: ratingRange.max
              })
            }
            step={0.5}
            type="range"
            value={ratingRange.min}
          />
          <label className="sr-only" htmlFor="rating-max">最高评分</label>
          <input
            aria-valuetext={`最高评分 ${ratingRange.max.toFixed(1)}`}
            className="atlas-range-input w-full"
            id="rating-max"
            max={10}
            min={0}
            onChange={(event) =>
              onRatingRangeChange({
                min: ratingRange.min,
                max: Math.max(Number(event.target.value), ratingRange.min)
              })
            }
            step={0.5}
            type="range"
            value={ratingRange.max}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <CoverSizeSlider coverSize={coverSize} onChange={onCoverSizeChange} />
        <label className="atlas-toggle-control">
          <span>
            自动旋转
            <small className="earth-muted block text-[11px]">
              {isRotateEnabled ? "已开启" : "已关闭"}
            </small>
          </span>
          <input
            aria-label="切换地球自动旋转"
            checked={isRotateEnabled}
            name="rotate-globe"
            onChange={(event) => onRotateChange(event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>
        <div>
        <span className="earth-label block text-sm" id="camera-mode-label">
          镜头模式
        </span>
        <div
          aria-labelledby="camera-mode-label"
          className="atlas-control-box mt-2 grid grid-cols-2 gap-2 text-sm"
          role="group"
        >
          {cameraModes.map((mode) => (
            <button
              aria-label={`切换到${getCameraModeLabel(mode)}镜头`}
              aria-pressed={mode === cameraMode}
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
          <p className="earth-muted mt-2 text-xs leading-5">
            {zoomStatusLabel ?? "地图内提供缩放、重置与聚焦操作"}；
            {regionStatusLabel ?? `当前区域：${activeRegionLabel}`}
          </p>
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
      </section>
    </details>
  );
}
