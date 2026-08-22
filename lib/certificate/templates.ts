import { BlackBorderTemplate } from "@/components/certificate/BlackBorderTemplate";
import { ModernLineTemplate } from "@/components/certificate/ModernLineTemplate";
import type { Template } from "@/lib/certificate/types";

export const templates: Template[] = [
  { id: "black-border", name: "Black Border", Component: BlackBorderTemplate },
  { id: "modern-line", name: "Modern Line", Component: ModernLineTemplate },
];
