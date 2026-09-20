import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { loadMasterCV, saveMasterCV, loadDrafts } from "jobai-shared";
import type { CV, JobMetadata } from "jobai-shared";
import { PageLayout } from "../../components/PageLayout";

interface SearchParams {
  template?: string;
  view?: string;
}

export const Route = createFileRoute("/app/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      template: typeof search.template === "string" ? search.template : undefined,
      view: typeof search.view === "string" ? search.view : undefined,
    };
  },
  beforeLoad: ({ search }) => {
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
  component: HomeComponent,
});

function createBlankCV(templateId = "modern"): CV {
  return {
    id: `master-cv-${Date.now()}`,
    version: "1.0.0",
    contact: {
      name: "Your Name",
      email: "your.email@example.com",
      phone: "+1 555-0100",
      location: "City, Country",
    },
    summary:
      "A targeted summary highlighting core strengths, career achievements, and relevance to target roles.",
    sections: [
      {
        id: `sec-${Date.now()}-1`,
        type: "experience",
        title: "Work Experience",
        items: [],
      },
      {
        id: `sec-${Date.now()}-2`,
        type: "education",
        title: "Education",
        items: [],
      },
      {
        id: `sec-${Date.now()}-3`,
        type: "skills",
        title: "Skills & Proficiencies",
        items: [],
      },
    ],
    stylePrefs: {
      templateId,
      primaryColor: "#292a27",
      fontSize: "10pt",
      fontFamily: "Inter",
      margin: "0.5in",
      paperSize: "A4",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function HomeComponent() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const [cv, setCv] = useState<CV | null>(null);
  const [drafts, setDrafts] = useState<JobMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload CV Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractProgress, setExtractProgress] = useState("");
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    provider: string | null;
    model: string | null;
  } | null>(null);
  const [overwriteCandidate, setOverwriteCandidate] = useState<CV | null>(null);

  // Connect to Extension state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Readiness Checklist Status
  const [workspaceStatus, setWorkspaceStatus] = useState<{
    profileComplete: boolean;
    extensionPaired: boolean;
    aiConfigured: boolean;
  }>({
    profileComplete: false,
    extensionPaired: false,
    aiConfigured: false,
  });

  const fetchWorkspaceStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/status");
      if (res.ok) {
        const data = await res.json();
        setWorkspaceStatus({
          profileComplete: Boolean(data.profileComplete),
          extensionPaired: Boolean(data.extensionPaired),
          aiConfigured: Boolean(data.aiConfigured),
        });
      }
    } catch {
      // Fallback silently if offline or endpoint not reachable
    }
  }, []);

  const refreshDrafts = useCallback(async () => {
    try {
      const res = await loadDrafts();
      if (res.success && res.data) {
        setDrafts(
          [...res.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const res = loadMasterCV();
    if (res.success && res.data) {
      setCv(res.data);
    }
    void refreshDrafts();
    void fetchWorkspaceStatus();
    setLoading(false);
  }, [refreshDrafts, fetchWorkspaceStatus]);

  const handleOpenUploadModal = async () => {
    setUploadMode("file");
    setSelectedFile(null);
    setPastedText("");
    setConsentChecked(false);
    setExtractError(null);
    setExtractProgress("");
    setOverwriteCandidate(null);
    setIsUploadModalOpen(true);

    try {
      const res = await fetch("/api/ai/status");
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch {
      setAiStatus(null);
    }
  };

  const handleExtractCV = async () => {
    if (!consentChecked) {
      setExtractError("Please confirm your consent to process this data locally.");
      return;
    }

    if (uploadMode === "file" && !selectedFile) {
      setExtractError("Please select a CV document file first.");
      return;
    }

    if (uploadMode === "text" && !pastedText.trim()) {
      setExtractError("Please paste your CV text into the area above.");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractProgress("Parsing CV contents...");

    try {
      let textToExtract = pastedText.trim();

      if (uploadMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const parseRes = await fetch("/api/parse-cv", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to read document text.");
        }

        const parseData = await parseRes.json();
        textToExtract = parseData.text;
      }

      setExtractProgress("Structuring profile with AI parser...");

      const extractRes = await fetch("/api/ai/extract-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToExtract }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to structure CV data.");
      }

      const res = await extractRes.json();
      if (res.success && res.data) {
        const extractedCV = res.data;
        const existing = loadMasterCV();
        if (existing.success && existing.data) {
          setOverwriteCandidate(extractedCV);
        } else {
          saveMasterCV(extractedCV);
          setCv(extractedCV);
          setOverwriteCandidate(null);
          setIsUploadModalOpen(false);
          navigate({ to: "/app/editor" });
        }
      } else {
        throw new Error("Invalid response format received from extraction.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error extracting CV content.";
      setExtractError(msg);
    } finally {
      setIsExtracting(false);
      setExtractProgress("");
    }
  };

  const handleConfirmOverwrite = () => {
    if (!overwriteCandidate) return;
    saveMasterCV(overwriteCandidate);
    setCv(overwriteCandidate);
    setOverwriteCandidate(null);
    setIsUploadModalOpen(false);
    navigate({ to: "/app/editor" });
  };

  const handleStartFromScratch = () => {
    const fresh = createBlankCV("modern");
    saveMasterCV(fresh);
    setCv(fresh);
    navigate({ to: "/app/editor" });
  };

  const handleOpenConnect = () => {
    setIsConnectModalOpen(true);
    setPairingCode(null);
    setSyncError(null);
    setSyncSuccess(false);
  };

  const handleGeneratePairingCode = async () => {
    if (!cv) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/extension/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate pairing code.");
      }

      const data = await res.json();
      setPairingCode(data.code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to prepare extension sync.";
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmExtensionSync = async () => {
    if (!pairingCode) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/extension/confirm-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pairingCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sync confirmation failed.");
      }

      setSyncSuccess(true);
      setTimeout(() => {
        setIsConnectModalOpen(false);
        setSyncSuccess(false);
        setPairingCode(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete handshake.";
      setSyncError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-sm text-[#73736b]">Loading workspace...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <PageLayout
        variant="fixed"
        leading={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0ede6] text-[#625181] border border-[#e2ded5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9782d8]" />
            Local-first workspace
          </span>
        }
        title={cv?.contact?.name ? `Welcome back, ${cv.contact.name.split(" ")[0]}` : "Welcome to JobAI"}
        description="Build tailored CVs, manage job targets, and sync with your local extension."
        headerActions={
          <>
          <button
            onClick={cv ? () => navigate({ to: "/app/editor" }) : handleStartFromScratch}
            className="inline-flex items-center gap-2 rounded-lg bg-[#292a27] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#41423c] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
          >
            <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{cv ? "Edit CV" : "Create CV"}</span>
          </button>
          </>
        }
        className="space-y-6"
      >
      {/* 2. Primary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Master CV Status */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs flex flex-col justify-between hover:border-[#dedcd4] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] border border-[#ebe8e1] flex items-center justify-center text-[#625181]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cv ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#f5f5f3] text-[#73736b]"}`}>
                {cv ? "Saved locally" : "Not started"}
              </span>
            </div>
            <h2 className="text-lg font-medium text-[#292a27]">Master CV</h2>
            <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
              {cv
                ? "Updated profile · Ready for targeted exports."
                : "Your single source of truth for work experience, skills, and projects."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0ede6] flex items-center justify-between">
            {cv ? (
              <button
                onClick={() => navigate({ to: "/app/editor" })}
                className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Editor</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartFromScratch}
                  className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition-colors cursor-pointer"
                >
                  Start blank
                </button>
                <span className="text-[#dedcd4] text-xs">·</span>
                <button
                  onClick={handleOpenUploadModal}
                  className="text-xs font-semibold text-[#73736b] hover:text-[#292a27] transition-colors cursor-pointer"
                >
                  Upload document
                </button>
              </div>
            )}
            <span className="text-[11px] text-[#9b9a92]">Private & on-device</span>
          </div>
        </div>

        {/* Card 2: Browser Extension Bridge */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs flex flex-col justify-between hover:border-[#dedcd4] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] border border-[#ebe8e1] flex items-center justify-center text-[#625181]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#f5f5f3] text-[#73736b]">
                Chrome Extension
              </span>
            </div>
            <h2 className="text-lg font-medium text-[#292a27]">Job Application Bridge</h2>
            <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
              Extract job descriptions from LinkedIn or Greenhouse with one click and auto-draft tailorings.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0ede6] flex items-center justify-between">
            <button
              onClick={cv ? handleOpenConnect : handleStartFromScratch}
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Sync to extension</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link to="/app/extension" className="text-[11px] text-[#9b9a92] hover:text-[#73736b] transition-colors">
              Setup guide
            </Link>
          </div>
        </div>

        {/* Card 3: Applications & Drafts */}
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs flex flex-col justify-between hover:border-[#dedcd4] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] border border-[#ebe8e1] flex items-center justify-center text-[#625181]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#f5f5f3] text-[#73736b]">
                {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
              </span>
            </div>
            <h2 className="text-lg font-medium text-[#292a27]">Active Applications</h2>
            <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
              {drafts.length > 0
                ? `Latest: ${drafts[0].jobTitle} at ${drafts[0].company || "Unknown Company"}`
                : "Import job postings via extension or direct paste to start tailoring."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0ede6] flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/app/applications" })}
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage drafts</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-[11px] text-[#9b9a92]">Saved in browser</span>
          </div>
        </div>
      </div>

      {/* 3. Draft Applications Section */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3">
            <h2 className="text-lg font-medium text-[#292a27] font-heading">
              Recent Application Drafts
            </h2>
            <Link
              to="/app/applications"
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition-colors"
            >
              View all ({drafts.length})
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.slice(0, 3).map((draft) => (
              <div
                key={draft.id}
                className="group relative rounded-xl border border-[#e8e7e2] bg-[#fffefa] p-5 shadow-xs hover:border-[#9782d8]/50 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-[#292a27] group-hover:text-[#625181] transition-colors line-clamp-1">
                      {draft.jobTitle}
                    </h3>
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#73736b] border border-[#e8e7e2]">
                      Draft
                    </span>
                  </div>
                  <p className="text-xs text-[#73736b] font-medium mb-3">
                    {draft.company || "Direct Application"}
                  </p>
                  {draft.jobText && (
                    <p className="text-xs text-[#8c8b84] line-clamp-2 leading-relaxed mb-4">
                      {draft.jobText}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f5f4ef] flex items-center justify-between text-[11px] text-[#9b9a92]">
                  <span>{formatRelativeTime(new Date(draft.createdAt).getTime())}</span>
                  <button
                    onClick={() => navigate({ to: "/app/applications", search: { id: draft.id } })}
                    className="font-medium text-[#625181] hover:underline cursor-pointer"
                  >
                    View draft →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Readiness Checklist: 3 Concrete Setup Gates */}
      <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#f0ede6] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[#292a27] font-heading">
              Application Readiness
            </h2>
            <p className="text-xs text-[#73736b] mt-0.5">
              Ensure your local workspace is primed for auto-tailoring and fast application delivery.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f0ede6] text-[#625181] border border-[#e2ded5]">
            {[Boolean(cv), workspaceStatus.extensionPaired, workspaceStatus.aiConfigured].filter(Boolean).length}/3 Ready
          </span>
        </div>

        <div className="divide-y divide-[#f5f4f0]">
          {/* Step 1: Master CV */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${cv ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#f5f4ef] text-[#9b9a92]"}`}>
                {cv ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#292a27]">Master CV Profile</p>
                <p className="text-xs text-[#73736b] mt-0.5">
                  {cv ? "Master profile saved in local browser storage." : "Add your work history and core skills to enable tailoring."}
                </p>
              </div>
            </div>
            <button
              onClick={cv ? () => navigate({ to: "/app/editor" }) : handleStartFromScratch}
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition shrink-0 cursor-pointer"
            >
              {cv ? "Edit profile" : "Create now"}
            </button>
          </div>

          {/* Step 2: Extension Paired */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${workspaceStatus.extensionPaired ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#f5f4ef] text-[#9b9a92]"}`}>
                {workspaceStatus.extensionPaired ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#292a27]">Browser Extension</p>
                <p className="text-xs text-[#73736b] mt-0.5">
                  {workspaceStatus.extensionPaired
                    ? "Extension paired and communicating with local server."
                    : "Pair the Chrome extension to extract job descriptions with 1 click."}
                </p>
              </div>
            </div>
            <Link
              to="/app/extension"
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition shrink-0"
            >
              {workspaceStatus.extensionPaired ? "Extension status" : "Setup guide"}
            </Link>
          </div>

          {/* Step 3: AI Configuration */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${workspaceStatus.aiConfigured ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#f5f4ef] text-[#9b9a92]"}`}>
                {workspaceStatus.aiConfigured ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#292a27]">AI Tailoring Provider</p>
                <p className="text-xs text-[#73736b] mt-0.5">
                  {workspaceStatus.aiConfigured
                    ? "Local or cloud AI key configured for CV extraction and targeting."
                    : "Connect OpenAI, Claude, or GLM to unlock smart bullet tailoring."}
                </p>
              </div>
            </div>
            <Link
              to="/app/settings/ai"
              className="text-xs font-semibold text-[#625181] hover:text-[#4b3c66] transition shrink-0"
            >
              {workspaceStatus.aiConfigured ? "Configure AI" : "Add key"}
            </Link>
          </div>
        </div>
      </div>

      {/* Connect to Extension Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dedcd4] bg-[#fffefa] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3 mb-4">
              <h3 className="text-lg font-medium text-[#292a27]">Pair Chrome Extension</h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-[#73736b] hover:text-[#292a27] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[#73736b] leading-relaxed mb-6">
              Generate a 6-digit sync code to securely link your local Master CV with the JobAI browser extension.
            </p>

            {syncError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {syncError}
              </div>
            )}

            {syncSuccess ? (
              <div className="my-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-sm font-semibold text-emerald-800">Extension Connected Successfully!</p>
                <p className="text-xs text-emerald-600 mt-1">Your CV is now synced to the extension popup.</p>
              </div>
            ) : pairingCode ? (
              <div className="my-6 text-center">
                <p className="text-xs text-[#73736b] mb-2 font-medium">Enter this pairing code in extension popup:</p>
                <div className="inline-block tracking-widest font-mono text-3xl font-bold bg-[#f5f4ef] border border-[#e8e7e2] px-6 py-3 rounded-xl text-[#292a27]">
                  {pairingCode}
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleConfirmExtensionSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#625181] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4e4067] transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>Confirm Handshake</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-6 text-center">
                <button
                  onClick={handleGeneratePairingCode}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#292a27] px-5 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-[#41423c] transition disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#c7bcd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{isSyncing ? "Generating..." : "Generate 6-Digit Code"}</span>
                </button>
              </div>
            )}

            <div className="border-t border-[#e8e7e2] pt-4 mt-6 flex items-center justify-between text-xs text-[#73736b]">
              <Link
                to="/app/extension"
                onClick={() => setIsConnectModalOpen(false)}
                className="hover:text-[#292a27] underline"
              >
                Or open dedicated Extension Setup page
              </Link>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#e8e7e2] hover:bg-[#f5f4ef] text-[#292a27] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#dedcd4] bg-[#fffefa] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3 mb-4">
              <h3 className="text-lg font-medium text-[#292a27]">Upload CV Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#73736b] hover:text-[#292a27] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {overwriteCandidate ? (
              <div className="space-y-4 my-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-xs">
                  <p className="font-semibold text-sm mb-1 text-amber-900">Replace existing CV?</p>
                  You already have a Master CV saved in your browser. Importing this document will replace your current profile.
                </div>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => {
                      setOverwriteCandidate(null);
                      setIsUploadModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg border border-[#dedcd4] text-xs font-medium text-[#73736b] hover:bg-[#eeede7] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverwrite}
                    className="px-4 py-2 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
                  >
                    Replace CV
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Configuration Warning */}
                {aiStatus && !aiStatus.configured && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs flex items-center justify-between">
                    <span>AI provider not configured. Key needed for parsing.</span>
                    <Link to="/app/settings/ai" className="font-semibold underline ml-2 shrink-0">
                      Configure AI
                    </Link>
                  </div>
                )}

                {/* Upload Mode Selector */}
                <div className="flex rounded-lg bg-[#f0ede6] p-1 border border-[#e2ded5]">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      uploadMode === "file" ? "bg-[#fffefa] text-[#292a27] shadow-xs" : "text-[#73736b] hover:text-[#292a27]"
                    }`}
                  >
                    Document Upload (PDF / DOCX)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("text")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      uploadMode === "text" ? "bg-[#fffefa] text-[#292a27] shadow-xs" : "text-[#73736b] hover:text-[#292a27]"
                    }`}
                  >
                    Paste Text Directly
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div className="rounded-xl border-2 border-dashed border-[#dedcd4] p-6 text-center hover:border-[#625181] transition bg-[#fdfcf9]">
                    <svg className="w-8 h-8 text-[#9b9a92] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-[#73736b] mb-1">Select your PDF or DOCX file to extract profile data</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs text-[#73736b] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#625181] file:text-white hover:file:bg-[#4e4067] cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-xs font-medium text-emerald-700 mt-2">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#73736b] mb-1">
                      Paste full resume or CV text
                    </label>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste text containing contact details, work experience, education, and skills..."
                      className="w-full rounded-xl border border-[#dedcd4] bg-[#fdfcf9] p-3 text-xs text-[#292a27] focus:border-[#625181] focus:ring-1 focus:ring-[#625181] outline-none font-mono"
                    />
                  </div>
                )}

                {/* Consent & Privacy Checkbox */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="consent-cv"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded border-[#dedcd4] text-[#625181] focus:ring-[#625181]"
                  />
                  <label htmlFor="consent-cv" className="text-xs text-[#73736b] leading-tight">
                    I agree to parse this CV. Extracted data will be stored exclusively in my local browser storage.
                  </label>
                </div>

                {extractError && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                    {extractError}
                  </div>
                )}

                {extractProgress && (
                  <div className="rounded-lg bg-purple-50 p-2.5 text-xs text-[#625181] border border-purple-200 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{extractProgress}</span>
                  </div>
                )}

                <div className="border-t border-[#e8e7e2] pt-4 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#dedcd4] text-xs font-medium text-[#73736b] hover:bg-[#eeede7] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExtractCV}
                    disabled={isExtracting || !consentChecked}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#292a27] text-xs font-medium text-white hover:bg-[#41423c] transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isExtracting ? "Extracting..." : "Extract Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </PageLayout>
    </motion.div>
  );
}
