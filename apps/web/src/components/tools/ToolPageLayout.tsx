import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

// Literal route map (no $slug route exists; each tool has a dedicated file route).
export const TOOL_ROUTES = {
  "bullet-analyzer": "/toolkit/bullet-analyzer",
  "pdf-text-preview": "/toolkit/pdf-text-preview",
} as const;

export type ToolSlug = keyof typeof TOOL_ROUTES;

export type ToolMeta = {
  slug: ToolSlug;
  name: string;
  short: string;
  description: string;
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "bullet-analyzer",
    name: "CV Bullet Impact & Readability Analyzer",
    short: "Bullet Analyzer",
    description:
      "Inspect your resume bullet points for strong action verbs, quantifiable metrics, and print density. Instant, deterministic feedback with zero signup and zero data tracking.",
  },
  {
    slug: "pdf-text-preview",
    name: "PDF Text Preview",
    short: "PDF Text Preview",
    description:
      "Extract readable text from any PDF entirely in your browser. See what your resume actually says when a parser reads it — useful for ATS readability checks before you send it out.",
  },
];

export function PrivacyBadge() {
  return (
    <div className="text-xs text-[#8c8d81] flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
      <span>Runs 100% in your browser</span>
    </div>
  );
}

export function ToolPageLayout({
  tool,
  children,
  howItWorks,
  footnote,
}: {
  tool: ToolMeta;
  children: ReactNode;
  howItWorks: { title: string; body: string }[];
  footnote?: ReactNode;
}) {
  const related = TOOLS.filter((t) => t.slug !== tool.slug);
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-10">
      <div className="space-y-4">
        <Link
          to="/toolkit"
          className="text-sm font-medium text-[#625181] hover:text-[#9782d8] transition-colors"
        >
          ← Back to Toolkit
        </Link>
        <div className="border-b border-[#e8e7e2] pb-5 space-y-3">
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading"
          >
            {tool.name}
          </h1>
          <p className="text-sm text-[#73736b] max-w-2xl leading-relaxed">{tool.description}</p>
          <div className="text-xs text-[#73736b] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>This tool runs entirely in your browser. No data is sent to any server.</span>
          </div>
        </div>
      </div>

      {children}

      {howItWorks.length > 0 && (
        <section aria-labelledby="how-it-works-heading" className="space-y-4">
          <h2
            id="how-it-works-heading"
            className="text-xl font-semibold tracking-tight text-[#292a27] font-heading"
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-[#e4e1d7] bg-[#faf9f6] p-4 space-y-1.5"
              >
                <div className="text-sm font-semibold text-[#292a27]">{step.title}</div>
                <p className="text-xs text-[#73736b] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          {footnote}
        </section>
      )}

      <section aria-labelledby="related-tools-heading" className="space-y-4">
        <h2
          id="related-tools-heading"
          className="text-xl font-semibold tracking-tight text-[#292a27] font-heading"
        >
          Related tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {related.map((t) => (
            <Link
              key={t.slug}
              to={TOOL_ROUTES[t.slug]}
              className="block rounded-2xl border border-[#e2ded5] bg-[#fffefa] p-5 shadow-sm hover:border-[#9782d8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[#292a27] font-heading">{t.name}</h3>
                <span className="text-sm text-[#625181] shrink-0">Try it →</span>
              </div>
              <p className="mt-2 text-sm text-[#73736b] leading-relaxed">{t.description}</p>
              <div className="mt-3 text-xs text-[#8c8d81] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Runs 100% in your browser</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ToolPageLayout;
