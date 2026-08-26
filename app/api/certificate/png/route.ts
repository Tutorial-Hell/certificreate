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
    return NextResponse.json({ error: parsed.errors.join(", ") }, { status: 400 });
  }

  try {
    const png = await withPage((page) =>
      goToCertificateRender(page, parsed.data).then((certificateElement) =>
        certificateElement.screenshot({ type: "png" }),
      ),
    );

    const filename = certificateFilename(parsed.data.recipientName, "png");

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
