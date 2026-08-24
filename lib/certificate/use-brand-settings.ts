import { useEffect, useState } from "react";
import {
  BRAND_SETTINGS_STORAGE_KEY,
  DEFAULT_BRAND_SETTINGS,
  parseBrandSettings,
  type BrandSettings,
} from "@/lib/certificate/brand-settings";

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(parseBrandSettings(localStorage.getItem(BRAND_SETTINGS_STORAGE_KEY)));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(BRAND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save brand settings - your browser storage may be full.");
    }
  }, [settings, loaded]);

  return { settings, setSettings, loaded, saveError };
}
