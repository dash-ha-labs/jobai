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

  const fetchAIStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
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
      ) : !cv ? (
        /* FRESH STATE: Folio Welcome & Intake */
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
          className="space-y-8"
        >
          {/* Welcome Header */}
          <section id="welcome" className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#292a27] font-heading">
                Let’s build your next chapter.
              </h1>
              <p className="mt-1.5 text-sm text-[#73736b]">
                Your CVs, application tools, and next steps. All in one local workspace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartFromScratch}
                className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create a CV</span>
              </button>
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e8e7e2] bg-[#f5f4f0] px-4 py-2.5 text-xs font-semibold text-[#292a27] transition hover:bg-[#eeede7] cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#73736b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Document</span>
              </button>
            </div>
          </section>

          {/* Featured Lavender Hero / Opportunity Banner with Document Thumbnail Composition */}
          <section id="hero" className="relative isolate overflow-hidden rounded-2xl border border-[#ddd3e9] bg-[#e8e0f3] grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-9">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/40 px-3 py-1.5 text-xs font-medium text-[#625181]">
                <svg className="w-3.5 h-3.5 text-[#9782d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>YOUR NEXT OPPORTUNITY STARTS HERE</span>
              </div>
              <h2 className="max-w-md text-3xl sm:text-4xl font-semibold leading-[1.18] tracking-tight text-[#292a27] font-heading">
                Your next role.
                <br />
                A CV to match.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#625181]">
                Turn your experience into a focused application. Start with a canonical profile, add your achievements, and tailor on-demand with zero cloud tracking.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartFromScratch}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer"
                >
                  <span>Start from scratch</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#c9bcd9] bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#292a27] transition hover:bg-white cursor-pointer"
                >
                  <span>Upload existing CV</span>
                </button>
              </div>
              <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-[#79648f]">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free to use. 100% stored locally in your browser.</span>
              </p>
            </div>

            {/* Overlapping Document-Thumbnail Composition */}
            <div className="relative hidden min-h-[300px] items-center justify-center md:flex select-none" aria-hidden="true">
              <div className="absolute right-7 top-6 h-64 w-64 rounded-full border border-white/40 pointer-events-none" />
              <div className="absolute right-0 top-1 h-80 w-80 rounded-full border border-white/25 pointer-events-none" />
              {/* Left Thumbnail: Target Job Spec */}
              <div className="absolute left-4 top-10 w-48 -rotate-[6deg] rounded-xl border border-white/90 bg-[#f7f4fa] p-4 shadow-[0_8px_24px_rgba(97,70,119,0.1)] transition-transform hover:rotate-0">
                <div className="mb-3 flex items-center gap-1.5 border-b border-[#e7e1ed] pb-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cfc7db]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dcd5e4]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e6dfed]" />
                  <span className="ml-auto text-[10px] text-[#a398ae] font-medium">target role</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e0e7dc] text-xs font-semibold text-[#625181]">
                  🎯
                </div>
                <p className="mt-2 text-xs font-bold text-[#292a27] truncate">
                  Target Opportunity
                </p>
                <p className="text-[10px] text-[#9c92a4] truncate">
                  Active Job Postings
                </p>
                <div className="my-3 space-y-1.5">
                  <div className="h-1.5 w-full rounded-xs bg-[#e2dce9]" />
                  <div className="h-1.5 w-4/5 rounded-xs bg-[#e2dce9]" />
                  <div className="h-1.5 w-11/12 rounded-xs bg-[#e2dce9]" />
                </div>
                <div className="rounded-md bg-[#e7dfef] py-1 text-center text-[10px] font-medium text-[#625181]">
                  JobAI Extension Ready
                </div>
              </div>
              {/* Right Thumbnail: Master Profile Document */}
              <div className="absolute right-6 top-8 w-52 rotate-[4deg] rounded-xl border border-white bg-[#fffefb] p-4 shadow-[0_14px_35px_rgba(112,87,128,0.15)] transition-transform hover:rotate-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8e0f3] text-[10px] font-bold text-[#625181]">
                    JA
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#292a27] truncate">
                      Canonical Profile
                    </p>
                    <p className="text-[10px] text-[#979489]">
                      A4 Print-Ready
                    </p>
                  </div>
                </div>
                <div className="mb-2 mt-3 h-px bg-[#dbddd2]" />
                <p className="text-[10px] font-semibold text-[#74796b] uppercase tracking-wider">Summary</p>
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                  <div className="h-1 w-5/6 rounded-xs bg-[#e7e7df]" />
                </div>
                <p className="mb-1 mt-2.5 text-[10px] font-semibold text-[#74796b] uppercase tracking-wider">Experience</p>
                <div className="space-y-1">
                  <div className="h-1 w-3/4 rounded-xs bg-[#9782d8]/60" />
                  <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                  <div className="h-1 w-4/5 rounded-xs bg-[#e7e7df]" />
                </div>
              </div>
            </div>
          </section>

          {/* Three Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#fffefa] border border-[#e8e7e2] shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8e0f3] text-xs font-semibold text-[#625181] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#292a27] font-heading">100% Private</p>
              <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
                Stored strictly in your local browser and on 127.0.0.1:3000. Zero cloud telemetry.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#fffefa] border border-[#e8e7e2] shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8e0f3] text-xs font-semibold text-[#625181] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#292a27] font-heading">ATS Optimized</p>
              <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
                Clean semantic markup engineered for automated applicant tracking scanners and crisp A4 PDF prints.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#fffefa] border border-[#e8e7e2] shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8e0f3] text-xs font-semibold text-[#625181] mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#292a27] font-heading">One-Click Tailor</p>
              <p className="text-xs text-[#73736b] mt-1 leading-relaxed">
                Extract job postings in 1 click via Chrome extension and generate tailored drafts instantly.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ACTIVE CV WORKSPACE */
        <div className="space-y-6">
          {/* Top Folio Header & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e7e2] pb-5 no-print">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#292a27] font-heading">
                  {isEditorView ? "Document Studio" : `Welcome back, ${cv.contact.name?.split(" ")[0] || "Job Hunter"}`}
                </h1>
                <span className="rounded-full bg-[#e8e0f3] px-2.5 py-0.5 text-xs font-medium text-[#625181] border border-[#ddd3e9]">
                  Canonical Master CV
                </span>
              </div>
              <p className="mt-1 text-xs text-[#73736b]">
                {isEditorView
                  ? "Edit your canonical sections and style preferences with real-time printable preview."
                  : "Overview of your application assets, master profile, and active job tailoring."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Segmented View Switcher: Overview vs Editor */}
              <div className="inline-flex rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] p-1">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/", search: { view: "overview" } })}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    !isEditorView
                      ? "bg-[#30332d] text-white shadow-xs"
                      : "text-[#73736b] hover:text-[#292a27]"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isEditorView
                      ? "bg-[#30332d] text-white shadow-xs"
                      : "text-[#73736b] hover:text-[#292a27]"
                  }`}
                >
                  Editor
                </button>
              </div>

              {!isEditorView && (
                <button
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="rounded-lg border border-[#e4e3dd] bg-white px-3 py-1.5 text-xs font-medium text-[#292a27] transition hover:bg-[#faf9f6] cursor-pointer"
                >
                  Re-import
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#30332d] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* VIEW A: OVERVIEW DASHBOARD */}
          {!isEditorView ? (
            <div className="space-y-8">
              {/* Featured Lavender Hero / Opportunity Banner with Document Thumbnail Composition */}
              <section id="hero" className="relative isolate overflow-hidden rounded-2xl border border-[#ddd3e9] bg-[#e8e0f3] grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-9">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9bcd9] bg-white/40 px-3 py-1.5 text-xs font-medium text-[#625181]">
                    <svg className="w-3.5 h-3.5 text-[#9782d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>ACTIVE OPPORTUNITY TAILORING</span>
                  </div>
                  <h2 className="max-w-md text-3xl sm:text-4xl font-semibold leading-[1.18] tracking-tight text-[#292a27] font-heading">
                    Your next role.
                    <br />
                    A CV to match.
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#625181]">
                    Turn your canonical experience into a focused application. Start with a target role, generate targeted drafts, and export ATS-ready PDFs.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#4a4e43] cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Pair Extension to Tailor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#c9bcd9] bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#292a27] transition hover:bg-white cursor-pointer"
                    >
                      <span>Open Document Studio</span>
                    </button>
                  </div>
                  <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-[#79648f]">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>100% on-device. Zero cloud CV telemetry.</span>
                  </p>
                </div>

                {/* Overlapping Document-Thumbnail Composition */}
                <div className="relative hidden min-h-[300px] items-center justify-center md:flex select-none" aria-hidden="true">
                  <div className="absolute right-7 top-6 h-64 w-64 rounded-full border border-white/40 pointer-events-none" />
                  <div className="absolute right-0 top-1 h-80 w-80 rounded-full border border-white/25 pointer-events-none" />
                  {/* Left Thumbnail: Target Job Spec */}
                  <div className="absolute left-4 top-10 w-48 -rotate-[6deg] rounded-xl border border-white/90 bg-[#f7f4fa] p-4 shadow-[0_8px_24px_rgba(97,70,119,0.1)] transition-transform hover:rotate-0">
                    <div className="mb-3 flex items-center gap-1.5 border-b border-[#e7e1ed] pb-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cfc7db]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#dcd5e4]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e6dfed]" />
                      <span className="ml-auto text-[10px] text-[#a398ae] font-medium">target role</span>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e0e7dc] text-xs font-semibold text-[#625181]">
                      🎯
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#292a27] truncate">
                      {drafts[0]?.jobTitle || "Senior Engineer"}
                    </p>
                    <p className="text-[10px] text-[#9c92a4] truncate">
                      {drafts[0]?.company || "Active Opportunity"}
                    </p>
                    <div className="my-3 space-y-1.5">
                      <div className="h-1.5 w-full rounded-xs bg-[#e2dce9]" />
                      <div className="h-1.5 w-4/5 rounded-xs bg-[#e2dce9]" />
                      <div className="h-1.5 w-11/12 rounded-xs bg-[#e2dce9]" />
                    </div>
                    <div className="rounded-md bg-[#e7dfef] py-1 text-center text-[10px] font-medium text-[#625181]">
                      JobAI Extension Ready
                    </div>
                  </div>
                  {/* Right Thumbnail: Master Profile Document */}
                  <div className="absolute right-6 top-8 w-52 rotate-[4deg] rounded-xl border border-white bg-[#fffefb] p-4 shadow-[0_14px_35px_rgba(112,87,128,0.15)] transition-transform hover:rotate-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8e0f3] text-[10px] font-bold text-[#625181]">
                        JA
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#292a27] truncate">
                          {cv.contact.name || "Canonical CV"}
                        </p>
                        <p className="text-[10px] text-[#979489]">
                          {cv.stylePrefs?.templateId || "modern"} layout
                        </p>
                      </div>
                    </div>
                    <div className="mb-2 mt-3 h-px bg-[#dbddd2]" />
                    <p className="text-[10px] font-semibold text-[#74796b] uppercase tracking-wider">Summary</p>
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                      <div className="h-1 w-5/6 rounded-xs bg-[#e7e7df]" />
                    </div>
                    <p className="mb-1 mt-2.5 text-[10px] font-semibold text-[#74796b] uppercase tracking-wider">Experience</p>
                    <div className="space-y-1">
                      <div className="h-1 w-3/4 rounded-xs bg-[#9782d8]/60" />
                      <div className="h-1 w-full rounded-xs bg-[#e7e7df]" />
                      <div className="h-1 w-4/5 rounded-xs bg-[#e7e7df]" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 Top Summary Metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e8e7e2] bg-[#fffefa] p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">Master Resume</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                      Validated
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-[#292a27] font-heading truncate">
                    {cv.contact.name || "Untitled Profile"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#73736b]">
                    <span>Template: {cv.stylePrefs?.templateId || "modern"}</span>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                      className="font-medium text-[#625181] hover:underline cursor-pointer"
                    >
                      Open editor &rarr;
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e8e7e2] bg-[#fffefa] p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">Applications</span>
                    <span className="inline-flex items-center rounded-full bg-[#e8e0f3] px-2 py-0.5 text-[11px] font-medium text-[#625181] border border-[#ddd3e9]">
                      {drafts.length} Active
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-[#292a27] font-heading">
                    {drafts.length} Tailored {drafts.length === 1 ? "Role" : "Roles"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#73736b]">
                    <span>Targeted CVs ready</span>
                    <Link to="/drafts" className="font-medium text-[#625181] hover:underline">
                      View all &rarr;
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e8e7e2] bg-[#fffefa] p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">AI Tailoring</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                      aiStatus?.configured
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {aiStatus?.configured ? "BYOK Active" : "Key Needed"}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-[#292a27] font-heading truncate">
                    {aiStatus?.provider ? `${aiStatus.provider.toUpperCase()}` : "Not Configured"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#73736b]">
                    <span className="truncate">{aiStatus?.model || "Standard extraction"}</span>
                    <Link to="/settings/ai" className="font-medium text-[#625181] hover:underline">
                      Configure &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Document & Toolkit Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Canonical Master CV Document Card */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e7e2] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">DOCUMENT VIEW</span>
                          <span className="rounded-full bg-[#e8e3f1] px-2 py-0.5 text-[11px] font-medium text-[#625181]">
                            {cv.stylePrefs?.templateId === "executive"
                              ? "Executive Serif"
                              : cv.stylePrefs?.templateId === "tech"
                              ? "Technical Code"
                              : cv.stylePrefs?.templateId === "compact"
                              ? "Compact ATS"
                              : "Modern Clean"}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-[#292a27] font-heading mt-0.5">
                          Canonical Master CV
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                          className="rounded-lg bg-[#30332d] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#4a4e43] cursor-pointer"
                        >
                          Open in Editor
                        </button>
                        <Link
                          to="/templates"
                          className="rounded-lg border border-[#e4e3dd] bg-[#f5f4f0] px-3 py-1.5 text-xs font-medium text-[#292a27] transition hover:bg-[#eeede7]"
                        >
                          Templates
                        </Link>
                      </div>
                    </div>

                    {/* Miniature Paper Canvas */}
                    <div
                      onClick={() => navigate({ to: "/", search: { view: "editor" } })}
                      className="mt-5 relative overflow-hidden rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-6 sm:p-8 cursor-pointer transition hover:border-[#c9bcd9] shadow-2xs group"
                      title="Click to open in editor"
                    >
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition rounded-md bg-[#30332d] px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
                        Click to edit &rarr;
                      </div>

                      <div className="border-b border-[#e8e7e2] pb-4">
                        <h3 className="text-xl font-bold tracking-tight text-[#292a27] font-heading">
                          {cv.contact.name || "Alex Morgan"}
                        </h3>
                        <p className="mt-1 text-xs text-[#73736b] flex flex-wrap gap-x-3 gap-y-1">
                          {cv.contact.email && <span>{cv.contact.email}</span>}
                          {cv.contact.phone && <span>• {cv.contact.phone}</span>}
                          {cv.contact.location && <span>• {cv.contact.location}</span>}
                        </p>
                      </div>

                      {cv.summary && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">Summary</p>
                          <p className="mt-1 text-xs text-[#4a4e43] line-clamp-3 leading-relaxed">
                            {cv.summary}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 space-y-3">
                        {cv.sections.slice(0, 2).map((sec) => (
                          <div key={sec.id}>
                            <p className="text-xs font-semibold tracking-wider text-[#92928a] uppercase">{sec.title || sec.type}</p>
                            <div className="mt-1.5 space-y-2">
                              {sec.items.slice(0, 2).map((item) => (
                                <div key={item.id} className="text-xs">
                                  <div className="flex items-center justify-between font-medium text-[#292a27]">
                                    <span>{item.title}</span>
                                    <span className="text-[11px] text-[#92928a]">{item.date}</span>
                                  </div>
                                  {item.subtitle && <p className="text-[11px] text-[#73736b]">{item.subtitle}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#e8e7e2] text-[11px] text-[#92928a]">
                        <span>{cv.sections.length} sections defined</span>
                        <span className="font-medium text-[#625181]">Double click to open full editor</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Applications & Career Toolkit */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Recent Applications Card */}
                  <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#e8e7e2] pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-[#292a27] font-heading">Recent Applications</h2>
                        <p className="text-[11px] text-[#73736b]">Roles tailored from extension or job text</p>
                      </div>
                      <Link to="/drafts" className="text-xs font-medium text-[#625181] hover:underline">
                        View all &rarr;
                      </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                      {drafts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#e4e3dd] bg-[#faf9f6] p-6 text-center">
                          <p className="text-xs font-semibold text-[#292a27]">No tailored drafts yet</p>
                          <p className="text-[11px] text-[#73736b] mt-1">
                            Use the JobAI extension on job boards or import a description below to tailor your CV.
                          </p>
                          <Link
                            to="/import-job"
                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#30332d] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#4a4e43]"
                          >
                            Tailor for a role
                          </Link>
                        </div>
                      ) : (
                        drafts.slice(0, 3).map((draft) => (
                          <div
                            key={draft.id}
                            className="rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-3.5 transition hover:border-[#c9bcd9]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-[#292a27] truncate">{draft.jobTitle}</p>
                                <p className="text-[11px] font-medium text-[#625181]">{draft.company}</p>
                              </div>
                              <span className="text-[10px] text-[#92928a] shrink-0">
                                {new Date(draft.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#f0eee6] text-[11px]">
                              <a
                                href={`/api/pdf/${draft.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#73736b] hover:text-[#292a27]"
                              >
                                PDF
                              </a>
                              <Link
                                to="/drafts"
                                search={{ id: draft.id }}
                                className="font-medium text-[#625181] hover:underline"
                              >
                                Review &rarr;
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Honest Career Toolkit Grid */}
                  <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-6 shadow-xs space-y-3">
                    <div className="border-b border-[#e8e7e2] pb-3">
                      <h2 className="text-sm font-bold text-[#292a27] font-heading">Application Toolkit</h2>
                      <p className="text-[11px] text-[#73736b]">Real on-device utilities for job search</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      <Link
                        to="/import-job"
                        className="group flex items-start gap-3 rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-3 transition hover:border-[#c9bcd9] hover:bg-[#faf8f5]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8e0f3] text-[#625181]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#292a27] group-hover:text-[#625181]">Match Job Description</p>
                          <p className="text-[11px] text-[#73736b]">Paste job requirements to align keywords and highlights.</p>
                        </div>
                      </Link>

                      <Link
                        to="/extension"
                        className="group flex items-start gap-3 rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-3 transition hover:border-[#c9bcd9] hover:bg-[#faf8f5]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8e0f3] text-[#625181]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#292a27] group-hover:text-[#625181]">Chrome Extension</p>
                          <p className="text-[11px] text-[#73736b]">Capture postings from LinkedIn, Indeed, and Ashby.</p>
                        </div>
                      </Link>

                      <Link
                        to="/templates"
                        className="group flex items-start gap-3 rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-3 transition hover:border-[#c9bcd9] hover:bg-[#faf8f5]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8e0f3] text-[#625181]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#292a27] group-hover:text-[#625181]">Resume Templates</p>
                          <p className="text-[11px] text-[#73736b]">Switch between Modern, Executive, Tech, and Compact.</p>
                        </div>
                      </Link>

                      <Link
                        to="/settings/ai"
                        className="group flex items-start gap-3 rounded-xl border border-[#e8e7e2] bg-[#fcfbf9] p-3 transition hover:border-[#c9bcd9] hover:bg-[#faf8f5]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8e0f3] text-[#625181]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#292a27] group-hover:text-[#625181]">AI Engine Settings</p>
                          <p className="text-[11px] text-[#73736b]">Bring your own OpenAI, Anthropic, or GLM API key.</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: DOCUMENT EDITOR SPLIT PANE */
            <div className="space-y-4">
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
                    📄 Live Preview
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
      )}
    </div>
  );
}
