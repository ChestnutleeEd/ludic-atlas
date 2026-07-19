import assert from "node:assert/strict";
import test from "node:test";
import {
  COVER_SIZE_DEFAULT,
  COVER_SIZE_LAYOUT_BUCKET,
  COVER_SIZE_MAX,
  COVER_SIZE_MIN,
  COVER_SIZE_STEP,
  COVER_SIZE_STORAGE_KEY,
  clampCoverSize,
  getCoverSizeLayoutBucket,
  normalizeCoverSize,
  parseStoredCoverSize,
  readStoredCoverSize,
  snapCoverSizeToStep,
  writeStoredCoverSize
} from "../src/lib/coverSize.ts";

test("cover size exposes the 48/72/112 anchors and 4 px step", () => {
  assert.equal(COVER_SIZE_MIN, 48);
  assert.equal(COVER_SIZE_DEFAULT, 72);
  assert.equal(COVER_SIZE_MAX, 112);
  assert.equal(COVER_SIZE_STEP, 4);
  assert.equal(COVER_SIZE_LAYOUT_BUCKET, 8);
});

test("cover size clamps finite numeric bounds and safely defaults non-finite input", () => {
  assert.equal(clampCoverSize(12), 48);
  assert.equal(clampCoverSize(80), 80);
  assert.equal(clampCoverSize(999), 112);
  assert.equal(clampCoverSize(Number.NaN), 72);
  assert.equal(clampCoverSize(Number.POSITIVE_INFINITY), 72);
});

test("cover size snaps to the nearest valid 4 px step after clamping", () => {
  assert.equal(snapCoverSizeToStep(49), 48);
  assert.equal(snapCoverSizeToStep(50), 52);
  assert.equal(snapCoverSizeToStep(71), 72);
  assert.equal(snapCoverSizeToStep(111), 112);
  assert.equal(normalizeCoverSize("84"), 72);
});

test("stored cover size accepts only finite in-range step-aligned values", () => {
  for (const value of ["48", "72", "112", "84"]) {
    assert.equal(parseStoredCoverSize(value), Number(value));
  }
  for (const value of [null, "", "abc", "NaN", "Infinity", "47", "116", "70", "72.5"]) {
    assert.equal(parseStoredCoverSize(value), 72);
  }
});

test("storage uses a versioned key and falls back when storage is absent or throws", () => {
  assert.match(COVER_SIZE_STORAGE_KEY, /:v1$/);
  assert.equal(readStoredCoverSize(null), 72);
  assert.equal(readStoredCoverSize({ getItem: (key) => key === COVER_SIZE_STORAGE_KEY ? "88" : null }), 88);
  assert.equal(readStoredCoverSize({ getItem: () => { throw new Error("blocked"); } }), 72);
});

test("storage writing normalizes values and contains storage failures", () => {
  const values = new Map<string, string>();
  assert.equal(writeStoredCoverSize({ setItem: (key, value) => values.set(key, value) }, 90), true);
  assert.equal(values.get(COVER_SIZE_STORAGE_KEY), "92");
  assert.equal(writeStoredCoverSize({ setItem: () => { throw new Error("blocked"); } }, 80), false);
  assert.equal(writeStoredCoverSize(null, 80), false);
});

test("cover-size collision buckets change only at the 8 px contract boundary", () => {
  assert.equal(getCoverSizeLayoutBucket(48), 0);
  assert.equal(getCoverSizeLayoutBucket(52), 0);
  assert.equal(getCoverSizeLayoutBucket(56), 1);
  assert.equal(getCoverSizeLayoutBucket(112), 8);
});
