import { NextResponse } from "next/server";

// Intentionally does not touch getBrowser() or Puppeteer readiness - Chrome's
// cold start can be slow, and coupling this to it risks Render restarting an
// otherwise-healthy service during normal startup or a transient hiccup.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
