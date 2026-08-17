"use client";

import { useState } from "react";
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

function isComplete(data: CertificateData): boolean {
  return Boolean(
    data.recipientName.trim() &&
      data.course.trim() &&
      data.date.trim() &&
      data.instructorName.trim(),
  );
}

function extractFilename(contentDisposition: string | null): string {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? "certificate.png";
}

export function CertificateWorkspace() {
  const [data, setData] = useState<CertificateData>(emptyData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof Omit<CertificateData, "logoUrl">, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadPng = async () => {
    setError(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/certificate/png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, templateId: template.id }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to generate PNG");
      }

      const blob = await response.blob();
      const filename = extractFilename(response.headers.get("Content-Disposition"));

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PNG");
    } finally {
      setIsDownloading(false);
    }
  };

  const Template = template.Component;
  const canDownload = isComplete(data) && !isDownloading;

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
      <CertificateForm data={data} onChange={handleChange} />
      <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="w-full max-w-xl">
          <Template data={data} />
        </div>
        <div className="flex w-full max-w-xl flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!canDownload}
            className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? "Generating..." : "Download PNG"}
          </button>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
