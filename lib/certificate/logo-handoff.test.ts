import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stashLogo, takeLogo } from "./logo-handoff";

describe("logo-handoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the stashed value when claimed", () => {
    const token = stashLogo("data:image/png;base64,abc123");
    expect(takeLogo(token)).toBe("data:image/png;base64,abc123");
  });

  it("is single-use - a second take on the same token returns undefined", () => {
    const token = stashLogo("data:image/png;base64,abc123");
    takeLogo(token);
    expect(takeLogo(token)).toBeUndefined();
  });

  it("returns undefined for an unknown token", () => {
    expect(takeLogo("not-a-real-token")).toBeUndefined();
  });

  it("expires an unclaimed token after the TTL", () => {
    const token = stashLogo("data:image/png;base64,abc123");
    vi.advanceTimersByTime(30_000);
    expect(takeLogo(token)).toBeUndefined();
  });

  it("does not expire a token claimed before the TTL elapses", () => {
    const token = stashLogo("data:image/png;base64,abc123");
    expect(takeLogo(token)).toBe("data:image/png;base64,abc123");
    vi.advanceTimersByTime(30_000);
    expect(takeLogo(token)).toBeUndefined();
  });
});
