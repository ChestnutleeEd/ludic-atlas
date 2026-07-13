import assert from "node:assert/strict";
import test from "node:test";
import {
  createCameraAnimator,
  getCameraDuration,
  interpolatePointOfView,
  shortestLongitudeDelta
} from "../src/lib/globeCamera.ts";

test("longitude interpolation uses the shortest arc", () => {
  assert.equal(shortestLongitudeDelta(170, -170), 20);
  assert.equal(interpolatePointOfView({ lat: 0, lng: 170, altitude: 1 }, { lat: 0, lng: -170, altitude: 1 }, 0.5).lng, 187.5);
});

test("reduced motion has zero duration", () => {
  assert.equal(getCameraDuration(600, true), 0);
  assert.equal(getCameraDuration(900, false), 600);
});

test("a newer revision and user interruption cancel stale frame writes", () => {
  const callbacks = new Map<number, (time: number) => void>();
  let nextId = 0;
  const writes: number[] = [];
  const animator = createCameraAnimator({
    now: () => 0,
    requestFrame: (callback) => { const id = ++nextId; callbacks.set(id, callback); return id; },
    cancelFrame: (id) => callbacks.delete(id),
    write: (point) => writes.push(point.lng)
  });
  animator.animate({ lat: 0, lng: 0, altitude: 1 }, { lat: 0, lng: 90, altitude: 1 }, 600);
  const stale = [...callbacks.values()][0];
  animator.animate({ lat: 0, lng: 0, altitude: 1 }, { lat: 0, lng: -40, altitude: 1 }, 600);
  stale(300);
  assert.deepEqual(writes, []);
  animator.cancel();
  for (const callback of callbacks.values()) callback(600);
  assert.deepEqual(writes, []);
});
