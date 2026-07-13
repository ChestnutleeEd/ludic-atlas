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
  regionStatusLabel?: string;
  zoomStatusLabel?: string;
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
  regionStatusLabel,
  totalGames,
  zoomStatusLabel,
  onYearRangeChange,
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
        className="atlas-filter-tray-body grid gap-3 p-3 xl:grid-cols-[1.05fr_1.25fr_1fr_1fr_1fr]"
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
