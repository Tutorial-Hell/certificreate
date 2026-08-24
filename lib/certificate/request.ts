import { templates } from "@/lib/certificate/templates";
import type { BrandColors } from "@/lib/certificate/brand-settings";
import type { CertificateData } from "@/lib/certificate/types";
import type { CertificateRenderRequest } from "@/lib/certificate/render";

export type CertificateRequestBody = Partial<CertificateData> & {
  templateId?: string;
  colors?: BrandColors;
};

const REQUIRED_FIELDS = [
  "recipientName",
  "course",
  "date",
  "instructorName",
] as const satisfies readonly (keyof CertificateData)[];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export type ParsedCertificateRequest =
  | { ok: true; data: CertificateRenderRequest }
  | { ok: false; missing: string[] };

export function parseCertificateRequest(body: CertificateRequestBody): ParsedCertificateRequest {
  const missing = REQUIRED_FIELDS.filter((field) => !isNonEmptyString(body[field]));
  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const templateId = templates.some((template) => template.id === body.templateId)
    ? (body.templateId as string)
    : templates[0].id;

  return {
    ok: true,
    data: {
      recipientName: body.recipientName as string,
      course: body.course as string,
      date: body.date as string,
      instructorName: body.instructorName as string,
      templateId,
      colors: body.colors,
      logoUrl: body.logoUrl,
    },
  };
}
