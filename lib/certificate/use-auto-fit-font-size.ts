"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { computeFitScale } from "@/lib/certificate/auto-fit";

/**
 * Shrinks (never grows) an element's font size so its text stays on one line
 * within its own bounding box. The ref'd element must have a fixed/bounded
 * width via CSS (its clientWidth is treated as the available space) and
 * `white-space: nowrap` so scrollWidth reflects the text's true natural
 * width. No ResizeObserver: the certificate templates always render at a
 * fixed intrinsic width (matching Puppeteer's viewport), scaled visually via
 * CSS transform in the live preview, not actually resized at the DOM level.
 */
export function useAutoFitFontSize<T extends HTMLElement>(text: string, baseFontSizePx: number) {
  const ref = useRef<T>(null);
  const [fontSize, setFontSize] = useState(baseFontSizePx);
  // Tracks the scale actually rendered on the DOM right now, so measure()
  // can back out the natural (unscaled) width from the current scrollWidth
  // without ever imperatively touching the element's style. An imperative
  // reset-to-base there is a trap: if a later measurement lands on the same
  // scale as before, React bails out of re-rendering (identical state), and
  // the reset is the last thing left touching the DOM - silently discarding
  // the shrink.
  const appliedScaleRef = useRef(1);

  useLayoutEffect(() => {
    appliedScaleRef.current = fontSize / baseFontSizePx;
  }, [fontSize, baseFontSizePx]);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const naturalWidthAtBase = el.scrollWidth / appliedScaleRef.current;
    const scale = computeFitScale(el.clientWidth, naturalWidthAtBase);
    setFontSize(baseFontSizePx * scale);
  }, [baseFontSizePx]);

  useLayoutEffect(() => {
    measure();
  }, [text, measure]);

  // The self-hosted font can still be loading on the first measurement,
  // producing a scale based on fallback-font metrics. Re-measure once the
  // real font is ready - Puppeteer awaits this same promise before
  // capturing (lib/certificate/render.ts), so the correction lands first.
  useEffect(() => {
    document.fonts.ready.then(measure);
  }, [measure]);

  return { ref, fontSize };
}
