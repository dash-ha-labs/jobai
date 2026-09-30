import { createFileRoute } from "@tanstack/react-router";
import { ToolPageLayout, TOOLS } from "../../components/tools/ToolPageLayout";
import { PdfTextTool } from "../../components/tools/PdfTextTool";

export const Route = createFileRoute("/toolkit/pdf-text-preview")({
  component: PdfTextPreviewPage,
});

function PdfTextPreviewPage() {
  const tool = TOOLS.find((t) => t.slug === "pdf-text-preview")!;
  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        {
          title: "Parsed in your browser",
          body: "The PDF is parsed locally with a client-side library inside a Web Worker. The file never leaves this page — no upload, no storage, no network.",
        },
        {
          title: "Text layer extraction",
          body: "Each page's embedded text layer is read and reassembled into selectable, copyable plain text with a page count, so you can see what parsers actually receive.",
        },
        {
          title: "Bounded and cancellable",
          body: "Extraction is limited to 5 MiB and 20 pages and stops hard after 15 seconds or when you press Cancel — nothing keeps running in the background.",
        },
      ]}
      footnote={
        <p className="text-xs text-[#8b939f] leading-relaxed">
          No OCR — works with text-based PDFs only. Scanned documents won't extract text.
        </p>
      }
    >
      <div className="max-w-2xl">
        <PdfTextTool />
      </div>
    </ToolPageLayout>
  );
}
