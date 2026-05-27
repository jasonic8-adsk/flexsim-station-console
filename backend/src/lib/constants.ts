export const SESSION_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const SESSION_CODE_LENGTH = 6;
export const SESSION_CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

export const READER_KEYS = [
  "reader_0",
  "reader_1",
  "reader_2",
  "reader_3",
  "reader_4",
  "reader_5",
  "reader_6"
] as const;

export type ReaderKey = (typeof READER_KEYS)[number];

export const PRODUCT_IDS = [
  "Product_A",
  "Product_B",
  "Product_C",
  "Product_D"
] as const;

export const MACHINE_IDS = [
  "Machine_A",
  "Machine_B",
  "Machine_C",
  "Machine_D",
  "Machine_E",
  "Machine_F",
  "Machine_G",
  "Machine_H",
  "Machine_I",
  "Machine_J"
] as const;

export const PLACEMENT_VALUES = [...PRODUCT_IDS, ...MACHINE_IDS, "empty"] as const;

export type PlacementValue = (typeof PLACEMENT_VALUES)[number];

export type Readings = Record<ReaderKey, PlacementValue>;
