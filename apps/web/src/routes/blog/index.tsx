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
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs font-medium text-[#73736b]">
          <span className="h-2 w-2 rounded-full bg-[#9782d8]" aria-hidden="true" />
          <span>Practical Guidance</span>
        </div>
      }
      title="Advice for your job search"
      description="Quiet, practical guidance for job seekers. Craft a truthful CV, articulate your contributions with measurable impact, and verify exports before sending."
      className="space-y-8 sm:space-y-10"
    >
      {/* Featured Article Card: Prominent with Restrained Layered-Paper Illustration */}
      {featuredArticle && (
        <article
          className="relative overflow-hidden rounded-2xl border border-[#ddd3e9] bg-[#e8e0f3] grid md:grid-cols-[1.1fr_0.9fr] transition hover:shadow-md mb-8 sm:mb-10"
          aria-labelledby="featured-article-title"
        >
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/40 px-3 py-1 text-xs font-medium text-[#625181] mb-4">
                <span>Featured Guide</span>
                <span aria-hidden="true">•</span>
                <span>{featuredArticle.category}</span>
              </div>
              <h2
                id="featured-article-title"
                className="text-2xl sm:text-3xl font-medium tracking-tight text-[#292a27] leading-[1.25] mb-3"
              >
                {isApp ? (
                  <Link
                    to="/app/blog/$slug"
                    params={{ slug: featuredArticle.slug }}
                    className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
                  >
                    {featuredArticle.title}
                  </Link>
                ) : (
                  <Link
                    to="/blog/$slug"
                    params={{ slug: featuredArticle.slug }}
                    className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
                  >
                    {featuredArticle.title}
                  </Link>
                )}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#5a5b54] leading-relaxed max-w-md mb-6">
                {featuredArticle.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#d8cde6]">
              <div className="flex items-center gap-2 text-xs text-[#73736b]">
                <span>{featuredArticle.readTime}</span>
                <span aria-hidden="true">•</span>
                <span>{featuredArticle.date}</span>
              </div>
              {isApp ? (
                <Link
                  to="/app/blog/$slug"
                  params={{ slug: featuredArticle.slug }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
                  className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#4a4e43] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
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
            <div className="absolute left-6 top-10 w-48 -rotate-[6deg] rounded-xl border border-white/90 bg-[#f7f4fa] p-4 shadow-[0_8px_24px_rgba(97,70,119,0.08)]">
              <div className="mb-3 flex items-center gap-1.5 border-b border-[#e7e1ed] pb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#cfc7db]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#dcd5e4]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#e6dfed]" />
                <span className="ml-auto text-[10px] font-medium text-[#a398ae]">Job Spec</span>
              </div>
              <p className="text-xs font-semibold text-[#41394d]">Target Role</p>
              <p className="text-[10px] text-[#827494] mt-0.5">Core Requirements</p>
              <div className="my-3 space-y-1.5">
                <div className="h-1 w-full rounded bg-[#e2dce9]" />
                <div className="h-1 w-4/5 rounded bg-[#e2dce9]" />
                <div className="h-1 w-11/12 rounded bg-[#e2dce9]" />
              </div>
              <div className="rounded-md bg-[#eee7f6] py-1 text-center text-[10px] font-medium text-[#7a6491]">
                Prioritize Match
              </div>
            </div>

            {/* Front Card: Tailored CV Facts */}
            <div className="absolute right-8 top-12 w-52 rotate-[4deg] rounded-xl border border-white bg-[#fffefb] p-4 shadow-[0_14px_35px_rgba(112,87,128,0.12)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e3f1] text-[10px] font-bold text-[#625181]">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#292a27]">Truthful CV</p>
                  <p className="text-[9px] text-[#93938a]">Aligned, Not Invented</p>
                </div>
              </div>
              <div className="my-2.5 space-y-1.5 border-t border-[#f0ede6] pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#55564e]">
                  <span className="text-[#625181]">•</span>
                  <span className="truncate">Led B2B MVP rollout</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#55564e]">
                  <span className="text-[#625181]">•</span>
                  <span className="truncate">Collaborated with UX</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#55564e]">
                  <span className="text-[#625181]">•</span>
                  <span className="truncate">Defined measurable KPIs</span>
                </div>
              </div>
              <div className="rounded-md bg-[#e6ede1] py-1 text-center text-[10px] font-medium text-[#5f744e]">
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
              className="flex flex-col overflow-hidden rounded-xl border border-[#e8e6dd] bg-[#fffefa] transition hover:shadow-md"
              aria-labelledby={`article-title-${article.slug}`}
            >
              {/* Card Illustration Banner */}
              <div
                className={`relative flex h-40 items-center justify-center overflow-hidden border-b ${
                  isSage ? "bg-[#ececdf] border-[#e2e2d5]" : "bg-[#f1e7de] border-[#e9ded3]"
                }`}
                aria-hidden="true"
              >
                {/* Decorative geometry */}
                <div
                  className={`absolute h-44 w-44 rounded-full border ${
                    isSage ? "border-[#dcdcca]" : "border-[#e4d7cc]"
                  }`}
                />
                <div
                  className={`absolute h-28 w-28 rounded-full border ${
                    isSage ? "border-[#dddecb]" : "border-[#ebdfd4]"
                  }`}
                />

                {/* Layered paper elements */}
                {isSage ? (
                  <div className="relative flex w-52 -rotate-2 items-center gap-3 rounded-xl border border-white/90 bg-[#fffaf4] p-3.5 shadow-xs">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#a8b48e] text-xs font-bold tracking-tight text-[#6d7c54]">
                      STAR
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#575949] truncate">
                        Action + Outcome
                      </p>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-[#e6e8d8]">
                        <div className="h-full w-4/5 rounded-full bg-[#9fb084]" />
                      </div>
                      <p className="mt-1 text-[10px] text-[#868875]">Quantify results</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex w-52 rotate-2 items-center gap-3 rounded-xl border border-white/90 bg-[#fffdfa] p-3.5 shadow-xs">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#d6bba4] text-xs font-bold tracking-tight text-[#8c6b4b]">
                      PDF
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#665445] truncate">
                        Pre-Export Check
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8a7563]">
                        <span className="text-[#8c6b4b]">✓</span> Links &amp; margins clean
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#a49180]">No stray orphan lines</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8c8d81] mb-2">
                    <span className="font-medium text-[#73736b]">{article.category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{article.readTime}</span>
                    <span aria-hidden="true">•</span>
                    <span>{article.date}</span>
                  </div>
                  <h3
                    id={`article-title-${article.slug}`}
                    className="text-xl font-medium tracking-tight text-[#292a27] leading-snug mb-2"
                  >
                    {isApp ? (
                      <Link
                        to="/app/blog/$slug"
                        params={{ slug: article.slug }}
                        className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm block"
                      >
                        {article.title}
                      </Link>
                    ) : (
                      <Link
                        to="/blog/$slug"
                        params={{ slug: article.slug }}
                        className="hover:text-[#625181] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm block"
                      >
                        {article.title}
                      </Link>
                    )}
                  </h3>
                  <p className="text-sm text-[#73736b] leading-relaxed mb-6">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f0ede6] mt-auto">
                  {isApp ? (
                    <Link
                      to="/app/blog/$slug"
                      params={{ slug: article.slug }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
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
