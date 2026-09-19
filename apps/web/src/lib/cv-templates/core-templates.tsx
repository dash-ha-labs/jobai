import type { CV, CVSectionItem } from "jobai-shared";
import { ContactInline, hasContact } from "./shared";

export function ModernTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;

  return (
    <div className="space-y-6">
      <header className="border-b-2 pb-5" style={{ borderColor: primaryColor }}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} primaryColor={primaryColor} className="mt-2 text-xs text-slate-600" />
      </header>
      {summary?.trim() && (
        <section className="cv-section">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
            Professional Summary
          </h2>
          <p className="text-slate-700 leading-relaxed">{summary}</p>
        </section>
      )}
      {sections.map((section) => (
        <section key={section.id} className="cv-section space-y-3">
          <h2
            className="text-xs font-bold uppercase tracking-wider border-b pb-1"
            style={{ color: primaryColor, borderColor: "#e2e8f0" }}
          >
            {section.title || section.type}
          </h2>
          <div className="space-y-4">
            {section.items.map((item) => <SectionItemModern key={item.id} item={item} />)}
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

export function ExecutiveTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;

  return (
    <div className="font-serif space-y-6">
      <header className="text-center pb-4 border-b-2" style={{ borderColor: primaryColor }}>
        <h1 className="text-3xl font-bold tracking-wider uppercase text-slate-900">{contact.name || "Your Name"}</h1>
        {hasContact(contact) && (
          <div className="mt-2.5 flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-sans">
            <ContactInline contact={contact} separator="♦" className="justify-center text-xs text-slate-600" />
          </div>
        )}
      </header>
      {summary?.trim() && (
        <section className="cv-section">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2 font-sans">
            Executive Summary
          </h2>
          <p className="text-slate-800 leading-relaxed text-center italic max-w-2xl mx-auto">{summary}</p>
        </section>
      )}
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

export function TechTemplate({
  cv,
  primaryColor,
  variant = "default",
}: {
  cv: CV;
  primaryColor: string;
  variant?: "default" | "matrix";
}) {
  const { contact, summary, sections } = cv;
  const isMatrix = variant === "matrix";
  const headerBg = isMatrix ? "bg-black" : "bg-slate-900";
  const accent = isMatrix ? "#22c55e" : primaryColor;

  return (
    <div className="space-y-6">
      <header className={`${headerBg} text-white p-5 rounded-lg border-l-4`} style={{ borderLeftColor: accent }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight font-mono text-white">
            <span style={{ color: accent }} className="mr-1.5">{isMatrix ? "$" : ">"}</span>
            {contact.name || "Developer"}
          </h1>
          <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {isMatrix ? "SYS_CV" : "CV_V1.0"}
          </span>
        </div>
        {hasContact(contact) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300 border-t border-slate-800 pt-3">
            {contact.email && <span>email: {contact.email}</span>}
            {contact.phone && <span>tel: {contact.phone}</span>}
            {contact.location && <span>loc: {contact.location}</span>}
            {contact.website && <span style={{ color: accent }}>web: {contact.website}</span>}
          </div>
        )}
      </header>
      {summary?.trim() && (
        <section className="cv-section bg-slate-50 p-3.5 rounded-md border border-slate-200">
          <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">// Overview</div>
          <p className="text-slate-700 text-xs leading-relaxed font-sans">{summary}</p>
        </section>
      )}
      {sections.map((section) => {
        const isSkills = section.type === "skills";
        return (
          <section key={section.id} className="cv-section space-y-3">
            <h2 className="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span style={{ color: accent }} className="font-mono">//</span>
              <span>{section.title || section.type}</span>
            </h2>
            {isSkills ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                    <span className="font-bold font-mono text-slate-900 block mb-1">{item.title}</span>
                    {item.bullets && item.bullets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.bullets.map((b, i) => (
                          <span key={i} className="font-mono text-[10px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-700">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.id} className="cv-item space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      {item.date && (
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.date}
                        </span>
                      )}
                    </div>
                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-700 mt-1 pl-3">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span style={{ color: accent }} className="font-mono text-[10px] select-none">&gt;</span>
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

export function CompactTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;

  return (
    <div className="space-y-3.5 text-xs">
      <header className="flex flex-wrap items-end justify-between border-b-2 pb-2 gap-2" style={{ borderColor: primaryColor }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{contact.name || "Your Name"}</h1>
          {summary?.trim() && (
            <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 max-w-lg leading-snug">{summary}</p>
          )}
        </div>
        <div className="text-right text-[11px] text-slate-600 leading-tight space-y-0.5">
          {contact.email && <div>{contact.email}</div>}
          {contact.phone && <div>{contact.phone}</div>}
          {contact.location && <div>{contact.location}</div>}
        </div>
      </header>
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
