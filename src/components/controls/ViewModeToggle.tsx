import { getViewModeLabel } from "@/lib/localization";
import type { ViewMode } from "@/types/game";

type ViewModeToggleProps = {
  viewMode: ViewMode;
  onChange: (viewMode: ViewMode) => void;
};

const viewModes: ViewMode[] = ["countries", "games"];

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div>
      <span className="block text-sm text-[#F0B65A]" id="view-mode-label">
        marker 模式
      </span>
      <div
        aria-labelledby="view-mode-label"
        className="atlas-control-box mt-2 grid grid-cols-2 gap-2 text-sm"
        role="group"
      >
        {viewModes.map((mode) => (
          <button
            aria-label={`显示${getViewModeLabel(mode)} marker`}
            aria-pressed={mode === viewMode}
            className={`atlas-segment-button ${
              mode === viewMode
                ? "is-active"
                : ""
            }`}
            key={mode}
            onClick={() => onChange(mode)}
            type="button"
          >
            {getViewModeLabel(mode)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#A99D8B]">
        国家模式显示国家聚合点；游戏模式显示代表性游戏封面。
      </p>
    </div>
  );
}
