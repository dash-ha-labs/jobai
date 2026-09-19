import { createFileRoute, Link } from "@tanstack/react-router";
import { getArticleBySlug } from "./content/articles";

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
    <div className="w-full pb-8">
      {/* Breadcrumb back to Blog */}
      <nav aria-label="Breadcrumb" className="mb-6">
        {isApp ? (
          <Link
            to="/app/blog"
            className="inline-flex items-center gap-2 text-sm text-[#73736b] hover:text-[#292a27] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
          >
            <svg
              className="w-4 h-4 text-[#9b9a92]"
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
            className="inline-flex items-center gap-2 text-sm text-[#73736b] hover:text-[#292a27] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
          >
            <svg
              className="w-4 h-4 text-[#9b9a92]"
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

      {/* Semantic Article Landmark with Narrow Reading Column (~65-72ch) */}
      <article className="mx-auto max-w-[65ch]" aria-labelledby="article-header-title">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8c8d81] mb-3">
            <span className="font-medium text-[#625181] bg-[#e8e3f1] px-2.5 py-0.5 rounded-full">
              {article.category}
            </span>
            <span aria-hidden="true">•</span>
            <span>{article.readTime}</span>
            <span aria-hidden="true">•</span>
            <span>{article.date}</span>
          </div>
          <h1
            id="article-header-title"
            className="text-3xl sm:text-4xl font-medium tracking-tight text-[#292a27] leading-[1.2] mb-4"
          >
            {article.title}
          </h1>
          <p className="text-lg text-[#5a5b54] leading-relaxed">
            {article.lead}
          </p>
        </header>

        {/* Subtle Practical Tip Callout */}
        <aside
          aria-label={article.tip.title}
          className="my-8 rounded-xl border border-[#e6e5da] bg-[#f2f2e9] p-5 sm:p-6 flex items-start gap-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5e7d4] text-[#728564]">
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#728564]">
              {article.tip.title}
            </h2>
            <p className="mt-1 text-sm text-[#5a5b54] leading-relaxed">
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
                className="text-xl sm:text-2xl font-medium text-[#292a27] tracking-tight mt-8 mb-4"
              >
                {section.heading}
              </h2>

              {section.paragraphs?.map((p, pIdx) => (
                <p
                  key={pIdx}
                  className="text-[15px] sm:text-base text-[#41423c] leading-relaxed mb-4"
                >
                  {p}
                </p>
              ))}

              {section.orderedItems && (
                <ol className="my-4 space-y-3 pl-1">
                  {section.orderedItems.map((item, oIdx) => (
                    <li key={oIdx} className="flex items-start gap-3 text-sm sm:text-[15px] text-[#41423c] leading-relaxed">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8e3f1] text-xs font-semibold text-[#625181]">
                        {oIdx + 1}
                      </span>
                      <div>
                        <strong className="font-medium text-[#292a27]">{item.label}</strong>
                        <span className="text-[#73736b]"> — </span>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {section.unorderedItems && (
                <ul className="my-4 space-y-2.5 pl-2">
                  {section.unorderedItems.map((item, uIdx) => (
                    <li key={uIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[#41423c] leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9782d8]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Labeled Fictional Example */}
              {section.fictionalExample && (
                <div className="my-6 rounded-xl border border-[#e8e6dd] bg-white p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0efe7] pb-3 mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8c8d81]">
                      Fictional Example
                    </span>
                    <span className="text-xs text-[#73736b] bg-[#f5f4f0] px-2.5 py-0.5 rounded-md">
                      {section.fictionalExample.targetRole}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[#ecebe6] bg-[#faf9f6] p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#8c8d81] mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c7c5bc]" />
                        <span>{section.fictionalExample.before.label}</span>
                      </div>
                      <ul className="space-y-2 text-xs sm:text-[13px] text-[#73736b]">
                        {section.fictionalExample.before.items.map((bItem, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <span className="text-[#c7c5bc]">•</span>
                            <span>{bItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-[#ddd3e9] bg-[#f8f6fb] p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#625181] mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9782d8]" />
                        <span>{section.fictionalExample.after.label}</span>
                      </div>
                      <ul className="space-y-2 text-xs sm:text-[13px] text-[#41394d]">
                        {section.fictionalExample.after.items.map((aItem, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2">
                            <span className="text-[#9782d8]">•</span>
                            <span>{aItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {section.fictionalExample.note && (
                    <p className="mt-4 text-xs text-[#8c8d81] italic">
                      {section.fictionalExample.note}
                    </p>
                  )}
                </div>
              )}

              {/* Inspection Checklist Table */}
              {section.table && (
                <div className="my-6 overflow-x-auto rounded-xl border border-[#e8e6dd] bg-white shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e8e6dd] bg-[#f5f4f0] text-[#73736b]">
                        {section.table.headers.map((th, thIdx) => (
                          <th key={thIdx} className="px-4 py-3 font-medium">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ede6]">
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#faf9f6]/50">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 text-[#41423c] ${
                                cIdx === 0 ? "font-medium text-[#292a27]" : ""
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
        <footer className="mt-12 pt-8 border-t border-[#e8e7e2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[#292a27]">
              Ready to apply these principles?
            </h2>
            <p className="text-xs text-[#8c8d81] mt-0.5">
              Return to your local CV editor to refine your active draft.
            </p>
          </div>
          {isApp ? (
            <Link
              to="/app/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
              className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
    </div>
  );
}

function BlogNotFound({ isApp = false }: { isApp?: boolean }) {
  return (
    <div className="w-full py-16 px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f0ea] text-[#73736b] mb-4">
          <svg
            className="w-6 h-6 text-[#9b9a92]"
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
        <h1 className="text-2xl font-medium tracking-tight text-[#292a27] mb-2">
          Article not found
        </h1>
        <p className="text-sm text-[#73736b] mb-6 leading-relaxed">
          The career guidance article you are looking for does not exist or has been moved.
        </p>
        {isApp ? (
          <Link
            to="/app/blog"
            className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
            className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
    </div>
  );
}
