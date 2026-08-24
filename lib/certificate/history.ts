export type CertificateHistoryEntry = {
  id: string;
  recipientName: string;
  course: string;
  date: string;
  instructorName: string;
  templateId: string;
  createdAt: number;
};

export const CERTIFICATE_HISTORY_STORAGE_KEY = "certificreate:history";

// Bounds local storage growth; oldest entries fall off once exceeded.
export const MAX_HISTORY_ENTRIES = 50;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidEntry(value: unknown): value is CertificateHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    isString(entry.id) &&
    isString(entry.recipientName) &&
    isString(entry.course) &&
    isString(entry.date) &&
    isString(entry.instructorName) &&
    isString(entry.templateId) &&
    typeof entry.createdAt === "number"
  );
}

export function parseCertificateHistory(raw: string | null): CertificateHistoryEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

export function addHistoryEntry(
  entries: CertificateHistoryEntry[],
  entry: CertificateHistoryEntry,
): CertificateHistoryEntry[] {
  return [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
}
