import type { CertificateData } from "@/lib/certificate/types";

type FieldKey = keyof Omit<CertificateData, "logoUrl">;

const fields: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: "recipientName", label: "Recipient name", placeholder: "Jordan Alvarez" },
  { key: "course", label: "Course / achievement", placeholder: "Full-Stack Web Development" },
  { key: "date", label: "Date", placeholder: "Aug 9, 2026" },
  { key: "instructorName", label: "Instructor", placeholder: "Brad Traversy" },
];

export function CertificateForm({
  data,
  onChange,
}: {
  data: CertificateData;
  onChange: (field: FieldKey, value: string) => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Certificate details
      </h2>
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-[var(--muted)]">{field.label}</span>
            <input
              type="text"
              value={data[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
