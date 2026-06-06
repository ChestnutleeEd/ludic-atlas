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
      <label className="block text-sm text-emerald-300">展示模式</label>
      <div className="mt-2 grid grid-cols-2 gap-2 border border-emerald-500/30 p-3 text-sm text-emerald-50/70">
        {viewModes.map((mode) => (
          <button
            className={`border px-3 py-2 text-left transition-colors ${
              mode === viewMode
                ? "border-emerald-300 bg-emerald-400/10 text-emerald-300"
                : "border-emerald-500/25 bg-black text-emerald-50/60 hover:border-emerald-400/70"
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
