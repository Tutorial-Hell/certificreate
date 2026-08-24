import type { CertificateHistoryEntry } from "@/lib/certificate/history";
import type { Template } from "@/lib/certificate/types";

function formatTimestamp(createdAt: number): string {
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CertificateHistoryPanel({
  entries,
  templates,
  busy,
  onOpen,
  onDownload,
}: {
  entries: CertificateHistoryEntry[];
  templates: Template[];
  busy: boolean;
  onOpen: (entry: CertificateHistoryEntry) => void;
  onDownload: (entry: CertificateHistoryEntry, format: "png" | "pdf") => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        History
      </h2>
      {entries.length === 0 ? (
        <p className="text-xs text-[var(--faint)]">No certificates generated yet.</p>
      ) : (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {entries.map((entry) => {
            const templateName =
              templates.find((t) => t.id === entry.templateId)?.name ?? entry.templateId;
            return (
              <div
                key={entry.id}
                className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] p-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-[var(--text)]">{entry.recipientName}</span>
                  <span className="shrink-0 text-[10px] text-[var(--faint)]">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {entry.course} - {entry.date} - {templateName}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(entry)}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(entry, "png")}
                    disabled={busy}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(entry, "pdf")}
                    disabled={busy}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
