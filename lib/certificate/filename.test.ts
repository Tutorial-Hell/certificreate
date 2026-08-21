import { describe, expect, it } from "vitest";
import { certificateFilename, slugify } from "./filename";

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

describe("certificateFilename", () => {
  it("combines the slugified name with the given extension", () => {
    expect(certificateFilename("Jane Doe", "png")).toBe("jane-doe-certificate.png");
    expect(certificateFilename("Jane Doe", "pdf")).toBe("jane-doe-certificate.pdf");
  });

  it("falls back to certificate for empty input", () => {
    expect(certificateFilename("   ", "pdf")).toBe("certificate-certificate.pdf");
  });
});
