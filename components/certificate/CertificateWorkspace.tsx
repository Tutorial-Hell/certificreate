"use client";

import { useState } from "react";
import { CertificateForm } from "@/components/certificate/CertificateForm";
import { templates } from "@/lib/certificate/templates";
import type { CertificateData } from "@/lib/certificate/types";

const emptyData: CertificateData = {
  recipientName: "",
  course: "",
  date: "",
  instructorName: "",
};

const template = templates[0];

export function CertificateWorkspace() {
  const [data, setData] = useState<CertificateData>(emptyData);

  const handleChange = (field: keyof Omit<CertificateData, "logoUrl">, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const Template = template.Component;

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-[360px_1fr]">
      <CertificateForm data={data} onChange={handleChange} />
      <div className="flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="w-full max-w-xl">
          <Template data={data} />
        </div>
      </div>
    </div>
  );
}
