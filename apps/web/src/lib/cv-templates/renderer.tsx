import type { CV } from "jobai-shared";
import { getCvTemplateById } from "jobai-shared";
import {
  CompactTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  TechTemplate,
} from "./core-templates";
import {
  AcademicTemplate,
  BannerTemplate,
  BoldTemplate,
  ClassicTemplate,
  ClinicalTemplate,
  CreativeTemplate,
  ElegantTemplate,
  InternationalTemplate,
  LegalTemplate,
  MinimalTemplate,
  PortfolioTemplate,
  SidebarLeftTemplate,
  SidebarRightTemplate,
  StartupTemplate,
  TimelineTemplate,
  TwoColTemplate,
} from "./extended-templates";

export function CvTemplateRenderer({
  cv,
  templateId,
  primaryColor,
}: {
  cv: CV;
  templateId: string;
  primaryColor: string;
}) {
  const def = getCvTemplateById(templateId);
  const layout = def?.layout ?? "modern";

  switch (layout) {
    case "executive":
      return <ExecutiveTemplate cv={cv} primaryColor={primaryColor} />;
    case "tech":
      return <TechTemplate cv={cv} primaryColor={primaryColor} variant={templateId === "matrix" ? "matrix" : "default"} />;
    case "compact":
      return <CompactTemplate cv={cv} primaryColor={primaryColor} />;
    case "creative":
      return <CreativeTemplate cv={cv} primaryColor={primaryColor} />;
    case "academic":
      return <AcademicTemplate cv={cv} primaryColor={primaryColor} />;
    case "banner":
      return <BannerTemplate cv={cv} primaryColor={primaryColor} />;
    case "minimal":
      return <MinimalTemplate cv={cv} primaryColor={primaryColor} />;
    case "bold":
      return <BoldTemplate cv={cv} primaryColor={primaryColor} />;
    case "elegant":
      return <ElegantTemplate cv={cv} primaryColor={primaryColor} />;
    case "startup":
      return <StartupTemplate cv={cv} primaryColor={primaryColor} />;
    case "legal":
      return <LegalTemplate cv={cv} primaryColor={primaryColor} />;
    case "clinical":
      return <ClinicalTemplate cv={cv} primaryColor={primaryColor} />;
    case "sidebar-left":
      return <SidebarLeftTemplate cv={cv} primaryColor={primaryColor} gradient={templateId === "aurora"} />;
    case "sidebar-right":
      return <SidebarRightTemplate cv={cv} primaryColor={primaryColor} />;
    case "timeline":
      return <TimelineTemplate cv={cv} primaryColor={primaryColor} />;
    case "classic":
      return <ClassicTemplate cv={cv} primaryColor={primaryColor} />;
    case "international":
      return <InternationalTemplate cv={cv} primaryColor={primaryColor} />;
    case "portfolio":
      return <PortfolioTemplate cv={cv} primaryColor={primaryColor} />;
    case "twocol":
      return <TwoColTemplate cv={cv} primaryColor={primaryColor} />;
    case "modern":
    default:
      return <ModernTemplate cv={cv} primaryColor={primaryColor} />;
  }
}
