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
    navigate({ to: "/", search: { template: templateId, view: "editor" } });
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="border-b border-[#e8e7e2] pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-[#292a27] font-heading">
            Print-Ready CV Templates
          </h1>
          <span className="rounded-full bg-[#e8e0f3] px-2.5 py-0.5 text-xs font-medium text-[#625181] border border-[#ddd3e9]">
            A4 Print-Ready
          </span>
        </div>
        <p className="mt-1 text-xs text-[#73736b]">
          Four standardized layouts engineered for crisp printing, PDF export, and ATS readability. Select a layout to apply it to your CV.
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
              className={`rounded-2xl border bg-[#fffefa] p-5 flex flex-col justify-between transition ${
                isSelected
                  ? "border-[#9782d8] ring-1 ring-[#9782d8]/40 shadow-xs"
                  : "border-[#e8e7e2] hover:border-[#c9bcd9]"
              }`}
            >
              <div>
                {/* Big Truthful Paper Preview */}
                <div className="h-48 bg-[#faf9f6] rounded-xl border border-[#e8e7e2] p-4 mb-4 flex flex-col justify-between overflow-hidden select-none shadow-2xs">
                  {tmpl.id === "modern" && (
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <div className="h-2.5 w-24 bg-[#292a27] rounded-xs" />
                        <div className="h-1.5 w-32 bg-[#92928a] rounded-xs" />
                      </div>
                      <div className="border-b border-[#9782d8]/60 pt-0.5" />
                      <div className="space-y-2 pt-1">
                        <div className="space-y-1">
                          <div className="h-1.5 w-16 bg-[#625181] rounded-xs" />
                          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-14 bg-[#625181] rounded-xs" />
                          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                          <div className="h-1 w-3/4 bg-[#e8e7e0] rounded-xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {tmpl.id === "executive" && (
                    <div className="space-y-2.5 text-center flex flex-col items-center">
                      <div className="space-y-1">
                        <div className="h-2.5 w-28 bg-[#292a27] rounded-xs mx-auto" />
                        <div className="h-1.5 w-36 bg-[#92928a] rounded-xs mx-auto" />
                      </div>
                      <div className="w-full border-b border-[#292a27]/30 pt-0.5" />
                      <div className="w-full space-y-2 pt-1">
                        <div className="space-y-1">
                          <div className="h-1.5 w-20 bg-[#73736b] rounded-xs mx-auto" />
                          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs mx-auto" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-16 bg-[#73736b] rounded-xs mx-auto" />
                          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                          <div className="h-1 w-2/3 bg-[#e8e7e0] rounded-xs mx-auto" />
                        </div>
                      </div>
                    </div>
                  )}

                  {tmpl.id === "tech" && (
                    <div className="space-y-2.5">
                      <div className="bg-[#292a27] px-2.5 py-2 rounded-md flex items-center justify-between">
                        <div className="h-2 w-20 bg-[#9782d8] rounded-xs" />
                        <div className="h-1.5 w-10 bg-[#858174] rounded-xs" />
                      </div>
                      <div className="space-y-2 pt-0.5">
                        <div className="space-y-1">
                          <div className="h-1.5 w-16 bg-[#625181] rounded-xs" />
                          <div className="flex gap-1.5">
                            <div className="h-2 w-12 bg-[#e8e0f3] rounded-xs" />
                            <div className="h-2 w-10 bg-[#e8e0f3] rounded-xs" />
                            <div className="h-2 w-8 bg-[#e8e0f3] rounded-xs" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-14 bg-[#625181] rounded-xs" />
                          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {tmpl.id === "compact" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b border-[#e8e7e2] pb-1.5">
                        <div className="h-2.5 w-20 bg-[#292a27] rounded-xs" />
                        <div className="h-1.5 w-16 bg-[#92928a] rounded-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-14 bg-[#73736b] rounded-xs" />
                        <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                        <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                        <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
                      </div>
                      <div className="space-y-1.5 pt-0.5">
                        <div className="h-1.5 w-12 bg-[#73736b] rounded-xs" />
                        <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
                        <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-[#a2a096] font-mono self-end">A4 Standard</div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-[#292a27] text-base font-heading">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="text-xs font-medium text-[#79628f]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#73736b] mt-1.5 leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#e8e7e2]">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-[#30332d] hover:bg-[#4a4e43] text-white shadow-xs"
                      : "border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27]"
                  }`}
                >
                  {isSelected ? "Open in Document Studio" : "Apply template"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
