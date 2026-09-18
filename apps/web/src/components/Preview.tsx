import type * as React from "react";
import type { CV, CVSectionItem } from "jobai-shared";

interface PreviewProps {
  cv: CV;
  onPrint?: () => void;
  onTemplateChange?: (templateId: string) => void;
}

export const TEMPLATES = [
  { id: "modern", name: "Modern", desc: "Clean & balanced with accent highlights" },
  { id: "executive", name: "Executive", desc: "Classic serif typography with formal layout" },
  { id: "tech", name: "Technical", desc: "Monospace accents and structured skills focus" },
  { id: "compact", name: "Compact", desc: "High density layout maximizing page efficiency" },
];

export function Preview({ cv, onPrint: _onPrint, onTemplateChange: _onTemplateChange }: PreviewProps) {
  const currentTemplate = cv.stylePrefs?.templateId || "modern";
  const fontSize = cv.stylePrefs?.fontSize || "normal";
  const marginPref = cv.stylePrefs?.margin || "normal";
  const primaryColor = cv.stylePrefs?.primaryColor || "#4f46e5";
  const isLetter = cv.stylePrefs?.paperSize === "Letter";
  const paperLabel = isLetter ? "Letter (8.5 × 11 in)" : "A4 (210 × 297 mm)";

  // Spacing / margin mapping
  const marginClasses = {
    compact: "p-6 sm:p-8",
    normal: "p-8 sm:p-12",
    spacious: "p-10 sm:p-16",
  }[marginPref] || "p-8 sm:p-12";

  // Base font size mapping
  const fontSizeClasses = {
    small: "text-[13px] leading-relaxed",
    normal: "text-[14px] leading-relaxed",
    large: "text-[15px] leading-relaxed",
  }[fontSize] || "text-[14px] leading-relaxed";

  return (
    <div className="flex flex-col h-full">
      <div className="no-print text-xs text-[#92928a] mb-2 px-1 flex items-center justify-between">
        <span>Live {paperLabel} Printable Preview</span>
        <span className="hidden sm:inline">Choose &ldquo;Save as PDF&rdquo; in print dialog</span>
      </div>

      {/* Dynamic @page CSS rule for native browser print */}
      <style>{`
        @media print {
          @page {
            size: ${isLetter ? "8.5in 11in" : "210mm 297mm"} portrait;
            margin: ${isLetter ? "0.5in" : "12mm 15mm"};
          }
        }
      `}</style>

      {/* CV Paper Canvas */}
      <div className="flex-1 overflow-y-auto bg-[#eeeadd] p-3 sm:p-6 rounded-2xl flex justify-center items-start shadow-inner border border-[#e1dccd]">
        <div
          id="cv-paper"
          className={`cv-paper cv-print-target bg-white text-[#292a27] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#e4e1d8] w-full ${
            isLetter ? "max-w-[8.5in] min-h-[11in]" : "max-w-[210mm] min-h-[297mm]"
          } mx-auto transition-all ${marginClasses} ${fontSizeClasses}`}
          style={{ "--accent-color": primaryColor } as React.CSSProperties}
        >
          {currentTemplate === "modern" && <ModernTemplate cv={cv} primaryColor={primaryColor} />}
          {currentTemplate === "executive" && <ExecutiveTemplate cv={cv} primaryColor={primaryColor} />}
          {currentTemplate === "tech" && <TechTemplate cv={cv} primaryColor={primaryColor} />}
          {currentTemplate === "compact" && <CompactTemplate cv={cv} primaryColor={primaryColor} />}
        </div>
      </div>
    </div>
  );
}

// 1. MODERN TEMPLATE
function ModernTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  const hasContactInfo = contact.email || contact.phone || contact.location || contact.website;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b-2 pb-5" style={{ borderColor: primaryColor }}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {contact.name || "Your Name"}
        </h1>
        {hasContactInfo && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && (
              <>
                <span className="text-slate-300">•</span>
                <span>{contact.phone}</span>
              </>
            )}
            {contact.location && (
              <>
                <span className="text-slate-300">•</span>
                <span>{contact.location}</span>
              </>
            )}
            {contact.website && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-medium" style={{ color: primaryColor }}>{contact.website}</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="cv-section">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: primaryColor }}>
            <span>Professional Summary</span>
          </h2>
          <p className="text-slate-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className="cv-section space-y-3">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 flex items-center gap-2"
            style={{ color: primaryColor, borderColor: "#e2e8f0" }}
          >
            <span>{section.title || section.type}</span>
          </h2>

          <div className="space-y-4">
            {section.items.map((item) => (
              <SectionItemModern key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionItemModern({ item }: { item: CVSectionItem }) {
  return (
    <div className="cv-item space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-bold text-slate-900">{item.title}</span>
          {item.subtitle && <span className="font-medium text-slate-600 text-xs">| {item.subtitle}</span>}
        </div>
        {item.date && <span className="text-xs text-slate-500 font-medium">{item.date}</span>}
      </div>

      {item.description && <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>}

      {item.bullets && item.bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 mt-1">
          {item.bullets.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 2. EXECUTIVE TEMPLATE (Formal serif, centered classic header)
function ExecutiveTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  const hasContactInfo = contact.email || contact.phone || contact.location || contact.website;

  return (
    <div className="font-serif space-y-6">
      {/* Centered Classic Header */}
      <header className="text-center pb-4 border-b-2" style={{ borderColor: primaryColor }}>
        <h1 className="text-3xl font-bold tracking-wider uppercase text-slate-900">
          {contact.name || "Your Name"}
        </h1>
        {hasContactInfo && (
          <div className="mt-2.5 flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-sans">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && (
              <>
                <span className="text-slate-400">♦</span>
                <span>{contact.phone}</span>
              </>
            )}
            {contact.location && (
              <>
                <span className="text-slate-400">♦</span>
                <span>{contact.location}</span>
              </>
            )}
            {contact.website && (
              <>
                <span className="text-slate-400">♦</span>
                <span>{contact.website}</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="cv-section">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            Executive Summary
          </h2>
          <p className="text-slate-800 leading-relaxed text-center italic max-w-2xl mx-auto">{summary}</p>
        </section>
      )}

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className="cv-section space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 font-sans">
            {section.title || section.type}
          </h2>

          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.id} className="cv-item space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  {item.date && <span className="text-xs italic text-slate-600 font-sans">{item.date}</span>}
                </div>
                {item.subtitle && <div className="text-xs italic text-slate-700">{item.subtitle}</div>}
                {item.description && <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 mt-1 font-sans">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// 3. TECHNICAL TEMPLATE (Monospace accents, badge skills, engineering focus)
function TechTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  const hasContactInfo = contact.email || contact.phone || contact.location || contact.website;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-slate-900 text-white p-5 rounded-lg border-l-4" style={{ borderLeftColor: primaryColor }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight font-mono text-white">
            <span style={{ color: primaryColor }} className="mr-1.5">&gt;</span>
            {contact.name || "Developer"}
          </h1>
          <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">CV_V1.0</span>
        </div>

        {hasContactInfo && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300 border-t border-slate-800 pt-3">
            {contact.email && <span>email: {contact.email}</span>}
            {contact.phone && <span>tel: {contact.phone}</span>}
            {contact.location && <span>loc: {contact.location}</span>}
            {contact.website && <span className="text-emerald-400">web: {contact.website}</span>}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="cv-section bg-slate-50 p-3.5 rounded-md border border-slate-200">
          <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            // Overview
          </div>
          <p className="text-slate-700 text-xs leading-relaxed font-sans">{summary}</p>
        </section>
      )}

      {/* Sections */}
      {sections.map((section) => {
        const isSkills = section.type === "skills";

        return (
          <section key={section.id} className="cv-section space-y-3">
            <h2 className="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span style={{ color: primaryColor }} className="font-mono">//</span>
              <span>{section.title || section.type}</span>
            </h2>

            {isSkills ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                    <span className="font-bold font-mono text-slate-900 block mb-1">{item.title}</span>
                    {item.subtitle && <span className="text-slate-600 block text-[11px] mb-1">{item.subtitle}</span>}
                    {item.bullets && item.bullets.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.bullets.map((b, i) => (
                          <span key={i} className="font-mono text-[10px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-700">
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : (
                      item.description && <p className="text-[11px] text-slate-600">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.id} className="cv-item space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        {item.subtitle && <span className="text-xs font-mono" style={{ color: primaryColor }}>@{item.subtitle}</span>}
                      </div>
                      {item.date && (
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.date}
                        </span>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-slate-600">{item.description}</p>}
                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-700 mt-1 pl-3">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span style={{ color: primaryColor }} className="font-mono text-[10px] select-none">&gt;</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// 4. COMPACT TEMPLATE (High-density single-page optimization)
function CompactTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;

  return (
    <div className="space-y-3.5 text-xs">
      {/* Tight Two-Column Header */}
      <header className="flex flex-wrap items-end justify-between border-b-2 pb-2 gap-2" style={{ borderColor: primaryColor }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
            {contact.name || "Your Name"}
          </h1>
          {summary?.trim() && (
            <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 max-w-lg leading-snug">
              {summary}
            </p>
          )}
        </div>

        <div className="text-right text-[11px] text-slate-600 leading-tight space-y-0.5">
          {contact.email && <div>{contact.email}</div>}
          {contact.phone && <div>{contact.phone}</div>}
          {contact.location && <div>{contact.location}</div>}
          {contact.website && <div className="font-medium text-slate-900">{contact.website}</div>}
        </div>
      </header>

      {/* Dense Sections */}
      {sections.map((section) => (
        <section key={section.id} className="cv-section space-y-1.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
            {section.title || section.type}
          </h2>

          <div className="space-y-2">
            {section.items.map((item) => (
              <div key={item.id} className="cv-item leading-snug">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{item.title}</span>
                    {item.subtitle && <span className="text-slate-600 font-medium"> — {item.subtitle}</span>}
                  </div>
                  {item.date && <span className="text-[10px] text-slate-500 font-medium">{item.date}</span>}
                </div>
                {item.description && <p className="text-[11px] text-slate-600 mt-0.5">{item.description}</p>}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700 mt-0.5">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
