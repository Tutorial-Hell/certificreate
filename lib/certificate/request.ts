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
    return { ok: false, errors: result.error.issues.map((issue) => issue.message) };
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
