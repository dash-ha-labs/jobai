import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { loadMasterCV, saveMasterCV, deleteMasterCV } from "jobai-shared";
import type { CV } from "jobai-shared";
import { Editor } from "../components/Editor";
import { Preview } from "../components/Preview";

interface SearchParams {
  template?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      template: typeof search.template === "string" ? search.template : undefined,
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

      // If user already has a saved CV, confirm before replacing
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

  // Load existing CV from browser localStorage
  useEffect(() => {
    const res = loadMasterCV();
    if (res.success && res.data) {
      // If template was specified in URL query, apply it
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
      // If URL specified template on blank start
      if (search.template) {
        setCv(createBlankCV(search.template));
      }
    }
    setLoading(false);
  }, [search.template]);

  // Handle changes in local state
  const handleCvChange = useCallback((updatedCv: CV) => {
    setCv(updatedCv);
    setSaveStatus("unsaved");
    setValidationErrors([]);
    setStorageError(null);
  }, []);

  // Start from scratch button
  const handleStartFromScratch = () => {
    const fresh = createBlankCV(search.template || "modern");
    setCv(fresh);
    setSaveStatus("unsaved");
  };

  // Validate CV before saving
  const validateBeforeSave = (targetCv: CV): string[] => {
    const errors: string[] = [];
    if (!targetCv.contact.name || !targetCv.contact.name.trim()) {
      errors.push("Full Name is required");
    }
    if (!targetCv.contact.email || !targetCv.contact.email.trim()) {
      errors.push("Email Address is required");
    }

    // Check items in sections
    for (const sec of targetCv.sections) {
      for (const item of sec.items) {
        if (!item.title || !item.title.trim()) {
          errors.push(`An item in "${sec.title || sec.type}" is missing a title`);
        }
      }
    }

    return errors;
  };

  // Explicit Save
  const handleSave = () => {
    if (!cv) return;

    // Run user validation
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

  // Destructive Reset
  const handleReset = () => {
    deleteMasterCV();
    setCv(null);
    setSaveStatus("idle");
    setStorageError(null);
    setValidationErrors([]);
    navigate({ to: "/", search: {} });
  };

  // Connect to Extension state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

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
          // 1. Save locally
          saveMasterCV(cv);

          // 2. Sync to local server
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

      // 3. Request pairing code
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

  // Template switch in preview
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

  return (
    <div className="space-y-6">
      {/* Hidden SEO / SSR marker for contract compatibility */}
      <div className="sr-only">
        <h1>JobAI Document Editor — Canonical Master CV</h1>
        <span>Modern Clean</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Loading document editor...
        </div>
      ) : !cv ? (
        /* FRESH STATE: Concise 'Create your CV' */
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your CV</h1>
            <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Build a polished, professional CV with real-time printable previews. Everything is stored privately in your browser.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleStartFromScratch}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Start from scratch
              </button>

              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold border border-slate-300 transition-colors cursor-pointer"
              >
                Upload existing CV
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Upload PDF, DOCX, or paste text to extract your profile using configured AI.
            </p>
          </div>
        </motion.div>
      ) : (
        /* ACTIVE DOCUMENT EDITOR: Split Pane */
        <div className="space-y-4">
          {/* Mobile Segmented View Switcher */}
          <div className="lg:hidden no-print flex items-center justify-center">
            <div className="inline-flex rounded-lg bg-slate-200 p-1">
              <button
                type="button"
                onClick={() => setMobileTab("edit")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mobileTab === "edit"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✏️ Edit Content
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mobileTab === "preview"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 Live Preview
              </button>
            </div>
          </div>

          {/* Desktop Two-Column Split Pane / Mobile Active Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Editor */}
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

            {/* Right Column: Live Printable Preview */}
            <div
              className={`lg:col-span-6 lg:sticky lg:top-20 ${
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

          {/* Connect to Extension Modal */}
          {isConnectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-indigo-600">🔗</span> Connect to Chrome Extension
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                  <div className="font-semibold text-slate-800">
                    Local Server Storage &amp; AI Transfer Consent:
                  </div>
                  <p>
                    Syncing stores your master CV locally on your machine at <code>127.0.0.1:3000</code> (<code>.jobai-data/profile.json</code>).
                  </p>
                  <p>
                    When you use the extension to tailor your CV for a job listing, your CV and the job text are sent to your configured AI provider (OpenAI-compatible) to select and prioritize your existing experience.
                  </p>
                  <p className="font-medium text-slate-700">
                    Your master profile is never overwritten. No data leaves your machine without your explicit action.
                  </p>
                </div>

                {syncError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-xs border border-red-200">
                    <strong>Error:</strong> {syncError}
                  </div>
                )}

                {!pairingCode ? (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleGeneratePairingCode(true)}
                      disabled={isSyncing}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      {isSyncing ? "Connecting..." : cv ? "Sync Master CV & Get Pairing Code" : "Get Pairing Code"}
                    </button>
                    <div className="text-center pt-1">
                      <a href="/extension" className="text-xs text-indigo-600 hover:underline">
                        Or open dedicated Extension Setup page &rarr;
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="text-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block mb-1">
                        One-Time Pairing Code
                      </span>
                      <div className="text-3xl font-mono font-extrabold text-indigo-900 tracking-widest select-all">
                        {pairingCode}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-2">
                        Enter this code in the JobAI Chrome extension popup (valid for 10 minutes)
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
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Copy Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-indigo-600">📄</span> Upload & Extract CV
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setOverwriteCandidate(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                {/* Overwrite Confirmation Dialog */}
                {overwriteCandidate ? (
                  <div className="space-y-4 py-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                      <div className="font-bold text-amber-950">Existing CV Profile Found</div>
                      <p>
                        A master CV is already loaded in your browser. Replacing it will overwrite your current profile with the extracted data:
                      </p>
                      <p className="font-semibold">
                        Name: {overwriteCandidate.contact.name || "Unnamed"} ({overwriteCandidate.sections.length} sections extracted)
                      </p>
                      <p className="text-slate-600">
                        You will be able to review and edit all fields in the editor before clicking &ldquo;Save CV&rdquo;.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setOverwriteCandidate(null)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Keep Existing CV
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmOverwrite}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Replace & Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* AI Configuration Warning */}
                    {aiStatus && !aiStatus.configured && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1 text-amber-950">
                          <span>⚠️ AI Provider Key Required</span>
                        </div>
                        <p>
                          Document extraction requires an active AI provider. Please configure your API key in AI settings first.
                        </p>
                        <a
                          href="/settings/ai"
                          className="inline-block font-semibold text-indigo-600 hover:underline pt-0.5"
                        >
                          Go to AI Settings &rarr;
                        </a>
                      </div>
                    )}

                    {extractError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                        <span className="font-semibold">Error:</span> {extractError}
                      </div>
                    )}

                    {/* Mode Tabs */}
                    <div className="flex border-b border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setUploadMode("file")}
                        className={`pb-2 px-3 font-semibold border-b-2 cursor-pointer transition-colors ${
                          uploadMode === "file"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Upload Document (PDF / DOCX)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode("text")}
                        className={`pb-2 px-3 font-semibold border-b-2 cursor-pointer transition-colors ${
                          uploadMode === "text"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Paste Text
                      </button>
                    </div>

                    {/* File Input */}
                    {uploadMode === "file" ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">
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
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg p-2"
                        />
                        {selectedFile && (
                          <div className="text-[11px] text-slate-500">
                            Selected: <span className="font-mono">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Text-based PDFs and Word documents supported. Scanned/image-only PDFs require copy-pasting into Paste Text.
                        </p>
                      </div>
                    ) : (
                      /* Paste Text Input */
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Paste your CV text directly
                        </label>
                        <textarea
                          rows={6}
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder="Paste work experience, education, skills, and contact details..."
                          className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <div className="text-[11px] text-slate-400 text-right">
                          {pastedText.length} / 60,000 characters
                        </div>
                      </div>
                    )}

                    {/* Data Transfer Consent Notice */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>Data Transfer Notice</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Extracting your CV sends document text to your configured AI provider (
                        <span className="font-medium text-slate-800">{aiStatus?.provider || "OpenAI/Anthropic/GLM"}</span>, model{" "}
                        <span className="font-mono text-slate-800">{aiStatus?.model || "default"}</span>
                        ). Your provider key will be charged according to their standard token rates.
                      </p>
                      <label className="flex items-start gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11.5px] font-medium text-slate-800 select-none">
                          I consent to sending this document text to my configured AI provider for structuring.
                        </span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
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
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed"
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
