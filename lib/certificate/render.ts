import type { ElementHandle, Page } from "puppeteer";
import type { BrandColors } from "@/lib/certificate/brand-settings";
import { stashLogo } from "@/lib/certificate/logo-handoff";
import type { CertificateData } from "@/lib/certificate/types";

const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 849;
const DEVICE_SCALE_FACTOR = 3;

export type CertificateRenderRequest = CertificateData & {
  templateId: string;
  colors?: BrandColors;
};

/**
 * Puppeteer and the Next.js server share one container, so the render page
 * must be reached over plain HTTP on the local port, never through the
 * public HTTPS origin - behind Render's proxy, the inbound request's
 * forwarded-https protocol paired with its raw (internal, plain-HTTP)
 * Host header produces an origin nothing actually serves TLS on.
 */
function getInternalOrigin(): string {
  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

/**
 * Navigates a Puppeteer page to the print-only /certificate/render route and
 * waits until the certificate is ready to capture. Shared by PNG export and,
 * later, PDF export, so both reuse the same navigate/wait logic.
 */
export async function goToCertificateRender(
  page: Page,
  data: CertificateRenderRequest,
): Promise<ElementHandle<Element>> {
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  });

  const params = new URLSearchParams({
    recipientName: data.recipientName,
    course: data.course,
    date: data.date,
    instructorName: data.instructorName,
    templateId: data.templateId,
  });
  if (data.colors?.border) params.set("colorBorder", data.colors.border);
  if (data.colors?.borderInner) params.set("colorBorderInner", data.colors.borderInner);
  // The logo is handed off in-process via a token, never placed in the URL
  // itself - see lib/certificate/logo-handoff.ts for why.
  if (data.logoUrl) params.set("logoToken", stashLogo(data.logoUrl));

  await page.goto(`${getInternalOrigin()}/certificate/render?${params.toString()}`, {
    waitUntil: "networkidle0",
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const certificateElement = await page.waitForSelector("#certificate-root");
  if (!certificateElement) {
    throw new Error("Certificate render page did not produce #certificate-root");
  }

  return certificateElement;
}
