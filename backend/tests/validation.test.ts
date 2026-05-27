import {
  formatPiTimestamp,
  isValidSessionCode,
  validateReadings
} from "../src/lib/validation.js";

describe("isValidSessionCode", () => {
  it("accepts valid codes", () => {
    expect(isValidSessionCode("A3X9K2")).toBe(true);
    expect(isValidSessionCode("ABCDEF")).toBe(true);
  });

  it("rejects ambiguous or invalid characters", () => {
    expect(isValidSessionCode("A3X9K0")).toBe(false);
    expect(isValidSessionCode("A3X9KO")).toBe(false);
    expect(isValidSessionCode("A3X9K")).toBe(false);
    expect(isValidSessionCode(undefined)).toBe(false);
  });
});

describe("validateReadings", () => {
  const validReadings = {
    reader_0: "Product_A",
    reader_1: "Machine_J",
    reader_2: "Machine_D",
    reader_3: "Machine_B",
    reader_4: "Machine_A",
    reader_5: "Machine_H",
    reader_6: "Machine_F"
  };

  it("accepts a valid Pi-compatible payload", () => {
    const result = validateReadings(validReadings);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.readings).toEqual(validReadings);
    }
  });

  it("accepts all-empty readings", () => {
    const empty = {
      reader_0: "empty",
      reader_1: "empty",
      reader_2: "empty",
      reader_3: "empty",
      reader_4: "empty",
      reader_5: "empty",
      reader_6: "empty"
    };
    expect(validateReadings(empty).ok).toBe(true);
  });

  it("rejects duplicate placements", () => {
    const result = validateReadings({
      ...validReadings,
      reader_2: "Machine_J"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects product in station slot", () => {
    const result = validateReadings({
      ...validReadings,
      reader_1: "Product_B"
    });
    expect(result.ok).toBe(false);
  });
});

describe("formatPiTimestamp", () => {
  it("formats without Z and with microsecond precision", () => {
    const formatted = formatPiTimestamp(new Date(2025, 6, 22, 17, 36, 56, 453));
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/);
    expect(formatted.endsWith(".453000")).toBe(true);
  });
});
