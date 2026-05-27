import {
  MACHINE_IDS,
  PLACEMENT_VALUES,
  PRODUCT_IDS,
  READER_KEYS,
  SESSION_CODE_PATTERN,
  type Readings
} from "./constants.js";

const placementValueSet = new Set<string>(PLACEMENT_VALUES);

export function isValidSessionCode(code: string | undefined): boolean {
  return typeof code === "string" && SESSION_CODE_PATTERN.test(code);
}

export function validateReadings(value: unknown): { ok: true; readings: Readings } | { ok: false; error: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "readings must be an object" };
  }

  const record = value as Record<string, unknown>;
  const readings = {} as Readings;

  for (const key of READER_KEYS) {
    if (!(key in record)) {
      return { ok: false, error: `missing key: ${key}` };
    }

    const slotValue = record[key];
    if (typeof slotValue !== "string" || !placementValueSet.has(slotValue)) {
      return { ok: false, error: `invalid value for ${key}` };
    }

    readings[key] = slotValue as Readings[typeof key];
  }

  for (const key of Object.keys(record)) {
    if (!READER_KEYS.includes(key as (typeof READER_KEYS)[number])) {
      return { ok: false, error: `unexpected key: ${key}` };
    }
  }

  const usedPieces = new Set<string>();
  for (const key of READER_KEYS) {
    const slotValue = readings[key];
    if (slotValue === "empty") {
      continue;
    }

    if (usedPieces.has(slotValue)) {
      return { ok: false, error: `duplicate placement: ${slotValue}` };
    }
    usedPieces.add(slotValue);
  }

  const productSlot = readings.reader_0;
  if (productSlot !== "empty" && !PRODUCT_IDS.includes(productSlot as (typeof PRODUCT_IDS)[number])) {
    return { ok: false, error: "reader_0 must be a product or empty" };
  }

  for (const key of READER_KEYS) {
    if (key === "reader_0") {
      continue;
    }
    const slotValue = readings[key];
    if (slotValue !== "empty" && !MACHINE_IDS.includes(slotValue as (typeof MACHINE_IDS)[number])) {
      return { ok: false, error: `${key} must be a machine or empty` };
    }
  }

  return { ok: true, readings };
}

export function formatPiTimestamp(date: Date = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  const micros = ms + "000";
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${micros}`;
}
