import { useEffect, useState } from "react";
import {
  addHistoryEntry,
  CERTIFICATE_HISTORY_STORAGE_KEY,
  parseCertificateHistory,
  type CertificateHistoryEntry,
} from "@/lib/certificate/history";

export function useCertificateHistory() {
  const [entries, setEntries] = useState<CertificateHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(parseCertificateHistory(localStorage.getItem(CERTIFICATE_HISTORY_STORAGE_KEY)));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(CERTIFICATE_HISTORY_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // best-effort; history is a convenience, not critical data
    }
  }, [entries, loaded]);

  const addEntry = (entry: CertificateHistoryEntry) => {
    setEntries((prev) => addHistoryEntry(prev, entry));
  };

  const clearEntries = () => {
    try {
      localStorage.removeItem(CERTIFICATE_HISTORY_STORAGE_KEY);
    } catch {
      // best-effort; history is a convenience, not critical data
    }
    setEntries([]);
  };

  return { entries, addEntry, clearEntries, loaded };
}
