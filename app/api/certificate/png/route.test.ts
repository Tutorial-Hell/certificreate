import { describe, expect, it } from "vitest";
import { slugify } from "./route";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Jane Doe")).toBe("jane-doe");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(slugify("O'Brien & Sons, Inc.")).toBe("o-brien-sons-inc");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Jane Doe--  ")).toBe("jane-doe");
  });

  it("falls back to certificate for empty or symbol-only input", () => {
    expect(slugify("   ")).toBe("certificate");
    expect(slugify("!!!")).toBe("certificate");
  });
});
