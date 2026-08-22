import type { Template } from "@/lib/certificate/types";

export function TemplatePicker({
  templates,
  selectedId,
  onSelect,
}: {
  templates: Template[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Template
      </h2>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => {
          const selected = template.id === selectedId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              aria-pressed={selected}
              className={
                selected
                  ? "rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)]"
                  : "rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
              }
            >
              {template.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
