import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

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
      className="max-w-5xl mx-auto w-full space-y-12 py-4 sm:py-8"
    >
      {/* ================= 1. HERO SECTION ================= */}
      <section className="space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3e9] bg-[#e8e0f3]/60 px-3.5 py-1 text-xs font-semibold text-[#625181] uppercase tracking-wider">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Browser Extension Companion</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#292a27] font-heading leading-tight">
            Clip listings with zero cloud leak. Strict localhost loopback.
          </h1>
          <p className="text-base sm:text-lg text-[#73736b] leading-relaxed">
            Tailor your CV for any job posting directly from your browser. The JobAI companion
            extension captures job descriptions from LinkedIn, Indeed, Greenhouse, and Lever,
            communicating strictly with your private local JobAI workspace on{" "}
            <code className="text-xs bg-[#f5f4f0] font-mono px-1.5 py-0.5 rounded border border-[#e4e3dd] text-[#292a27]">
              127.0.0.1:3000
            </code>
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 pt-2 justify-center sm:justify-start">
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-2 rounded-xl bg-[#292a27] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#41423c] transition cursor-pointer"
          >
            <span>Open App to Pair</span>
            <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={DOWNLOAD_HREF}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8d6cc] bg-white px-5 py-3.5 text-sm font-medium text-[#292a27] hover:bg-[#f5f4ef] transition"
          >
            <svg className="w-4 h-4 text-[#73736b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download extension (.zip)</span>
          </a>
        </div>

        {/* Security / Privacy Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#73736b] justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Strict localhost loopback</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Zero cloud leak</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>CSRF-protected pairing code</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Zero telemetry</span>
          </span>
        </div>
      </section>

      {/* ================= 2. FEATURE PILLARS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1 */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#e8e0f3] border border-[#ddd3e9] flex items-center justify-center text-[#625181] font-semibold text-lg">
            ⚡
          </div>
          <h2 className="text-base font-semibold text-[#292a27] font-heading">
            1-Click Job Clipping
          </h2>
          <p className="text-xs text-[#73736b] leading-relaxed">
            Extract clean titles, company details, responsibilities, and qualification requirements
            directly from LinkedIn, Indeed, Greenhouse, Lever, and Ashby with one click.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] border border-[#ebe8e1] flex items-center justify-center text-[#625181] font-semibold text-lg">
            🔒
          </div>
          <h2 className="text-base font-semibold text-[#292a27] font-heading">
            Zero Cloud Leak
          </h2>
          <p className="text-xs text-[#73736b] leading-relaxed">
            Job postings, personal CV records, and tailored outputs never transit to an external
            cloud database. All data exchanges stay locked to your local machine.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#eeeadd] border border-[#e1dccd] flex items-center justify-center text-[#625181] font-semibold text-lg">
            🎯
          </div>
          <h2 className="text-base font-semibold text-[#292a27] font-heading">
            One-Click Tailoring
          </h2>
          <p className="text-xs text-[#73736b] leading-relaxed">
            Match your verified Master CV experience to the target position instantly. Generate
            grounded bullet adaptations without ever fabricating credentials.
          </p>
        </div>
      </section>

      {/* ================= 3. ARCHITECTURE PANEL ================= */}
      <section className="rounded-3xl border border-[#ddd3e9] bg-[#f4effa] p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#79628f]">
            Local-First Architecture
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[#393040] font-heading">
            How the localhost loopback works
          </h2>
          <p className="text-xs sm:text-sm text-[#685775] leading-relaxed">
            Unlike traditional job extensions that send your browsing activity to remote telemetry servers,
            the JobAI extension operates entirely through a secure local bridge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-[#ddd3e9] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[#625181]">Step 1</span>
            <p className="text-xs font-medium text-[#292a27]">Active Tab Extraction</p>
            <p className="text-[11px] text-[#73736b] leading-relaxed">
              Native content script reads the active job posting DOM client-side when requested.
            </p>
          </div>

          <div className="rounded-xl border border-[#ddd3e9] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[#625181]">Step 2</span>
            <p className="text-xs font-medium text-[#292a27]">Local Loopback Transfer</p>
            <p className="text-[11px] text-[#73736b] leading-relaxed">
              Job payload is sent over localhost (127.0.0.1:3000) using a CSRF-enforced bearer code.
            </p>
          </div>

          <div className="rounded-xl border border-[#ddd3e9] bg-white/70 p-4 space-y-1.5">
            <span className="text-xs font-bold text-[#625181]">Step 3</span>
            <p className="text-xs font-medium text-[#292a27]">Private Tailoring</p>
            <p className="text-[11px] text-[#73736b] leading-relaxed">
              Local JobAI server analyzes requirements against your Master CV and crafts tailored drafts.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4. HOW TO GET STARTED ================= */}
      <section className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-[#e8e7e2] pb-4">
          <h2 className="text-xl font-semibold text-[#292a27] font-heading">
            Get started in 3 simple steps
          </h2>
          <p className="text-xs text-[#73736b] mt-1">
            Install the extension unpacked in Chrome and pair it with your local JobAI instance.
          </p>
        </div>

        <div className="space-y-4 text-xs text-[#73736b]">
          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#30332d] text-xs font-bold text-white">
              1
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#292a27]">Load Extension in Chrome</p>
              <p className="leading-relaxed">
                Open <code className="font-mono bg-[#f5f4f0] px-1 rounded border border-[#e4e3dd]">chrome://extensions</code>,
                toggle <strong>Developer mode ON</strong>, click <strong>Load unpacked</strong>, and select{" "}
                <code className="font-mono bg-[#f5f4f0] px-1 rounded border border-[#e4e3dd]">apps/extension/dist</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#30332d] text-xs font-bold text-white">
              2
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#292a27]">Generate One-Time Pairing Code</p>
              <p className="leading-relaxed">
                Visit the pairing workspace at <Link to="/app/extension" className="text-[#625181] hover:underline font-medium">/app/extension</Link> and generate your 6-digit expiring token.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#30332d] text-xs font-bold text-white">
              3
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-[#292a27]">Start Tailoring on Job Boards</p>
              <p className="leading-relaxed">
                Click the JobAI extension icon while viewing any job listing on LinkedIn, Indeed, or Ashby to tailor your CV.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#e8e7e2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#92928a]">
            Ready to connect?
          </span>
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-1.5 font-semibold text-[#625181] hover:text-[#4b3c66] transition"
          >
            <span>Open App to Pair</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ================= 5. FOOTER CALLOUT ================= */}
      <section className="rounded-3xl border border-[#e4e1d7] bg-[#f5f3eb] p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#292a27] font-heading">
          Ready to experience seamless, private CV tailoring?
        </h2>
        <p className="text-xs sm:text-sm text-[#73736b] max-w-lg mx-auto leading-relaxed">
          Open the workspace pairing screen to connect your browser in under 60 seconds.
        </p>
        <div className="pt-2 flex justify-center">
          <Link
            to="/app/extension"
            className="inline-flex items-center gap-2 rounded-xl bg-[#292a27] px-6 py-3 text-sm font-medium text-white shadow-xs hover:bg-[#41423c] transition"
          >
            <span>Open App to Pair</span>
            <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
