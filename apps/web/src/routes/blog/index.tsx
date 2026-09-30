import { createFileRoute, Link } from "@tanstack/react-router";
import { articles } from "./content/articles";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Career Advice & Guides — JobAI" },
      {
        name: "description",
        content:
          "Practical career guidance for job seekers. Truthful CV tailoring, experience bullet points that show contribution, and pre-export PDF checks.",
      },
    ],
  }),
  component: () => <BlogIndexComponent isApp={false} />,
});

export function BlogIndexComponent({ isApp = false }: { isApp?: boolean }) {
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1);

  return (
    <PageLayout
      variant="fixed"
      leading={
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e6eb] bg-white/70 px-3 py-1 text-xs font-medium text-[#636c7a]">
          <span className="h-2 w-2 rounded-full bg-[var(--ui-accent)]" aria-hidden="true" />
          <span>Practical Guidance</span>
        </div>
      }
      title="Small steps for your next move"
      description="Friendly, practical advice for writing a CV that sounds like you, making your experience clear, and feeling ready to apply."
      className="space-y-8 sm:space-y-10"
    >
      {/* Featured Article Card: Prominent with Restrained Layered-Paper Illustration */}
      {featuredArticle && (
        <article
          className="relative overflow-hidden rounded-3xl border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)] grid md:grid-cols-[1.1fr_0.9fr] transition hover:shadow-md mb-8 sm:mb-10"
          aria-labelledby="featured-article-title"
        >
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-accent-line)] bg-white/40 px-3 py-1 text-xs font-medium text-[var(--ui-accent)] mb-4">
                <span>Featured Guide</span>
                <span aria-hidden="true">•</span>
                <span>{featuredArticle.category}</span>
              </div>
              <h2
                id="featured-article-title"
                className="text-2xl sm:text-3xl font-medium tracking-tight text-[#191b20] leading-[1.25] mb-3"
              >
                {isApp ? (
                  <Link
                    to="/app/blog/$slug"
                    params={{ slug: featuredArticle.slug }}
                    className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                  >
                    {featuredArticle.title}
                  </Link>
                ) : (
                  <Link
                    to="/blog/$slug"
                    params={{ slug: featuredArticle.slug }}
                    className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                  >
                    {featuredArticle.title}
                  </Link>
                )}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#636c7a] leading-relaxed max-w-md mb-6">
                {featuredArticle.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--ui-accent-soft)]">
              <div className="flex items-center gap-2 text-xs text-[#636c7a]">
                <span>{featuredArticle.readTime}</span>
                <span aria-hidden="true">•</span>
                <span>{featuredArticle.date}</span>
              </div>
              {isApp ? (
                <Link
                  to="/app/blog/$slug"
                  params={{ slug: featuredArticle.slug }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
                >
                  <span>Read article</span>
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
                  to="/blog/$slug"
                  params={{ slug: featuredArticle.slug }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#3f4753] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
                >
                  <span>Read article</span>
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
            </div>
          </div>

          {/* Restrained Layered-Paper Illustration */}
          <div
            className="relative hidden md:flex min-h-[320px] items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute right-6 top-4 h-64 w-64 rounded-full border border-white/40" />
            <div className="absolute -right-8 -bottom-8 h-80 w-80 rounded-full border border-white/30" />

            {/* Back Card: Target Job Description */}
            <div className="absolute left-6 top-10 w-48 -rotate-[6deg] rounded-xl border border-white/90 bg-[var(--ui-accent-soft)] p-4 shadow-[0_8px_24px_rgba(25,27,32,0.08)]">
              <div className="mb-3 flex items-center gap-1.5 border-b border-[var(--ui-accent-soft)] pb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent-line)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent-soft)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent-soft)]" />
                <span className="ml-auto text-[10px] font-medium text-[var(--ui-accent)]">Job Spec</span>
              </div>
              <p className="text-xs font-semibold text-[var(--ui-accent-hover)]">Target Role</p>
              <p className="text-[10px] text-[var(--ui-accent)] mt-0.5">Core Requirements</p>
              <div className="my-3 space-y-1.5">
                <div className="h-1 w-full rounded bg-[var(--ui-accent-soft)]" />
                <div className="h-1 w-4/5 rounded bg-[var(--ui-accent-soft)]" />
                <div className="h-1 w-11/12 rounded bg-[var(--ui-accent-soft)]" />
              </div>
              <div className="rounded-md bg-[var(--ui-accent-soft)] py-1 text-center text-[10px] font-medium text-[var(--ui-accent)]">
                Prioritize Match
              </div>
            </div>

            {/* Front Card: Tailored CV Facts */}
            <div className="absolute right-8 top-12 w-52 rotate-[4deg] rounded-xl border border-white bg-[#ffffff] p-4 shadow-[0_14px_35px_rgba(25,27,32,0.12)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ui-accent-soft)] text-[10px] font-bold text-[var(--ui-accent)]">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#191b20]">Truthful CV</p>
                  <p className="text-[9px] text-[#8b939f]">Aligned, Not Invented</p>
                </div>
              </div>
              <div className="my-2.5 space-y-1.5 border-t border-[#f1f3f6] pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#636c7a]">
                  <span className="text-[var(--ui-accent)]">•</span>
                  <span className="truncate">Led B2B MVP rollout</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#636c7a]">
                  <span className="text-[var(--ui-accent)]">•</span>
                  <span className="truncate">Collaborated with UX</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#636c7a]">
                  <span className="text-[var(--ui-accent)]">•</span>
                  <span className="truncate">Defined measurable KPIs</span>
                </div>
              </div>
              <div className="rounded-md bg-[#e3e6eb] py-1 text-center text-[10px] font-medium text-[#636c7a]">
                Factual Impact
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Two Smaller Illustrated Article Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {secondaryArticles.map((article) => {
          const isSage = article.colorTheme === "sage";
          return (
            <article
              key={article.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#e3e6eb] bg-[#ffffff] transition hover:shadow-md"
              aria-labelledby={`article-title-${article.slug}`}
            >
              {/* Card Illustration Banner */}
              <div
                className={`relative flex h-40 items-center justify-center overflow-hidden border-b ${
                  isSage ? "bg-[#e3e6eb] border-[#e3e6eb]" : "bg-[#f1f3f6] border-[#e3e7ed]"
                }`}
                aria-hidden="true"
              >
                {/* Decorative geometry */}
                <div
                  className={`absolute h-44 w-44 rounded-full border ${
                    isSage ? "border-[#c5cbd4]" : "border-[#e3e7ed]"
                  }`}
                />
                <div
                  className={`absolute h-28 w-28 rounded-full border ${
                    isSage ? "border-[#c5cbd4]" : "border-[#e3e7ed]"
                  }`}
                />

                {/* Layered paper elements */}
                {isSage ? (
                  <div className="relative flex w-52 -rotate-2 items-center gap-3 rounded-xl border border-white/90 bg-[#ffffff] p-3.5 shadow-xs">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#8b939f] text-xs font-bold tracking-tight text-[#636c7a]">
                      STAR
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#3f4753] truncate">
                        Action + Outcome
                      </p>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-[#e3e6eb]">
                        <div className="h-full w-4/5 rounded-full bg-[#8b939f]" />
                      </div>
                      <p className="mt-1 text-[10px] text-[#636c7a]">Quantify results</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex w-52 rotate-2 items-center gap-3 rounded-xl border border-white/90 bg-[#ffffff] p-3.5 shadow-xs">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#c5cbd4] text-xs font-bold tracking-tight text-[#657080]">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#636c7a] truncate">
                        Pre-Export Check
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#636c7a]">
                        <span className="text-[#657080]">✓</span> Links &amp; margins clean
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#8b939f]">No stray orphan lines</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8b939f] mb-2">
                    <span className="font-medium text-[#636c7a]">{article.category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{article.readTime}</span>
                    <span aria-hidden="true">•</span>
                    <span>{article.date}</span>
                  </div>
                  <h3
                    id={`article-title-${article.slug}`}
                    className="text-xl font-medium tracking-tight text-[#191b20] leading-snug mb-2"
                  >
                    {isApp ? (
                      <Link
                        to="/app/blog/$slug"
                        params={{ slug: article.slug }}
                        className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm block"
                      >
                        {article.title}
                      </Link>
                    ) : (
                      <Link
                        to="/blog/$slug"
                        params={{ slug: article.slug }}
                        className="hover:text-[var(--ui-accent)] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm block"
                      >
                        {article.title}
                      </Link>
                    )}
                  </h3>
                  <p className="text-sm text-[#636c7a] leading-relaxed mb-6">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f1f3f6] mt-auto">
                  {isApp ? (
                    <Link
                      to="/app/blog/$slug"
                      params={{ slug: article.slug }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-hover)] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                    >
                      <span>Read {isSage ? "guide" : "checklist"}</span>
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      to="/blog/$slug"
                      params={{ slug: article.slug }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-hover)] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] rounded-sm"
                    >
                      <span>Read {isSage ? "guide" : "checklist"}</span>
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </PageLayout>
  );
}
