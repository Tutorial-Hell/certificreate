import { NextResponse, type NextRequest } from "next/server";
import { goToCertificateRender } from "@/lib/certificate/render";
import { withPage } from "@/lib/puppeteer/browser";
import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

export const runtime = "nodejs";

type PngRequestBody = Partial<CertificateData> & { templateId?: string };

const REQUIRED_FIELDS = [
  "recipientName",
  "course",
  "date",
  "instructorName",
] as const satisfies readonly (keyof CertificateData)[];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "certificate";
}

export async function POST(request: NextRequest) {
  let body: PngRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !isNonEmptyString(body[field]));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const templateId = templates.some((template) => template.id === body.templateId)
    ? (body.templateId as string)
    : templates[0].id;

  try {
    const png = await withPage((page) =>
      goToCertificateRender(page, request.nextUrl.origin, {
        recipientName: body.recipientName as string,
        course: body.course as string,
        date: body.date as string,
        instructorName: body.instructorName as string,
        templateId,
      }).then((certificateElement) => certificateElement.screenshot({ type: "png" })),
    );

    const filename = `${slugify(body.recipientName as string)}-certificate.png`;

    return new NextResponse(new Blob([Buffer.from(png)], { type: "image/png" }), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render certificate PNG", error);
    return new NextResponse("Failed to render certificate PNG", { status: 500 });
  }
}
