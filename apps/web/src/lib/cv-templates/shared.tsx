import type * as React from "react";
import type { CVSection, CVSectionItem, CVContact } from "jobai-shared";

export function hasContact(contact: CVContact): boolean {
  return Boolean(contact.email || contact.phone || contact.location || contact.website);
}

export function ContactInline({
  contact,
  primaryColor,
  separator = "•",
  className = "text-xs text-slate-600",
}: {
  contact: CVContact;
  primaryColor?: string;
  separator?: string;
  className?: string;
}) {
  if (!hasContact(contact)) return null;
  const parts: React.ReactNode[] = [];
  if (contact.email) parts.push(<span key="e">{contact.email}</span>);
  if (contact.phone) parts.push(<span key="p">{contact.phone}</span>);
  if (contact.location) parts.push(<span key="l">{contact.location}</span>);
  if (contact.website) {
    parts.push(
      <span key="w" className="font-medium" style={{ color: primaryColor }}>
        {contact.website}
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-x-3">
          {i > 0 && <span className="text-slate-300">{separator}</span>}
          {part}
        </span>
      ))}
    </div>
  );
}

export function SectionBlock({
  section,
  primaryColor,
  titleClass = "text-xs font-bold uppercase tracking-wider mb-2",
  itemRenderer = DefaultItem,
}: {
  section: CVSection;
  primaryColor: string;
  titleClass?: string;
  itemRenderer?: (props: { item: CVSectionItem }) => React.ReactNode;
}) {
  const Item = itemRenderer;
  return (
    <section className="cv-section space-y-3">
      <h2 className={titleClass} style={{ color: primaryColor }}>
        {section.title || section.type}
      </h2>
      <div className="space-y-4">
        {section.items.map((item) => <Item key={item.id} item={item} />)}
      </div>
    </section>
  );
}

export function DefaultItem({ item }: { item: CVSectionItem }) {
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

export function reorderSectionsForPortfolio(sections: CVSection[]): CVSection[] {
  const projects = sections.filter((s) => s.type === "projects");
  const rest = sections.filter((s) => s.type !== "projects");
  return [...projects, ...rest];
}
