import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { getConfig } from "../server/contracts";
import { loadMasterCV, saveMasterCV } from "jobai-shared";
import type { AppConfig, TemplateMetadata } from "jobai-shared";

export const Route = createFileRoute("/templates")({
  loader: async (): Promise<AppConfig> => {
    return await getConfig();
  },
  component: TemplatesComponent,
});

export function TemplatesComponent() {
  const shouldReduceMotion = useReducedMotion();
  const config = Route.useLoaderData() as AppConfig;
  const navigate = useNavigate();

  const [activeTemplateId, setActiveTemplateId] = useState<string>("modern");

  useEffect(() => {
    const res = loadMasterCV();
    if (res.success && res.data?.stylePrefs?.templateId) {
      setActiveTemplateId(res.data.stylePrefs.templateId);
    }
  }, []);

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
    navigate({ to: "/", search: { template: templateId } });
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Print-Ready CV Templates</h1>
        <p className="text-slate-600 text-sm mt-1">
          Four standardized layouts engineered for crisp A4 printing and automated ATS screening. Choose a design to apply it to your CV.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(config.templates ?? []).map((tmpl: TemplateMetadata, idx: number) => {
          const isSelected = activeTemplateId === tmpl.id;

          return (
            <motion.div
              key={tmpl.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, delay: idx * 0.05 }}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              className={`bg-white rounded-xl shadow-xs border p-5 flex flex-col justify-between transition-all ${
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                {/* Visual Layout Thumbnail */}
                <div className="h-32 bg-slate-50 rounded-lg border border-slate-200 p-3 mb-4 flex flex-col justify-between overflow-hidden select-none">
                  {tmpl.id === "modern" && (
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-indigo-600 rounded-xs" />
                      <div className="h-1.5 w-24 bg-slate-300 rounded-xs" />
                      <div className="border-b border-slate-200 pt-1" />
                      <div className="space-y-1 pt-1">
                        <div className="h-2 w-12 bg-indigo-200 rounded-xs" />
                        <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-slate-200 rounded-xs" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "executive" && (
                    <div className="space-y-2 text-center flex flex-col items-center">
                      <div className="h-3 w-24 bg-slate-800 rounded-xs mx-auto" />
                      <div className="h-1.5 w-32 bg-slate-400 rounded-xs mx-auto" />
                      <div className="w-full border-b border-slate-400 pt-1" />
                      <div className="w-full space-y-1 pt-1">
                        <div className="h-2 w-16 bg-slate-400 rounded-xs mx-auto" />
                        <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
                        <div className="h-1.5 w-3/4 bg-slate-200 rounded-xs mx-auto" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "tech" && (
                    <div className="space-y-2">
                      <div className="bg-slate-900 p-1.5 rounded-xs flex items-center justify-between">
                        <div className="h-2 w-14 bg-emerald-400 rounded-xs" />
                        <div className="h-1.5 w-6 bg-slate-600 rounded-xs" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-16 bg-indigo-400 rounded-xs" />
                        <div className="flex gap-1">
                          <div className="h-2 w-8 bg-slate-200 rounded-xs" />
                          <div className="h-2 w-8 bg-slate-200 rounded-xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {tmpl.id === "compact" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-1">
                        <div className="h-2.5 w-16 bg-slate-800 rounded-xs" />
                        <div className="h-1.5 w-12 bg-slate-400 rounded-xs" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-1.5 w-10 bg-slate-400 rounded-xs" />
                        <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
                        <div className="h-1.5 w-full bg-slate-200 rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-slate-200 rounded-xs" />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono self-end">A4 Formatted</div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {isSelected ? "Edit with this template" : "Select template"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
