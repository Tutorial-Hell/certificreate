export type LastFormValues = {
  recipientName: string;
  course: string;
  date: string;
  instructorName: string;
  templateId: string;
};

export const LAST_FORM_VALUES_STORAGE_KEY = "certificreate:last-form-values";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function parseLastFormValues(raw: string | null): LastFormValues | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      isString(parsed.recipientName) &&
      isString(parsed.course) &&
      isString(parsed.date) &&
      isString(parsed.instructorName) &&
      isString(parsed.templateId)
    ) {
      return {
        recipientName: parsed.recipientName,
        course: parsed.course,
        date: parsed.date,
        instructorName: parsed.instructorName,
        templateId: parsed.templateId,
      };
    }
    return null;
  } catch {
    return null;
  }
}
