import type { CSSProperties } from "react";

export type BrandColors = {
  border?: string;
  borderInner?: string;
};

export type BrandSettings = {
  instructorName: string;
  colors: BrandColors;
  /** Data URL; unused until feature 6b (logo upload). */
  logoDataUrl?: string;
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  instructorName: "",
  colors: {},
};

export const BRAND_SETTINGS_STORAGE_KEY = "certificreate:brand-settings";

// Only the two accent tokens are brand-overridable; unset values are
// omitted so the CSS falls back to globals.css's defaults.
export function colorOverrideStyle(colors: BrandColors): CSSProperties {
  return {
    ...(colors.border ? { "--cert-border": colors.border } : {}),
    ...(colors.borderInner ? { "--cert-border-inner": colors.borderInner } : {}),
  } as CSSProperties;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function parseBrandSettings(raw: string | null): BrandSettings {
  if (!raw) return DEFAULT_BRAND_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const colorsInput = (parsed.colors ?? {}) as Record<string, unknown>;

    return {
      instructorName: isString(parsed.instructorName) ? parsed.instructorName : "",
      colors: {
        border: isString(colorsInput.border) ? colorsInput.border : undefined,
        borderInner: isString(colorsInput.borderInner) ? colorsInput.borderInner : undefined,
      },
      logoDataUrl: isString(parsed.logoDataUrl) ? parsed.logoDataUrl : undefined,
    };
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}
