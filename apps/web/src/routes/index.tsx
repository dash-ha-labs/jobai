import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { CV_TEMPLATES } from "jobai-shared";
import { TemplateThumbnail } from "../lib/cv-templates/thumbnail";
import { BulletAnalyzer } from "../components/tools/BulletAnalyzer";

const FEATURED_TEMPLATES = CV_TEMPLATES.slice(0, 8);

interface SearchParams {
  template?: string;
  view?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      template: typeof search.template === "string" ? search.template : undefined,
      view: typeof search.view === "string" ? search.view : undefined,
    };
  },
  beforeLoad: ({ search }) => {
    // Legacy deep links compatibility: redirect ?view=editor or ?view=overview to canonical /app routes
    if (search.view === "editor") {
      throw redirect({
        to: "/app/editor",
        search: { template: search.template },
        statusCode: 307,
      });
    }
    if (search.view === "overview") {
      throw redirect({
        to: "/app",
        statusCode: 307,
      });
    }
  },
  component: PublicLandingComponent,
});

export function PublicLandingComponent() {
  const blogArticles = [
    {
      slug: "tailor-your-cv-without-inventing-experience",
      title: "Tailor Your CV Without Inventing Experience",
      readingTime: "5 min read",
      summary: "How to emphasize authentic achievements matching a job specification without exaggerating or inventing skills.",
    },
    {
      slug: "write-experience-bullets-that-show-contribution",
      title: "Write Experience Bullets That Show Contribution",
      readingTime: "4 min read",
      summary: "Action-driven formulas to structure CV bullet points with verifiable outcomes and context.",
    },
    {
      slug: "check-your-cv-before-exporting-to-pdf",
      title: "Check Your CV Before Exporting to PDF",
      readingTime: "4 min read",
      summary: "A practical pre-flight checklist for typography, page-break margins, and ATS text extraction safety.",
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-9 lg:px-10 py-8 sm:py-12 space-y-16 sm:space-y-24">
      {/* ================= 1. OUTCOME HERO SECTION ================= */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden rounded-3xl border border-[#ddd3e9] bg-[#e8e0f3] grid lg:grid-cols-[1.12fr_1fr] shadow-sm"
      >
        {/* Left Column: Confident Outcome-led Copy & High-Contrast CTAs */}
        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 flex flex-col justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/50 px-3.5 py-1.5 text-xs font-medium text-[#625181]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>ONE-CLICK APPLICATION TAILORING</span>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-[-0.04em] leading-[1.12] text-[#292a27] font-heading max-w-xl"
            >
              One click.
              <br />
              <span className="text-[#625181]">A CV made for this job.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#5c4d68] max-w-lg">
              Import your master CV facts and pair the browser extension once. When you find a target role, JobAI tailors relevant achievements in a single click. Always review your customized CV before sending.
            </p>

            {/* High-Contrast Conversion CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/app"
                search={{ view: "editor" }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#292a27] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#41423c] focus-visible:ring-2 focus-visible:ring-[#9782d8] focus-visible:outline-none"
              >
                <span>Create your CV</span>
                <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <a
                href="#templates"
                className="inline-flex items-center gap-2 rounded-xl border border-[#c3b6d4] bg-white/60 px-5 py-3.5 text-sm font-medium text-[#463853] hover:bg-white/90 transition"
              >
                <span>Explore templates</span>
                <svg className="w-4 h-4 text-[#79628f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>

              <a
                href="#workflow"
                className="text-xs font-medium text-[#625181] hover:underline sm:ml-2"
              >
                See 3-step workflow →
              </a>
            </div>
          </div>

          {/* Truthful Qualitative Guardrails (No false 100% on-device, no universal ATS guarantee) */}
          <div className="mt-10 pt-6 border-t border-[#d8cce4] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#796788]">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>Local-first master CV in your browser</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>Bring Your Own AI Key or run local</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>Native A4 &amp; Letter print fidelity</span>
            </div>
          </div>
        </div>

        {/* Right Column: Staged Truthful Transformation Demonstration (Clearly labelled illustrative) */}
        <div
          className="relative min-h-[420px] lg:min-h-full items-center justify-center p-6 hidden sm:flex overflow-hidden"
          aria-label="Target job specification matched to an authentic tailored CV document"
        >
          {/* Subtle background rings */}
          <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full border border-white/40 pointer-events-none" />
          <div className="absolute right-10 bottom-6 h-96 w-96 rounded-full border border-white/20 pointer-events-none" />

          {/* Demonstration Notice Ribbon */}
          <div className="absolute top-3 right-4 z-20 rounded-md bg-white/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono font-medium text-[#625181] border border-[#d8cde6]">
            Illustrative Transformation Demonstration (Not a Result Guarantee)
          </div>

          {/* Job Specification Card (tilted left) */}
          <div className="absolute left-4 lg:left-8 top-14 w-60 -rotate-[4deg] rounded-2xl border border-white/90 bg-[#f7f4fa] p-4 shadow-[0_8px_30px_rgba(97,70,119,0.14)] transition-transform hover:rotate-0 duration-300">
            <div className="mb-2.5 flex items-center justify-between border-b border-[#e7e1ed] pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#91819e]">Target Role</span>
              <span className="rounded-md bg-[#e4daee] px-1.5 py-0.5 text-[10px] font-medium text-[#625181]">Clipped via Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0e7dc] text-xs font-bold text-[#5a704c]">
                AC
              </span>
              <div>
                <p className="text-xs font-semibold text-[#292a27]">Staff Systems Engineer</p>
                <p className="text-[11px] text-[#867891]">Acme Cloud • Remote</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-[#ede7f2] pt-2 text-[11px] text-[#554763]">
              <div className="font-medium text-[#3b2d49]">Required skills:</div>
              <div className="rounded bg-[#ece5f4] px-2 py-1 text-[10px] text-[#5d4672]">
                • Distributed consensus (Raft/Paxos)
              </div>
              <div className="rounded bg-[#ece5f4] px-2 py-1 text-[10px] text-[#5d4672]">
                • Go/Rust high-throughput pipelines
              </div>
              <div className="rounded bg-[#ece5f4] px-2 py-1 text-[10px] text-[#5d4672]">
                • Kubernetes cluster automation
              </div>
            </div>
          </div>

          {/* Tailored CV Card (tilted right) */}
          <div className="absolute right-4 lg:right-10 top-10 w-72 rotate-[2.5deg] rounded-xl border border-white bg-[#fffefa] p-5 shadow-[0_18px_44px_rgba(112,87,128,0.18)] transition-transform hover:rotate-0 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7e0f4] text-xs font-bold text-[#625181]">
                  AR
                </div>
                <div>
                  <p className="text-xs font-bold text-[#292a27]">Alex Rivera</p>
                  <p className="text-[10px] text-[#79628f]">Staff Systems Engineer</p>
                </div>
              </div>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200">
                Tailored Variant
              </span>
            </div>

            <div className="my-2.5 h-px bg-[#ece8df]" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#41423c]">
                <span>Aligned Highlights</span>
                <span className="text-[10px] text-[#625181] lowercase font-normal">diff applied</span>
              </div>

              <div className="rounded-md bg-[#f9f7fc] border border-[#e4dcf0] p-2 space-y-1 text-[10px]">
                <p className="text-[#3b2d49] font-medium leading-snug">
                  <span className="text-emerald-600 font-bold">✓</span> Prioritized Raft/Paxos consensus project to top of Experience
                </p>
                <p className="text-[#3b2d49] font-medium leading-snug">
                  <span className="text-emerald-600 font-bold">✓</span> Framed throughput metrics (250k req/s) matching job spec
                </p>
                <p className="text-[#796b86] leading-snug">
                  <span className="text-[#998baf]">•</span> Omitted unrelated mobile dev bullets to preserve 1-page density
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#f0ede6] flex items-center justify-between text-[10px] text-[#86877e]">
              <span>Master facts locked</span>
              <span className="font-medium text-[#625181]">Review before export</span>
            </div>
          </div>

          {/* Floating Confirmation Pill */}
          <div className="absolute bottom-4 left-6 lg:left-12 z-20 flex items-center gap-2 rounded-full border border-white bg-[#f8faf4] px-4 py-2 shadow-[0_6px_20px_rgba(96,73,118,0.12)]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#dbe8c8] text-[#55723b]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-[11px] font-medium text-[#4f5c38]">
              Truth preserved: 0 invented facts • 100% verifiable experience
            </span>
          </div>
        </div>
      </section>

      {/* ================= 2. SETUP VS REPEAT WORKFLOW COMPARISON ================= */}
      <section id="workflow" aria-labelledby="workflow-heading" className="space-y-6 scroll-mt-24">
        <div className="border-b border-[#e8e7e2] pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs font-medium text-[#73736b] mb-2">
            <span>THE WORKFLOW</span>
          </div>
          <h2 id="workflow-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading">
            Upfront setup once. One click for every job after.
          </h2>
          <p className="mt-1.5 text-sm text-[#73736b] max-w-2xl">
            Why spend hours manually rewriting bullet points for each job application? Set up your master career facts once, then tailor role-specific applications quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A: One-time setup */}
          <div className="rounded-2xl border border-[#e4e1d7] bg-[#fbfaf6] p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#ece8df]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#625181] font-mono">
                  Phase 1 • Initial Setup
                </span>
                <span className="rounded-md bg-[#e8e0f3] px-2 py-0.5 text-[11px] font-medium text-[#625181]">
                  First-Time Setup
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ececdf] text-xs font-bold text-[#5a624a] font-mono">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#292a27]">Import or enter your master facts</h3>
                    <p className="mt-1 text-xs text-[#73736b] leading-relaxed">
                      Load your complete work history, projects, metrics, and education once. This is your master vault of truthful experience.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ececdf] text-xs font-bold text-[#5a624a] font-mono">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#292a27]">Connect extension &amp; choose AI provider</h3>
                    <p className="mt-1 text-xs text-[#73736b] leading-relaxed">
                      Pair the browser extension with your local workspace and provide your API key (Anthropic, OpenAI, Groq, or local Ollama).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ece8df] text-xs text-[#8c8d81] flex items-center justify-between">
              <span>Saved in local browser storage</span>
              <span className="text-emerald-700 font-medium">✓ Ready for one-click tailoring</span>
            </div>
          </div>

          {/* Column B: Repeat one-click workflow */}
          <div className="rounded-2xl border border-[#ddd3e9] bg-[#f7f3fb] p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e6dced]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#625181] font-mono">
                  Phase 2 • Every Job
                </span>
                <span className="rounded-md bg-[#292a27] px-2 py-0.5 text-[11px] font-medium text-white">
                  Repeat Workflow
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4daf0] text-xs font-bold text-[#625181] font-mono">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#292a27]">Clip any posting with one click</h3>
                    <p className="mt-1 text-xs text-[#73736b] leading-relaxed">
                      Browse LinkedIn, Indeed, Greenhouse, or Lever. Tap the JobAI extension icon to extract the target role specification cleanly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4daf0] text-xs font-bold text-[#625181] font-mono">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#292a27]">Generate tailored draft variant</h3>
                    <p className="mt-1 text-xs text-[#73736b] leading-relaxed">
                      JobAI highlights your most relevant achievements and reorders bullet points to match role priorities without inventing facts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4daf0] text-xs font-bold text-[#625181] font-mono">
                    03
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#292a27]">Review diff &amp; export print-ready PDF</h3>
                    <p className="mt-1 text-xs text-[#73736b] leading-relaxed">
                      Inspect the changes side-by-side in your local editor, make any personal adjustments, and export crisp A4 or Letter PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#e6dced] text-xs text-[#8c8d81] flex items-center justify-between">
              <span>Zero blank-page staring</span>
              <span className="text-[#625181] font-medium">Never send a generic resume</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. WORKING FREE BROWSER TOOLS ================= */}
      <section id="toolkit" aria-labelledby="tools-heading" className="space-y-6 scroll-mt-24">
        <div className="border-b border-[#e8e7e2] pb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs font-medium text-[#73736b] mb-2">
              <span>TOOLKIT</span>
            </div>
            <h2 id="tools-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading">
              Toolkit
            </h2>
            <p className="mt-1 text-sm text-[#73736b] max-w-2xl">
              Inspect your resume bullet points for strong action verbs, quantifiable metrics, and print density. Instant, deterministic feedback with zero signup and zero data tracking.
            </p>
          </div>

          <div className="text-xs text-[#8c8d81] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Runs 100% locally in your browser</span>
          </div>
        </div>

        {/* Interactive Tool Card (shared with /toolkit/bullet-analyzer) */}
        <BulletAnalyzer />

        <div className="flex justify-end">
          <Link
            to="/toolkit"
            className="text-sm font-medium text-[#625181] hover:text-[#9782d8] transition-colors"
          >
            See all tools →
          </Link>
        </div>
      </section>

      {/* ================= 4. FEATURED TEMPLATES SHOWCASE ================= */}
      <section id="templates" aria-labelledby="gallery-heading" className="space-y-6 scroll-mt-24 min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e8e7e2] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 id="gallery-heading" className="text-2xl font-semibold tracking-tight text-[#292a27] font-heading">
                Print-Ready CV Templates
              </h2>
              <span className="rounded-full bg-[#e8e0f3] px-2.5 py-0.5 text-xs font-medium text-[#625181] border border-[#ddd3e9]">
                20 Professional Layouts
              </span>
            </div>
            <p className="mt-1 text-xs text-[#73736b]">
              Engineered with native CSS @page rules for crisp PDF generation and structured readability.
            </p>
          </div>

          <Link
            to="/templates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#625181] hover:text-[#292a27] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9782d8] focus-visible:ring-offset-2 rounded-sm"
          >
            <span>View all in template catalog</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div
          className="flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1 min-w-0 md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
          role="list"
          aria-label="Featured CV templates"
        >
          {FEATURED_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              role="listitem"
              className="snap-start shrink-0 w-[72%] max-w-[16.5rem] min-w-0 md:w-auto md:max-w-none"
            >
              <Link
                to="/templates"
                data-featured-template={tmpl.id}
                className="group flex h-full flex-col rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-4 transition hover:border-[#c9bcd9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9782d8] focus-visible:ring-offset-2"
              >
                <div className="mb-3 flex h-36 flex-col justify-between overflow-hidden rounded-xl border border-[#e8e7e2] bg-[#faf9f6] p-3 shadow-2xs">
                  <TemplateThumbnail layout={tmpl.layout} templateId={tmpl.id} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium font-heading text-[#292a27]">{tmpl.name}</h3>
                  <span className="shrink-0 rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] text-[#63645b]">
                    {tmpl.category}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            to="/templates"
            className="text-sm font-medium text-[#625181] hover:text-[#9782d8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9782d8] focus-visible:ring-offset-2 rounded-sm"
          >
            Browse all templates →
          </Link>
        </div>
      </section>

      {/* ================= 5. AI FREEDOM & TRANSPARENT PRICING ================= */}
      <section id="ai-freedom" aria-labelledby="ai-heading" className="space-y-6 scroll-mt-24">
        <div className="border-b border-[#e8e7e2] pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs font-medium text-[#73736b] mb-2">
            <span>BYOK &amp; LOCAL LLM FREEDOM</span>
          </div>
          <h2 id="ai-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading">
            AI Freedom. Use your preferred provider, or run local.
          </h2>
          <p className="mt-1.5 text-sm text-[#73736b] max-w-2xl">
            No locked proprietary models. No subscription markups. Connect your own API key to access wholesale intelligence, or run completely offline with local Ollama models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: BYOK Providers */}
          <div className="rounded-2xl border border-[#e4e1d7] bg-[#fffefa] p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8e0f3] text-[#625181] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#292a27] font-heading">
                Bring Your Own Key (BYOK)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#73736b]">
                Plug in Anthropic (Claude 3.5 Sonnet), OpenAI (GPT-4o), Groq (Llama 3.3 70B), or Mistral directly. Your credentials remain on your local machine with strict file permissions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#f0efe9] text-[11px] text-[#625181] font-medium">
              Official API endpoints only
            </div>
          </div>

          {/* Card 2: Wholesale Pricing Transparency */}
          <div className="rounded-2xl border border-[#e4e1d7] bg-[#fffefa] p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0ecdf] text-[#446b5a] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#292a27] font-heading">
                Wholesale Pricing Transparency
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#73736b]">
                Pay your model provider directly at raw wholesale token rates — token costs vary by provider and prompt length. JobAI adds zero markup and zero recurring monthly fees.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#f0efe9] text-[11px] text-[#446b5a] font-medium">
              Zero subscription markups
            </div>
          </div>

          {/* Card 3: Local Offline LLMs */}
          <div className="rounded-2xl border border-[#e4e1d7] bg-[#fffefa] p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3e8ee] text-[#48637e] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#292a27] font-heading">
                Local Ollama &amp; Offline Models
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#73736b]">
                Prefer zero network calls? Connect to Ollama, LM Studio, or any local OpenAI-compatible endpoint running directly on your computer.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#f0efe9] text-[11px] text-[#48637e] font-medium">
              100% offline option supported
            </div>
          </div>
        </div>

        {/* Transparent Processing Disclosure Callout */}
        <div className="rounded-2xl border border-[#dedcd2] bg-[#f8f7f2] p-5 sm:p-6 text-xs text-[#6e6f66] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-semibold text-[#292a27]">Truthful Data Transmission Disclosure:</span>
            <p className="leading-relaxed">
              Master CV data lives in your browser's local storage. When you click tailor, only the target job text and relevant CV sections are sent to your configured AI endpoint. Data is never resold or used to train third-party models.
            </p>
          </div>
          <Link
            to="/app/settings/ai"
            className="shrink-0 rounded-lg border border-[#d8d6cc] bg-white px-3.5 py-2 text-xs font-medium text-[#292a27] hover:bg-[#edece4] transition"
          >
            Configure AI in Settings →
          </Link>
        </div>
      </section>

      {/* ================= 6. RESTRAINED LAVENDER EXTENSION PANEL ================= */}
      <section
        id="extension"
        aria-labelledby="extension-heading"
        className="rounded-3xl border border-[#ddd3e9] bg-[#f4effa] p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8 scroll-mt-24"
      >
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/50 px-3 py-1 text-xs font-medium text-[#79628f]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>BROWSER EXTENSION COMPANION</span>
          </div>

          <h2 id="extension-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#393040] font-heading">
            Pair extension. Clip listings with zero cloud leak.
          </h2>

          <p className="text-sm leading-relaxed text-[#685775]">
            Our lightweight Chrome extension captures job postings directly from LinkedIn, Indeed, Greenhouse, and Lever, handing the job spec safely to your local JobAI server via a secure token.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#796788]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>CSRF-protected pairing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>Strict localhost loopback</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#625181]"></span>
              <span>Zero telemetry</span>
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 rounded-xl bg-[#292a27] px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#41423c] transition"
          >
            <span>Extension setup guide</span>
            <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ================= 7. ADVICE & GUIDES ARCHIVE ================= */}
      <section id="resources" aria-labelledby="blog-heading" className="space-y-6 scroll-mt-24 mt-8 sm:mt-0">
        <div className="flex items-end justify-between border-b border-[#e8e7e2] pb-4">
          <div>
            <h2 id="blog-heading" className="text-2xl font-semibold tracking-tight text-[#292a27] font-heading">
              From the Advice &amp; Guides archive
            </h2>
            <p className="mt-1 text-sm text-[#73736b]">
              Practical, honest guides on resume craft, ATS systems, and tailoring strategy.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#625181] hover:text-[#292a27] transition"
          >
            <span>Read all articles</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogArticles.map((article) => (
            <article
              key={article.slug}
              className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 flex flex-col justify-between shadow-2xs hover:border-[#c9bcd9] transition"
            >
              <div>
                <span className="text-[11px] font-mono text-[#919187] uppercase tracking-wider">
                  {article.readingTime}
                </span>
                <h3 className="mt-2.5 text-base font-semibold text-[#292a27] font-heading line-clamp-2">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: article.slug }}
                    className="hover:text-[#625181] transition-colors"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-2.5 text-xs text-[#73736b] leading-relaxed line-clamp-3">
                  {article.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f0efe9]">
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#625181] hover:text-[#292a27] transition"
                >
                  <span>Read guide</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================= 8. STRONG FINAL CONVERSION CTA ================= */}
      <section
        aria-labelledby="cta-heading"
        className="rounded-3xl border border-[#e4e1d7] bg-[#f5f3eb] p-8 sm:p-14 text-center space-y-5"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d5cb] bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-[#625181]">
          <span>GET STARTED NOW</span>
        </div>

        <h2 id="cta-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#292a27] font-heading max-w-xl mx-auto">
          Start building your tailored CV today.
        </h2>

        <p className="text-sm text-[#73736b] max-w-md mx-auto leading-relaxed">
          Import your master career facts once. Generate truthful, role-matched applications without manual rewriting.
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/app"
            search={{ view: "editor" }}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#292a27] px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#41423c] transition focus-visible:ring-2 focus-visible:ring-[#9782d8]"
          >
            <span>Create your CV</span>
            <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            to="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8d6ce] bg-white/70 px-5 py-3.5 text-sm font-medium text-[#463853] hover:bg-white transition"
          >
            <span>Explore templates</span>
          </Link>
        </div>

        <p className="text-[11px] text-[#9a9a91] pt-2">
          Free to use with your own API key • No subscription required • Full export freedom
        </p>
      </section>
    </div>
  );
}
