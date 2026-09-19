import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { loadDrafts, deleteDraft, type JobMetadata, type CV } from "jobai-shared";
import { Editor } from "../../components/Editor";
import { Preview } from "../../components/Preview";

interface SearchParams {
  id?: string;
}

export const Route = createFileRoute("/app/applications")({
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
    const res = loadDrafts();
    if (!res.success && res.error) {
      setStorageError(res.error);
    } else {
      setStorageError(null);
    }
    const localDrafts = res.data || [];

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

    setDrafts(
      Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
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

  // If viewing a specific draft via ID
  if (search.id) {
    return (
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/app/applications", search: {} })}
                className="text-xs font-semibold text-[#73736b] hover:text-[#292a27] transition cursor-pointer"
              >
                ← Back to Applications
              </button>
              <span className="text-[#c7c5bc]">|</span>
              <span className="text-xs font-medium text-[#625181] bg-[#e8e0f3] px-2 py-0.5 rounded-full border border-[#ddd3e9]">
                Draft ID: {search.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#292a27] font-heading mt-1.5">
              {activeDraft ? `${activeDraft.jobTitle} at ${activeDraft.company || "Target Role"}` : "Tailored Application CV"}
            </h1>
            <p className="text-xs text-[#73736b]">
              Editing this tailored version will only update this draft. Your master CV profile remains untouched.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27] rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleSaveDraftVersion}
              disabled={draftSaveStatus === "saving"}
              className="px-4 py-1.5 bg-[#30332d] hover:bg-[#4a4e43] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              {draftSaveStatus === "saving" ? "Saving..." : "Save Draft Version"}
            </button>
          </div>
        </div>

        {draftSaveError && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
            <strong>Error:</strong> {draftSaveError}
          </div>
        )}

        {activeDraft?.unapprovedSuggestedSummary && (
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2 no-print">
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
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium cursor-pointer transition shadow-2xs"
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
          <div className="p-12 text-center text-[#73736b] text-sm bg-[#fffefa] rounded-2xl border border-[#e8e7e2]">
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
            <div className="lg:col-span-6 lg:sticky lg:top-24">
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
          <div className="p-10 text-center bg-[#fffefa] rounded-2xl border border-[#e8e7e2] text-[#73736b] text-sm">
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
      className="max-w-5xl mx-auto w-full space-y-6"
    >
      <div className="border-b border-[#e8e7e2] pb-5 mb-8">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#292a27] font-heading">
            Job Applications
          </h1>
          <span className="rounded-md bg-[#eeede7] px-2 py-0.5 text-xs text-[#929285] font-medium">
            {drafts.length}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-[#73736b]">
          Targeted resume versions tailored for specific roles and captured from job listings.
        </p>
      </div>

      {storageError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <strong>Storage Notice:</strong> {storageError}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#e8e0f3] border border-[#ddd3e9] flex items-center justify-center mx-auto text-[#625181] text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[#292a27] font-heading">No Applications Saved Yet</h2>
          <p className="text-[#73736b] text-xs max-w-md mx-auto leading-relaxed">
            Use the JobAI Chrome extension on supported job boards or use the Job Import tool to tailor your CV. Saved applications will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/import-job"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#30332d] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4a4e43] transition"
            >
              Tailor CV for a job posting
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((draft) => (
            <motion.div
              key={draft.id}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="rounded-xl border border-[#e6e5dd] bg-[#fffefa] p-5 flex flex-col justify-between transition hover:border-[#c3bab0] shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-[#292a27] text-base leading-snug font-heading truncate">
                        {draft.jobTitle}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-[#625181] font-medium mt-0.5 truncate">{draft.company}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                    className="text-xs text-[#92928a] hover:text-rose-600 font-medium px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer shrink-0"
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
                      className="text-[#85857d] hover:text-[#292a27] truncate block text-[11px]"
                    >
                      {draft.sourceUrl}
                    </a>
                  </div>
                )}

                {draft.changes && draft.changes.length > 0 && (
                  <div className="mt-3 p-2.5 bg-[#fcfbf9] rounded-lg border border-[#e8e7e2] text-xs text-[#292a27] space-y-1">
                    <span className="font-medium text-[#625181] text-[11px] block">Tailoring Adjustments:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#73736b]">
                      {draft.changes.slice(0, 3).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-[#73736b] mt-3 line-clamp-3 bg-[#faf9f6] p-3 rounded-lg border border-[#eeeadd] leading-relaxed font-sans">
                  {draft.jobText}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e8e7e2] flex items-center justify-between text-xs">
                <span className="text-[#a0a094]">
                  Edited {new Date(draft.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/pdf/${draft.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4a4e43] hover:text-[#292a27] font-medium border border-[#e4e3dd] bg-[#f5f4f0] hover:bg-[#eeede7] px-2.5 py-1 rounded-lg transition"
                  >
                    PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/app/applications", search: { id: draft.id } })}
                    className="text-[#625181] hover:text-[#4a396b] font-medium bg-[#e8e0f3] hover:bg-[#ddd3e9] px-2.5 py-1 rounded-lg transition cursor-pointer"
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
