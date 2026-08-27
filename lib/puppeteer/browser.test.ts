import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseConcurrency } from "./browser";

const launch = vi.fn();

vi.mock("puppeteer", () => ({
  default: { launch: (...args: unknown[]) => launch(...args) },
}));

function makeFakePage() {
  return { close: vi.fn(async () => {}) };
}

function makeFakeBrowser() {
  return { newPage: vi.fn(async () => makeFakePage()) };
}

beforeEach(() => {
  vi.resetModules();
  globalThis.__certificreateBrowserPromise = undefined;
  launch.mockReset();
});

afterEach(() => {
  globalThis.__certificreateBrowserPromise = undefined;
});

describe("parseConcurrency", () => {
  it("falls back to the default for undefined", () => {
    expect(parseConcurrency(undefined)).toBe(2);
  });

  it("accepts a valid positive integer", () => {
    expect(parseConcurrency("5")).toBe(5);
  });

  it("falls back to the default for zero", () => {
    expect(parseConcurrency("0")).toBe(2);
  });

  it("falls back to the default for a negative number", () => {
    expect(parseConcurrency("-1")).toBe(2);
  });

  it("falls back to the default for a non-numeric string", () => {
    expect(parseConcurrency("abc")).toBe(2);
  });

  it("falls back to the default for a non-integer number", () => {
    expect(parseConcurrency("2.5")).toBe(2);
  });
});

describe("withPage", () => {
  it("never runs more than the concurrency cap at once, then lets queued calls through", async () => {
    const fakeBrowser = makeFakeBrowser();
    launch.mockResolvedValue(fakeBrowser);
    const { withPage } = await import("./browser");

    const started: number[] = [];
    const releases: (() => void)[] = [];

    function task(id: number) {
      return withPage(async () => {
        started.push(id);
        await new Promise<void>((resolve) => releases.push(resolve));
        return id;
      });
    }

    const p1 = task(1);
    const p2 = task(2);
    const p3 = task(3);

    // Default cap is 2 - only the first two should be running.
    await vi.waitFor(() => expect(started).toEqual([1, 2]));

    releases[0]();
    await p1;

    // Releasing one slot lets the third, queued call start.
    await vi.waitFor(() => expect(started).toContain(3));

    releases[1]();
    releases[2]();
    await Promise.all([p2, p3]);

    expect(fakeBrowser.newPage).toHaveBeenCalledTimes(3);
  });

  it("closes the page even when the render function throws", async () => {
    const fakePage = makeFakePage();
    const fakeBrowser = { newPage: vi.fn(async () => fakePage) };
    launch.mockResolvedValue(fakeBrowser);
    const { withPage } = await import("./browser");

    await expect(
      withPage(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(fakePage.close).toHaveBeenCalledTimes(1);
  });

  it("resolves every call", async () => {
    const fakeBrowser = makeFakeBrowser();
    launch.mockResolvedValue(fakeBrowser);
    const { withPage } = await import("./browser");

    const results = await Promise.all([1, 2, 3, 4].map((n) => withPage(async () => n)));

    expect(results).toEqual([1, 2, 3, 4]);
  });

  it("launches the browser only once across multiple calls", async () => {
    const fakeBrowser = makeFakeBrowser();
    launch.mockResolvedValue(fakeBrowser);
    const { withPage } = await import("./browser");

    await Promise.all([1, 2, 3].map((n) => withPage(async () => n)));

    expect(launch).toHaveBeenCalledTimes(1);
  });
});
