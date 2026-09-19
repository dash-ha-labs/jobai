import { useMemo, useState } from "react";

// CV Bullet Impact & Readability Analyzer — extracted verbatim from the
// homepage inline section so the homepage teaser and /toolkit/bullet-analyzer
// share one tool implementation.

const presetBullets = [
  {
    label: "Strong Technical Impact",
    text: "Engineered distributed caching layer in Go, reducing p99 query latency by 42% across 12M daily active users.",
  },
  {
    label: "Passive / Weak Verb",
    text: "Responsible for managing a team of 4 engineers and worked on improving database query performance.",
  },
  {
    label: "Vague / Missing Metrics",
    text: "Helped with marketing campaigns and increased sales for the company during the quarter.",
  },
];

export function BulletAnalyzer({ showTitle = true }: { showTitle?: boolean }) {
  const [bulletInput, setBulletInput] = useState<string>(presetBullets[0].text);

  // Client-side real analysis engine
  const bulletAnalysis = useMemo(() => {
    const text = bulletInput.trim();
    if (!text) {
      return null;
    }

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Verb analysis
    const strongVerbs = [
      "engineered", "architected", "spearheaded", "designed", "built", "reduced",
      "accelerated", "streamlined", "orchestrated", "developed", "deployed",
      "launched", "led", "managed", "created", "implemented", "automated",
      "increased", "transformed", "resolved", "optimized", "delivered", "mentored",
    ];

    const weakVerbs = [
      "responsible for", "worked on", "helped with", "assisted with", "assisted",
      "handled", "participated in", "involved in", "tasked with", "was part of",
    ];

    const lower = text.toLowerCase();
    const leadingWord = (words[0] || "").toLowerCase().replace(/[^a-z]/g, "");

    let hasWeakLeading = false;
    let detectedWeakPhrase = "";
    for (const phrase of weakVerbs) {
      if (lower.startsWith(phrase)) {
        hasWeakLeading = true;
        detectedWeakPhrase = phrase;
        break;
      }
    }

    const hasStrongLeading = strongVerbs.includes(leadingWord);

    // Number & metric detection (%, $, €, £, digits, X multipliers, k/m suffixes)
    const metricRegex = /\b(\d+[\d,.]*|\$\d+|\€\d+|\£\d+|\d+%\b|\d+[xX]\b|\d+[kKmMbB]\+?)/
    const hasMetric = metricRegex.test(text);

    // Length assessment (optimal print bullet is 12-24 words)
    let lengthAssessment: { status: "optimal" | "short" | "long"; note: string };
    if (wordCount < 10) {
      lengthAssessment = {
        status: "short",
        note: "Brief (<10 words) — consider adding quantifiable scope or context.",
      };
    } else if (wordCount > 28) {
      lengthAssessment = {
        status: "long",
        note: "Long (>28 words) — risk of wrapping to 3 lines on standard A4 print margins in most layouts.",
      };
    } else {
      lengthAssessment = {
        status: "optimal",
        note: "Optimal length (10–28 words) — fits standard 1–2 line print rhythm.",
      };
    }

    return {
      wordCount,
      hasStrongLeading,
      leadingWord,
      hasWeakLeading,
      detectedWeakPhrase,
      hasMetric,
      lengthAssessment,
    };
  }, [bulletInput]);

  return (
    <div className="rounded-3xl border border-[#e2ded5] bg-[#fffefa] p-6 sm:p-8 shadow-sm space-y-6">
      {showTitle && (
        <h3 className="text-lg font-semibold tracking-tight text-[#292a27] font-heading">
          CV Bullet Impact &amp; Readability Analyzer
        </h3>
      )}
      {/* Preset Buttons */}
      <div>
        <p className="text-xs font-semibold text-[#73736b] uppercase tracking-wider mb-2.5">
          Try a preset sample bullet:
        </p>
        <div className="flex flex-wrap gap-2">
          {presetBullets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setBulletInput(preset.text)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                bulletInput === preset.text
                  ? "bg-[#292a27] text-white"
                  : "bg-[#f4f3ee] text-[#55564e] hover:bg-[#e8e7e0]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input Area */}
      <div className="space-y-2">
        <label htmlFor="bullet-input" className="block text-xs font-medium text-[#41423c]">
          Bullet point text to inspect:
        </label>
        <textarea
          id="bullet-input"
          rows={3}
          value={bulletInput}
          onChange={(e) => setBulletInput(e.target.value)}
          placeholder="Paste an experience bullet point..."
          className="w-full rounded-xl border border-[#dcd9ce] bg-[#faf9f6] p-3.5 text-sm text-[#292a27] focus:border-[#9782d8] focus:outline-none focus:ring-1 focus:ring-[#9782d8] transition leading-relaxed font-sans"
        />
      </div>

      {/* Analysis Feedback Panel */}
      {bulletAnalysis && (
        <div className="rounded-2xl border border-[#e8e5dc] bg-[#f8f7f2] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8e5dc] pb-3">
            <span className="text-xs font-semibold text-[#292a27] uppercase tracking-wider font-heading">
              Pre-Flight Analysis Results
            </span>
            <span className="text-xs text-[#73736b] font-mono">
              {bulletAnalysis.wordCount} words
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Check 1: Action Verb */}
            <div className="rounded-xl border border-[#e4e1d7] bg-white p-3.5 space-y-1.5">
              <div className="text-[11px] font-medium text-[#73736b]">Action Verb</div>
              {bulletAnalysis.hasWeakLeading ? (
                <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <span>⚠ Passive phrasing:</span>
                  <span className="font-mono underline">"{bulletAnalysis.detectedWeakPhrase}"</span>
                </div>
              ) : bulletAnalysis.hasStrongLeading ? (
                <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span>✓ Strong action verb:</span>
                  <span className="font-mono">"{bulletAnalysis.leadingWord}"</span>
                </div>
              ) : (
                <div className="text-xs font-medium text-[#625181]">
                  Starts with: <span className="font-mono">"{bulletAnalysis.leadingWord}"</span>
                </div>
              )}
              <p className="text-[10px] text-[#8c8d81]">
                {bulletAnalysis.hasWeakLeading
                  ? "Replace with an active verb (e.g. Orchestrated, Engineered, Directed)."
                  : "Lead with what you specifically performed, built, or delivered."}
              </p>
            </div>

            {/* Check 2: Quantified Metrics */}
            <div className="rounded-xl border border-[#e4e1d7] bg-white p-3.5 space-y-1.5">
              <div className="text-[11px] font-medium text-[#73736b]">Quantified Metrics</div>
              {bulletAnalysis.hasMetric ? (
                <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span>✓ Quantifiable impact detected</span>
                </div>
              ) : (
                <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <span>⚠ No numbers or metrics found</span>
                </div>
              )}
              <p className="text-[10px] text-[#8c8d81]">
                {bulletAnalysis.hasMetric
                  ? "Verifiable figures (percentages, latency, throughput) prove real contribution."
                  : "Add scale (e.g., team size, latency drop %, dollar savings, volume)."}
              </p>
            </div>

            {/* Check 3: Print Length & Density */}
            <div className="rounded-xl border border-[#e4e1d7] bg-white p-3.5 space-y-1.5">
              <div className="text-[11px] font-medium text-[#73736b]">Print Layout Fit</div>
              <div
                className={`text-xs font-semibold ${
                  bulletAnalysis.lengthAssessment.status === "optimal"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {bulletAnalysis.lengthAssessment.status === "optimal" ? "✓ Balanced print density" : "⚠ Check length"}
              </div>
              <p className="text-[10px] text-[#8c8d81]">
                {bulletAnalysis.lengthAssessment.note}
              </p>
            </div>
          </div>

          {/* Polish Recommendation Formula */}
          <div className="pt-2 text-xs text-[#52534a] bg-white/70 rounded-xl p-3 border border-[#e8e6df]">
            <span className="font-semibold text-[#292a27]">Proven Formula: </span>
            <span className="font-mono text-[#625181]">[Strong Action Verb]</span> +{" "}
            <span className="font-mono text-[#446b5a]">[Technical Context / Scope]</span> +{" "}
            <span className="font-mono text-[#79628f]">[Quantified Business Result]</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulletAnalyzer;
