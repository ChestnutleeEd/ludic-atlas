import assert from "node:assert/strict";
import test from "node:test";
import {
  createCameraAnimator,
  createGlobeCameraController,
  getCameraDuration,
  interpolatePointOfView,
  shortestLongitudeDelta
} from "../src/lib/globeCamera.ts";

test("longitude interpolation uses the shortest arc", () => {
  assert.equal(shortestLongitudeDelta(170, -170), 20);
  assert.equal(interpolatePointOfView({ lat: 0, lng: 170, altitude: 1 }, { lat: 0, lng: -170, altitude: 1 }, 0.5).lng, 180);
});

test("camera controller transitions, revision cancellation, and user takeover are deterministic", () => {
  const callbacks = new Map<number, (time: number) => void>();
  const states: string[] = [];
  const settles: Array<{ reason: string; revision: number }> = [];
  const writes: number[] = [];
  let current = { altitude: 1, lat: 0, lng: 0 };
  let nextId = 0;
  const controller = createGlobeCameraController({
    cancelFrame: (id) => callbacks.delete(id),
    now: () => 0,
    onSettle: (_point, revision, reason) => settles.push({ reason, revision }),
    onStateChange: (state) => states.push(state),
    read: () => current,
    requestFrame: (callback) => {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    },
    write: (point) => {
      current = point;
      writes.push(point.lng);
    }
  });

  assert.equal(controller.navigate({ duration: 600, revision: 1, target: { altitude: 1, lat: 0, lng: 80 } }), true);
  const staleFrame = [...callbacks.values()][0];
  assert.equal(controller.navigate({ duration: 600, revision: 3, target: { altitude: 1, lat: 0, lng: -30 } }), true);
  assert.equal(controller.navigate({ duration: 0, revision: 2, target: { altitude: 1, lat: 0, lng: 120 } }), false);
  staleFrame(600);
  assert.deepEqual(writes, []);

  controller.beginUserControl();
  for (const callback of callbacks.values()) callback(600);
  assert.deepEqual(writes, []);
  controller.endUserControl();
  assert.deepEqual(states, ["programmatic-navigation", "user-controlled", "settled"]);
  assert.deepEqual(settles, [{ reason: "user", revision: 3 }]);

  controller.dispose();
  assert.equal(controller.navigate({ duration: 0, revision: 4, target: { altitude: 1, lat: 0, lng: 10 } }), false);
  assert.equal(controller.getSnapshot().state, "disposed");
});

test("programmatic navigation settles only after its latest frame completes", () => {
  const callbacks = new Map<number, (time: number) => void>();
  const states: string[] = [];
  const saved: number[] = [];
  let current = { altitude: 1, lat: 0, lng: 0 };
  let nextId = 0;
  const controller = createGlobeCameraController({
    cancelFrame: (id) => callbacks.delete(id),
    now: () => 0,
    onSettle: (_point, revision) => saved.push(revision),
    onStateChange: (state) => states.push(state),
    read: () => current,
    requestFrame: (callback) => { const id = ++nextId; callbacks.set(id, callback); return id; },
    write: (point) => { current = point; }
  });
  controller.navigate({ duration: 500, revision: 8, target: { altitude: 0.2, lat: 50, lng: 5 } });
  assert.deepEqual(saved, []);
  [...callbacks.values()][0](500);
  assert.deepEqual(states, ["programmatic-navigation", "settled"]);
  assert.deepEqual(saved, [8]);
});

test("reduced motion has zero duration", () => {
  assert.equal(getCameraDuration(600, true), 0);
  assert.equal(getCameraDuration(1200, false), 900);
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
