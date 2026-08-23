import type { BrandSettings } from "@/lib/certificate/brand-settings";

const DEFAULT_BORDER_COLOR = "#4b3e96";
const DEFAULT_BORDER_INNER_COLOR = "#7691c2";

export function BrandSettingsPanel({
  settings,
  onChange,
}: {
  settings: BrandSettings;
  onChange: (next: BrandSettings) => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Brand settings
      </h2>
      <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
