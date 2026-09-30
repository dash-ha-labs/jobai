import { createFileRoute, Link } from "@tanstack/react-router";
import { articles } from "../blog/content/articles";
import { checklists } from "./content/checklists";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Practical resources for your job search — JobAI" },
      {
        name: "description",
        content:
          "Original checklists and existing JobAI guides for truthful CV tailoring, pre-apply review, and application tracking.",
      },
    ],
  }),
  component: ResourcesIndexPage,
});

function ResourcesIndexPage() {
  return (
    <PageLayout
      variant="fixed"
      leading={
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e6eb] bg-white/70 px-3 py-1 text-xs font-medium text-[#636c7a]">
          <span className="h-2 w-2 rounded-full bg-[var(--ui-accent)]" aria-hidden="true" />
          <span>Guides &amp; checklists</span>
        </div>
      }
      title="Practical resources for your job search"
      description="Checklists you can run through before you apply, plus the existing JobAI guides on tailoring, bullets, and export review. No invented scores or guaranteed outcomes. Just the steps we actually use."
      className="space-y-12 sm:space-y-16"
    >
      <section aria-labelledby="resources-guides-heading" className="mb-12 sm:mb-16">
        <div className="flex items-end justify-between gap-4 border-b border-[#e3e6eb] pb-4 mb-6">
          <div>
            <h2
              id="resources-guides-heading"
              className="text-xl sm:text-2xl font-semibold tracking-tight text-[#191b20] font-heading"
            >
              Guides
            </h2>
            <p className="mt-1 text-sm text-[#636c7a]">
              From the Advice &amp; Guides archive. Full articles live on the blog.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ui-accent)] hover:text-[#191b20] transition shrink-0"
          >
            <span>All articles</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="flex flex-col rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 shadow-2xs hover:border-[var(--ui-accent-line)] transition"
              aria-labelledby={`guide-title-${article.slug}`}
            >
              <span className="text-[11px] font-medium text-[var(--ui-accent)]">{article.category}</span>
              <h3
                id={`guide-title-${article.slug}`}
                className="mt-2.5 text-base font-semibold text-[#191b20] font-heading leading-snug"
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                >
                  {article.title}
                </Link>
              </h3>
              <p className="mt-2.5 text-sm text-[#636c7a] leading-relaxed flex-1">{article.excerpt}</p>
              <div className="mt-6 pt-4 border-t border-[#f1f3f6] flex items-center justify-between gap-3">
                <span className="text-xs text-[#8b939f]">{article.readTime}</span>
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ui-accent)] hover:text-[#191b20] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                >
                  <span>Read guide</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="resources-checklists-heading">
        <div className="border-b border-[#e3e6eb] pb-4 mb-6">
          <h2
            id="resources-checklists-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-[#191b20] font-heading"
          >
            Checklists
          </h2>
          <p className="mt-1 text-sm text-[#636c7a]">
            Original, printable-style lists. Use them as a last pass, not as a promise of results.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {checklists.map((checklist) => (
            <article
              key={checklist.slug}
              className="flex flex-col rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 shadow-2xs hover:border-[var(--ui-accent-line)] transition"
              aria-labelledby={`checklist-title-${checklist.slug}`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#8b939f]">Checklist</span>
              <h3
                id={`checklist-title-${checklist.slug}`}
                className="mt-2.5 text-base font-semibold text-[#191b20] font-heading leading-snug"
              >
                <Link
                  to="/resources/$slug"
                  params={{ slug: checklist.slug }}
                  className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                >
                  {checklist.title}
                </Link>
              </h3>
              <p className="mt-2.5 text-sm text-[#636c7a] leading-relaxed flex-1">{checklist.excerpt}</p>
              <div className="mt-6 pt-4 border-t border-[#f1f3f6]">
                <Link
                  to="/resources/$slug"
                  params={{ slug: checklist.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ui-accent)] hover:text-[#191b20] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                >
                  <span>Open checklist</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
