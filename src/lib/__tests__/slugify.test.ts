import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("converts title to kebab case", () => {
    expect(slugify("Chicken Tikka Masala")).toBe("chicken-tikka-masala");
  });

  it("strips punctuation", () => {
    const result = slugify("Grandma's Mac & Cheese!");
    expect(result).not.toMatch(/[&!']/);
    expect(result).toBe("grandmas-mac-cheese");
  });

  it("collapses whitespace", () => {
    expect(slugify("  lots   of   spaces  ")).toBe("lots-of-spaces");
  });

  it("keeps numbers", () => {
    expect(slugify("24 Hour Bread")).toBe("24-hour-bread");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});
