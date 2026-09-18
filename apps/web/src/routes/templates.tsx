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
              className={`rounded-2xl border bg-[#fffefa] p-5 flex flex-col justify-between transition shadow-2xs ${
                isSelected
                  ? "border-[#9782d8] ring-2 ring-[#9782d8]/20"
                  : "border-[#e8e7e2] hover:border-[#c9bcd9]"
              }`}
            >
              <div>
                {/* Visual Layout Thumbnail */}
                <div className="h-36 bg-[#fcfbf9] rounded-xl border border-[#e8e7e2] p-3.5 mb-4 flex flex-col justify-between overflow-hidden select-none shadow-2xs">
                  {tmpl.id === "modern" && (
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-[#30332d] rounded-xs" />
                      <div className="h-1.5 w-28 bg-[#92928a] rounded-xs" />
                      <div className="border-b border-[#e8e7e2] pt-1" />
                      <div className="space-y-1.5 pt-1">
                        <div className="h-2 w-14 bg-[#9782d8] rounded-xs" />
                        <div className="h-1.5 w-full bg-[#e8e7e2] rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-[#e8e7e2] rounded-xs" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "executive" && (
                    <div className="space-y-2 text-center flex flex-col items-center">
                      <div className="h-3 w-24 bg-[#30332d] rounded-xs mx-auto" />
                      <div className="h-1.5 w-32 bg-[#92928a] rounded-xs mx-auto" />
                      <div className="w-full border-b border-[#30332d]/40 pt-1" />
                      <div className="w-full space-y-1.5 pt-1">
                        <div className="h-2 w-16 bg-[#73736b] rounded-xs mx-auto" />
                        <div className="h-1.5 w-full bg-[#e8e7e2] rounded-xs" />
                        <div className="h-1.5 w-3/4 bg-[#e8e7e2] rounded-xs mx-auto" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "tech" && (
                    <div className="space-y-2">
                      <div className="bg-[#292a27] p-2 rounded-md flex items-center justify-between">
                        <div className="h-2 w-16 bg-[#9782d8] rounded-xs" />
                        <div className="h-1.5 w-8 bg-[#858174] rounded-xs" />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="h-2 w-14 bg-[#625181] rounded-xs" />
                        <div className="flex gap-1.5">
                          <div className="h-2 w-10 bg-[#e8e7e2] rounded-xs" />
                          <div className="h-2 w-10 bg-[#e8e7e2] rounded-xs" />
                        </div>
                      </div>
                    </div>
                  )}

                  {tmpl.id === "compact" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center border-b border-[#e8e7e2] pb-1">
                        <div className="h-2.5 w-18 bg-[#30332d] rounded-xs" />
                        <div className="h-1.5 w-12 bg-[#92928a] rounded-xs" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-12 bg-[#73736b] rounded-xs" />
                        <div className="h-1.5 w-full bg-[#e8e7e2] rounded-xs" />
                        <div className="h-1.5 w-full bg-[#e8e7e2] rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-[#e8e7e2] rounded-xs" />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-[#92928a] font-mono self-end">A4 Standard</div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[#292a27] text-base font-heading">{tmpl.name}</h3>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-[#625181] bg-[#e8e0f3] border border-[#ddd3e9] px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#73736b] mt-2 leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e8e7e2]">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-[#30332d] hover:bg-[#4a4e43] text-white shadow-xs"
                      : "border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27]"
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
