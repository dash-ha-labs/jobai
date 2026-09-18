import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { loadDrafts, deleteDraft, type JobMetadata, type CV } from "jobai-shared";
import { Editor } from "../components/Editor";
import { Preview } from "../components/Preview";

interface SearchParams {
  id?: string;
}

export const Route = createFileRoute("/drafts")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: ApplicationsComponent,
});

export function ApplicationsComponent() {
  const shouldReduceMotion = useReducedMotion();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState<JobMetadata[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Single draft editor state (when ?id=... is present)
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const [draftCv, setDraftCv] = useState<CV | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);

  const refreshDrafts = async () => {
    // 1. Load browser localStorage drafts
    const res = loadDrafts();
    if (!res.success && res.error) {
      setStorageError(res.error);
    } else {
      setStorageError(null);
    }
    const localDrafts = res.data || [];

    // 2. Load server drafts
    let serverDrafts: any[] = [];
    try {
      const serverRes = await fetch("/api/drafts", {
        headers: { "x-jobai-csrf": "1" },
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        serverDrafts = data.drafts || [];
      }
    } catch {
      // Server may be offline
    }

    // Merge by id
    const mergedMap = new Map<string, JobMetadata>();
    for (const d of localDrafts) {
      mergedMap.set(d.id, d);
    }
    for (const sd of serverDrafts) {
      mergedMap.set(sd.id, {
        id: sd.id,
        masterId: sd.masterId || "master-default",
        jobTitle: sd.jobTitle,
        company: sd.company,
        sourceUrl: sd.sourceUrl,
        jobText: sd.jobText,
        createdAt: sd.createdAt,
        proposedCV: sd.tailoredCV,
        changes: sd.changes,
      });
    }

    setDrafts(Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    refreshDrafts();
  }, []);

  // When search.id changes, load the active draft from server
  useEffect(() => {
    if (!search.id) {
      setActiveDraft(null);
      setDraftCv(null);
      return;
    }

    setDraftLoading(true);
    setDraftSaveError(null);

    (async () => {
      try {
        const res = await fetch(`/api/drafts/${search.id}`, {
          headers: { "x-jobai-csrf": "1" },
        });
        if (!res.ok) {
          throw new Error(`Draft ${search.id} not found on server.`);
        }
        const data = await res.json();
        setActiveDraft(data.draft);
        setDraftCv(data.draft.tailoredCV);
      } catch (err: any) {
        setDraftSaveError(err?.message || "Failed to load draft");
      } finally {
        setDraftLoading(false);
      }
    })();
  }, [search.id]);

  const handleDelete = (id: string) => {
    deleteDraft(id);
    refreshDrafts();
  };

  const handleSaveDraftVersion = async () => {
    if (!search.id || !draftCv) return;
    setDraftSaveStatus("saving");
    setDraftSaveError(null);

    try {
      const res = await fetch(`/api/drafts/${search.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-jobai-csrf": "1",
        },
        body: JSON.stringify({ cv: draftCv }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save draft version");
      }

      setDraftSaveStatus("saved");
    } catch (err: any) {
      setDraftSaveStatus("unsaved");
      setDraftSaveError(err?.message || "Failed to update draft");
    }
  };

  const handleDownloadPdf = () => {
    if (!search.id) return;
    window.open(`/api/pdf/${search.id}`, "_blank");
  };

  // If viewing a specific draft via opaque ID
  if (search.id) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/drafts", search: {} })}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ← Back to Applications
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Draft ID: {search.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {activeDraft ? `${activeDraft.jobTitle} at ${activeDraft.company || "Target Role"}` : "Tailored Application CV"}
            </h1>
            <p className="text-xs text-slate-500">
              Editing this tailored version will only update this draft. Your master CV profile remains unchanged.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              📥 Download PDF
            </button>
            <button
              type="button"
              onClick={handleSaveDraftVersion}
              disabled={draftSaveStatus === "saving"}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              {draftSaveStatus === "saving" ? "Saving..." : "Save Draft Version"}
            </button>
          </div>
        </div>

        {draftSaveError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
            <strong>Error:</strong> {draftSaveError}
          </div>
        )}

        {activeDraft?.unapprovedSuggestedSummary && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 no-print">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-amber-900 uppercase tracking-wide">
                Optional AI Suggested Summary (Unapproved)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (activeDraft?.unapprovedSuggestedSummary && draftCv) {
                    setDraftCv({ ...draftCv, summary: activeDraft.unapprovedSuggestedSummary });
                    setDraftSaveStatus("unsaved");
                  }
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium cursor-pointer transition-colors"
              >
                Adopt Suggested Summary
              </button>
            </div>
            <p className="text-amber-800 italic">&ldquo;{activeDraft.unapprovedSuggestedSummary}&rdquo;</p>
            <p className="text-[11px] text-amber-700">
              Your authentic original summary was preserved in the generated PDF. Clicking &apos;Adopt Suggested Summary&apos; will apply this suggested wording to this draft only.
            </p>
          </div>
        )}

        {draftLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Loading draft details...
          </div>
        ) : draftCv ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 no-print">
              <Editor
                cv={draftCv}
                onChange={(updated) => {
                  setDraftCv(updated);
                  setDraftSaveStatus("unsaved");
                }}
                onSave={handleSaveDraftVersion}
                onReset={() => {}}
                saveStatus={draftSaveStatus}
                storageError={null}
                validationErrors={[]}
              />
            </div>
            <div className="lg:col-span-6 lg:sticky lg:top-20">
              <Preview
                cv={draftCv}
                onTemplateChange={(tmpl) => {
                  setDraftCv({
                    ...draftCv,
                    stylePrefs: {
                      ...draftCv.stylePrefs,
                      templateId: tmpl,
                    },
                  });
                  setDraftSaveStatus("unsaved");
                }}
                onPrint={() => window.print()}
              />
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-600 text-sm">
            Draft not found or could not be loaded.
          </div>
        )}
      </div>
    );
  }

  // Default: View all drafts
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Applications</h1>
        <p className="text-slate-600 text-sm mt-1">
          Targeted versions and job postings tailored from your extension and web editor.
        </p>
      </div>

      {storageError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <strong>Storage Notice:</strong> {storageError}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">No Applications Saved Yet</h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            Use the JobAI Chrome extension on supported job listings to capture roles and tailor your CV. Saved applications will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((draft) => (
            <motion.div
              key={draft.id}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base leading-snug">{draft.jobTitle}</h2>
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">{draft.company}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                    className="text-xs text-slate-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                {draft.sourceUrl && (
                  <div className="mt-2 text-xs">
                    <a
                      href={draft.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-indigo-600 truncate block text-[11px]"
                    >
                      {draft.sourceUrl}
                    </a>
                  </div>
                )}

                {draft.changes && draft.changes.length > 0 && (
                  <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1">
                    <span className="font-semibold text-indigo-900 text-[11px] block">Tailoring Adjustments:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      {draft.changes.slice(0, 3).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-sans">
                  {draft.jobText}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Saved {new Date(draft.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/pdf/${draft.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-indigo-600 font-medium bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                  >
                    PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/drafts", search: { id: draft.id } })}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    Review &amp; Edit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
