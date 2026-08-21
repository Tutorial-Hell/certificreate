"use client";

import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { CertificateForm } from "@/components/certificate/CertificateForm";
import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

const emptyData: CertificateData = {
  recipientName: "",
  course: "",
  date: "",
  instructorName: "",
};

const template = templates[0];

// Matches the viewport width /certificate/render is captured at (lib/certificate/render.ts),
// so the preview is a true scaled miniature of the export, not a differently-proportioned reflow.
const CERTIFICATE_DESIGN_WIDTH = 1200;

function CertificatePreview({
  data,
  Template,
}: {
  data: CertificateData;
  Template: ComponentType<{ data: CertificateData }>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setScale(el.getBoundingClientRect().width / CERTIFICATE_DESIGN_WIDTH);
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / CERTIFICATE_DESIGN_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="aspect-[1.414/1] w-full max-w-xl overflow-hidden">
      <div
        className="origin-top-left"
        style={{ width: CERTIFICATE_DESIGN_WIDTH, transform: `scale(${scale})` }}
      >
        <Template data={data} />
      </div>
    </div>
  );
}

function isComplete(data: CertificateData): boolean {
  return Boolean(
    data.recipientName.trim() &&
      data.course.trim() &&
      data.date.trim() &&
      data.instructorName.trim(),
  );
}

function extractFilename(contentDisposition: string | null, format: "png" | "pdf"): string {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? `certificate.${format}`;
}

async function downloadCertificate(
  endpoint: string,
  data: CertificateData,
  format: "png" | "pdf",
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, templateId: template.id }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to generate ${format.toUpperCase()}`);
  }

  const blob = await response.blob();
  const filename = extractFilename(response.headers.get("Content-Disposition"), format);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function CertificateWorkspace() {
  const [data, setData] = useState<CertificateData>(emptyData);
  const [downloadingFormat, setDownloadingFormat] = useState<"png" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof Omit<CertificateData, "logoUrl">, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = (endpoint: string, format: "png" | "pdf") => async () => {
    setError(null);
    setDownloadingFormat(format);
    try {
      await downloadCertificate(endpoint, data, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const Template = template.Component;
  const canDownload = isComplete(data) && downloadingFormat === null;

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
      <CertificateForm data={data} onChange={handleChange} />
      <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <CertificatePreview data={data} Template={Template} />
        <div className="flex w-full max-w-xl flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload("/api/certificate/png", "png")}
              disabled={!canDownload}
              className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingFormat === "png" ? "Generating..." : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={handleDownload("/api/certificate/pdf", "pdf")}
              disabled={!canDownload}
              className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingFormat === "pdf" ? "Generating..." : "Download PDF"}
            </button>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
