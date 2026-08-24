import { describe, it, expect } from "vitest";
import { normalizeUnit } from "../taxonomy";

describe("normalizeUnit", () => {
  it("passes through canonical unit", () => {
    expect(normalizeUnit("tsp")).toBe("tsp");
  });

  it("normalizes tablespoon to tbsp", () => {
    expect(normalizeUnit("tablespoon")).toBe("tbsp");
  });

  it("is case insensitive", () => {
    expect(normalizeUnit("Tablespoons")).toBe("tbsp");
  });

  it("normalizes cups to cup", () => {
    expect(normalizeUnit("cups")).toBe("cup");
  });

  it("normalizes lbs to lb", () => {
    expect(normalizeUnit("lbs")).toBe("lb");
  });

  it("returns null for null input", () => {
    expect(normalizeUnit(null)).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(normalizeUnit("")).toBe(null);
  });

  it("returns null for unknown unit", () => {
    expect(normalizeUnit("banana")).toBe(null);
  });
});
