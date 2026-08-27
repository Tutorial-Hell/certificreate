import puppeteer, { type Browser, type Page } from "puppeteer";

const DEFAULT_MAX_CONCURRENT_RENDERS = 2;

// Tunable per Render instance size (CERTIFICATE_RENDER_CONCURRENCY) without a
// redeploy. Falls back to the default for anything missing or not a positive
// integer - never throws on a malformed env value.
export function parseConcurrency(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_CONCURRENT_RENDERS;
}

const MAX_CONCURRENT_RENDERS = parseConcurrency(process.env.CERTIFICATE_RENDER_CONCURRENCY);

declare global {
  var __certificreateBrowserPromise: Promise<Browser> | undefined;
}

function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}

export function getBrowser(): Promise<Browser> {
  if (!globalThis.__certificreateBrowserPromise) {
    globalThis.__certificreateBrowserPromise = launchBrowser();
  }
  return globalThis.__certificreateBrowserPromise;
}

let activeRenders = 0;
const waiting: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      activeRenders += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRenders -= 1;
  const next = waiting.shift();
  if (next) next();
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const acquireStart = performance.now();
  await acquireSlot();
  const queueWaitMs = performance.now() - acquireStart;
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      const renderStart = performance.now();
      const result = await fn(page);
      const renderMs = performance.now() - renderStart;
      const rssMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
      console.log(
        `[render] queueWaitMs=${Math.round(queueWaitMs)} renderMs=${Math.round(renderMs)} rssMB=${rssMB} activeRenders=${activeRenders}`,
      );
      return result;
    } finally {
      await page.close();
    }
  } finally {
    releaseSlot();
  }
}
