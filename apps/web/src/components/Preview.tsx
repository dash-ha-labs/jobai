import type * as React from "react";
import type { CV } from "jobai-shared";
import { CV_TEMPLATES } from "jobai-shared";
import { CvTemplateRenderer } from "../lib/cv-templates/renderer";

interface PreviewProps {
  cv: CV;
  onPrint?: () => void;
  onTemplateChange?: (templateId: string) => void;
}

/** @deprecated Use CV_TEMPLATES from jobai-shared */
export const TEMPLATES = CV_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  desc: t.description,
}));

export function Preview({ cv, onPrint: _onPrint, onTemplateChange: _onTemplateChange }: PreviewProps) {
  const currentTemplate = cv.stylePrefs?.templateId || "modern";
  const fontSize = cv.stylePrefs?.fontSize || "normal";
  const marginPref = cv.stylePrefs?.margin || "normal";
  const primaryColor = cv.stylePrefs?.primaryColor || "#4f46e5";
  const isLetter = cv.stylePrefs?.paperSize === "Letter";
  const paperLabel = isLetter ? "Letter (8.5 × 11 in)" : "A4 (210 × 297 mm)";

  const marginClasses = {
    compact: "p-6 sm:p-8",
    normal: "p-8 sm:p-12",
    spacious: "p-10 sm:p-16",
  }[marginPref] || "p-8 sm:p-12";

  const fontSizeClasses = {
    small: "text-[13px] leading-relaxed",
    normal: "text-[14px] leading-relaxed",
    large: "text-[15px] leading-relaxed",
  }[fontSize] || "text-[14px] leading-relaxed";

  return (
    <div className="flex flex-col h-full">
      <div className="no-print text-xs text-[#92928a] mb-2 px-1 flex items-center justify-between">
        <span>Live {paperLabel} Printable Preview</span>
        <span className="hidden sm:inline">Export downloads a PDF or use print dialog</span>
      </div>

      <style>{`
        @media print {
          @page {
            size: ${isLetter ? "8.5in 11in" : "210mm 297mm"} portrait;
            margin: ${isLetter ? "0.5in" : "12mm 15mm"};
          }
        }
      `}</style>

      <div className="flex-1 min-w-0 overflow-y-auto bg-[#f4f2ed] p-3 sm:p-6 rounded-xl flex justify-center items-start border border-[#e8e6df]">
        <div
          id="cv-paper"
          className={`cv-paper cv-print-target bg-white text-[#292a27] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e6e4dc] w-full ${
            isLetter ? "max-w-[8.5in]" : "max-w-[210mm]"
          } mx-auto transition-all ${marginClasses} ${fontSizeClasses}`}
          style={
            {
              "--accent-color": primaryColor,
              aspectRatio: isLetter ? "8.5 / 11" : "210 / 297",
              minHeight: isLetter ? "min(11in, 100%)" : "min(297mm, 100%)",
            } as React.CSSProperties
          }
        >
          <CvTemplateRenderer cv={cv} templateId={currentTemplate} primaryColor={primaryColor} />
        </div>
      </div>
    </div>
  );
}
