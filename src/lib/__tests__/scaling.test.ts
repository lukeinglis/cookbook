import { describe, it, expect } from "vitest";
import { scaleQuantity, formatQuantity } from "../scaling";

describe("formatQuantity", () => {
  it("formats 0.667 as ⅔", () => {
    expect(formatQuantity(0.667)).toBe("⅔");
  });

  it("formats 0.75 as ¾", () => {
    expect(formatQuantity(0.75)).toBe("¾");
  });

  it("formats 1.5 as 1½", () => {
    expect(formatQuantity(1.5)).toBe("1½");
  });

  it("formats 0 as '0'", () => {
    expect(formatQuantity(0)).toBe("0");
  });

  it("formats null as empty string", () => {
    expect(formatQuantity(null)).toBe("");
  });

  it("formats 3 as '3'", () => {
    expect(formatQuantity(3)).toBe("3");
  });

  it("falls back sanely for values with no near fraction", () => {
    const result = formatQuantity(0.123);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("scaleQuantity", () => {
  it("scales 1 by 0.25", () => {
    expect(scaleQuantity(1, 0.25, true)).toBe(0.25);
  });

  it("scales 1 by 3", () => {
    expect(scaleQuantity(1, 3, true)).toBe(3);
  });

  it("scales 0.5 by 2", () => {
    expect(scaleQuantity(0.5, 2, true)).toBe(1);
  });

  it("passes through non-scalable quantity untouched", () => {
    expect(scaleQuantity(5, 2, false)).toBe(5);
  });

  it("returns null for null quantity", () => {
    expect(scaleQuantity(null, 2, true)).toBe(null);
  });
});
