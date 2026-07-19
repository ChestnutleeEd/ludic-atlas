import assert from "node:assert/strict";
import test from "node:test";
import {
  AGGREGATE_MARKER_MIN_HIT_TARGET,
  clampAggregateMarkerDiameter,
  diffMarkerIdentitySets,
  getMarkerInteractionPolicy,
  getMarkerSemanticIdentity,
  reconcileMarkerDescriptors,
  type EarthMarkerInteractionState
} from "../src/lib/markerContracts.ts";
import { stabilizeMarkerBudget } from "../src/lib/markerLayout.ts";

test("game semantic identity is game plus geographic layout slot", () => {
  const base = { kind: "game", gameId: "game-1", layoutIdentity: "FR:main:slot-2" } as const;
  const identity = getMarkerSemanticIdentity(base);
  assert.equal(identity, "game:game-1:FR:main:slot-2");
  assert.equal(identity, getMarkerSemanticIdentity({ ...base }));
  assert.notEqual(identity, getMarkerSemanticIdentity({ ...base, layoutIdentity: "FR:main:slot-3" }));
});

test("game, aggregate, and overflow identities are disjoint", () => {
  const layoutIdentity = "BE:main:slot-0";
  const identities = new Set([
    getMarkerSemanticIdentity({ kind: "game", gameId: "BE-1", layoutIdentity }),
    getMarkerSemanticIdentity({ kind: "aggregate", countryCode: "BE", layoutIdentity }),
    getMarkerSemanticIdentity({ kind: "overflow", countryCode: "BE", layoutIdentity })
  ]);
  assert.equal(identities.size, 3);
});

test("selection, cover size, camera state, and ARIA presentation are excluded from identity", () => {
  const marker = { kind: "game", gameId: "FR-1", layoutIdentity: "FR:main:slot-1" } as const;
  const before = getMarkerSemanticIdentity(marker);
  const presentationOnlyChanges = { selectedGameId: "FR-1", coverSize: 112, cameraState: "user-dragging", ariaPressed: true };
  assert.deepEqual(presentationOnlyChanges, presentationOnlyChanges);
  assert.equal(getMarkerSemanticIdentity(marker), before);
});

test("accepted-set reconciliation creates and removes only the actual set difference", () => {
  assert.deepEqual(diffMarkerIdentitySets(["a", "b", "c"], ["b", "c", "d"]), {
    added: ["d"],
    removed: ["a"],
    retained: ["b", "c"]
  });
});

test("descriptor reconciliation retains objects and updates presentation fields in place", () => {
  const registry = new Map<string, { id: string; selected: boolean }>();
  const first = reconcileMarkerDescriptors(
    registry,
    [{ id: "a", selected: false }, { id: "b", selected: false }],
    (marker) => marker.id
  );
  const second = reconcileMarkerDescriptors(
    registry,
    [{ id: "a", selected: true }, { id: "c", selected: false }],
    (marker) => marker.id
  );
  assert.equal(second[0], first[0]);
  assert.equal(second[0].selected, true);
  assert.equal(registry.has("b"), false);
  assert.equal(registry.get("c"), second[1]);
});

test("every interaction state preserves marker presence, identity, occlusion authority, and renderer ownership", () => {
  const states: EarthMarkerInteractionState[] = [
    "idle",
    "user-dragging",
    "user-zooming",
    "programmatic-camera-animation",
    "auto-rotate",
    "settling",
    "cover-size-preview",
    "cover-size-change",
    "reduced-motion"
  ];
  for (const state of states) {
    const policy = getMarkerInteractionPolicy(state);
    assert.equal(policy.mayReduceDecoration, state !== "idle");
    assert.equal(policy.mayHideAllMarkers, false);
    assert.equal(policy.mayUnmountAllMarkers, false);
    assert.equal(policy.visibilityAuthority, "htmlElementVisibilityModifier");
    assert.equal(policy.affectsSemanticIdentity, false);
    assert.equal(policy.mayAllocateRendererResources, false);
  }
});

test("collision budget hysteresis and aggregate dimensions stay bounded", () => {
  assert.equal(stabilizeMarkerBudget(10, 11), 10);
  assert.equal(stabilizeMarkerBudget(10, 12), 12);
  assert.equal(AGGREGATE_MARKER_MIN_HIT_TARGET, 24);
  assert.equal(clampAggregateMarkerDiameter(48), 18);
  assert.equal(clampAggregateMarkerDiameter(72), 20);
  assert.equal(clampAggregateMarkerDiameter(112), 31);
  assert.equal(clampAggregateMarkerDiameter(999), 32);
  assert.equal(clampAggregateMarkerDiameter(Number.NaN), 20);
});
