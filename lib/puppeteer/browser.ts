import puppeteer, { type Browser, type Page } from "puppeteer";

const MAX_CONCURRENT_RENDERS = 2;

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
  await acquireSlot();
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      return await fn(page);
    } finally {
      await page.close();
    }
  } finally {
    releaseSlot();
  }
}
