import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { loadDrafts, deleteDraft, loadMasterCV, type JobMetadata, type CV } from "jobai-shared";
import { Editor } from "../../components/Editor";
import { CvPrintPreview } from "../../components/CvPrintPreview";
import { PageLayout } from "../../components/PageLayout";

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
  const [showTailorForm, setShowTailorForm] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [tailorConsent, setTailorConsent] = useState(false);
  const [tailorBusy, setTailorBusy] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

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

  const handleTailorFromText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTailorError(null);

    if (!tailorConsent) {
      setTailorError("Please agree to send your CV details and job description to your configured AI provider.");
      return;
    }

    const title = jobTitle.trim();
    const text = jobText.trim();
    if (!title || !text || !jobUrl.trim()) {
      setTailorError("Add a job title, job link, and job description to continue.");
      return;
    }
    if (text.length < 100 || text.length > 30000) {
      setTailorError("The job description needs to be between 100 and 30,000 characters.");
      return;
    }

    let sourceUrl: string;
    try {
      const parsed = new URL(jobUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      if (parsed.username || parsed.password) throw new Error();
      sourceUrl = parsed.toString();
    } catch {
      setTailorError("Enter a valid job listing link that starts with http:// or https://.");
      return;
    }

    const masterResult = loadMasterCV();
    const masterCV = masterResult.success ? masterResult.data : null;
    if (!masterCV) {
      setTailorError("Add and save your Master CV before tailoring a job.");
      return;
    }

    setTailorBusy(true);
    try {
      const statusRes = await fetch("/api/status");
      const status = await statusRes.json().catch(() => ({}));
      if (!statusRes.ok) throw new Error(status.message || "Could not check your JobAI setup.");
      if (!status.aiConfigured) {
        throw new Error("Choose and configure an AI provider in Settings before tailoring.");
      }
      const providerLabel = status.aiProvider || "configured AI provider";
      setAiProvider(providerLabel);

      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-jobai-csrf": "1" },
        body: JSON.stringify({ cv: masterCV }),
      });
      const profileData = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) {
        throw new Error(profileData.message || "Could not prepare your Master CV for this draft.");
      }

      const tailorRes = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jobai-csrf": "1",
        },
        body: JSON.stringify({
          job: {
            title,
            company: company.trim() || "Not specified",
            sourceUrl,
            text,
          },
          templateId: masterCV.stylePrefs?.templateId || "modern",
        }),
      });
      const result = await tailorRes.json().catch(() => ({}));
      if (!tailorRes.ok || !result.draftId) {
        throw new Error(result.message || "JobAI could not create this tailored draft.");
      }

      await refreshDrafts();
      await navigate({ to: "/app/applications", search: { id: result.draftId } });
    } catch (err: any) {
      setTailorError(err?.message || "Something went wrong while tailoring this job.");
    } finally {
      setTailorBusy(false);
    }
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
      <PageLayout
        variant="fixed"
        leading={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/app/applications", search: {} })}
              className="text-xs font-semibold text-[#636c7a] hover:text-[#191b20] transition cursor-pointer"
            >
              ← Back to Applications
            </button>
            <span className="text-[#c5cbd4]">|</span>
            <span className="text-xs font-medium text-[var(--ui-accent)] bg-[var(--ui-accent-soft)] px-2 py-0.5 rounded-full border border-[var(--ui-accent-line)]">
              Draft ID: {search.id}
            </span>
          </div>
        }
        title={
          activeDraft
            ? `${activeDraft.jobTitle} at ${activeDraft.company || "Target Role"}`
            : "Tailored Application CV"
        }
        description="Editing this tailored version will only update this draft. Your master CV profile remains untouched."
        headerActions={
          <>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 border border-[#e3e6eb] bg-[#f1f3f6] hover:bg-[#e3e6eb] text-[#191b20] rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleSaveDraftVersion}
              disabled={draftSaveStatus === "saving"}
              className="px-4 py-1.5 bg-[#191b20] hover:bg-[#3f4753] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              {draftSaveStatus === "saving" ? "Saving..." : "Save Draft Version"}
            </button>
          </>
        }
        className="space-y-6"
      >
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
          <div className="p-12 text-center text-[#636c7a] text-sm bg-[#ffffff] rounded-2xl border border-[#e3e6eb]">
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
              <CvPrintPreview cv={draftCv} />
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-[#ffffff] rounded-2xl border border-[#e3e6eb] text-[#636c7a] text-sm">
            Draft not found or could not be loaded.
          </div>
        )}
      </PageLayout>
    );
  }

  // Default: View all drafts
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      <PageLayout
        variant="fixed"
        title="Job Applications"
        titleAddon={
          <span className="rounded-md bg-[#e3e6eb] px-2 py-0.5 text-xs text-[#8b939f] font-medium">
            {drafts.length}
          </span>
        }
        description="Tailored CV drafts for roles you’re considering. Your Master CV stays unchanged."
        className="space-y-6"
      >
      {storageError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <strong>Storage Notice:</strong> {storageError}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#191b20] font-heading">Tailor for a job</h2>
            <p className="mt-1 text-xs text-[var(--ui-accent-hover)]">Paste a listing here to make a separate draft. The browser extension is optional.</p>
          </div>
          <button
            type="button"
            aria-expanded={showTailorForm}
            onClick={() => { setShowTailorForm(!showTailorForm); setTailorError(null); }}
            className="rounded-xl bg-[#191b20] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3f4753] transition cursor-pointer"
          >
            {showTailorForm ? "Close form" : "Paste a job"}
          </button>
        </div>

        {showTailorForm && (
          <form onSubmit={handleTailorFromText} className="space-y-4 rounded-2xl border border-[var(--ui-accent-soft)] bg-[#ffffff] p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-medium text-[#3f4753]">
                Job title <span className="text-rose-600">*</span>
                <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={300} required className="w-full rounded-xl border border-[#c5cbd4] bg-white px-3 py-2.5 text-sm font-normal text-[#191b20] outline-none focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent)]/20" placeholder="e.g. Product Designer" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[#3f4753]">
                Company <span className="font-normal text-[#636c7a]">(optional)</span>
                <input value={company} onChange={(event) => setCompany(event.target.value)} maxLength={300} className="w-full rounded-xl border border-[#c5cbd4] bg-white px-3 py-2.5 text-sm font-normal text-[#191b20] outline-none focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent)]/20" placeholder="Company name" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-[#3f4753] sm:col-span-2">
                Job listing link <span className="text-rose-600">*</span>
                <input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} required className="w-full rounded-xl border border-[#c5cbd4] bg-white px-3 py-2.5 text-sm font-normal text-[#191b20] outline-none focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent)]/20" placeholder="https://company.com/careers/job" />
              </label>
            </div>
            <label className="block space-y-1.5 text-xs font-medium text-[#3f4753]">
              Job description <span className="text-rose-600">*</span>
              <textarea value={jobText} onChange={(event) => setJobText(event.target.value)} required minLength={100} maxLength={30000} rows={7} className="w-full resize-y rounded-xl border border-[#c5cbd4] bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-[#191b20] outline-none focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent)]/20" placeholder="Paste the role description here…" />
              <span className="block text-[11px] font-normal text-[#636c7a]">{jobText.length.toLocaleString()} / 30,000 characters (at least 100)</span>
            </label>

            <div className="rounded-xl border border-[#e3e6eb] bg-[#f7f8fa] p-3.5 space-y-2.5">
              <p className="text-xs leading-relaxed text-[#636c7a]">
                JobAI saves a copy of your Master CV in its local service for this request. Your CV details and the job description are sent to the AI provider configured in Settings. If you use a cloud provider, that provider processes the information under its own terms. A new draft is created; your Master CV is left as it is.
              </p>
              {aiProvider && <p className="text-[11px] font-medium text-[var(--ui-accent)]">Configured provider: {aiProvider}</p>}
              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#3f4753] cursor-pointer">
                <input type="checkbox" checked={tailorConsent} onChange={(event) => setTailorConsent(event.target.checked)} className="mt-0.5 accent-[var(--ui-accent)]" />
                <span>I agree to send my CV details and this job description to the AI provider configured for JobAI.</span>
              </label>
              <Link to="/app/settings/ai" className="inline-block text-[11px] font-medium text-[var(--ui-accent)] hover:underline">Review AI settings</Link>
            </div>

            {tailorError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-800">{tailorError}</div>
            )}
            <button type="submit" disabled={tailorBusy || !tailorConsent} className="rounded-xl bg-[#191b20] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3f4753] disabled:cursor-not-allowed disabled:opacity-50 transition">
              {tailorBusy ? "Preparing your draft…" : "Create tailored draft"}
            </button>
          </form>
        )}
      </section>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-line)] flex items-center justify-center mx-auto text-[var(--ui-accent)] text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[#191b20] font-heading">No Applications Saved Yet</h2>
          <p className="text-[#636c7a] text-xs max-w-md mx-auto leading-relaxed">
            Paste a job description here to create your first tailored draft. You can also use the optional browser extension.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTailorForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#191b20] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3f4753] transition cursor-pointer"
            >
              Paste a job description
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((draft) => (
            <motion.div
              key={draft.id}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="rounded-xl border border-[#e3e6eb] bg-[#ffffff] p-5 flex flex-col justify-between transition hover:border-[#c5cbd4] shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-[#191b20] text-base leading-snug font-heading truncate">
                        {draft.jobTitle}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ui-accent)] font-medium mt-0.5 truncate">{draft.company}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                    className="text-xs text-[#8b939f] hover:text-rose-600 font-medium px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer shrink-0"
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
                      className="text-[#636c7a] hover:text-[#191b20] truncate block text-[11px]"
                    >
                      {draft.sourceUrl}
                    </a>
                  </div>
                )}

                {draft.changes && draft.changes.length > 0 && (
                  <div className="mt-3 p-2.5 bg-[#ffffff] rounded-lg border border-[#e3e6eb] text-xs text-[#191b20] space-y-1">
                    <span className="font-medium text-[var(--ui-accent)] text-[11px] block">Tailoring Adjustments:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#636c7a]">
                      {draft.changes.slice(0, 3).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-[#636c7a] mt-3 line-clamp-3 bg-[#f7f8fa] p-3 rounded-lg border border-[#f1f3f6] leading-relaxed font-sans">
                  {draft.jobText}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e3e6eb] flex items-center justify-between text-xs">
                <span className="text-[#8b939f]">
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
                    className="text-[#3f4753] hover:text-[#191b20] font-medium border border-[#e3e6eb] bg-[#f1f3f6] hover:bg-[#e3e6eb] px-2.5 py-1 rounded-lg transition"
                  >
                    PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/app/applications", search: { id: draft.id } })}
                    className="text-[var(--ui-accent)] hover:text-[var(--ui-accent-hover)] font-medium bg-[var(--ui-accent-soft)] hover:bg-[var(--ui-accent-line)] px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    Review &amp; Edit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </PageLayout>
    </motion.div>
  );
}
