import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { loadMasterCV, saveMasterCV, deleteMasterCV, loadDrafts } from "jobai-shared";
import type { CV, JobMetadata } from "jobai-shared";
import { Editor } from "../components/Editor";
import { Preview } from "../components/Preview";

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
  component: HomeComponent,
});

function createBlankCV(templateId = "modern"): CV {
  return {
    id: `master-cv-${Date.now()}`,
    version: "1.0.0",
    contact: {
      name: "",
      email: "",
      phone: "",
      website: "",
      location: "",
    },
    summary: "",
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
      fontSize: "normal",
      margin: "normal",
      primaryColor: "#4f46e5",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}


function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "recently";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "just now";
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

function HomeComponent() {
  const shouldReduceMotion = useReducedMotion();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [cv, setCv] = useState<CV | null>(null);
  const [drafts, setDrafts] = useState<JobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const [workspaceStatus, setWorkspaceStatus] = useState<{
    aiConfigured: boolean;
    aiProvider: string | null;
    aiModel: string | null;
    extensionPaired: boolean;
    hasProfile: boolean;
  } | null>(null);

  const fetchWorkspaceStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setWorkspaceStatus({
          aiConfigured: Boolean(data.aiConfigured),
          aiProvider: data.aiProvider || null,
          aiModel: data.aiModel || null,
          extensionPaired: Boolean(data.paired || data.boundOrigin || data.serverTokenActive),
          hasProfile: Boolean(data.hasProfile),
        });
        setAiStatus({
          configured: Boolean(data.aiConfigured),
          provider: data.aiProvider || null,
          model: data.aiModel || null,
        });
      }
    } catch {
      // ignore
    }
  };
  const fetchAIStatus = fetchWorkspaceStatus;

  const refreshDrafts = () => {
    const res = loadDrafts();
    if (res.success && res.data) {
      setDrafts(res.data);
    }
  };

  // Load existing CV & Drafts from browser localStorage
  useEffect(() => {
    fetchAIStatus();
    refreshDrafts();

    const res = loadMasterCV();
    if (res.success && res.data) {
      if (search.template && search.template !== res.data.stylePrefs?.templateId) {
        const updated = {
          ...res.data,
          stylePrefs: {
            ...res.data.stylePrefs,
            templateId: search.template,
          },
        };
        setCv(updated);
        saveMasterCV(updated);
      } else {
        setCv(res.data);
      }
    } else {
      if (res.error && !res.error.includes("unavailable")) {
        setStorageError(res.error);
      }
      if (search.template) {
        setCv(createBlankCV(search.template));
      }
    }
    setLoading(false);
  }, [search.template]);

  const handleOpenUploadModal = () => {
    setExtractError(null);
    setSelectedFile(null);
    setPastedText("");
    setConsentChecked(false);
    setExtractProgress("");
    setIsUploadModalOpen(true);
    fetchAIStatus();
  };

  const handleExtractCV = async () => {
    if (!consentChecked) {
      setExtractError("Please consent to data transfer to your configured AI provider.");
      return;
    }
    setExtractError(null);
    setIsExtracting(true);

    try {
      let payload: any = {};
      if (uploadMode === "file") {
        if (!selectedFile) {
          throw new Error("Please choose a file to upload (PDF, DOCX, or TXT).");
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
          throw new Error("File size exceeds 5MB limit. Please upload a smaller document.");
        }
        setExtractProgress("Reading and encoding document...");
        const arrayBuffer = await selectedFile.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        payload = {
          fileBase64: base64,
          filename: selectedFile.name,
          templateId: search.template || "modern",
        };
      } else {
        if (!pastedText.trim()) {
          throw new Error("Please paste your CV text.");
        }
        payload = {
          text: pastedText.trim().slice(0, 60000),
          templateId: search.template || "modern",
        };
      }

      setExtractProgress(
        `Extracting and structuring CV with ${aiStatus?.provider || "AI"} (${aiStatus?.model || "configured model"})...`
      );

      const res = await fetch("/api/cv/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jobai-csrf": "1",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to extract CV");
      }

      const structuredCV: CV = data.cv;

      if (cv && (cv.contact.name || cv.sections.some((s) => s.items.length > 0))) {
        setOverwriteCandidate(structuredCV);
      } else {
        setCv(structuredCV);
        setSaveStatus("unsaved");
        setIsUploadModalOpen(false);
      }
    } catch (err: any) {
      setExtractError(err?.message || "Failed to extract CV");
    } finally {
      setIsExtracting(false);
      setExtractProgress("");
    }
  };

  const handleConfirmOverwrite = () => {
    if (overwriteCandidate) {
      setCv(overwriteCandidate);
      setSaveStatus("unsaved");
      setOverwriteCandidate(null);
      setIsUploadModalOpen(false);
    }
  };

  const handleCvChange = useCallback((updatedCv: CV) => {
    setCv(updatedCv);
    setSaveStatus("unsaved");
    setValidationErrors([]);
    setStorageError(null);
  }, []);

  const handleStartFromScratch = () => {
    const fresh = createBlankCV(search.template || "modern");
    setCv(fresh);
    setSaveStatus("unsaved");
    navigate({ to: "/", search: { view: "editor" } });
  };

  const validateBeforeSave = (targetCv: CV): string[] => {
    const errors: string[] = [];
    if (!targetCv.contact.name || !targetCv.contact.name.trim()) {
      errors.push("Full Name is required");
    }
    if (!targetCv.contact.email || !targetCv.contact.email.trim()) {
      errors.push("Email Address is required");
    }
    for (const sec of targetCv.sections) {
      for (const item of sec.items) {
        if (!item.title || !item.title.trim()) {
          errors.push(`An item in "${sec.title || sec.type}" is missing a title`);
        }
      }
    }
    return errors;
  };

  const handleSave = () => {
    if (!cv) return;
    const errors = validateBeforeSave(cv);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaveStatus("saving");
    const res = saveMasterCV(cv);

    if (res.success) {
      setSaveStatus("saved");
      setStorageError(null);
      setValidationErrors([]);
    } else {
      setSaveStatus("unsaved");
      setStorageError(res.error ?? "Failed to save CV to local storage");
    }
  };

  const handleReset = () => {
    deleteMasterCV();
    setCv(null);
    setSaveStatus("idle");
    setStorageError(null);
    setValidationErrors([]);
    navigate({ to: "/", search: { view: "overview" } });
  };

  const handleOpenConnect = () => {
    setSyncError(null);
    setPairingCode(null);
    setSyncSuccess(false);
    setIsConnectModalOpen(true);
  };

  const handleGeneratePairingCode = async (syncCv = true) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      if (syncCv && cv) {
        const errors = validateBeforeSave(cv);
        if (errors.length === 0) {
          saveMasterCV(cv);
          const profileRes = await fetch("/api/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-jobai-csrf": "1",
            },
            body: JSON.stringify({ cv }),
          });

          if (!profileRes.ok) {
            const err = await profileRes.json().catch(() => ({}));
            throw new Error(err.message || `Server returned status ${profileRes.status}`);
          }
          setSyncSuccess(true);
        }
      }

      const codeRes = await fetch("/api/pair/code", {
        method: "POST",
        headers: {
          "x-jobai-csrf": "1",
        },
      });

      if (!codeRes.ok) {
        const err = await codeRes.json().catch(() => ({}));
        throw new Error(err.message || `Server returned status ${codeRes.status}`);
      }

      const codeData = await codeRes.json();
      setPairingCode(codeData.code);
    } catch (err: any) {
      setSyncError(err?.message || String(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (!cv) return;
    handleCvChange({
      ...cv,
      stylePrefs: {
        ...cv.stylePrefs,
        templateId,
      },
    });
  };

  const isEditorView = search.view === "editor";
  const isCvSaved = Boolean(cv) || Boolean(workspaceStatus?.hasProfile);
  const isExtensionConnected = Boolean(workspaceStatus?.extensionPaired);
  const isAiConfigured = Boolean(workspaceStatus?.aiConfigured || aiStatus?.configured);
  const isAllReady = isCvSaved && isExtensionConnected && isAiConfigured;

  return (
    <div className="space-y-6">
      {/* Hidden SEO / SSR marker for contract compatibility */}
      <div className="sr-only">
        <h1>JobAI Document Editor — Canonical Master CV</h1>
        <span>Modern Clean</span>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-12 text-center text-sm text-[#73736b]">
          Loading document workspace...
        </div>
      ) : !isEditorView ? (
        /* ==================== ASTRA EXACT FOLIO OVERVIEW ==================== */
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
          className="space-y-8"
        >
          {/* Welcome Header: compact 28-32px Manrope heading, 14-16px description, actions opposite with natural wrap */}
          <section id="welcome" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#292a27] font-heading">
                {cv?.contact?.name
                  ? `Welcome back, ${cv.contact.name.split(" ")[0]}.`
                  : "Let’s build your next chapter."}
              </h1>
              <p className="mt-1.5 text-sm text-[#73736b]">
                Your CVs, application tools, and next steps. All in one local workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={cv ? () => navigate({ to: "/", search: { view: "editor" } }) : handleStartFromScratch}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create a CV</span>
              </button>
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e4e3dd] bg-white px-4 py-2.5 text-sm font-medium text-[#292a27] shadow-2xs transition hover:bg-[#f5f4f0] cursor-pointer w-full sm:w-auto"
              >
                <svg className="w-4 h-4 text-[#73736b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload document</span>
              </button>
              {cv && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#c9bcd9] bg-white px-3.5 py-2.5 text-sm font-medium text-[#625181] transition hover:bg-[#faf8fd] cursor-pointer w-full sm:w-auto"
                >
                  <span>Open in editor &rarr;</span>
                </button>
              )}
            </div>
          </section>

          {/* Featured Lavender Panel: 300-350px height, headline 36-42px, one charcoal CTA, overlapping job sheet + actual CV miniature */}
          <section id="hero" className="relative isolate overflow-hidden rounded-2xl border border-[#ddd3e9] bg-[#e8e0f3] grid grid-cols-1 md:grid-cols-[1.08fr_1fr]">
            <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-9">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/40 px-3 py-1.5 text-xs font-medium text-[#79628f]">
                <svg className="w-3.5 h-3.5 text-[#9782d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>YOUR NEXT OPPORTUNITY STARTS HERE</span>
              </div>
              <h2 className="max-w-md text-2xl sm:text-4xl lg:text-[2.65rem] font-medium leading-[1.16] tracking-tight text-[#393040] font-heading">
                Your next role.
                <br />
                A CV to match.
              </h2>
              <p className="mt-4 max-w-[340px] text-sm leading-relaxed text-[#82738e]">
                Turn your experience into a focused application. Start with a role, add your achievements, and make the draft your own.
              </p>
              <button
                type="button"
                onClick={cv ? () => setIsConnectModalOpen(true) : handleStartFromScratch}
                className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#30332d] px-4 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create a tailored CV</span>
                <svg className="w-4 h-4 ml-1 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#95839f]">
                <svg className="w-3.5 h-3.5 text-[#79628f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free to start. Yours to edit and export.</span>
              </p>
            </div>

            {/* Overlapping job sheet and real CV miniature with gentle 4-6deg rotations */}
            <div className="relative hidden min-h-[350px] items-center justify-center md:flex select-none" aria-label="A job description transformed into a tailored CV">
              <div className="absolute right-7 top-6 h-72 w-72 rounded-full border border-white/35 pointer-events-none" />
              <div className="absolute right-0 top-1 h-96 w-96 rounded-full border border-white/25 pointer-events-none" />

              {/* Left Job Sheet Thumbnail */}
              <div className="absolute left-1 top-12 w-48 -rotate-[6deg] rounded-xl border border-white/90 bg-[#f7f4fa] p-4 shadow-[0_8px_24px_rgba(97,70,119,0.08)] lg:left-2">
                <div className="mb-3.5 flex items-center gap-1.5 border-b border-[#e7e1ed] pb-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cfc7db]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dcd5e4]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e6dfed]" />
                  <span className="ml-auto text-[10px] text-[#a398ae] font-medium">target role</span>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0e7dc] text-xs font-semibold text-[#728564]">
                  🎯
                </span>
                <p className="mt-2.5 text-xs font-semibold text-[#292a27] truncate">
                  {drafts[0]?.jobTitle || "Product Designer"}
                </p>
                <p className="mt-0.5 text-[10px] text-[#9c92a4] truncate">
                  {drafts[0]?.company || "Acme · Remote"}
                </p>
                <div className="my-3 space-y-1.5">
                  <div className="h-1.5 w-full rounded-xs bg-[#e2dce9]" />
                  <div className="h-1.5 w-4/5 rounded-xs bg-[#e2dce9]" />
                  <div className="h-1.5 w-11/12 rounded-xs bg-[#e2dce9]" />
                </div>
                <div className="rounded-md bg-[#e7dfef] py-1.5 text-center text-[10px] font-medium text-[#8b759c]">
                  This could be the one.
                </div>
              </div>

              {/* Right CV Paper Miniature */}
              <div className="absolute right-6 top-8 w-52 rotate-[4deg] rounded-xl border border-white bg-[#fffefb] p-4 shadow-[0_14px_35px_rgba(112,87,128,0.12)] lg:right-10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7e4db] text-xs font-medium text-[#6c7061]">
                    {cv?.contact?.name ? cv.contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "JA"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-tight text-[#292a27] truncate">
                      {cv?.contact?.name || "Jamie Davis"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#979489] truncate">
                      {cv?.sections.find((s) => s.type === "experience")?.items[0]?.title || "Product Designer"}
                    </p>
                  </div>
                </div>
                <div className="mb-2.5 mt-3 h-px bg-[#dbddd2]" />
                <p className="text-[10px] font-medium text-[#74796b]">A little about me</p>
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                  <div className="h-1 w-4/5 rounded-xs bg-[#e7e7df]" />
                </div>
                <p className="mb-1.5 mt-3 text-[10px] font-medium text-[#74796b]">Experience</p>
                <div className="space-y-1">
                  <div className="h-1.5 w-3/5 rounded-xs bg-[#d9dece]" />
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                </div>
                <div className="mt-3 flex gap-1">
                  <span className="h-2.5 w-10 rounded-xs bg-[#e9eddf]" />
                  <span className="h-2.5 w-8 rounded-xs bg-[#eee7f4]" />
                  <span className="h-2.5 w-7 rounded-xs bg-[#eee9df]" />
                </div>
              </div>

              {/* Bottom Reassuring Badge */}
              <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 rounded-xl border border-white bg-[#fafcf4] px-4 py-2.5 shadow-[0_5px_20px_rgba(96,73,118,0.08)] lg:left-8">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e1ebce] text-[#829b5c]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-[#727c5c]">
                  Made for you. Matched to the role.
                </span>
              </div>

              <span className="absolute right-6 top-10 text-2xl text-[#af92c7] select-none pointer-events-none">✦</span>
              <span className="absolute bottom-10 right-10 text-xl text-[#a58cba] select-none pointer-events-none">✧</span>
            </div>
          </section>

          {/* CV Library Section: Your recent CVs with small count from real data, real document cards, no trio metric cards */}
          <section id="cvs-section" className="mb-8 scroll-mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-medium tracking-tight text-[#292a27] font-heading">
                  Your recent CVs
                </h2>
                <span id="recent-count" className="rounded-md bg-[#eeede7] px-2 py-0.5 text-xs text-[#929285] font-medium">
                  {(cv ? 1 : 0) + drafts.length}
                </span>
              </div>
              <Link to="/drafts" className="flex items-center gap-1.5 text-xs font-medium text-[#8c8d81] hover:text-[#4e5646]">
                <span>View all CVs</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {!cv && drafts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dcdcd1] bg-[#fffefa] py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#e8e0f3] border border-[#ddd3e9] flex items-center justify-center mx-auto text-[#625181] mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-[#292a27] font-heading">No CVs found</h3>
                <p className="text-xs text-[#8b8c81] mt-1 max-w-sm mx-auto">
                  Create a fresh profile from scratch or upload an existing PDF/text document to begin.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleStartFromScratch}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#30332d] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#4a4e43]"
                  >
                    Create a CV
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenUploadModal}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] px-3.5 py-2 text-xs font-medium text-[#292a27] transition hover:bg-[#eeede7]"
                  >
                    Upload document
                  </button>
                </div>
              </div>
            ) : (
              <div id="cv-grid" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {/* 1. Canonical Master CV Card (if present) */}
                {cv && (
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                    className="group overflow-hidden rounded-xl border border-[#e6e5dd] bg-[#fffefa] text-left transition hover:border-[#c3bab0] hover:shadow-xs cursor-pointer"
                  >
                    <div className="relative flex h-36 justify-center overflow-hidden bg-[#e9e5f0]">
                      <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-white/70 bg-white/75 px-2 py-1 text-xs text-[#625181] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9782d8]" />
                        Ready to go
                      </span>
                      {/* Document Paper Miniature */}
                      <div className="mt-5 w-40 rounded-t bg-[#fffefa] px-5 pb-4 pt-4 shadow-xs transition group-hover:-translate-y-1">
                        <p className="text-[11px] font-bold tracking-tight text-[#292a27] truncate uppercase">
                          {cv.contact.name || "Alex Morgan"}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-[#b0aca2]">
                          {cv.sections.find((s) => s.type === "experience")?.items[0]?.title || "Canonical Profile"}
                        </p>
                        <div className="my-2 h-px bg-[#aaa0bc]" />
                        <div className="flex gap-2">
                          <div className="w-2/3 space-y-1">
                            <div className="h-1 w-2/3 rounded-xs bg-[#aaa0bc]" />
                            <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                            <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                            <div className="h-1 w-4/5 rounded-xs bg-[#e8e7e0]" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="h-1 rounded-xs bg-[#aaa0bc]" />
                            <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                          </div>
                        </div>
                      </div>
                      <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-[#878776] shadow-2xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="truncate text-sm font-medium text-[#292a27]">
                        Master CV
                        <span className="font-normal text-[#a2a095]"> — {cv.stylePrefs?.templateId ? cv.stylePrefs.templateId.charAt(0).toUpperCase() + cv.stylePrefs.templateId.slice(1) : "Modern"}</span>
                      </h3>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#a0a094]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Edited {formatRelativeTime(cv.updatedAt)}</span>
                      </p>
                    </div>
                  </button>
                )}

                {/* 2. Draft Applications */}
                {drafts.slice(0, cv ? 2 : 3).map((draft, idx) => {
                  const bgClass = idx % 2 === 0 ? "bg-[#e9ecdf]" : "bg-[#efe7dd]";
                  const accentLine = idx % 2 === 0 ? "bg-[#a7af8f]" : "bg-[#c1ad95]";
                  return (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => navigate({ to: "/drafts", search: { id: draft.id } })}
                      className="group overflow-hidden rounded-xl border border-[#e6e5dd] bg-[#fffefa] text-left transition hover:border-[#c3bab0] hover:shadow-xs cursor-pointer"
                    >
                      <div className={`relative flex h-36 justify-center overflow-hidden ${bgClass}`}>
                        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-white/70 bg-white/75 px-2 py-1 text-xs text-[#7d886c] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          Tailored
                        </span>
                        <div className="mt-5 w-40 rounded-t bg-[#fffefa] px-5 pb-4 pt-4 shadow-xs transition group-hover:-translate-y-1">
                          <p className="text-[11px] font-bold tracking-tight text-[#292a27] truncate uppercase">
                            {cv?.contact?.name || "Alex Morgan"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#b0aca2]">
                            {draft.jobTitle}
                          </p>
                          <div className={`my-2 h-px ${accentLine}`} />
                          <div className="flex gap-2">
                            <div className="w-2/3 space-y-1">
                              <div className={`h-1 w-2/3 rounded-xs ${accentLine}`} />
                              <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                              <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                              <div className="h-1 w-4/5 rounded-xs bg-[#e8e7e0]" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className={`h-1 rounded-xs ${accentLine}`} />
                              <div className="h-1 rounded-xs bg-[#e8e7e0]" />
                            </div>
                          </div>
                        </div>
                        <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-[#878776] shadow-2xs">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-sm font-medium text-[#292a27]">
                          {draft.jobTitle}
                          <span className="font-normal text-[#a2a095]"> — {draft.company}</span>
                        </h3>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#a0a094]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Edited {formatRelativeTime(draft.createdAt)}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Workspace Readiness: standard section typography, no outer boxed container, compact setup checklist */}
          {isAllReady ? (
            <section id="readiness-section" className="mb-7 scroll-mt-6">
              <div className="flex items-center gap-2 text-xs text-[#73736b] py-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Ready to tailor your next application</span>
              </div>
            </section>
          ) : (
            <section id="readiness-section" className="mb-7 scroll-mt-6">
              <div className="mb-3">
                <h2 className="text-lg font-medium tracking-tight text-[#292a27] font-heading">
                  Workspace readiness
                </h2>
                <p className="mt-1 text-sm text-[#73736b]">
                  Complete your local setup to tailor and capture applications.
                </p>
              </div>
              <div className="rounded-xl border border-[#e8e7e2] bg-[#fffefa] divide-y divide-[#eeede7]">
                {/* Row 1: Save your CV */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 sm:px-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="mt-0.5 sm:mt-0 shrink-0">
                      {isCvSaved ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#c7c5bc]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#292a27]">Save your CV</span>
                      <span className="mx-2 text-[#dcdcd5] hidden sm:inline">&middot;</span>
                      <span className="block sm:inline text-xs text-[#73736b]">
                        {isCvSaved
                          ? "Master CV saved to your local workspace"
                          : "Store your master resume locally to tailor for job postings"}
                      </span>
                    </div>
                  </div>
                  {!isCvSaved && (
                    <button
                      type="button"
                      onClick={cv ? () => navigate({ to: "/", search: { view: "editor" } }) : handleStartFromScratch}
                      className="text-xs font-medium text-[#625181] hover:text-[#4a396b] shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      Create or import &rarr;
                    </button>
                  )}
                </div>

                {/* Row 2: Connect extension */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 sm:px-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="mt-0.5 sm:mt-0 shrink-0">
                      {isExtensionConnected ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#c7c5bc]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#292a27]">Connect extension</span>
                      <span className="mx-2 text-[#dcdcd5] hidden sm:inline">&middot;</span>
                      <span className="block sm:inline text-xs text-[#73736b]">
                        {isExtensionConnected
                          ? "Extension connected to local bridge"
                          : "Capture job postings directly from your browser"}
                      </span>
                    </div>
                  </div>
                  {!isExtensionConnected && (
                    <Link
                      to="/extension"
                      className="text-xs font-medium text-[#625181] hover:text-[#4a396b] shrink-0 self-start sm:self-auto"
                    >
                      Pair extension &rarr;
                    </Link>
                  )}
                </div>

                {/* Row 3: Choose your AI */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 sm:px-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="mt-0.5 sm:mt-0 shrink-0">
                      {isAiConfigured ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#c7c5bc]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#292a27]">Choose your AI</span>
                      <span className="mx-2 text-[#dcdcd5] hidden sm:inline">&middot;</span>
                      <span className="block sm:inline text-xs text-[#73736b]">
                        {isAiConfigured
                          ? `AI provider active (${workspaceStatus?.aiProvider ? workspaceStatus.aiProvider.toUpperCase() : "Configured"})`
                          : "Bring your private OpenAI, Anthropic, or GLM API key"}
                      </span>
                    </div>
                  </div>
                  {!isAiConfigured && (
                    <Link
                      to="/settings/ai"
                      className="text-xs font-medium text-[#625181] hover:text-[#4a396b] shrink-0 self-start sm:self-auto"
                    >
                      Configure AI &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Application Toolkit: restored illustrated coming-next toolkit matching reference lines 390-507 */}
          <section id="tools-section" className="mb-7 scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium tracking-tight text-[#292a27] font-heading">
                Your application toolkit
              </h2>
              <p className="mt-1 text-xs text-[#99998f]">
                Polish your portrait, review your CV, and draft your introduction.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Card 1: Portrait studio */}
              <div className="overflow-hidden rounded-xl border border-[#e8e6dd] bg-[#fffefa] text-left shadow-2xs">
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-[#ececdf]" aria-hidden="true">
                  <div className="absolute h-36 w-36 rounded-full border border-[#dcdcca]" />
                  <div className="absolute h-24 w-24 rounded-full border border-[#dddecb]" />
                  <div className="relative mr-[-12px] mt-5 h-24 w-20 -rotate-[12deg] overflow-hidden rounded-lg border-4 border-[#fffef7] shadow-xs bg-[#e2e2d5] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#a3a692]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div className="relative -mt-2 h-28 w-24 rotate-[8deg] overflow-hidden rounded-lg border-4 border-[#fffef7] shadow-xs bg-[#f7f6ed] flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#7d886c]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span className="absolute right-5 top-5 rounded-full bg-[#fafbf1] p-1.5 leading-none text-[#93986e]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.857L13 21l-2.286-6.857L5 12l5.714-2.857L13 3z" />
                    </svg>
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-[#292a27]">Portrait studio</h3>
                    <span className="rounded-md bg-[#eeede7] px-2 py-0.5 text-[10px] font-medium text-[#73736b]">
                      Coming next
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#919287]">
                    Upload and preview a professional portrait crop.
                  </p>
                </div>
              </div>

              {/* Card 2: CV review */}
              <div className="overflow-hidden rounded-xl border border-[#e8e6dd] bg-[#fffefa] text-left shadow-2xs">
                <div className="relative flex h-32 items-center justify-center bg-[#f1e7de]" aria-hidden="true">
                  <div className="relative flex w-48 -rotate-3 items-center gap-3 rounded-xl border border-white/90 bg-[#fffaf4] p-3.5 shadow-xs">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#a8b48e] bg-[#f5f8ef] text-[#788761]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#766a5d]">Review checklist</p>
                      <div className="mt-1.5 h-1.5 w-20 rounded-full bg-[#e8e1d6]">
                        <div className="h-full w-10/12 rounded-full bg-[#bbc5a4]" />
                      </div>
                      <p className="mt-1 text-[11px] text-[#b2a697]">Action-driven verbs</p>
                    </div>
                  </div>
                  <svg className="absolute right-7 top-5 rotate-12 w-7 h-7 text-[#c5a284]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-[#292a27]">CV review</h3>
                    <span className="rounded-md bg-[#eeede7] px-2 py-0.5 text-[10px] font-medium text-[#73736b]">
                      Coming next
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#919287]">
                    Check your writing for clarity and impact.
                  </p>
                </div>
              </div>

              {/* Card 3: Cover letter builder */}
              <div className="overflow-hidden rounded-xl border border-[#e8e6dd] bg-[#fffefa] text-left shadow-2xs">
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-[#e5eaf0]" aria-hidden="true">
                  <div className="mt-8 h-32 w-40 -rotate-[8deg] rounded-t-lg bg-[#fafcfe] p-4 shadow-xs">
                    <p className="text-xs font-medium text-[#8b98a6]">Hello, future team.</p>
                    <div className="mt-3 space-y-2">
                      <div className="h-1 w-full rounded bg-[#dfe5ec]" />
                      <div className="h-1 w-11/12 rounded bg-[#dfe5ec]" />
                      <div className="h-1 w-full rounded bg-[#dfe5ec]" />
                      <div className="h-1 w-4/5 rounded bg-[#dfe5ec]" />
                    </div>
                  </div>
                  <div className="absolute right-10 top-7 flex h-9 w-9 rotate-12 items-center justify-center rounded-xl bg-[#ccd8e6] text-[#8a9bb4] shadow-xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-[#292a27]">Cover letter builder</h3>
                    <span className="rounded-md bg-[#eeede7] px-2 py-0.5 text-[10px] font-medium text-[#73736b]">
                      Coming next
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#919287]">
                    Start with an outline. Make it sound like you.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sage Advice Strip: A tiny tip, a big difference */}
          <section id="learn-section" className="mb-8 flex scroll-mt-6 flex-wrap sm:flex-nowrap items-center gap-4 rounded-xl border border-[#e6e5da] bg-[#f2f2e9] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5e7d4] text-[#93976e]" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#292a27]">A tiny tip, a big difference.</p>
              <p className="mt-1 text-xs leading-relaxed text-[#8d907d]">
                Don’t just list what you did. Show the difference you made. Numbers tell a great story.
              </p>
            </div>
          </section>
        </motion.div>
      ) : (
        /* ==================== ASTRA EXACT FOLIO EDITOR SPLIT PANE ==================== */
        <div className="space-y-6">
          {/* Top Folio Header & Document Actions: calm compact controls, restrained toolbar, Export PDF isolated to editor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e7e2] pb-5 no-print">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/", search: { view: "overview" } })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#73736b] hover:text-[#292a27] transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Overview</span>
                </button>
                <span className="text-[#dcdcd5]">/</span>
                <h1 className="text-xl font-bold tracking-tight text-[#292a27] font-heading">
                  Document Studio
                </h1>
              </div>
              <p className="mt-1 text-xs text-[#73736b]">
                Edit your canonical sections and style preferences with real-time printable preview.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/templates"
                className="rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] px-3 py-1.5 text-xs font-medium text-[#292a27] transition hover:bg-[#eeede7]"
              >
                Templates
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  saveStatus === "saved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-[#30332d] text-white hover:bg-[#4a4e43] shadow-xs"
                }`}
              >
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e3dd] bg-white px-3 py-1.5 text-xs font-medium text-[#292a27] transition hover:bg-[#faf9f6] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-[#73736b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {!cv ? (
            <div className="rounded-2xl border border-dashed border-[#dcdcd1] bg-[#fffefa] py-12 px-6 text-center space-y-3">
              <h2 className="text-base font-medium text-[#292a27] font-heading">No CV in Studio</h2>
              <p className="text-xs text-[#8b8c81] max-w-sm mx-auto">
                Start a fresh CV from scratch or upload a document to begin editing.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartFromScratch}
                  className="rounded-lg bg-[#30332d] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#4a4e43]"
                >
                  Create from scratch
                </button>
                <button
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] px-4 py-2 text-xs font-medium text-[#292a27] transition hover:bg-[#eeede7]"
                >
                  Upload document
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Tab Switcher */}
              <div className="lg:hidden no-print flex items-center justify-center">
                <div className="inline-flex rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] p-1">
                  <button
                    type="button"
                    onClick={() => setMobileTab("edit")}
                    className={`rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      mobileTab === "edit"
                        ? "bg-[#30332d] text-white shadow-xs"
                        : "text-[#73736b] hover:text-[#292a27]"
                    }`}
                  >
                    ✏️ Form Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("preview")}
                    className={`rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      mobileTab === "preview"
                        ? "bg-[#30332d] text-white shadow-xs"
                        : "text-[#73736b] hover:text-[#292a27]"
                    }`}
                  >
                    📄 Printable Preview
                  </button>
                </div>
              </div>

              {/* Desktop Two-Column Split Pane / Mobile Active Tab */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div
                  className={`lg:col-span-6 no-print ${
                    mobileTab === "edit" ? "block" : "hidden lg:block"
                  }`}
                >
                  <Editor
                    cv={cv}
                    onChange={handleCvChange}
                    onSave={handleSave}
                    onReset={handleReset}
                    onConnectExtension={handleOpenConnect}
                    onUploadCV={handleOpenUploadModal}
                    saveStatus={saveStatus}
                    storageError={storageError}
                    validationErrors={validationErrors}
                  />
                </div>

                <div
                  className={`lg:col-span-6 lg:sticky lg:top-24 ${
                    mobileTab === "preview" ? "block" : "hidden lg:block"
                  }`}
                >
                  <Preview
                    cv={cv}
                    onTemplateChange={handleTemplateChange}
                    onPrint={() => window.print()}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

          {/* Connect to Extension Modal */}
          {isConnectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292a27]/50 backdrop-blur-xs no-print">
              <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] max-w-md w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3">
                  <h2 className="text-sm font-bold text-[#292a27] font-heading flex items-center gap-2">
                    <span className="text-[#9782d8]">🔗</span> Connect Browser Extension
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="text-[#73736b] hover:text-[#292a27] text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="p-3 bg-[#faf9f6] rounded-xl border border-[#eeeadd] text-xs text-[#73736b] space-y-2 leading-relaxed">
                  <p className="font-semibold text-[#292a27]">
                    Local Storage &amp; AI Transfer Consent:
                  </p>
                  <p>
                    Syncing stores your master CV locally on your machine at <code>127.0.0.1:3000</code>.
                  </p>
                  <p>
                    When you use the extension on a job posting, document text is processed by your configured AI provider to prioritize relevant experience.
                  </p>
                </div>

                {syncError && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
                    <strong>Error:</strong> {syncError}
                  </div>
                )}

                {!pairingCode ? (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleGeneratePairingCode(true)}
                      disabled={isSyncing}
                      className="w-full py-2.5 px-4 bg-[#30332d] hover:bg-[#4a4e43] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      {isSyncing ? "Connecting..." : cv ? "Sync Master CV & Get Code" : "Get Pairing Code"}
                    </button>
                    <div className="text-center pt-1">
                      <Link to="/extension" className="text-xs text-[#625181] hover:underline">
                        Or open dedicated Extension Setup page &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="text-center p-4 bg-[#e8e0f3]/40 border border-[#ddd3e9] rounded-xl">
                      <span className="text-[11px] font-semibold text-[#625181] uppercase tracking-wider block mb-1">
                        One-Time Pairing Code
                      </span>
                      <div className="text-3xl font-mono font-extrabold text-[#292a27] tracking-widest select-all">
                        {pairingCode}
                      </div>
                      <span className="text-[11px] text-[#73736b] block mt-2">
                        Enter this code in the extension popup (valid for 10 minutes)
                      </span>
                    </div>

                    {syncSuccess && (
                      <p className="text-xs text-emerald-600 text-center font-medium">
                        ✓ Master CV synced to local backend successfully
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pairingCode);
                          alert("Code copied to clipboard!");
                        }}
                        className="flex-1 py-2 bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27] rounded-lg text-xs font-semibold transition cursor-pointer border border-[#e4e3dd]"
                      >
                        Copy Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(false)}
                        className="flex-1 py-2 bg-[#30332d] hover:bg-[#4a4e43] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Existing CV Modal */}
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292a27]/50 backdrop-blur-xs no-print">
              <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] max-w-lg w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3">
                  <h2 className="text-sm font-bold text-[#292a27] font-heading flex items-center gap-2">
                    <span className="text-[#9782d8]">📄</span> Upload &amp; Extract CV
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setOverwriteCandidate(null);
                    }}
                    className="text-[#73736b] hover:text-[#292a27] text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                {overwriteCandidate ? (
                  <div className="space-y-4 py-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                      <div className="font-bold text-amber-950">Existing CV Profile Found</div>
                      <p>
                        A master CV is already loaded. Replacing it will overwrite your current profile with the extracted data:
                      </p>
                      <p className="font-semibold">
                        Name: {overwriteCandidate.contact.name || "Unnamed"} ({overwriteCandidate.sections.length} sections extracted)
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOverwriteCandidate(null)}
                        className="flex-1 py-2 px-3 bg-[#f5f4f0] hover:bg-[#eeede7] text-[#292a27] rounded-lg text-xs font-semibold cursor-pointer border border-[#e4e3dd]"
                      >
                        Keep Existing CV
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmOverwrite}
                        className="flex-1 py-2 px-3 bg-[#30332d] hover:bg-[#4a4e43] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Replace &amp; Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {aiStatus && !aiStatus.configured && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <div className="font-bold text-amber-950">⚠️ AI Provider Key Required</div>
                        <p>
                          Document extraction requires an active AI provider. Please configure your key in settings.
                        </p>
                        <Link to="/settings/ai" className="inline-block font-semibold text-[#625181] hover:underline pt-0.5">
                          Go to AI Settings &rarr;
                        </Link>
                      </div>
                    )}

                    {extractError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <span className="font-semibold">Error:</span> {extractError}
                      </div>
                    )}

                    <div className="flex border-b border-[#e8e7e2] text-xs">
                      <button
                        type="button"
                        onClick={() => setUploadMode("file")}
                        className={`pb-2 px-3 font-semibold border-b-2 cursor-pointer transition ${
                          uploadMode === "file"
                            ? "border-[#30332d] text-[#292a27]"
                            : "border-transparent text-[#73736b] hover:text-[#292a27]"
                        }`}
                      >
                        Upload Document (PDF / DOCX)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode("text")}
                        className={`pb-2 px-3 font-semibold border-b-2 cursor-pointer transition ${
                          uploadMode === "text"
                            ? "border-[#30332d] text-[#292a27]"
                            : "border-transparent text-[#73736b] hover:text-[#292a27]"
                        }`}
                      >
                        Paste Text
                      </button>
                    </div>

                    {uploadMode === "file" ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-[#292a27]">
                          Select PDF or DOCX file (max 5MB)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              if (f.size > 5 * 1024 * 1024) {
                                setExtractError("Selected file exceeds 5MB limit.");
                                setSelectedFile(null);
                              } else {
                                setExtractError(null);
                                setSelectedFile(f);
                              }
                            }
                          }}
                          className="block w-full text-xs text-[#73736b] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#e8e0f3] file:text-[#625181] hover:file:bg-[#ddd3e9] cursor-pointer border border-[#e8e7e2] rounded-lg p-2 bg-white"
                        />
                        {selectedFile && (
                          <div className="text-[11px] text-[#73736b]">
                            Selected: <span className="font-mono">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-[#292a27]">
                          Paste your CV text directly
                        </label>
                        <textarea
                          rows={6}
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder="Paste experience, education, skills, and contact details..."
                          className="w-full text-xs font-mono border border-[#e8e7e2] rounded-xl p-2.5 focus:outline-hidden focus:border-[#9782d8] bg-white text-[#292a27]"
                        />
                        <div className="text-[11px] text-[#92928a] text-right">
                          {pastedText.length} / 60,000 characters
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-[#faf9f6] border border-[#eeeadd] rounded-xl space-y-1.5 text-xs text-[#73736b]">
                      <p className="font-semibold text-[#292a27]">Data Transfer Notice</p>
                      <p className="text-[11px] leading-relaxed">
                        Extracting your CV sends document text to your configured AI provider ({aiStatus?.provider || "OpenAI/Anthropic/GLM"}).
                      </p>
                      <label className="flex items-start gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="mt-0.5 rounded text-[#625181] focus:ring-[#9782d8]"
                        />
                        <span className="text-[11.5px] font-medium text-[#292a27] select-none">
                          I consent to sending this document text to my configured AI provider for structuring.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e8e7e2]">
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(false)}
                        className="px-3 py-1.5 text-xs text-[#73736b] hover:text-[#292a27] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExtractCV}
                        disabled={
                          isExtracting ||
                          !consentChecked ||
                          (uploadMode === "file" ? !selectedFile : !pastedText.trim()) ||
                          (aiStatus !== null && !aiStatus.configured)
                        }
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#30332d] hover:bg-[#4a4e43] disabled:opacity-50 text-white transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
                      >
                        {isExtracting ? extractProgress || "Extracting..." : "Extract & Structure CV"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
    </div>
  );
}
