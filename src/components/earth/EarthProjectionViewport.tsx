import type { ReactNode } from "react";
import type {
  EarthProjectionMode,
  SpatialNavigationIntent
} from "@/types/earth";

type EarthProjectionViewportProps = {
  navigationIntent: SpatialNavigationIntent;
  projectionMode: EarthProjectionMode;
  renderGlobe: () => ReactNode;
};

/** Mounts exactly one renderer branch; the Atlas branch is Phase 1 only. */
export function EarthProjectionViewport({
  navigationIntent,
  projectionMode,
  renderGlobe
}: EarthProjectionViewportProps) {
  if (projectionMode === "globe") {
    return renderGlobe();
  }

  return <AtlasContractPlaceholder navigationIntent={navigationIntent} />;
}

function AtlasContractPlaceholder({
  navigationIntent
}: {
  navigationIntent: SpatialNavigationIntent;
}) {
  return (
    <section
      aria-label="Atlas renderer contract placeholder"
      className="glass-panel atlas-globe-panel relative h-full min-h-0 overflow-hidden"
      data-earth-renderer="atlas-placeholder"
      data-navigation-revision={navigationIntent.revision}
      data-navigation-target={navigationIntent.target.type}
    >
      <div className="grid h-full min-h-[420px] place-items-center p-6 text-center text-sm text-[#A99D8B]">
        Atlas 挂载契约占位；正式地图渲染器将在后续阶段实现。
      </div>
    </section>
  );
}
