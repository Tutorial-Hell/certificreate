import { NextResponse, type NextRequest } from "next/server";
import { goToCertificateRender } from "@/lib/certificate/render";
import { withPage } from "@/lib/puppeteer/browser";
import { parseCertificateRequest, type CertificateRequestBody } from "@/lib/certificate/request";
import { certificateFilename } from "@/lib/certificate/filename";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: CertificateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCertificateRequest(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: `Missing required field(s): ${parsed.missing.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const pdf = await withPage((page) =>
      goToCertificateRender(page, parsed.data).then(() =>
        // The certificate's own aspect-[1.414/1] frame is A4's ratio, so an A4
        // landscape page at zero margin fills exactly with no crop or gutter.
        page.pdf({
          format: "A4",
          landscape: true,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        }),
      ),
    );

    const filename = certificateFilename(parsed.data.recipientName, "pdf");

    return new NextResponse(new Blob([Buffer.from(pdf)], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render certificate PDF", error);
    return new NextResponse("Failed to render certificate PDF", { status: 500 });
  }
}
