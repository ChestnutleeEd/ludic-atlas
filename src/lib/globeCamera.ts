export type CameraPointOfView = { altitude: number; lat: number; lng: number };
export type GlobeCameraState =
  | "idle"
  | "programmatic-navigation"
  | "user-controlled"
  | "settled"
  | "disposed";

export type GlobeCameraSettleReason = "programmatic" | "user";

export type GlobeCameraCommand = {
  duration: number;
  revision: number;
  target: CameraPointOfView;
};

type CameraAnimatorOptions = {
  now: () => number;
  requestFrame: (callback: (time: number) => void) => number;
  cancelFrame: (id: number) => void;
  write: (point: CameraPointOfView) => void;
};

export function shortestLongitudeDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

export function interpolatePointOfView(from: CameraPointOfView, to: CameraPointOfView, progress: number): CameraPointOfView {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const eased = clampedProgress * clampedProgress * clampedProgress * (
    clampedProgress * (clampedProgress * 6 - 15) + 10
  );
  return {
    altitude: from.altitude + (to.altitude - from.altitude) * eased,
    lat: from.lat + (to.lat - from.lat) * eased,
    lng: from.lng + shortestLongitudeDelta(from.lng, to.lng) * eased
  };
}

export function getCameraDuration(requested: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : Math.min(900, Math.max(0, requested));
}

export function createCameraAnimator(options: CameraAnimatorOptions) {
  let frameId: number | null = null;
  let revision = 0;

  const cancel = () => {
    revision += 1;
    if (frameId !== null) options.cancelFrame(frameId);
    frameId = null;
  };

  const animate = (from: CameraPointOfView, to: CameraPointOfView, duration: number) => {
    cancel();
    const ownRevision = revision;
    const safeDuration = Math.max(0, duration);
    if (safeDuration === 0) {
      options.write(to);
      return;
    }
    const startedAt = options.now();
    const step = (time: number) => {
      if (ownRevision !== revision) return;
      const progress = Math.min(1, (time - startedAt) / safeDuration);
      options.write(interpolatePointOfView(from, to, progress));
      if (progress < 1) frameId = options.requestFrame(step);
      else frameId = null;
    };
    frameId = options.requestFrame(step);
  };

  return { animate, cancel };
}

type GlobeCameraControllerOptions = CameraAnimatorOptions & {
  onSettle?: (
    point: CameraPointOfView,
    revision: number,
    reason: GlobeCameraSettleReason
  ) => void;
  onStateChange?: (state: GlobeCameraState) => void;
  read: () => CameraPointOfView;
};

/** The only imperative writer for programmatic Globe navigation. */
export function createGlobeCameraController(options: GlobeCameraControllerOptions) {
  let activeFrame: number | null = null;
  let commandToken = 0;
  let disposed = false;
  let latestRevision = -1;
  let state: GlobeCameraState = "idle";

  const setState = (nextState: GlobeCameraState) => {
    if (state === nextState) return;
    state = nextState;
    options.onStateChange?.(state);
  };

  const invalidateAnimation = () => {
    commandToken += 1;
    if (activeFrame !== null) options.cancelFrame(activeFrame);
    activeFrame = null;
  };

  const navigate = ({ duration, revision, target }: GlobeCameraCommand) => {
    if (disposed || revision < latestRevision) return false;
    latestRevision = revision;
    invalidateAnimation();
    const ownToken = commandToken;
    const from = options.read();
    const safeDuration = Math.max(0, duration);
    setState("programmatic-navigation");

    if (safeDuration === 0) {
      if (disposed || ownToken !== commandToken) return false;
      options.write(target);
      setState("settled");
      options.onSettle?.(target, revision, "programmatic");
      return true;
    }

    const startedAt = options.now();
    const step = (time: number) => {
      if (disposed || ownToken !== commandToken || revision < latestRevision) return;
      const progress = Math.min(1, (time - startedAt) / safeDuration);
      const point = interpolatePointOfView(from, target, progress);
      options.write(point);
      if (progress < 1) {
        activeFrame = options.requestFrame(step);
        return;
      }
      activeFrame = null;
      setState("settled");
      options.onSettle?.(point, revision, "programmatic");
    };
    activeFrame = options.requestFrame(step);
    return true;
  };

  const beginUserControl = () => {
    if (disposed) return;
    invalidateAnimation();
    setState("user-controlled");
  };

  const endUserControl = () => {
    if (disposed || state !== "user-controlled") return;
    setState("settled");
    options.onSettle?.(options.read(), latestRevision, "user");
  };

  const dispose = () => {
    if (disposed) return;
    invalidateAnimation();
    disposed = true;
    setState("disposed");
  };

  return {
    beginUserControl,
    dispose,
    endUserControl,
    getSnapshot: () => ({
      activeFrame: activeFrame !== null,
      disposed,
      latestRevision,
      state
    }),
    navigate
  };
}
