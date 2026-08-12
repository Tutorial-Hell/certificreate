import type { ComponentType } from "react";

export type CertificateData = {
  recipientName: string;
  course: string;
  /** Pre-formatted display string; date parsing/formatting is feature 8. */
  date: string;
  instructorName: string;
  /** Data URL; absent renders the placeholder logo mark. */
  logoUrl?: string;
};

export type Template = {
  id: string;
  name: string;
  Component: ComponentType<{ data: CertificateData }>;
};
