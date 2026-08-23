import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND_SETTINGS, parseBrandSettings } from "./brand-settings";

describe("parseBrandSettings", () => {
  it("returns the defaults for null input", () => {
    expect(parseBrandSettings(null)).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("returns the defaults for an empty string", () => {
    expect(parseBrandSettings("")).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("returns the defaults for corrupt JSON", () => {
    expect(parseBrandSettings("{not valid json")).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("parses a fully populated valid payload", () => {
    const raw = JSON.stringify({
      instructorName: "Brad Traversy",
      colors: { border: "#111111", borderInner: "#222222" },
      logoDataUrl: "data:image/png;base64,abc123",
    });
    expect(parseBrandSettings(raw)).toEqual({
      instructorName: "Brad Traversy",
      colors: { border: "#111111", borderInner: "#222222" },
      logoDataUrl: "data:image/png;base64,abc123",
    });
  });

  it("fills in defaults for a partial or malformed colors object", () => {
    const raw = JSON.stringify({
      instructorName: "Brad Traversy",
      colors: { border: "#111111", borderInner: 42 },
    });
    expect(parseBrandSettings(raw)).toEqual({
      instructorName: "Brad Traversy",
      colors: { border: "#111111", borderInner: undefined },
      logoDataUrl: undefined,
    });
  });

  it("falls back to defaults for non-string instructorName and missing colors", () => {
    const raw = JSON.stringify({ instructorName: 123 });
    expect(parseBrandSettings(raw)).toEqual({
      instructorName: "",
      colors: { border: undefined, borderInner: undefined },
      logoDataUrl: undefined,
    });
  });
});
