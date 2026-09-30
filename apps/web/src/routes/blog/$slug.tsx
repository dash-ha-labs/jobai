import { createFileRoute, Link } from "@tanstack/react-router";
import { getArticleBySlug } from "./content/articles";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const article = getArticleBySlug(params.slug);
    return {
      meta: [
        {
          title: article
            ? `${article.title} — JobAI Blog`
            : "Article Not Found — JobAI Blog",
        },
        {
          name: "description",
          content: article?.excerpt ?? "Practical career guidance for job seekers.",
        },
      ],
    };
  },
  loader: ({ params }) => {
    return {
      article: getArticleBySlug(params.slug),
    };
  },
  component: BlogSlugPage,
  notFoundComponent: () => <BlogNotFound isApp={false} />,
});

function BlogSlugPage() {
  const { slug } = Route.useParams();
  return <BlogSlugPageComponent slug={slug} isApp={false} />;
}

export function BlogSlugPageComponent({ slug, isApp = false }: { slug: string; isApp?: boolean }) {
  const article = getArticleBySlug(slug);

  if (!article) {
    return <BlogNotFound isApp={isApp} />;
  }

  return (
    <PageLayout
      variant="fluid"
      leading={
      <nav aria-label="Breadcrumb">
        {isApp ? (
          <Link
            to="/app/blog"
            className="inline-flex items-center gap-2 text-sm text-[#636c7a] hover:text-[#191b20] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
          >
            <svg
              className="w-4 h-4 text-[#8b939f]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to all articles</span>
          </Link>
        ) : (
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#636c7a] hover:text-[#191b20] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
          >
            <svg
              className="w-4 h-4 text-[#8b939f]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to all articles</span>
          </Link>
        )}
      </nav>
      }
    >
      <article className="mx-auto max-w-[65ch]" aria-labelledby="article-header-title">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8b939f] mb-3">
            <span className="font-medium text-[var(--ui-accent)] bg-[var(--ui-accent-soft)] px-2.5 py-0.5 rounded-full">
              {article.category}
            </span>
            <span aria-hidden="true">•</span>
            <span>{article.readTime}</span>
            <span aria-hidden="true">•</span>
            <span>{article.date}</span>
          </div>
          <h1
            id="article-header-title"
            className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#191b20] leading-[1.15] mb-4 font-heading"
          >
            {article.title}
          </h1>
          <p className="text-lg text-[#636c7a] leading-relaxed">
            {article.lead}
          </p>
        </header>

        {/* Subtle Practical Tip Callout */}
        <aside
          aria-label={article.tip.title}
          className="my-8 rounded-2xl border border-[#e3e6eb] bg-[#f1f3f6] p-5 sm:p-6 flex items-start gap-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e3e7ed] text-[#636c7a]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#636c7a]">
              {article.tip.title}
            </h2>
            <p className="mt-1 text-sm text-[#636c7a] leading-relaxed">
              {article.tip.content}
            </p>
          </div>
        </aside>

        {/* Article Sections: Clear h2 / list / table / example rhythm */}
        <div className="space-y-8">
          {article.sections.map((section, idx) => (
            <section key={idx} aria-labelledby={`section-heading-${idx}`}>
              <h2
                id={`section-heading-${idx}`}
                className="text-xl sm:text-2xl font-medium text-[#191b20] tracking-tight mt-8 mb-4"
              >
                {section.heading}
              </h2>

              {section.paragraphs?.map((p, pIdx) => (
                <p
                  key={pIdx}
                  className="text-[15px] sm:text-base text-[#3f4753] leading-relaxed mb-4"
                >
                  {p}
                </p>
              ))}

              {section.orderedItems && (
                <ol className="my-4 space-y-3 pl-1">
                  {section.orderedItems.map((item, oIdx) => (
                    <li key={oIdx} className="flex items-start gap-3 text-sm sm:text-[15px] text-[#3f4753] leading-relaxed">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ui-accent-soft)] text-xs font-semibold text-[var(--ui-accent)]">
                        {oIdx + 1}
                      </span>
                      <div>
                        <strong className="font-medium text-[#191b20]">{item.label}</strong>
                        <span className="text-[#636c7a]"> — </span>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {section.unorderedItems && (
                <ul className="my-4 space-y-2.5 pl-2">
                  {section.unorderedItems.map((item, uIdx) => (
                    <li key={uIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[#3f4753] leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-accent)]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Labeled Fictional Example */}
              {section.fictionalExample && (
                <div className="my-6 rounded-xl border border-[#e3e6eb] bg-white p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f3f6] pb-3 mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b939f]">
                      Fictional Example
                    </span>
                    <span className="text-xs text-[#636c7a] bg-[#f1f3f6] px-2.5 py-0.5 rounded-md">
                      {section.fictionalExample.targetRole}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[#e3e6eb] bg-[#f7f8fa] p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#8b939f] mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c5cbd4]" />
                        <span>{section.fictionalExample.before.label}</span>
                      </div>
                      <ul className="space-y-2 text-xs sm:text-[13px] text-[#636c7a]">
                        {section.fictionalExample.before.items.map((bItem, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <span className="text-[#c5cbd4]">•</span>
                            <span>{bItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)] p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ui-accent)] mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)]" />
                        <span>{section.fictionalExample.after.label}</span>
                      </div>
                      <ul className="space-y-2 text-xs sm:text-[13px] text-[var(--ui-accent-hover)]">
                        {section.fictionalExample.after.items.map((aItem, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2">
                            <span className="text-[var(--ui-accent)]">•</span>
                            <span>{aItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {section.fictionalExample.note && (
                    <p className="mt-4 text-xs text-[#8b939f] italic">
                      {section.fictionalExample.note}
                    </p>
                  )}
                </div>
              )}

              {/* Inspection Checklist Table */}
              {section.table && (
                <div className="my-6 overflow-x-auto rounded-xl border border-[#e3e6eb] bg-white shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e3e6eb] bg-[#f1f3f6] text-[#636c7a]">
                        {section.table.headers.map((th, thIdx) => (
                          <th key={thIdx} className="px-4 py-3 font-medium">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f6]">
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#f7f8fa]/50">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 text-[#3f4753] ${
                                cIdx === 0 ? "font-medium text-[#191b20]" : ""
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Quiet Ending Link to Existing CV Editor */}
        <footer className="mt-12 pt-8 border-t border-[#e3e6eb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[#191b20]">
              Ready to apply these principles?
            </h2>
            <p className="text-xs text-[#8b939f] mt-0.5">
              Return to your local CV editor to refine your active draft.
            </p>
          </div>
          {isApp ? (
            <Link
              to="/app/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
            >
              <span>Open CV Editor</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          ) : (
            <Link
              to="/"
              search={{ view: "editor" }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
            >
              <span>Open CV Editor</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          )}
        </footer>
      </article>
    </PageLayout>
  );
}

function BlogNotFound({ isApp = false }: { isApp?: boolean }) {
  return (
    <PageLayout
      variant="fixed"
      title="Article not found"
      description="The career guidance article you are looking for does not exist or has been moved."
      className="text-center"
    >
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3f6] text-[#636c7a] mb-4">
          <svg
            className="w-6 h-6 text-[#8b939f]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {isApp ? (
          <Link
            to="/app/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Return to all articles</span>
          </Link>
        ) : (
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Return to all articles</span>
          </Link>
        )}
      </div>
    </PageLayout>
  );
}
