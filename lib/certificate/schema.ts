import { z } from "zod";
import type { CertificateData } from "@/lib/certificate/types";

type CertificateFormFields = Omit<CertificateData, "logoUrl">;

export const RECIPIENT_NAME_MAX_LENGTH = 100;
export const COURSE_MAX_LENGTH = 150;
export const INSTRUCTOR_NAME_MAX_LENGTH = 100;

// A raw API body can omit a field entirely (undefined), which would otherwise
// fail Zod's built-in string type check before the friendly "is required"
// message below ever runs. Normalize any non-string to "" first so every
// missing/blank field reports the same message.
function requiredTrimmedString(requiredMessage: string, maxLength: number, maxMessage: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().min(1, requiredMessage).max(maxLength, maxMessage),
  );
}

export const certificateFormSchema = z.object({
  recipientName: requiredTrimmedString(
    "Recipient name is required",
    RECIPIENT_NAME_MAX_LENGTH,
    "Recipient name is too long",
  ),
  course: requiredTrimmedString("Course is required", COURSE_MAX_LENGTH, "Course name is too long"),
  date: requiredTrimmedString("Date is required", Number.MAX_SAFE_INTEGER, "Date is too long"),
  instructorName: requiredTrimmedString(
    "Instructor is required",
    INSTRUCTOR_NAME_MAX_LENGTH,
    "Instructor name is too long",
  ),
});

export type CertificateFormErrors = Partial<Record<keyof CertificateFormFields, string>>;

export function validateCertificateData(data: CertificateFormFields): {
  valid: boolean;
  errors: CertificateFormErrors;
} {
  const result = certificateFormSchema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };

  const errors: CertificateFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CertificateFormFields;
    if (!errors[field]) errors[field] = issue.message;
  }
  return { valid: false, errors };
}
