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
  onResetView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
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
  onRotateChange,
  onResetView,
  onZoomIn,
  onZoomOut
}: BottomControlsProps) {
  const hasZoomControls = Boolean(onZoomIn && onZoomOut);

  return (
    <section
      aria-label="地球探索筛选与视图控制"
      className="glass-panel atlas-bottom-controls grid gap-3 p-4 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1fr]"
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
            <small className="block text-[11px] text-[#A99D8B]">
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
        <span className="block text-sm text-[#F0B65A]" id="camera-mode-label">
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
      </div>
      <div>
        <span className="block text-sm text-[#F0B65A]" id="earth-actions-label">
          地球操作
        </span>
        <div
          aria-labelledby="earth-actions-label"
          className="atlas-control-box mt-2 grid grid-cols-3 gap-2 text-sm"
          role="group"
        >
          <button
            aria-label="放大地球视图"
            className="atlas-segment-button disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onZoomIn}
            onClick={onZoomIn}
            type="button"
          >
            放大
          </button>
          <button
            aria-label="缩小地球视图"
            className="atlas-segment-button disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onZoomOut}
            onClick={onZoomOut}
            type="button"
          >
            缩小
          </button>
          <button
            aria-label="重置当前区域镜头"
            className="atlas-segment-button disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onResetView}
            onClick={onResetView}
            type="button"
          >
            重置
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#A99D8B]">
          {zoomStatusLabel ??
            (hasZoomControls ? "缩放控制已接入" : "缩放控制待接入地球组件")}
          ；{regionStatusLabel ?? `当前区域：${activeRegionLabel}`}
        </p>
      </div>
      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
    </section>
  );
}
