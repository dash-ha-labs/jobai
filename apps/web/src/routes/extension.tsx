import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { PageLayout } from "../components/PageLayout";

export const Route = createFileRoute("/extension")({
  component: ExtensionMarketingComponent,
});

const DOWNLOAD_HREF = "/downloads/jobai-extension.zip";

function ExtensionMarketingComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      <PageLayout variant="fixed" className="space-y-12">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)]/60 px-3.5 py-1 text-xs font-semibold text-[var(--ui-accent)] uppercase tracking-wider">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Optional browser companion</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#191b20] font-heading leading-tight">
            Tailor a CV from a job listing, right in your browser.
          </h1>
          <p className="text-base sm:text-lg text-[#636c7a] leading-relaxed">
            The optional JobAI companion extension reads job descriptions from LinkedIn, Indeed,
            Greenhouse, and Lever, then shares them with your local JobAI app on{" "}
            <code className="text-xs bg-[#f1f3f6] font-mono px-1.5 py-0.5 rounded border border-[#e3e6eb] text-[#191b20]">
              127.0.0.1:3000
            </code>
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 pt-2 justify-center sm:justify-start">
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-2 rounded-xl bg-[#191b20] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3f4753] transition cursor-pointer"
          >
            <span>See optional setup</span>
            <svg className="w-4 h-4 text-[var(--ui-accent-line)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={DOWNLOAD_HREF}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-[#c5cbd4] bg-white px-5 py-3.5 text-sm font-medium text-[#191b20] hover:bg-[#f1f3f6] transition"
          >
            <svg className="w-4 h-4 text-[#636c7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download extension (.zip)</span>
          </a>
        </div>

        {/* Security / Privacy Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#636c7a] justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Runs with your local app</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Your CV stays on your computer</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>One-time connection code</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>No usage tracking</span>
          </span>
        </div>
      </section>

      {/* ================= 2. FEATURE PILLARS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1 */}
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-line)] flex items-center justify-center text-[var(--ui-accent)] font-semibold text-lg">
            ⚡
          </div>
          <h2 className="text-base font-semibold text-[#191b20] font-heading">
            1-Click Job Clipping
          </h2>
          <p className="text-xs text-[#636c7a] leading-relaxed">
            Extract clean titles, company details, responsibilities, and qualification requirements
            directly from LinkedIn, Indeed, Greenhouse, Lever, and Ashby with one click.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#f1f3f6] border border-[#e3e6eb] flex items-center justify-center text-[var(--ui-accent)] font-semibold text-lg">
            🔒
          </div>
          <h2 className="text-base font-semibold text-[#191b20] font-heading">
            Zero Cloud Leak
          </h2>
          <p className="text-xs text-[#636c7a] leading-relaxed">
            Job postings, personal CV records, and tailored outputs never transit to an external
            cloud database. All data exchanges stay locked to your local machine.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#f1f3f6] border border-[#e3e6eb] flex items-center justify-center text-[var(--ui-accent)] font-semibold text-lg">
            🎯
          </div>
          <h2 className="text-base font-semibold text-[#191b20] font-heading">
            One-Click Tailoring
          </h2>
          <p className="text-xs text-[#636c7a] leading-relaxed">
            Match your verified Master CV experience to the target position instantly. Generate
            grounded bullet adaptations without ever fabricating credentials.
          </p>
        </div>
      </section>

      {/* ================= 3. ARCHITECTURE PANEL ================= */}
      <section className="rounded-3xl border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)] p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-accent)]">
            How it works
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ui-accent-hover)] font-heading">
            Your browser and JobAI work together locally
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ui-accent-hover)] leading-relaxed">
            When you choose to tailor a listing, the extension reads its visible details and passes them to the JobAI app running on your computer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-[var(--ui-accent-line)] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[var(--ui-accent)]">Step 1</span>
            <p className="text-xs font-medium text-[#191b20]">1. Pick a listing</p>
            <p className="text-[11px] text-[#636c7a] leading-relaxed">
              Choose a job page and ask the extension to read its details.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--ui-accent-line)] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[var(--ui-accent)]">Step 2</span>
            <p className="text-xs font-medium text-[#191b20]">2. Match your experience</p>
            <p className="text-[11px] text-[#636c7a] leading-relaxed">
              The listing is shared with JobAI on your computer through a one-time connection.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--ui-accent-line)] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[var(--ui-accent)]">Step 3</span>
            <p className="text-xs font-medium text-[#191b20]">3. Review your CV</p>
            <p className="text-[11px] text-[#636c7a] leading-relaxed">
              JobAI prepares a tailored draft from your saved CV for you to review.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4. HOW TO GET STARTED ================= */}
      <section className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-[#e3e6eb] pb-4">
          <h2 className="text-xl font-semibold text-[#191b20] font-heading">
            Get started in 3 simple steps
          </h2>
          <p className="text-xs text-[#636c7a] mt-1">
            The main JobAI app works without this. Add the extension when you want to start from a browser listing.
          </p>
        </div>

        <div className="space-y-4 text-xs text-[#636c7a]">
          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#191b20] text-xs font-bold text-white">
              1
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#191b20]">Load Extension in Chrome</p>
              <p className="leading-relaxed">
                Open <code className="font-mono bg-[#f1f3f6] px-1 rounded border border-[#e3e6eb]">chrome://extensions</code>,
                toggle <strong>Developer mode ON</strong>, click <strong>Load unpacked</strong>, and select{" "}
                <code className="font-mono bg-[#f1f3f6] px-1 rounded border border-[#e3e6eb]">apps/extension/dist</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#191b20] text-xs font-bold text-white">
              2
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#191b20]">Generate One-Time Pairing Code</p>
              <p className="leading-relaxed">
                Visit the pairing workspace at <Link to="/app/extension" className="text-[var(--ui-accent)] hover:underline font-medium">/app/extension</Link> and generate your 6-digit expiring token.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#191b20] text-xs font-bold text-white">
              3
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#191b20]">Start Tailoring on Job Boards</p>
              <p className="leading-relaxed">
                Click the JobAI extension icon while viewing any job listing on LinkedIn, Indeed, or Ashby to tailor your CV.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#e3e6eb] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#8b939f]">
            Ready to connect?
          </span>
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-hover)] transition"
          >
            <span>Open App to Pair</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ================= 5. FOOTER CALLOUT ================= */}
      <section className="rounded-3xl border border-[#e3e6eb] bg-[#f7f8fa] p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#191b20] font-heading">
          Ready to experience seamless, private CV tailoring?
        </h2>
        <p className="text-xs sm:text-sm text-[#636c7a] max-w-lg mx-auto leading-relaxed">
          Open the workspace pairing screen to connect your browser in under 60 seconds.
        </p>
        <div className="pt-2 flex justify-center">
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-2 rounded-xl bg-[#191b20] px-6 py-3 text-sm font-medium text-white shadow-xs hover:bg-[#3f4753] transition"
          >
            <span>Open App to Pair</span>
            <svg className="w-4 h-4 text-[var(--ui-accent-line)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
      </PageLayout>
    </motion.div>
  );
}
