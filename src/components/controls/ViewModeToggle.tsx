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
      <label className="block text-sm text-[#F0B65A]">展示模式</label>
      <div className="atlas-control-box mt-2 grid grid-cols-2 gap-2 text-sm">
        {viewModes.map((mode) => (
          <button
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
    </div>
  );
}
