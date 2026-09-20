/**
 * Client-side PDF export from the live #cv-paper DOM (WYSIWYG with all template layouts).
 */

export type CvPdfPaperSize = "A4" | "Letter";

/** html2pdf pagebreak: css + legacy; avoid splitting items, headers, skill groups. */
export const CV_PDF_PAGEBREAK = {
  mode: ["css", "legacy"],
  avoid: [".cv-item", ".cv-skill-group", ".cv-section h2", ".cv-section .grid > div"],
};

const PAPER_CSS_WIDTH: Record<CvPdfPaperSize, string> = {
  A4: "210mm",
  Letter: "8.5in",
};

export function resolveCvPdfFilename(filename: string): string {
  const stem = String(filename ?? "")
    .replace(/\.pdf$/i, "")
    .trim();
  const normalized = stem
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || /^cv$/i.test(normalized) || /^my-cv$/i.test(normalized)) {
    return "My-CV.pdf";
  }
  if (/-cv$/i.test(normalized)) {
    return `${normalized.replace(/-cv$/i, "-CV")}.pdf`;
  }
  return `${normalized}-CV.pdf`;
}

export function resolveCvPrintTarget(root: HTMLElement): HTMLElement {
  if (root.id === "cv-paper" || root.classList.contains("cv-print-target")) {
    return root;
  }
  const nested = root.querySelector("#cv-paper, .cv-print-target");
  return nested instanceof HTMLElement ? nested : root;
}

function applyPaperCaptureStyles(paper: HTMLElement, paperSize: CvPdfPaperSize): void {
  paper.style.aspectRatio = "auto";
  paper.style.minHeight = "auto";
  paper.style.height = "auto";
  paper.style.overflow = "visible";
  paper.style.backgroundColor = "#ffffff";
  paper.style.color = "#292a27";
  paper.style.boxShadow = "none";
  paper.style.width = PAPER_CSS_WIDTH[paperSize];
  paper.style.maxWidth = PAPER_CSS_WIDTH[paperSize];
  /* CvPrintPreview scales paper via transform for on-screen fit; capture at 1:1. */
  paper.style.transform = "none";
  paper.style.position = "static";
  paper.setAttribute("data-pdf-paper", paperSize);
  paper.classList.add("cv-print-target");
}

export function prepareCvPaperForCapture(element: HTMLElement, paperSize: CvPdfPaperSize): () => void {
  const paper = resolveCvPrintTarget(element);
  const previous = {
    aspectRatio: paper.style.aspectRatio,
    minHeight: paper.style.minHeight,
    height: paper.style.height,
    overflow: paper.style.overflow,
    backgroundColor: paper.style.backgroundColor,
    color: paper.style.color,
    boxShadow: paper.style.boxShadow,
    width: paper.style.width,
    maxWidth: paper.style.maxWidth,
    transform: paper.style.transform,
    position: paper.style.position,
    paperAttr: paper.getAttribute("data-pdf-paper"),
    hadPrintClass: paper.classList.contains("cv-print-target"),
  };

  applyPaperCaptureStyles(paper, paperSize);

  return () => {
    paper.style.aspectRatio = previous.aspectRatio;
    paper.style.minHeight = previous.minHeight;
    paper.style.height = previous.height;
    paper.style.overflow = previous.overflow;
    paper.style.backgroundColor = previous.backgroundColor;
    paper.style.color = previous.color;
    paper.style.boxShadow = previous.boxShadow;
    paper.style.width = previous.width;
    paper.style.maxWidth = previous.maxWidth;
    paper.style.transform = previous.transform;
    paper.style.position = previous.position;
    if (previous.paperAttr == null) paper.removeAttribute("data-pdf-paper");
    else paper.setAttribute("data-pdf-paper", previous.paperAttr);
    if (!previous.hadPrintClass) paper.classList.remove("cv-print-target");
  };
}

export function buildCvPdfExportOptions(filename: string, paperSize: CvPdfPaperSize = "A4") {
  const format = paperSize === "Letter" ? "letter" : "a4";
  const resolvedName = resolveCvPdfFilename(filename);
  const pagebreak = CV_PDF_PAGEBREAK;

  return {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: resolvedName,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone(clonedDoc: Document) {
        const cloned =
          clonedDoc.getElementById("cv-paper") || clonedDoc.querySelector(".cv-print-target");
        if (!cloned) return;
        const Ctor = clonedDoc.defaultView?.HTMLElement ?? HTMLElement;
        if (cloned instanceof Ctor) {
          applyPaperCaptureStyles(cloned, paperSize);
        }
      },
    },
    jsPDF: { unit: "mm", format, orientation: "portrait" as const },
    pagebreak,
  };
}

export async function exportCvPaperToPdf(
  element: HTMLElement,
  filename: string,
  paperSize: CvPdfPaperSize = "A4",
): Promise<void> {
  const paper = resolveCvPrintTarget(element);
  const restore = prepareCvPaperForCapture(paper, paperSize);
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf().set(buildCvPdfExportOptions(filename, paperSize)).from(paper).save();
  } finally {
    restore();
  }
}
