import { describe, it, expect } from "vitest";
import { parseFractionQuantity } from "../parse-fraction";

describe("parseFractionQuantity", () => {
  it("parses mixed fraction", () => {
    expect(parseFractionQuantity("1 1/2")).toBe(1.5);
  });

  it("parses simple fraction", () => {
    expect(parseFractionQuantity("1/2")).toBe(0.5);
  });

  it("parses decimal", () => {
    expect(parseFractionQuantity("1.5")).toBe(1.5);
  });

  it("parses integer", () => {
    expect(parseFractionQuantity("3")).toBe(3);
  });

  it("returns null for empty string", () => {
    expect(parseFractionQuantity("")).toBe(null);
  });

  it("returns null for garbage input", () => {
    expect(parseFractionQuantity("garbage")).toBe(null);
  });
});
