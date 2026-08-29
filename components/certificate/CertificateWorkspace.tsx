"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { BrandSettingsPanel } from "@/components/certificate/BrandSettingsPanel";
import { CertificateForm } from "@/components/certificate/CertificateForm";
import { CertificateHistoryPanel } from "@/components/certificate/CertificateHistoryPanel";
import { TemplatePicker } from "@/components/certificate/TemplatePicker";
import { colorOverrideStyle, type BrandColors } from "@/lib/certificate/brand-settings";
import { useBrandSettings } from "@/lib/certificate/use-brand-settings";
import { useCertificateHistory } from "@/lib/certificate/use-certificate-history";
import type { CertificateHistoryEntry } from "@/lib/certificate/history";
import {
  LAST_FORM_VALUES_STORAGE_KEY,
  parseLastFormValues,
} from "@/lib/certificate/last-form-values";
import { validateCertificateData } from "@/lib/certificate/schema";
import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

const emptyData: CertificateData = {
  recipientName: "",
  course: "",
  date: "",
  instructorName: "",
};

// Matches the viewport width /certificate/render is captured at (lib/certificate/render.ts),
// so the preview is a true scaled miniature of the export, not a differently-proportioned reflow.
const CERTIFICATE_DESIGN_WIDTH = 1200;

function CertificatePreview({
  data,
  Template,
  colors,
}: {
  data: CertificateData;
  Template: ComponentType<{ data: CertificateData }>;
  colors: BrandColors;
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
        style={{
          width: CERTIFICATE_DESIGN_WIDTH,
          transform: `scale(${scale})`,
          ...colorOverrideStyle(colors),
        }}
      >
        <Template data={data} />
      </div>
    </div>
  );
}

function buildHistoryEntry(data: CertificateData, templateId: string): CertificateHistoryEntry {
  return {
    id: crypto.randomUUID(),
    recipientName: data.recipientName,
    course: data.course,
    date: data.date,
    instructorName: data.instructorName,
    templateId,
    createdAt: Date.now(),
  };
}

function extractFilename(contentDisposition: string | null, format: "png" | "pdf"): string {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? `certificate.${format}`;
}

async function downloadCertificate(
  endpoint: string,
  data: CertificateData,
  templateId: string,
  colors: BrandColors,
  logoUrl: string | undefined,
  format: "png" | "pdf",
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, templateId, colors, logoUrl }),
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
  const [templateId, setTemplateId] = useState<string>(templates[0].id);
  const [downloadingFormat, setDownloadingFormat] = useState<"png" | "pdf" | null>(null);
  const [downloadingEntryId, setDownloadingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    settings: brandSettings,
    setSettings: setBrandSettings,
    loaded: brandSettingsLoaded,
    saveError: brandSettingsSaveError,
  } = useBrandSettings();
  const {
    entries: historyEntries,
    addEntry: addHistoryEntry,
    clearEntries: clearHistoryEntries,
  } = useCertificateHistory();
  const [formValuesLoaded, setFormValuesLoaded] = useState(false);

  const handleChange = (field: keyof Omit<CertificateData, "logoUrl">, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!brandSettingsLoaded || !brandSettings.instructorName) return;
    setData((prev) =>
      prev.instructorName ? prev : { ...prev, instructorName: brandSettings.instructorName },
    );
  }, [brandSettingsLoaded, brandSettings.instructorName]);

  // Restore once on mount, before the persist effect below can write anything back.
  useEffect(() => {
    const restored = parseLastFormValues(localStorage.getItem(LAST_FORM_VALUES_STORAGE_KEY));
    if (restored) {
      setData({
        recipientName: restored.recipientName,
        course: restored.course,
        date: restored.date,
        instructorName: restored.instructorName,
      });
      setTemplateId(restored.templateId);
    }
    setFormValuesLoaded(true);
  }, []);

  useEffect(() => {
    if (!formValuesLoaded) return;
    try {
      localStorage.setItem(
        LAST_FORM_VALUES_STORAGE_KEY,
        JSON.stringify({ ...data, templateId }),
      );
    } catch {
      // best-effort; last form values are a convenience, not critical data
    }
  }, [data, templateId, formValuesLoaded]);

  const handleDownload = (endpoint: string, format: "png" | "pdf") => async () => {
    setError(null);
    setDownloadingFormat(format);
    try {
      await downloadCertificate(
        endpoint,
        data,
        templateId,
        brandSettings.colors,
        brandSettings.logoDataUrl,
        format,
      );
      addHistoryEntry(buildHistoryEntry(data, templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleClearHistory = () => {
    clearHistoryEntries();
    setData({ ...emptyData, instructorName: brandSettings.instructorName });
    setTemplateId(templates[0].id);
  };

  const handleOpenEntry = (entry: CertificateHistoryEntry) => {
    setData({
      recipientName: entry.recipientName,
      course: entry.course,
      date: entry.date,
      instructorName: entry.instructorName,
    });
    setTemplateId(entry.templateId);
  };

  const handleDownloadEntry = async (entry: CertificateHistoryEntry, format: "png" | "pdf") => {
    setError(null);
    setDownloadingEntryId(entry.id);
    const endpoint = format === "png" ? "/api/certificate/png" : "/api/certificate/pdf";
    const entryData: CertificateData = {
      recipientName: entry.recipientName,
      course: entry.course,
      date: entry.date,
      instructorName: entry.instructorName,
    };
    try {
      await downloadCertificate(
        endpoint,
        entryData,
        entry.templateId,
        brandSettings.colors,
        brandSettings.logoDataUrl,
        format,
      );
      addHistoryEntry(buildHistoryEntry(entryData, entry.templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${format.toUpperCase()}`);
    } finally {
      setDownloadingEntryId(null);
    }
  };

  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const Template = template.Component;
  const busy = downloadingFormat !== null || downloadingEntryId !== null;
  const { valid: dataIsValid, errors: formErrors } = validateCertificateData(data);
  const canDownload = dataIsValid && !busy;

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
      <div className="flex flex-col gap-6">
        <BrandSettingsPanel
          settings={brandSettings}
          onChange={setBrandSettings}
          saveError={brandSettingsSaveError}
        />
        <TemplatePicker templates={templates} selectedId={templateId} onSelect={setTemplateId} />
        <CertificateForm data={data} onChange={handleChange} errors={formErrors} />
        <CertificateHistoryPanel
          entries={historyEntries}
          templates={templates}
          busy={busy}
          onOpen={handleOpenEntry}
          onDownload={handleDownloadEntry}
          onClearHistory={handleClearHistory}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <CertificatePreview
          data={{ ...data, logoUrl: brandSettings.logoDataUrl }}
          Template={Template}
          colors={brandSettings.colors}
        />
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
