import { useState } from "react";
import {
  COURSE_MAX_LENGTH,
  INSTRUCTOR_NAME_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
  type CertificateFormErrors,
} from "@/lib/certificate/schema";
import type { CertificateData } from "@/lib/certificate/types";

type FieldKey = keyof Omit<CertificateData, "logoUrl">;

const fields: {
  key: FieldKey;
  label: string;
  type: "text" | "date";
  placeholder?: string;
  maxLength?: number;
}[] = [
  {
    key: "recipientName",
    label: "Recipient name",
    type: "text",
    placeholder: "Jordan Alvarez",
    maxLength: RECIPIENT_NAME_MAX_LENGTH,
  },
  {
    key: "course",
    label: "Course / achievement",
    type: "text",
    placeholder: "Full-Stack Web Development",
    maxLength: COURSE_MAX_LENGTH,
  },
  { key: "date", label: "Date", type: "date" },
  {
    key: "instructorName",
    label: "Instructor",
    type: "text",
    placeholder: "Brad Traversy",
    maxLength: INSTRUCTOR_NAME_MAX_LENGTH,
  },
];

export function CertificateForm({
  data,
  onChange,
  errors,
}: {
  data: CertificateData;
  onChange: (field: FieldKey, value: string) => void;
  errors: CertificateFormErrors;
}) {
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Certificate details
      </h2>
      <div className="flex flex-col gap-4">
        {fields.map((field) => {
          const errorMessage = touched[field.key] ? errors[field.key] : undefined;
          return (
            <label key={field.key} className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-[var(--muted)]">{field.label}</span>
              <input
                type={field.type}
                value={data[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                aria-invalid={Boolean(errorMessage)}
                className={`rounded-[var(--radius-sm)] border bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)] ${
                  errorMessage ? "border-[var(--danger)]" : "border-[var(--border)]"
                }`}
              />
              {errorMessage && (
                <span className="text-xs text-[var(--danger)]">{errorMessage}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
