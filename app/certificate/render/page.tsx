import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

type RenderSearchParams = {
  recipientName?: string;
  course?: string;
  date?: string;
  instructorName?: string;
  templateId?: string;
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
  };
  const template =
    templates.find((t) => t.id === params.templateId) ?? templates[0];
  const Template = template.Component;

  return (
    <div id="certificate-root" className="w-full">
      <Template data={data} />
    </div>
  );
}
