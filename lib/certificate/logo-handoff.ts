import { randomUUID } from "node:crypto";

const TOKEN_TTL_MS = 30_000;

// A plain module-level Map isn't guaranteed to be one shared instance across
// Next.js's module graph (API routes and page routes can load separate
// instances of the same file, notably under Turbopack dev) - globalThis
// forces true process-wide sharing, matching lib/puppeteer/browser.ts's
// existing browser-singleton pattern.
declare global {
  var __certificreatePendingLogos: Map<string, string> | undefined;
}

function pendingLogos(): Map<string, string> {
  if (!globalThis.__certificreatePendingLogos) {
    globalThis.__certificreatePendingLogos = new Map();
  }
  return globalThis.__certificreatePendingLogos;
}

/**
 * Hands a large per-request value (a logo data URL) from the PNG/PDF route
 * handler to the internally-navigated /certificate/render page without ever
 * putting it on the wire (URL, header, or cookie) - see the feature spec for
 * why. Same-process, in-memory only; each token is claimed at most once.
 */
export function stashLogo(dataUrl: string): string {
  const token = randomUUID();
  pendingLogos().set(token, dataUrl);
  setTimeout(() => pendingLogos().delete(token), TOKEN_TTL_MS).unref?.();
  return token;
}

export function takeLogo(token: string): string | undefined {
  const value = pendingLogos().get(token);
  pendingLogos().delete(token);
  return value;
}
