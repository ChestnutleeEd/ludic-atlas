export type MarkerSemanticIdentityInput =
  | { kind: "game"; gameId: string; layoutIdentity: string }
  | { kind: "aggregate"; countryCode: string; layoutIdentity: string }
  | { kind: "overflow"; countryCode: string; layoutIdentity: string };

export function getMarkerSemanticIdentity(marker: MarkerSemanticIdentityInput) {
  if (marker.kind === "game") {
    return `game:${marker.gameId}:${marker.layoutIdentity}`;
  }
  return `${marker.kind}:${marker.countryCode}:${marker.layoutIdentity}`;
}

export function diffMarkerIdentitySets(
  previous: Iterable<string>,
  next: Iterable<string>
) {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);
  return {
    added: [...nextSet].filter((identity) => !previousSet.has(identity)),
    removed: [...previousSet].filter((identity) => !nextSet.has(identity)),
    retained: [...nextSet].filter((identity) => previousSet.has(identity))
  };
}

export function reconcileMarkerDescriptors<T extends object>(
  registry: Map<string, T>,
  desired: readonly T[],
  getIdentity: (descriptor: T) => string
) {
  const accepted = new Set<string>();
  const reconciled = desired.map((descriptor) => {
    const identity = getIdentity(descriptor);
    accepted.add(identity);
    const retained = registry.get(identity);
    if (retained) {
      Object.assign(retained, descriptor);
      return retained;
    }
    registry.set(identity, descriptor);
    return descriptor;
  });
  for (const identity of registry.keys()) {
    if (!accepted.has(identity)) registry.delete(identity);
  }
  return reconciled;
}

export type EarthMarkerInteractionState =
  | "idle"
  | "user-dragging"
  | "user-zooming"
  | "programmatic-camera-animation"
  | "auto-rotate"
  | "settling"
  | "cover-size-preview"
  | "cover-size-change"
  | "reduced-motion";

export type MarkerInteractionPolicy = {
  mayReduceDecoration: boolean;
  mayHideAllMarkers: false;
  mayUnmountAllMarkers: false;
  visibilityAuthority: "htmlElementVisibilityModifier";
  affectsSemanticIdentity: false;
  mayAllocateRendererResources: false;
};

export function getMarkerInteractionPolicy(
  state: EarthMarkerInteractionState
): MarkerInteractionPolicy {
  return {
    mayReduceDecoration: state !== "idle",
    mayHideAllMarkers: false,
    mayUnmountAllMarkers: false,
    visibilityAuthority: "htmlElementVisibilityModifier",
    affectsSemanticIdentity: false,
    mayAllocateRendererResources: false
  };
}

export function clampAggregateMarkerDiameter(coverSize: number) {
  if (!Number.isFinite(coverSize)) return 20;
  return Math.min(32, Math.max(18, Math.round(coverSize * 0.28)));
}

export const AGGREGATE_MARKER_MIN_HIT_TARGET = 24;
