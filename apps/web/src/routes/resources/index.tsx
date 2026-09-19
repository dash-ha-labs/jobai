import { createFileRoute, Link } from "@tanstack/react-router";
import { articles } from "../blog/content/articles";
import { checklists } from "./content/checklists";

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
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-9 lg:px-10 py-8 sm:py-12">
      <header className="mb-10 sm:mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs font-medium text-[#73736b] mb-3">
          <span className="h-2 w-2 rounded-full bg-[#9782d8]" aria-hidden="true" />
          <span>Guides &amp; checklists</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#292a27] font-heading">
          Practical resources for your job search
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#73736b] leading-relaxed">
          Checklists you can run through before you apply, plus the existing JobAI guides on
          tailoring, bullets, and export review. No invented scores or guaranteed outcomes.
          Just the steps we actually use.
        </p>
      </header>

      <section aria-labelledby="resources-guides-heading" className="mb-12 sm:mb-16">
        <div className="flex items-end justify-between gap-4 border-b border-[#e8e7e2] pb-4 mb-6">
          <div>
            <h2
              id="resources-guides-heading"
              className="text-xl sm:text-2xl font-semibold tracking-tight text-[#292a27] font-heading"
            >
              Guides
            </h2>
            <p className="mt-1 text-sm text-[#73736b]">
              From the Advice &amp; Guides archive. Full articles live on the blog.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#625181] hover:text-[#292a27] transition shrink-0"
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
              className="flex flex-col rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-2xs hover:border-[#c9bcd9] transition"
              aria-labelledby={`guide-title-${article.slug}`}
            >
              <span className="text-[11px] font-medium text-[#625181]">{article.category}</span>
              <h3
                id={`guide-title-${article.slug}`}
                className="mt-2.5 text-base font-semibold text-[#292a27] font-heading leading-snug"
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
                >
                  {article.title}
                </Link>
              </h3>
              <p className="mt-2.5 text-sm text-[#73736b] leading-relaxed flex-1">{article.excerpt}</p>
              <div className="mt-6 pt-4 border-t border-[#f0efe9] flex items-center justify-between gap-3">
                <span className="text-xs text-[#8c8d81]">{article.readTime}</span>
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#625181] hover:text-[#292a27] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
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
        <div className="border-b border-[#e8e7e2] pb-4 mb-6">
          <h2
            id="resources-checklists-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight text-[#292a27] font-heading"
          >
            Checklists
          </h2>
          <p className="mt-1 text-sm text-[#73736b]">
            Original, printable-style lists. Use them as a last pass, not as a promise of results.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {checklists.map((checklist) => (
            <article
              key={checklist.slug}
              className="flex flex-col rounded-2xl border border-[#e2ded5] bg-[#fffefa] p-6 shadow-2xs hover:border-[#c9bcd9] transition"
              aria-labelledby={`checklist-title-${checklist.slug}`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#8c8d81]">Checklist</span>
              <h3
                id={`checklist-title-${checklist.slug}`}
                className="mt-2.5 text-base font-semibold text-[#292a27] font-heading leading-snug"
              >
                <Link
                  to="/resources/$slug"
                  params={{ slug: checklist.slug }}
                  className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
                >
                  {checklist.title}
                </Link>
              </h3>
              <p className="mt-2.5 text-sm text-[#73736b] leading-relaxed flex-1">{checklist.excerpt}</p>
              <div className="mt-6 pt-4 border-t border-[#f0efe9]">
                <Link
                  to="/resources/$slug"
                  params={{ slug: checklist.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#625181] hover:text-[#292a27] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
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
    </div>
  );
}
