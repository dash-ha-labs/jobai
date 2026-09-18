import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { validateJobHandoff, saveDraft } from "jobai-shared";
import type { JobHandoffPayload, JobMetadata } from "jobai-shared";

export const Route = createFileRoute("/import-job")({
  component: ImportJobComponent,
});

const MAX_FRAGMENT_LENGTH = 400000;

function ImportJobComponent() {
  const shouldReduceMotion = useReducedMotion();
  const [job, setJob] = useState<JobHandoffPayload | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [hasFragment, setHasFragment] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === "#") {
      // Clean migration: redirect no-fragment visitors to /extension
      window.location.replace("/extension");
      return;
    }

    setHasFragment(true);

    // 1. Enforce max fragment limit (<= 400000 chars)
    if (hash.length > MAX_FRAGMENT_LENGTH) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setJob(null);
      setErrors([`Job payload exceeds maximum safety size limit.`]);
      return;
    }

    // 2. Immediately strip fragment from URL
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    // 3. Extract job param from #job=... or #...
    let rawEncoded = "";
    if (hash.startsWith("#job=")) {
      rawEncoded = hash.slice(5);
    } else {
      const match = hash.slice(1).match(/(?:^|&)job=([^&]*)/);
      if (match && match[1]) {
        rawEncoded = match[1];
      } else {
        setJob(null);
        setErrors(["Malformed URL payload parameter."]);
        return;
      }
    }

    // 4. Decode URI component safely
    let decodedJson = "";
    try {
      decodedJson = decodeURIComponent(rawEncoded);
    } catch {
      setJob(null);
      setErrors(["Failed to decode job data."]);
      return;
    }

    // 5. Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(decodedJson);
    } catch {
      setJob(null);
      setErrors(["Invalid job data format."]);
      return;
    }

    // 6. Validate bounds & schema
    const validation = validateJobHandoff(parsed);
    if (!validation.valid || !validation.data) {
      setJob(null);
      setErrors(validation.errors);
      return;
    }

    setJob(validation.data);
    setErrors([]);
  }, []);

  const handleSaveAsDraft = () => {
    if (!job) return;
    const draftId = `draft-${Date.now()}`;
    const draft: JobMetadata = {
      id: draftId,
      masterId: "master-default",
      jobTitle: job.title,
      company: job.company,
      sourceUrl: job.sourceUrl,
      jobText: job.text,
      createdAt: new Date().toISOString(),
    };
    const res = saveDraft(draft);
    if (res.success) {
      setSavedDraftId(draftId);
    } else {
      setErrors([res.error ?? "Failed to save draft locally"]);
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Import Migration</h1>
        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
          Job import is now handled directly by the JobAI browser extension.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <span>⚠️</span> Import Could Not Be Completed
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <div className="pt-2">
            <Link to="/extension" className="text-xs text-red-800 underline font-semibold">
              Go to Extension Setup &rarr;
            </Link>
          </div>
        </div>
      )}

      {savedDraftId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between">
          <span>Draft saved successfully to your local browser storage.</span>
          <Link to="/drafts" className="font-semibold underline hover:text-emerald-900">
            View in Applications &rarr;
          </Link>
        </div>
      )}

      {/* Migration screen when no fragment was passed */}
      {!hasFragment && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 text-xl font-bold">
            🔗
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Direct Browser Extension Integration</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            The standalone fragment handoff page has been retired. The JobAI Chrome extension now extracts job postings and tailors your CV directly using your paired local server.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/extension"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              Go to Extension Setup &rarr;
            </a>
            <Link
              to="/drafts"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              View Saved Applications
            </Link>
          </div>
        </div>
      )}

      {/* Legacy fragment preview if job payload was present */}
      {job && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 divide-y divide-slate-100">
          <div className="p-6 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Transferred Job
            </span>
            <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
            <p className="text-sm font-medium text-slate-700">{job.company}</p>
            <div className="text-xs text-slate-500">
              Source: <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{job.sourceUrl}</a>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 flex items-center justify-between gap-4 rounded-b-xl">
            <Link to="/extension" className="text-xs text-slate-500 hover:text-slate-700 underline">
              Use extension directly &rarr;
            </Link>
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              Save as Draft
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}