import { colorOverrideStyle, type BrandColors } from "@/lib/certificate/brand-settings";
import { takeLogo } from "@/lib/certificate/logo-handoff";
import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

type RenderSearchParams = {
  recipientName?: string;
  course?: string;
  date?: string;
  instructorName?: string;
  templateId?: string;
  colorBorder?: string;
  colorBorderInner?: string;
  logoToken?: string;
};

export default async function CertificateRenderPage({
  searchParams,
}: {
  searchParams: Promise<RenderSearchParams>;
}) {
  const params = await searchParams;
  const data: CertificateData = {
    recipientName: params.recipientName ?? "",
    course: params.course ?? "",
    date: params.date ?? "",
    instructorName: params.instructorName ?? "",
    // A missing or already-claimed token falls back to the placeholder mark
    // (LogoMark treats an undefined logoUrl as "no logo") - never throws.
    logoUrl: params.logoToken ? takeLogo(params.logoToken) : undefined,
  };
  const template =
    templates.find((t) => t.id === params.templateId) ?? templates[0];
  const Template = template.Component;
  const colors: BrandColors = {
    border: params.colorBorder,
    borderInner: params.colorBorderInner,
  };

  return (
    <div id="certificate-root" className="w-full" style={colorOverrideStyle(colors)}>
      <Template data={data} />
    </div>
  );
}
