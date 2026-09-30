import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout } from "../PageLayout";
import {
  RESUME_SKILLS_TOOLS,
  resumeSkillsToolRoute,
  type ResumeSkillsSlug,
} from "./resume-skills-registry";

const LEGACY_TOOL_ROUTES = {
  "bullet-analyzer": "/toolkit/bullet-analyzer",
  "pdf-text-preview": "/toolkit/pdf-text-preview",
} as const;

const RESUME_SKILLS_ROUTE_ENTRIES = Object.fromEntries(
  RESUME_SKILLS_TOOLS.map((t) => [t.slug, resumeSkillsToolRoute(t.slug as ResumeSkillsSlug)]),
) as Record<ResumeSkillsSlug, `/toolkit/${ResumeSkillsSlug}`>;

export const TOOL_ROUTES = {
  ...LEGACY_TOOL_ROUTES,
  ...RESUME_SKILLS_ROUTE_ENTRIES,
} as const;

export type ToolSlug = keyof typeof TOOL_ROUTES;

export type ToolMeta = {
  slug: ToolSlug;
  name: string;
  short: string;
  description: string;
};

const LEGACY_TOOLS: ToolMeta[] = [
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

const RESUME_SKILLS_TOOL_META: ToolMeta[] = RESUME_SKILLS_TOOLS.map((t) => ({
  slug: t.slug as ToolSlug,
  name: t.name,
  short: t.short,
  description: t.description,
}));

export const TOOLS: ToolMeta[] = [...LEGACY_TOOLS, ...RESUME_SKILLS_TOOL_META];

export function toolkitLinkProps(slug: ToolSlug) {
  if (slug === "bullet-analyzer" || slug === "pdf-text-preview") {
    return { to: LEGACY_TOOL_ROUTES[slug] };
  }
  return { to: "/toolkit/$toolSlug" as const, params: { toolSlug: slug } };
}


export function PrivacyBadge() {
  return (
    <div className="text-xs text-[#8b939f] flex items-center gap-1.5">
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
    <PageLayout
      variant="fixed"
      leading={
        <Link
          to="/toolkit"
          className="text-sm font-medium text-[var(--ui-accent)] hover:text-[var(--ui-accent)] transition-colors"
        >
          ← Back to Toolkit
        </Link>
      }
      title={tool.name}
      description={
        <>
          <p>{tool.description}</p>
          <div className="mt-3 text-xs text-[#636c7a] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>This tool runs entirely in your browser. No data is sent to any server.</span>
          </div>
        </>
      }
      className="space-y-10"
    >
      {children}

      {howItWorks.length > 0 && (
        <section aria-labelledby="how-it-works-heading" className="space-y-4">
          <h2
            id="how-it-works-heading"
            className="text-xl font-semibold tracking-tight text-[#191b20] font-heading"
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {howItWorks.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-[#e3e6eb] bg-[#f7f8fa] p-4 space-y-1.5"
              >
                <div className="text-sm font-semibold text-[#191b20]">{step.title}</div>
                <p className="text-xs text-[#636c7a] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          {footnote}
        </section>
      )}

      <section aria-labelledby="related-tools-heading" className="space-y-4">
        <h2
          id="related-tools-heading"
          className="text-xl font-semibold tracking-tight text-[#191b20] font-heading"
        >
          Related tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {related.map((t) => (
            <Link
              key={t.slug}
              {...toolkitLinkProps(t.slug)}
              className="block rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-5 shadow-sm hover:border-[var(--ui-accent)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[#191b20] font-heading">{t.name}</h3>
                <span className="text-sm text-[var(--ui-accent)] shrink-0">Try it →</span>
              </div>
              <p className="mt-2 text-sm text-[#636c7a] leading-relaxed">{t.description}</p>
              <div className="mt-3 text-xs text-[#8b939f] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Runs 100% in your browser</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

export default ToolPageLayout;
