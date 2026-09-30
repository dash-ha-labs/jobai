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
          <span className="rounded-full bg-[var(--ui-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ui-accent)] border border-[var(--ui-accent-line)]">
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
              className={`rounded-2xl border bg-[#ffffff] p-5 flex flex-col justify-between transition ${
                isSelected
                  ? "border-[var(--ui-accent)] ring-1 ring-[var(--ui-accent)]/40 shadow-xs"
                  : "border-[#e3e6eb] hover:border-[var(--ui-accent-line)]"
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
                  <div className="h-48 bg-[#f7f8fa] rounded-xl border border-[#e3e6eb] p-4 mb-4 flex flex-col justify-between overflow-hidden select-none shadow-2xs group-hover:border-[var(--ui-accent)]/60 transition">
                    <TemplateThumbnail layout={layout} templateId={tmpl.id} />
                    <div className="flex items-center justify-between text-[10px] text-[#8b939f] font-mono mt-1 pt-1 border-t border-[#e3e6eb]">
                      <span>{meta?.category ?? "General"}</span>
                      <span className="text-[var(--ui-accent)] group-hover:underline">Click to preview →</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-[#191b20] text-base font-heading">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="text-xs font-medium text-[var(--ui-accent)]">
                      Active
                    </span>
                  )}
                </div>

                {/* Persona Callout line (ensures SSR of persona names) */}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#636c7a]">
                  <span className="font-semibold text-[#191b20] shrink-0">Sample:</span>
                  <span className="font-medium text-[var(--ui-accent)] truncate">{sample.personName}</span>
                  <span className="text-[#8b939f] shrink-0">•</span>
                  <span className="truncate text-[11px] text-[#8b939f]">{sample.personRole}</span>
                </div>

                <p className="text-xs text-[#636c7a] mt-2 leading-relaxed">{tmpl.description}</p>
              </div>

              {/* Action Buttons: Split Preview and Apply */}
              <div className="mt-5 pt-3.5 border-t border-[#e3e6eb] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplateId(tmpl.id)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-[#e3e6eb] bg-[#f1f3f6] hover:bg-[#e3e6eb] text-[#191b20] transition cursor-pointer text-center"
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                    isSelected
                      ? "bg-[#191b20] hover:bg-[#3f4753] text-white shadow-xs"
                      : "bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-white shadow-2xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#191b20]/60 backdrop-blur-xs no-print"
          onClick={() => setPreviewModalTemplateId(null)}
        >
          <div
            className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e6eb] p-4 sm:p-5 bg-white">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 id="preview-modal-title" className="text-base sm:text-lg font-bold text-[#191b20] font-heading">
                    {activePreviewSample.templateName}
                  </h2>
                  <span className="rounded-full bg-[var(--ui-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--ui-accent)]">
                    {activePreviewSample.templateDesc}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#636c7a] mt-1">
                  <span className="font-semibold text-[#191b20]">Sample profile:</span>
                  <span className="text-[var(--ui-accent)] font-medium">{activePreviewSample.personName}</span>
                  <span className="text-[#8b939f]">•</span>
                  <span>{activePreviewSample.personRole}</span>
                  <span className="text-[#8b939f] hidden sm:inline">•</span>
                  <span className="text-[11px] text-[#8b939f] hidden sm:inline">(fictional sample for preview)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(activePreviewSample.templateId)}
                  className="rounded-lg bg-[#191b20] px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-[#3f4753] transition cursor-pointer"
                >
                  Use this template in editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalTemplateId(null)}
                  className="text-[#636c7a] hover:text-[#191b20] text-2xl leading-none px-2 py-1 cursor-pointer rounded-lg hover:bg-[#f1f3f6]"
                  aria-label="Close preview modal"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Privacy notice callout */}
            <div className="bg-[#f7f8fa] border-b border-[#e3e6eb] px-4 sm:px-6 py-2 text-xs text-[#636c7a] flex items-center justify-between">
              <span>
                <strong>Sample data only:</strong> Applying this layout transfers only the template preference to your editor. Your saved master CV content remains strictly separate and is never modified.
              </span>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#f1f3f6]">
              <div className="max-w-3xl mx-auto">
                <CvPrintPreview cv={activePreviewSample.cv} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#e3e6eb] p-4 bg-white">
              <button
                type="button"
                onClick={() => setPreviewModalTemplateId(null)}
                className="rounded-lg border border-[#e3e6eb] bg-[#f1f3f6] hover:bg-[#e3e6eb] text-[#191b20] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Close preview
              </button>

              <button
                type="button"
                onClick={() => handleSelectTemplate(activePreviewSample.templateId)}
                className="rounded-lg bg-[var(--ui-accent)] hover:bg-[var(--ui-accent-hover)] text-white px-5 py-2 text-xs font-medium shadow-2xs cursor-pointer"
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
