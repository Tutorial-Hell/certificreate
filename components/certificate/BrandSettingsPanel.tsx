import { useState, type ChangeEvent } from "react";
import type { BrandSettings } from "@/lib/certificate/brand-settings";

const DEFAULT_BORDER_COLOR = "#4b3e96";
const DEFAULT_BORDER_INNER_COLOR = "#7691c2";
const MAX_LOGO_BYTES = 1024 * 1024;

export function BrandSettingsPanel({
  settings,
  onChange,
  saveError,
}: {
  settings: BrandSettings;
  onChange: (next: BrandSettings) => void;
  saveError?: string | null;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setUploadError("Image is too large - max 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadError(null);
      onChange({ ...settings, logoDataUrl: reader.result as string });
    };
    reader.onerror = () => {
      setUploadError("Couldn't read that file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setUploadError(null);
    onChange({ ...settings, logoDataUrl: undefined });
  };

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Brand settings
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-[var(--muted)]">Logo</span>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg)]">
              {settings.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable static asset
                <img
                  src={settings.logoDataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-[var(--faint)]">None</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-xs text-[var(--muted)] file:mr-2 file:rounded-[var(--radius-sm)] file:border file:border-[var(--border)] file:bg-[var(--bg)] file:px-2 file:py-1 file:text-xs file:text-[var(--text)]"
              />
              {settings.logoDataUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="self-start text-xs text-[var(--muted)] underline hover:text-[var(--text)]"
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>
          {uploadError && <p className="text-xs text-[var(--danger)]">{uploadError}</p>}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-[var(--muted)]">Default instructor</span>
          <input
            type="text"
            value={settings.instructorName}
            onChange={(e) => onChange({ ...settings, instructorName: e.target.value })}
            placeholder="Brad Traversy"
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-[var(--muted)]">Accent color</span>
            <input
              type="color"
              value={settings.colors.border ?? DEFAULT_BORDER_COLOR}
              onChange={(e) =>
                onChange({ ...settings, colors: { ...settings.colors, border: e.target.value } })
              }
              className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)]"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-[var(--muted)]">Secondary accent</span>
            <input
              type="color"
              value={settings.colors.borderInner ?? DEFAULT_BORDER_INNER_COLOR}
              onChange={(e) =>
                onChange({
                  ...settings,
                  colors: { ...settings.colors, borderInner: e.target.value },
                })
              }
              className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)]"
            />
          </label>
        </div>

        {saveError && <p className="text-xs text-[var(--danger)]">{saveError}</p>}
      </div>
    </div>
  );
}
