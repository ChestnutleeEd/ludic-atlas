export const COVER_SIZE_MIN = 48;
export const COVER_SIZE_DEFAULT = 72;
export const COVER_SIZE_MAX = 112;
export const COVER_SIZE_STEP = 4;
export const COVER_SIZE_LAYOUT_BUCKET = 8;
export const COVER_SIZE_STORAGE_KEY = "ludic-atlas:earth-cover-size:v1";

export type CoverSizeStorage = Pick<Storage, "getItem">;
export type CoverSizeWritableStorage = Pick<Storage, "setItem">;

export function clampCoverSize(value: number) {
  if (!Number.isFinite(value)) return COVER_SIZE_DEFAULT;
  return Math.min(COVER_SIZE_MAX, Math.max(COVER_SIZE_MIN, value));
}

export function snapCoverSizeToStep(value: number) {
  if (!Number.isFinite(value)) return COVER_SIZE_DEFAULT;
  const clamped = clampCoverSize(value);
  const steps = Math.round((clamped - COVER_SIZE_MIN) / COVER_SIZE_STEP);
  return clampCoverSize(COVER_SIZE_MIN + steps * COVER_SIZE_STEP);
}

export function normalizeCoverSize(value: unknown) {
  return typeof value === "number"
    ? snapCoverSizeToStep(value)
    : COVER_SIZE_DEFAULT;
}

export function parseStoredCoverSize(value: string | null) {
  if (value === null || value.trim() === "") return COVER_SIZE_DEFAULT;
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    parsed < COVER_SIZE_MIN ||
    parsed > COVER_SIZE_MAX ||
    (parsed - COVER_SIZE_MIN) % COVER_SIZE_STEP !== 0
  ) {
    return COVER_SIZE_DEFAULT;
  }
  return parsed;
}

export function readStoredCoverSize(storage: CoverSizeStorage | null | undefined) {
  if (!storage) return COVER_SIZE_DEFAULT;
  try {
    return parseStoredCoverSize(storage.getItem(COVER_SIZE_STORAGE_KEY));
  } catch {
    return COVER_SIZE_DEFAULT;
  }
}

export function writeStoredCoverSize(
  storage: CoverSizeWritableStorage | null | undefined,
  value: unknown
) {
  if (!storage) return false;
  const normalized = normalizeCoverSize(value);
  try {
    storage.setItem(COVER_SIZE_STORAGE_KEY, String(normalized));
    return true;
  } catch {
    return false;
  }
}

export function getCoverSizeLayoutBucket(value: unknown) {
  const size = normalizeCoverSize(value);
  return Math.floor((size - COVER_SIZE_MIN) / COVER_SIZE_LAYOUT_BUCKET);
}
