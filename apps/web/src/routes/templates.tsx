import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { getConfig } from "../server/contracts";
import { loadMasterCV, saveMasterCV, getCvTemplateById } from "jobai-shared";
import type { AppConfig, TemplateMetadata } from "jobai-shared";
import { TemplateThumbnail } from "../lib/cv-templates/thumbnail";
import { getSampleCv } from "../content/sample-cvs";
import { CvPrintPreview } from "../components/CvPrintPreview";
import { PageLayout } from "../components/PageLayout";

export const Route = createFileRoute("/templates")({
  loader: async (): Promise<AppConfig> => {
    return await getConfig();
  },
  component: TemplatesComponent,
});

export function TemplatesComponent({ config: propConfig }: { config?: AppConfig } = {}) {
  const shouldReduceMotion = useReducedMotion();
  let config = propConfig;
  if (!config) {
    try {
      config = Route.useLoaderData() as AppConfig;
    } catch {
      // route context mismatch fallback
    }
  }
  const navigate = useNavigate();

  const [activeTemplateId, setActiveTemplateId] = useState<string>("modern");
  const [previewModalTemplateId, setPreviewModalTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const res = loadMasterCV();
    if (res.success && res.data?.stylePrefs?.templateId) {
      setActiveTemplateId(res.data.stylePrefs.templateId);
    }
  }, []);

  // Keyboard accessibility for modal dialog
  useEffect(() => {
    if (!previewModalTemplateId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewModalTemplateId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalTemplateId]);

  const handleSelectTemplate = (templateId: string) => {
    const res = loadMasterCV();
    if (res.success && res.data) {
      const updated = {
        ...res.data,
        stylePrefs: {
          ...res.data.stylePrefs,
          templateId,
        },
      };
      saveMasterCV(updated);
    }
    setPreviewModalTemplateId(null);
    navigate({ to: "/app/editor", search: { template: templateId } });
  };

  const templateCount = config?.templates?.length ?? 0;
  const activePreviewSample = previewModalTemplateId ? getSampleCv(previewModalTemplateId) : null;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      <PageLayout
        variant="fixed"
        title="Print-Ready CV Templates"
        titleAddon={
          <span className="rounded-full bg-[#e8e0f3] px-2.5 py-0.5 text-xs font-medium text-[#625181] border border-[#ddd3e9]">
            {templateCount} layouts
          </span>
        }
        description="Professional layouts across corporate, creative, academic, and technical styles. Preview realistic persona data, then apply the layout to your own CV in the editor."
        className="space-y-6"
      >
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(config?.templates ?? []).map((tmpl: TemplateMetadata, idx: number) => {
          const isSelected = activeTemplateId === tmpl.id;
          const meta = getCvTemplateById(tmpl.id);
          const layout = meta?.layout ?? "modern";
          const sample = getSampleCv(tmpl.id);

          return (
            <motion.div
              key={tmpl.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              className={`rounded-2xl border bg-[#fffefa] p-5 flex flex-col justify-between transition ${
                isSelected
                  ? "border-[#9782d8] ring-1 ring-[#9782d8]/40 shadow-xs"
                  : "border-[#e8e7e2] hover:border-[#c9bcd9]"
              }`}
            >
              <div>
                {/* Clickable thumbnail area opens preview */}
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplateId(tmpl.id)}
                  className="w-full text-left cursor-pointer group"
                  aria-label={`Preview full document for ${tmpl.name}`}
                >
                  <div className="h-48 bg-[#faf9f6] rounded-xl border border-[#e8e7e2] p-4 mb-4 flex flex-col justify-between overflow-hidden select-none shadow-2xs group-hover:border-[#9782d8]/60 transition">
                    <TemplateThumbnail layout={layout} templateId={tmpl.id} />
                    <div className="flex items-center justify-between text-[10px] text-[#a2a096] font-mono mt-1 pt-1 border-t border-[#ecebe5]">
                      <span>{meta?.category ?? "General"}</span>
                      <span className="text-[#625181] group-hover:underline">Click to preview →</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-[#292a27] text-base font-heading">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="text-xs font-medium text-[#79628f]">
                      Active
                    </span>
                  )}
                </div>

                {/* Persona Callout line (ensures SSR of persona names) */}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#73736b]">
                  <span className="font-semibold text-[#292a27] shrink-0">Sample:</span>
                  <span className="font-medium text-[#625181] truncate">{sample.personName}</span>
                  <span className="text-[#a8a79f] shrink-0">•</span>
                  <span className="truncate text-[11px] text-[#8c8c83]">{sample.personRole}</span>
                </div>

                <p className="text-xs text-[#73736b] mt-2 leading-relaxed">{tmpl.description}</p>
              </div>

              {/* Action Buttons: Split Preview and Apply */}
              <div className="mt-5 pt-3.5 border-t border-[#e8e7e2] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplateId(tmpl.id)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27] transition cursor-pointer text-center"
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                    isSelected
                      ? "bg-[#30332d] hover:bg-[#4a4e43] text-white shadow-xs"
                      : "bg-[#625181] hover:bg-[#52436d] text-white shadow-2xs"
                  }`}
                >
                  {isSelected ? "Open in Editor" : "Apply"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full Document Preview Modal */}
      {activePreviewSample && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#292a27]/60 backdrop-blur-xs no-print"
          onClick={() => setPreviewModalTemplateId(null)}
        >
          <div
            className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e7e2] p-4 sm:p-5 bg-white">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 id="preview-modal-title" className="text-base sm:text-lg font-bold text-[#292a27] font-heading">
                    {activePreviewSample.templateName}
                  </h2>
                  <span className="rounded-full bg-[#e8e0f3] px-2 py-0.5 text-[11px] font-medium text-[#625181]">
                    {activePreviewSample.templateDesc}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#73736b] mt-1">
                  <span className="font-semibold text-[#292a27]">Sample profile:</span>
                  <span className="text-[#625181] font-medium">{activePreviewSample.personName}</span>
                  <span className="text-[#a8a79f]">•</span>
                  <span>{activePreviewSample.personRole}</span>
                  <span className="text-[#a8a79f] hidden sm:inline">•</span>
                  <span className="text-[11px] text-[#93938a] hidden sm:inline">(fictional sample for preview)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(activePreviewSample.templateId)}
                  className="rounded-lg bg-[#292a27] px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-[#41423c] transition cursor-pointer"
                >
                  Use this template in editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplateId(null)}
                  className="text-[#73736b] hover:text-[#292a27] text-2xl leading-none px-2 py-1 cursor-pointer rounded-lg hover:bg-[#f5f4f0]"
                  aria-label="Close preview modal"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Privacy notice callout */}
            <div className="bg-[#faf9f6] border-b border-[#ecebe5] px-4 sm:px-6 py-2 text-xs text-[#73736b] flex items-center justify-between">
              <span>
                <strong>Sample data only:</strong> Applying this layout transfers only the template preference to your editor. Your saved master CV content remains strictly separate and is never modified.
              </span>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#f4f2ed]">
              <div className="max-w-3xl mx-auto">
                <CvPrintPreview cv={activePreviewSample.cv} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#e8e7e2] p-4 bg-white">
              <button
                type="button"
                onClick={() => setPreviewModalTemplateId(null)}
                className="rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Close preview
              </button>

              <button
                type="button"
                onClick={() => handleSelectTemplate(activePreviewSample.templateId)}
                className="rounded-lg bg-[#625181] hover:bg-[#52436d] text-white px-5 py-2 text-xs font-medium shadow-2xs cursor-pointer"
              >
                Use {activePreviewSample.templateName}
              </button>
            </div>
          </div>
        </div>
      )}
      </PageLayout>
    </motion.div>
  );
}
