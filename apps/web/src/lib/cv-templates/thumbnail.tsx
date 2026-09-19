import type { CvTemplateLayout } from "jobai-shared";
import { FICTIONAL_SAMPLES } from "../../content/sample-cvs";

export interface TemplateThumbnailProps {
  layout?: CvTemplateLayout;
  templateId?: string;
  accent?: string;
}

export function TemplateThumbnail({ layout, templateId, accent }: TemplateThumbnailProps) {
  const sample = templateId ? FICTIONAL_SAMPLES[templateId] : undefined;
  const effectiveAccent = accent || sample?.accentColor || "#625181";
  const effectiveLayout = layout || "modern";
  const name = sample?.personName;
  const role = sample?.personRole;

  switch (effectiveLayout) {
    case "executive":
      return (
        <div className="space-y-1.5 text-center flex flex-col items-center w-full h-full justify-center">
          {name ? (
            <div className="text-[10px] font-serif font-bold text-[#292a27] tracking-tight truncate max-w-full">
              {name}
            </div>
          ) : (
            <div className="h-2.5 w-28 bg-[#292a27] rounded-xs mx-auto" />
          )}
          {role && (
            <div className="text-[7px] text-[#73736b] uppercase tracking-widest truncate max-w-[90%]">
              {role}
            </div>
          )}
          <div className="w-full border-b border-[#292a27]/30" />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs mx-auto" />
          <div className="h-1 w-3/4 bg-[#e8e7e0] rounded-xs mx-auto" />
        </div>
      );

    case "tech":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div
            className="px-2 py-1 rounded-md text-white flex items-center justify-between"
            style={{ backgroundColor: "#1e293b" }}
          >
            <span className="font-mono text-[9px] font-semibold truncate max-w-[80%]">
              {name || "$ turing --init"}
            </span>
            <span className="text-[7px] font-mono" style={{ color: effectiveAccent }}>
              [sys]
            </span>
          </div>
          <div className="flex gap-1 items-center">
            <span
              className="text-[6.5px] font-mono px-1 py-0.5 rounded-xs"
              style={{ backgroundColor: `${effectiveAccent}20`, color: effectiveAccent }}
            >
              KERNEL
            </span>
            <div className="h-1 w-12 bg-[#e8e7e0] rounded-xs" />
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "compact":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="flex justify-between items-baseline border-b border-[#e8e7e2] pb-0.5">
            <div className="text-[9.5px] font-bold text-[#292a27] tracking-tight truncate max-w-[65%]">
              {name || "Compact"}
            </div>
            <div className="text-[7px] text-[#73736b] truncate max-w-[30%]">
              {role ? role.split(" ")[0] : "1-Page"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          </div>
        </div>
      );

    case "sidebar-left":
      return (
        <div className="flex gap-2 w-full h-full items-stretch">
          <div
            className="w-1/3 rounded-md p-1.5 flex flex-col justify-between"
            style={{ backgroundColor: `${effectiveAccent}22`, borderRight: `1px solid ${effectiveAccent}44` }}
          >
            <div className="text-[8px] font-bold truncate" style={{ color: effectiveAccent }}>
              {name ? name.split(" ")[0] : "Panel"}
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded-xs" style={{ backgroundColor: `${effectiveAccent}44` }} />
              <div className="h-1 w-2/3 rounded-xs" style={{ backgroundColor: `${effectiveAccent}44` }} />
            </div>
          </div>
          <div className="flex-1 space-y-1.5 flex flex-col justify-center">
            {name && (
              <div className="text-[9px] font-semibold text-[#292a27] truncate">
                {name}
              </div>
            )}
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          </div>
        </div>
      );

    case "sidebar-right":
      return (
        <div className="flex gap-2 w-full h-full items-stretch">
          <div className="flex-1 space-y-1.5 flex flex-col justify-center">
            <div className="text-[9.5px] font-bold text-[#292a27] truncate">
              {name || "Designer"}
            </div>
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
          </div>
          <div
            className="w-1/3 rounded-md p-1.5 flex flex-col justify-between"
            style={{ backgroundColor: `${effectiveAccent}18`, borderLeft: `1px solid ${effectiveAccent}33` }}
          >
            <div className="text-[7.5px] font-medium text-[#73736b] truncate">
              Skills
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded-xs" style={{ backgroundColor: `${effectiveAccent}44` }} />
              <div className="h-1 w-3/4 rounded-xs" style={{ backgroundColor: `${effectiveAccent}44` }} />
            </div>
          </div>
        </div>
      );

    case "bold":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="text-[11px] font-black uppercase tracking-tight text-[#292a27] truncate">
            {name || "BOLD IMPACT"}
          </div>
          <div className="h-1 w-12 rounded-xs" style={{ backgroundColor: effectiveAccent }} />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "banner":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div
            className="rounded-md px-2 py-1 text-white flex items-center justify-between"
            style={{ backgroundColor: effectiveAccent }}
          >
            <span className="text-[9px] font-semibold truncate">{name || "Corporate"}</span>
            <span className="text-[7px] opacity-80">EST.</span>
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "creative":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-1.5 rounded-xs" style={{ backgroundColor: effectiveAccent }} />
            <div>
              <div className="text-[10px] font-extrabold text-[#292a27] truncate leading-tight">
                {name || "Creative"}
              </div>
              <div className="text-[7px] text-[#73736b] truncate leading-tight">
                {role || "Studio Master"}
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-3/4 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "timeline":
      return (
        <div className="flex gap-2 w-full h-full items-center">
          <div className="flex flex-col items-center h-full justify-around py-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: effectiveAccent }} />
            <div className="w-0.5 flex-1" style={{ backgroundColor: `${effectiveAccent}44` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: effectiveAccent }} />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="text-[9px] font-semibold text-[#292a27] truncate">
              {name || "Career Timeline"}
            </div>
            <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
          </div>
        </div>
      );

    case "twocol":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="text-[9.5px] font-bold text-[#292a27] truncate text-center">
            {name || "Two Columns"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
              <div className="h-1 w-3/4 bg-[#e8e7e0] rounded-xs" />
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
              <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
            </div>
          </div>
        </div>
      );

    case "academic":
      return (
        <div className="space-y-1.5 text-center flex flex-col items-center w-full h-full justify-center">
          <div className="text-[10px] font-serif font-bold text-[#292a27] tracking-tight truncate max-w-full">
            {name || "Curriculum Vitae"}
          </div>
          <div className="text-[7px] font-serif italic text-[#73736b] truncate max-w-[90%]">
            {role || "Scholar & Researcher"}
          </div>
          <div className="w-12 border-b border-[#292a27]/30" />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "minimal":
      return (
        <div className="space-y-2 w-full h-full flex flex-col justify-center">
          <div className="text-[10px] font-light tracking-wide text-[#292a27] truncate">
            {name || "Minimal"}
          </div>
          <div className="h-0.5 w-6 bg-[#92928a] rounded-xs" />
          <div className="h-1 w-full bg-[#f0eee6] rounded-xs" />
          <div className="h-1 w-3/4 bg-[#f0eee6] rounded-xs" />
        </div>
      );

    case "elegant":
      return (
        <div className="space-y-1.5 text-center flex flex-col items-center w-full h-full justify-center">
          <div className="text-[10px] font-serif text-[#292a27] tracking-wider truncate max-w-full">
            {name || "Ada Lovelace"}
          </div>
          <div className="w-8 border-b" style={{ borderColor: effectiveAccent }} />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs mx-auto" />
        </div>
      );

    case "startup":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="text-[9.5px] font-bold text-[#292a27] truncate">
              {name || "Steve Jobs"}
            </div>
            <span
              className="text-[6px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${effectiveAccent}20`, color: effectiveAccent }}
            >
              Seed
            </span>
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "legal":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="border-b border-[#292a27] pb-0.5">
            <div className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#292a27] truncate">
              {name || "Ruth Bader Ginsburg"}
            </div>
            <div className="text-[6.5px] text-[#73736b] uppercase">Jurisprudence</div>
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "clinical":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="flex items-center gap-1.5 border-b border-[#e8e7e2] pb-1">
            <div
              className="w-3 h-3 rounded-xs flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ backgroundColor: effectiveAccent }}
            >
              +
            </div>
            <div className="text-[9px] font-bold text-[#292a27] truncate">
              {name || "Jonas Salk"}
            </div>
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-4/5 bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "portfolio":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="text-[9.5px] font-bold text-[#292a27] truncate">
            {name || "Zaha Hadid"}
          </div>
          <div
            className="p-1 rounded-md text-[7px] font-medium"
            style={{ backgroundColor: `${effectiveAccent}15`, color: effectiveAccent }}
          >
            ★ Featured Masterwork
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "classic":
      return (
        <div className="space-y-1.5 text-center flex flex-col items-center w-full h-full justify-center border border-[#292a27]/20 p-1 rounded-xs">
          <div className="text-[9.5px] font-serif font-bold text-[#292a27] truncate max-w-full">
            {name || "Alexander Graham Bell"}
          </div>
          <div className="w-full border-t border-b border-[#292a27]/20 py-0.5">
            <div className="h-0.5 w-full bg-[#292a27]/40" />
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "international":
      return (
        <div className="space-y-1.5 w-full h-full flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="text-[9.5px] font-bold text-[#292a27] truncate">
              {name || "Sundar Pichai"}
            </div>
            <span className="text-[7.5px]" style={{ color: effectiveAccent }}>
              🌐 Global
            </span>
          </div>
          <div className="flex gap-1">
            <div className="h-1 w-1/3 bg-[#e8e7e0] rounded-xs" />
            <div className="h-1 w-1/3 bg-[#e8e7e0] rounded-xs" />
          </div>
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
        </div>
      );

    case "modern":
    default:
      return (
        <div className="space-y-2 w-full h-full flex flex-col justify-center">
          <div className="text-[10px] font-semibold text-[#292a27] tracking-tight truncate">
            {name || "Grace Hopper"}
          </div>
          <div className="border-b pt-0.5" style={{ borderColor: `${effectiveAccent}99` }} />
          <div className="h-1 w-full bg-[#e8e7e0] rounded-xs" />
          <div className="h-1 w-5/6 bg-[#e8e7e0] rounded-xs" />
        </div>
      );
  }
}
