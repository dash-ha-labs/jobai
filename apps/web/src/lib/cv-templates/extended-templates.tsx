import type { CV } from "jobai-shared";
import { ContactInline, DefaultItem, SectionBlock, reorderSectionsForPortfolio } from "./shared";

export function CreativeTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1e293b)` }}>
        <h1 className="text-3xl font-bold tracking-tight">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-2 text-xs text-white/90" separator="|" />
      </header>
      {summary?.trim() && (
        <p className="text-sm text-slate-700 leading-relaxed border-l-4 pl-4" style={{ borderColor: primaryColor }}>
          {summary}
        </p>
      )}
      {sections.map((section, idx) => (
        <section key={section.id} className="cv-section rounded-lg overflow-hidden border border-slate-200">
          <h2
            className="text-xs font-bold uppercase tracking-wider px-3 py-2 text-white"
            style={{ backgroundColor: idx % 2 === 0 ? primaryColor : "#334155" }}
          >
            {section.title || section.type}
          </h2>
          <div className="p-3 space-y-3 bg-white">
            {section.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AcademicTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="font-serif space-y-5 text-sm">
      <header className="border-b border-slate-400 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-1 text-xs text-slate-600 font-sans" />
      </header>
      {summary?.trim() && (
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800 mb-1 font-sans">Research Profile</h2>
          <p className="text-slate-800 leading-relaxed">{summary}</p>
        </section>
      )}
      {sections.map((section) => (
        <section key={section.id} className="cv-section">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] border-b border-slate-300 pb-0.5 mb-2 font-sans" style={{ color: primaryColor }}>
            {section.title || section.type}
          </h2>
          <div className="space-y-3">
            {section.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BannerTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header className="text-white px-4 py-5 -mx-2 sm:-mx-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
        <h1 className="text-2xl font-semibold tracking-tight">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-2 text-xs text-white/90" separator="|" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
      ))}
    </div>
  );
}

export function MinimalTemplate({ cv }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-light tracking-tight text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-3 text-xs text-slate-500" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-600 leading-loose max-w-prose">{summary}</p>}
      {sections.map((section) => (
        <section key={section.id} className="cv-section space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{section.title || section.type}</h2>
          <div className="space-y-5">
            {section.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BoldTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">{contact.name || "Your Name"}</h1>
        <div className="mt-3 h-1.5 w-24" style={{ backgroundColor: primaryColor }} />
        <ContactInline contact={contact} className="mt-4 text-xs text-slate-600" />
      </header>
      {summary?.trim() && <p className="text-base font-medium text-slate-800">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          primaryColor={primaryColor}
          titleClass="text-sm font-black uppercase tracking-wide mb-3"
        />
      ))}
    </div>
  );
}

export function ElegantTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="font-serif space-y-6 text-center">
      <header>
        <h1 className="text-3xl font-light tracking-wide text-slate-900">{contact.name || "Your Name"}</h1>
        <div className="mx-auto mt-2 h-px w-16 bg-slate-300" />
        <ContactInline contact={contact} className="mt-3 justify-center text-xs text-slate-600 font-sans" />
      </header>
      {summary?.trim() && <p className="text-sm italic text-slate-700 max-w-xl mx-auto">{summary}</p>}
      {sections.map((section) => (
        <section key={section.id} className="cv-section text-left">
          <h2 className="text-xs uppercase tracking-widest mb-2 font-sans font-semibold" style={{ color: primaryColor }}>
            {section.title || section.type}
          </h2>
          <div className="space-y-3">
            {section.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function StartupTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-[#faf9f6] border border-[#e8e7e2] p-4">
        <h1 className="text-2xl font-semibold text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} primaryColor={primaryColor} className="mt-2 text-xs text-slate-600" />
      </header>
      {summary?.trim() && (
        <p className="text-sm text-slate-700 bg-white rounded-xl border border-slate-200 p-3">{summary}</p>
      )}
      {sections.map((section) => (
        <section key={section.id} className="cv-section rounded-xl border border-slate-200 p-3 bg-white">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: primaryColor }}>
            {section.title || section.type}
          </h2>
          <div className="space-y-3">
            {section.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function LegalTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-4 text-[11px] leading-snug">
      <header className="text-center border-b-2 border-slate-900 pb-2">
        <h1 className="text-xl font-bold uppercase tracking-widest">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-1 justify-center text-[10px] text-slate-700" separator="·" />
      </header>
      {summary?.trim() && <p className="text-justify text-slate-800">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          primaryColor={primaryColor}
          titleClass="text-[10px] font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-2"
        />
      ))}
    </div>
  );
}

export function ClinicalTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap justify-between gap-3 border-b-2 border-sky-800 pb-3">
        <div>
          <h1 className="text-2xl font-semibold text-sky-950">{contact.name || "Your Name"}</h1>
          <p className="text-[10px] uppercase tracking-wider text-sky-700 mt-0.5">Clinical Curriculum Vitae</p>
        </div>
        <ContactInline contact={contact} className="text-xs text-slate-600 text-right" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700 bg-sky-50 border border-sky-100 rounded p-3">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
      ))}
    </div>
  );
}

function SidebarTemplate({
  cv,
  primaryColor,
  side,
  gradient = false,
}: {
  cv: CV;
  primaryColor: string;
  side: "left" | "right";
  gradient?: boolean;
}) {
  const { contact, summary, sections } = cv;
  const skills = sections.find((s) => s.type === "skills");
  const bodySections = sections.filter((s) => s.type !== "skills");
  const panelStyle = gradient
    ? { background: `linear-gradient(180deg, ${primaryColor}22, ${primaryColor}08)` }
    : { backgroundColor: `${primaryColor}12` };

  const panel = (
    <aside className="rounded-lg p-4 space-y-4 shrink-0 w-full sm:w-[32%]" style={panelStyle}>
      <div>
        <h1 className="text-xl font-bold text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} primaryColor={primaryColor} className="mt-2 text-[11px] text-slate-600" />
      </div>
      {summary?.trim() && <p className="text-[11px] text-slate-700 leading-relaxed">{summary}</p>}
      {skills && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
            {skills.title || "Skills"}
          </h2>
          <div className="space-y-2">
            {skills.items.map((item) => <DefaultItem key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div className={`flex flex-col sm:flex-row gap-5 ${side === "right" ? "sm:flex-row-reverse" : ""}`}>
      {panel}
      <div className="flex-1 min-w-0 space-y-4">
        {bodySections.map((section) => (
          <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
        ))}
      </div>
    </div>
  );
}

export function SidebarLeftTemplate(props: { cv: CV; primaryColor: string; gradient?: boolean }) {
  return <SidebarTemplate {...props} side="left" />;
}

export function SidebarRightTemplate(props: { cv: CV; primaryColor: string }) {
  return <SidebarTemplate {...props} side="right" />;
}

export function TimelineTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-1 text-xs text-slate-600" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700">{summary}</p>}
      {sections.map((section) => (
        <section key={section.id} className="cv-section">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
            {section.title || section.type}
          </h2>
          <div className="space-y-4 border-l-2 pl-4" style={{ borderColor: `${primaryColor}55` }}>
            {section.items.map((item) => (
              <div key={item.id} className="relative cv-item">
                <span
                  className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: primaryColor }}
                />
                <DefaultItem item={item} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ClassicTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="border-2 border-slate-900 p-4 space-y-4 font-serif">
      <header className="text-center border-b border-slate-900 pb-3">
        <h1 className="text-2xl font-bold uppercase">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-1 justify-center text-xs text-slate-700 font-sans" />
      </header>
      {summary?.trim() && <p className="text-sm text-center italic">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} primaryColor={primaryColor} titleClass="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2" />
      ))}
    </div>
  );
}

export function InternationalTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  return (
    <div className="space-y-5">
      <header className="border-b-2 pb-3" style={{ borderColor: primaryColor }}>
        <h1 className="text-2xl font-bold text-slate-900">{contact.name || "Your Name"}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {contact.location && (
            <span className="rounded-full border px-2 py-0.5 font-medium" style={{ borderColor: primaryColor, color: primaryColor }}>
              Based: {contact.location}
            </span>
          )}
          {contact.email && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{contact.email}</span>}
          {contact.phone && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{contact.phone}</span>}
          {contact.website && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{contact.website}</span>}
        </div>
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700">{summary}</p>}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
      ))}
    </div>
  );
}

export function PortfolioTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  const ordered = reorderSectionsForPortfolio(sections);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{contact.name || "Your Name"}</h1>
        <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Portfolio CV</p>
        <ContactInline contact={contact} primaryColor={primaryColor} className="mt-2 text-xs text-slate-600" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700">{summary}</p>}
      {ordered.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          primaryColor={primaryColor}
          titleClass={`text-xs font-bold uppercase tracking-wider mb-2 ${section.type === "projects" ? "text-base" : ""}`}
        />
      ))}
    </div>
  );
}

export function TwoColTemplate({ cv, primaryColor }: { cv: CV; primaryColor: string }) {
  const { contact, summary, sections } = cv;
  const left = sections.filter((s) => s.type === "education" || s.type === "skills");
  const right = sections.filter((s) => s.type !== "education" && s.type !== "skills");

  return (
    <div className="space-y-4">
      <header className="border-b pb-3" style={{ borderColor: primaryColor }}>
        <h1 className="text-2xl font-bold">{contact.name || "Your Name"}</h1>
        <ContactInline contact={contact} className="mt-1 text-xs text-slate-600" />
      </header>
      {summary?.trim() && <p className="text-sm text-slate-700">{summary}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          {left.map((section) => (
            <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
          ))}
        </div>
        <div className="space-y-4">
          {right.map((section) => (
            <SectionBlock key={section.id} section={section} primaryColor={primaryColor} />
          ))}
        </div>
      </div>
    </div>
  );
}
