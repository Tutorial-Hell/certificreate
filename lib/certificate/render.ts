import type { ElementHandle, Page } from "puppeteer";
import type { CertificateData } from "@/lib/certificate/types";

const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 849;
const DEVICE_SCALE_FACTOR = 3;

export type CertificateRenderRequest = CertificateData & { templateId: string };

/**
 * Navigates a Puppeteer page to the print-only /certificate/render route and
 * waits until the certificate is ready to capture. Shared by PNG export and,
 * later, PDF export, so both reuse the same navigate/wait logic.
 */
export async function goToCertificateRender(
  page: Page,
  origin: string,
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

  await page.goto(`${origin}/certificate/render?${params.toString()}`, {
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
