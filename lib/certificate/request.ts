import { certificateFormSchema } from "@/lib/certificate/schema";
import { templates } from "@/lib/certificate/templates";
import type { BrandColors } from "@/lib/certificate/brand-settings";
import type { CertificateData } from "@/lib/certificate/types";
import type { CertificateRenderRequest } from "@/lib/certificate/render";

export type CertificateRequestBody = Partial<CertificateData> & {
  templateId?: string;
  colors?: BrandColors;
};

export type ParsedCertificateRequest =
  | { ok: true; data: CertificateRenderRequest }
  | { ok: false; errors: string[] };

export function parseCertificateRequest(body: CertificateRequestBody): ParsedCertificateRequest {
  const result = certificateFormSchema.safeParse(body);
  if (!result.success) {
    // A field can fail more than one check (e.g. an empty date fails both
    // "required" and "valid date"); keep only the first message per field,
    // matching validateCertificateData's per-field error shape.
    const seenFields = new Set<string>();
    const errors: string[] = [];
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (seenFields.has(field)) continue;
      seenFields.add(field);
      errors.push(issue.message);
    }
    return { ok: false, errors };
  }

  const templateId = templates.some((template) => template.id === body.templateId)
    ? (body.templateId as string)
    : templates[0].id;

  return {
    ok: true,
    data: {
      ...result.data,
      templateId,
      colors: body.colors,
      logoUrl: body.logoUrl,
    },
  };
}
