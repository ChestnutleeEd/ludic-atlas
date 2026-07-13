export type CameraPointOfView = { altitude: number; lat: number; lng: number };

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
  const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);
  return {
    altitude: from.altitude + (to.altitude - from.altitude) * eased,
    lat: from.lat + (to.lat - from.lat) * eased,
    lng: from.lng + shortestLongitudeDelta(from.lng, to.lng) * eased
  };
}

export function getCameraDuration(requested: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : Math.min(600, Math.max(0, requested));
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
