import type { TemplateMetadata } from "./contracts.js";

export type CvTemplateCategory =
  | "Corporate"
  | "Creative"
  | "Academic"
  | "Tech"
  | "Healthcare"
  | "General";

export type CvTemplateLayout =
  | "modern"
  | "executive"
  | "tech"
  | "compact"
  | "sidebar-left"
  | "sidebar-right"
  | "minimal"
  | "bold"
  | "timeline"
  | "academic"
  | "banner"
  | "twocol"
  | "classic"
  | "startup"
  | "clinical"
  | "legal"
  | "portfolio"
  | "creative"
  | "elegant"
  | "international";

export type CvPdfRenderFamily = "modern" | "executive" | "tech" | "compact";

export interface CvTemplateDefinition extends TemplateMetadata {
  category: CvTemplateCategory;
  layout: CvTemplateLayout;
  pdfFamily: CvPdfRenderFamily;
}

export const CV_TEMPLATES: CvTemplateDefinition[] = [
  {
    id: "modern",
    name: "Modern Clean",
    description: "Minimalist layout with clear visual hierarchy and accent header",
    category: "General",
    layout: "modern",
    pdfFamily: "modern",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Structured traditional corporate layout optimized for leadership roles",
    category: "Corporate",
    layout: "executive",
    pdfFamily: "executive",
  },
  {
    id: "tech",
    name: "Technical",
    description: "Skills and project focused layout designed for engineering resumes",
    category: "Tech",
    layout: "tech",
    pdfFamily: "tech",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense single-page layout maximizing content per square inch",
    category: "General",
    layout: "compact",
    pdfFamily: "compact",
  },
  {
    id: "creative",
    name: "Creative Studio",
    description: "Bold color blocks and expressive section headers for design roles",
    category: "Creative",
    layout: "creative",
    pdfFamily: "modern",
  },
  {
    id: "academic",
    name: "Academic CV",
    description: "Formal scholarly structure with emphasis on education and research",
    category: "Academic",
    layout: "academic",
    pdfFamily: "executive",
  },
  {
    id: "corporate",
    name: "Corporate Blue",
    description: "Conservative top-band layout suited to finance and consulting",
    category: "Corporate",
    layout: "banner",
    pdfFamily: "modern",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Generous whitespace and quiet typography for understated profiles",
    category: "General",
    layout: "minimal",
    pdfFamily: "modern",
  },
  {
    id: "bold",
    name: "Bold Impact",
    description: "Oversized name and strong dividers for senior individual contributors",
    category: "Creative",
    layout: "bold",
    pdfFamily: "modern",
  },
  {
    id: "elegant",
    name: "Elegant Serif",
    description: "Refined centered header with light serif body copy",
    category: "Corporate",
    layout: "elegant",
    pdfFamily: "executive",
  },
  {
    id: "startup",
    name: "Startup Friendly",
    description: "Rounded panels and approachable rhythm for early-stage teams",
    category: "Tech",
    layout: "startup",
    pdfFamily: "modern",
  },
  {
    id: "legal",
    name: "Legal Professional",
    description: "Tight margins and formal caps for law and compliance careers",
    category: "Corporate",
    layout: "legal",
    pdfFamily: "compact",
  },
  {
    id: "clinical",
    name: "Clinical Care",
    description: "Clean clinical palette with structured credentials sections",
    category: "Healthcare",
    layout: "clinical",
    pdfFamily: "modern",
  },
  {
    id: "designer",
    name: "Designer Sidebar",
    description: "Asymmetric sidebar accent highlighting contact and skills",
    category: "Creative",
    layout: "sidebar-right",
    pdfFamily: "modern",
  },
  {
    id: "timeline",
    name: "Career Timeline",
    description: "Vertical timeline rail connecting roles and education chronologically",
    category: "General",
    layout: "timeline",
    pdfFamily: "modern",
  },
  {
    id: "aurora",
    name: "Aurora Panel",
    description: "Gradient sidebar panel with high-contrast section labels",
    category: "Creative",
    layout: "sidebar-left",
    pdfFamily: "modern",
  },
  {
    id: "classic",
    name: "Classic Print",
    description: "Black-and-white borders reminiscent of traditional print CVs",
    category: "General",
    layout: "classic",
    pdfFamily: "executive",
  },
  {
    id: "matrix",
    name: "Matrix Terminal",
    description: "Dark terminal aesthetic with monospace metadata lines",
    category: "Tech",
    layout: "tech",
    pdfFamily: "tech",
  },
  {
    id: "global",
    name: "Global Mobility",
    description: "International contact strip emphasizing location and languages",
    category: "Corporate",
    layout: "international",
    pdfFamily: "modern",
  },
  {
    id: "portfolio",
    name: "Portfolio First",
    description: "Projects and highlights surfaced before employment history",
    category: "Creative",
    layout: "portfolio",
    pdfFamily: "modern",
  },
];

export const CV_TEMPLATE_IDS = CV_TEMPLATES.map((t) => t.id);

export function getCvTemplateById(id: string): CvTemplateDefinition | undefined {
  return CV_TEMPLATES.find((t) => t.id === id);
}

export function resolvePdfFamily(templateId: string): CvPdfRenderFamily {
  return getCvTemplateById(templateId)?.pdfFamily ?? "modern";
}

export function cvTemplatesAsAppConfig(): TemplateMetadata[] {
  return CV_TEMPLATES.map(({ id, name, description, category }) => ({
    id,
    name,
    description: `${description} · ${category}`,
  }));
}
