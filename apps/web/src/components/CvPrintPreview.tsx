import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import type { CV } from "jobai-shared";
import { CvTemplateRenderer } from "../lib/cv-templates/renderer";

/**
 * Unified print preview: fixed physical paper (A4 210x297mm / Letter 8.5x11in),
 * uniformly scaled to the available width via CSS transform. Layout (wrapping,
 * font sizes, margins) never reflows with the viewport — only the scale changes.
 */
const PAPER_SIZES = {
  A4: {
    label: "A4 (210 × 297 mm)",
    w: "210mm",
    h: "297mm",
    wPx: (210 * 96) / 25.4,
    hPx: (297 * 96) / 25.4,
  },
  Letter: { label: "Letter (8.5 × 11 in)", w: "8.5in", h: "11in", wPx: 8.5 * 96, hPx: 11 * 96 },
} as const;

const MARGIN_CLASSES: Record<string, string> = {
  compact: "p-6 sm:p-8",
  normal: "p-8 sm:p-12",
  spacious: "p-10 sm:p-16",
};

const FONT_SIZE_CLASSES: Record<string, string> = {
  small: "text-[13px] leading-relaxed",
  normal: "text-[14px] leading-relaxed",
  large: "text-[15px] leading-relaxed",
};

interface CvPrintPreviewProps {
  cv: CV;
}

export function CvPrintPreview({ cv }: CvPrintPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(0);

  const paper = cv.stylePrefs?.paperSize === "Letter" ? PAPER_SIZES.Letter : PAPER_SIZES.A4;
  const templateId = cv.stylePrefs?.templateId || "modern";
  const fontSize = FONT_SIZE_CLASSES[cv.stylePrefs?.fontSize || "normal"] ?? FONT_SIZE_CLASSES.normal;
  const marginClasses = MARGIN_CLASSES[cv.stylePrefs?.margin || "normal"] ?? MARGIN_CLASSES.normal;
  const primaryColor = cv.stylePrefs?.primaryColor || "#4f46e5";

  useEffect(() => {
    const frame = frameRef.current;
    const paperEl = paperRef.current;
    if (!frame || !paperEl || typeof ResizeObserver === "undefined") return;

    const update = () => {
      setScale(frame.clientWidth / paper.wPx);
      // offsetHeight is layout height: unaffected by the scale transform.
      setPaperHeight(paperEl.offsetHeight);
    };
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    ro.observe(paperEl);
    update();
    return () => ro.disconnect();
  }, [paper.wPx]);

  return (
    <div className="flex flex-col h-full">
      <div className="no-print text-xs text-[#92928a] mb-2 px-1 flex items-center justify-between">
        <span>Live {paper.label} Printable Preview</span>
        <span className="hidden sm:inline">Export downloads a PDF or use print dialog</span>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto bg-[#f4f2ed] p-3 sm:p-6 rounded-xl flex justify-center items-start border border-[#e8e6df]">
        {/* Scaled frame: reserves exactly the scaled paper size so scroll bounds are correct */}
        <div
          ref={frameRef}
          className="relative w-full"
          style={
            paperHeight
              ? { height: paperHeight * scale }
              : { aspectRatio: `${paper.wPx} / ${paper.hPx}` }
          }
        >
          <div
            id="cv-paper"
            ref={paperRef}
            className={`cv-paper cv-print-target bg-white text-[#292a27] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e6e4dc] absolute top-0 left-0 ${marginClasses} ${fontSize}`}
            style={
              {
                "--accent-color": primaryColor,
                width: paper.w,
                minHeight: paper.h,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              } as React.CSSProperties
            }
          >
            <CvTemplateRenderer cv={cv} templateId={templateId} primaryColor={primaryColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
