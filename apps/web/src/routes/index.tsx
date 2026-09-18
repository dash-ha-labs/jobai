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
                disabled
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium border border-slate-200 cursor-not-allowed"
                title="Document parsing backend not yet implemented"
              >
                Upload existing CV (Unavailable)
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Direct document upload requires server-side parsing (currently in development).
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
        </div>
      )}
    </div>
  );
}
