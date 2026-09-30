import { createFileRoute, useNavigate, Link, useBlocker } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { loadMasterCV, saveMasterCV, deleteMasterCV } from "jobai-shared";
import type { CV } from "jobai-shared";
import { Editor } from "../../components/Editor";
import { CvPrintPreview } from "../../components/CvPrintPreview";
import { PageLayout } from "../../components/PageLayout";
import { getWorkProfile } from "../../content/work-profiles";
import "../../components/editor-studio.css";

interface SearchParams {
  template?: string;
  track?: string;
}

export const Route = createFileRoute("/app/editor")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      template: typeof search.template === "string" ? search.template : undefined,
      track: typeof search.track === "string" && getWorkProfile(search.track) ? search.track : undefined,
    };
  },
  component: EditorComponent,
});

function createBlankCV(templateId = "modern", track?: string): CV {
  const profile = getWorkProfile(track);
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
    sections: profile ? profile.starterSections.map((section, index) => ({ ...section, id: `sec-${Date.now()}-${index}`, items: [] })) : [
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
      primaryColor: "#245bd7",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function EditorComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [cv, setCv] = useState<CV | null>(() => createBlankCV(search.template || "modern", search.track));
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const blocker = useBlocker({ shouldBlockFn: () => saveStatus === "unsaved", enableBeforeUnload: saveStatus === "unsaved", withResolver: true });
  useEffect(() => {
    if (blocker.status === "blocked") leaveDialog.current?.showModal();
    else leaveDialog.current?.close();
  }, [blocker.status]);
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

  // Calm Editor More Actions & Reset Confirm State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreMenuOpen]);

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

  useEffect(() => {
    fetchAIStatus();

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
        setCv(createBlankCV(search.template, search.track));
      }
    }
    setLoading(false);
  }, [search.template, search.track]);

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

      // Always show extracted details for review before applying them, even when starting from a blank profile.
      setOverwriteCandidate(structuredCV);
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
    const fresh = createBlankCV(search.template || "modern", search.track);
    setCv(fresh);
    setSaveStatus("unsaved");
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

  const handleSave = (): boolean => {
    if (!cv) return false;
    const errors = validateBeforeSave(cv);
    if (errors.length > 0) { setValidationErrors(errors); return false; }
    setSaveStatus("saving");
    const result = saveMasterCV(cv);
    if (result.success) {
      setSaveStatus("saved"); setStorageError(null); setValidationErrors([]);
      return true;
    }
    setSaveStatus("unsaved"); setStorageError(result.error ?? "Could not save your CV in this browser.");
    return false;
  };

  const handleReset = () => {
    deleteMasterCV();
    setCv(null);
    setSaveStatus("idle");
    setStorageError(null);
    setValidationErrors([]);
    navigate({ to: "/app" });
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

  const handleExportPdf = useCallback(async () => {
    const paper = document.getElementById("cv-paper");
    if (!paper || !cv) {
      window.print();
      return;
    }
    try {
      const { exportCvPaperToPdf } = await import("../../lib/cv-pdf-export");
      const safeName = (cv.contact.name || "cv").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
      const paperSize = cv.stylePrefs?.paperSize === "Letter" ? "Letter" : "A4";
      await exportCvPaperToPdf(paper, `${safeName}.pdf`, paperSize);
    } catch {
      window.print();
    }
  }, [cv]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-12 text-center text-sm text-[#636c7a]">
        Loading document workspace...
      </div>
    );
  }

  return (
    <PageLayout variant="fluid" className="editor-studio space-y-6">
      {/* Hidden SEO / SSR marker for contract compatibility */}
      <div className="sr-only">
        <h1>JobAI Document Editor — Canonical Master CV</h1>
        <span>Modern Clean</span>
      </div>

      <div className="editor-studio-header no-print">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#17212f] font-heading truncate">
            {cv?.contact?.name ? `${cv.contact.name}’s CV` : "My CV"}
          </h1>

          {/* Real Save State Indicator */}
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[#536174] bg-white border border-[#d7dee8] px-3 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-accent)] animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shrink-0">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#536174] bg-white border border-[#d7dee8] px-3 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4973b]" />
              Unsaved edits
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" aria-pressed={showPreview} onClick={() => setShowPreview((value) => !value)} className="editor-studio-secondary">
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className={`editor-studio-primary ${
              saveStatus === "saved"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-80 cursor-default"
                : "bg-[#191b20] text-white hover:bg-[#3f4753] shadow-xs disabled:opacity-50"
            }`}
          >
            {saveStatus === "saving" ? (
              "Saving..."
            ) : saveStatus === "saved" ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save CV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="editor-studio-secondary"
          >
            <svg className="w-3.5 h-3.5 text-[#636c7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Export PDF</span>
          </button>

          {/* Accessible More Actions Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              id="more-actions-button"
              aria-haspopup="true"
              aria-expanded={isMoreMenuOpen}
              aria-label="More actions"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            className="editor-studio-secondary"
            >
              <span>More</span>
              <svg className="w-3 h-3 text-[#8b939f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMoreMenuOpen && (
              <div
                role="menu"
                aria-labelledby="more-actions-button"
                className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#e3e6eb] bg-white p-1.5 shadow-lg z-50 text-xs"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handleOpenUploadModal();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[#3f4753] hover:bg-[#f1f3f6] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#636c7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import document...</span>
                </button>
                <Link
                  to="/app/templates"
                  role="menuitem"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[#3f4753] hover:bg-[#f1f3f6] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#636c7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span>Browse templates</span>
                </Link>
                <div className="border-t border-[#e3e6eb] my-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setShowResetConfirm(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Reset CV...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {getWorkProfile(search.track) && <p className="editor-studio-context">Editing a {getWorkProfile(search.track)!.label} CV · {getWorkProfile(search.track)!.help}</p>}
      <dialog ref={leaveDialog} className="work-leave-dialog" aria-labelledby="leave-cv-title" onCancel={event => { event.preventDefault(); blocker.reset?.(); }}>
        <span className="work-kicker">KEEP YOUR WORK</span><h2 id="leave-cv-title">You have unsaved CV edits.</h2><p>Save your profile before leaving, or keep editing here.</p>
        {validationErrors.length > 0 && <p role="alert">{validationErrors.join(". ")}. Choose “Keep editing” to complete these details.</p>}
        {storageError && <p role="alert">{storageError}</p>}
        <div><button className="work-primary" onClick={() => { if (handleSave()) blocker.proceed?.(); }}>Save and continue</button><button className="work-text-link" onClick={() => blocker.reset?.()}>Keep editing</button></div>
        <button className="work-quiet-link" onClick={() => blocker.proceed?.()}>Leave without saving</button>
      </dialog>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191b20]/40 backdrop-blur-xs no-print"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          aria-describedby="reset-dialog-desc"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 id="reset-dialog-title" className="text-sm font-bold text-[#191b20]">
                  Clear entire CV?
                </h2>
                <p id="reset-dialog-desc" className="mt-1 text-xs text-[#636c7a] leading-relaxed">
                  All content, section edits, and custom styles will be permanently deleted from your local storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg border border-[#e3e6eb] bg-white px-3 py-1.5 text-xs font-medium text-[#3f4753] hover:bg-[#f1f3f6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  handleReset();
                }}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {!cv ? (
        <div className="rounded-2xl border border-dashed border-[#e3e6eb] bg-[#ffffff] py-12 px-6 text-center space-y-3">
          <h2 className="text-base font-medium text-[#191b20] font-heading">No CV in Studio</h2>
          <p className="text-xs text-[#8b939f] max-w-sm mx-auto">
            Start a fresh CV from scratch or upload a document to begin editing.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartFromScratch}
              className="rounded-lg bg-[#191b20] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3f4753]"
            >
              Create from scratch
            </button>
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="rounded-lg border border-[#e3e6eb] bg-[#f1f3f6] px-4 py-2 text-xs font-medium text-[#191b20] transition hover:bg-[#e3e6eb]"
            >
              Upload document
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={`editor-studio-layout ${showPreview ? "has-preview" : ""}`}>
            <div className="editor-studio-form no-print">
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

            <div className="editor-studio-preview" data-visible={showPreview} aria-hidden={!showPreview}>
              <CvPrintPreview cv={cv} />
            </div>
          </div>
        </>
      )}

      {/* Connect to Extension Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191b20]/50 backdrop-blur-xs no-print">
          <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-3">
              <h2 className="text-sm font-bold text-[#191b20] font-heading flex items-center gap-2">
                <span className="text-[var(--ui-accent)]">🔗</span> Connect Browser Extension
              </h2>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="text-[#636c7a] hover:text-[#191b20] text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-[#f7f8fa] rounded-xl border border-[#f1f3f6] text-xs text-[#636c7a] space-y-2 leading-relaxed">
              <p className="font-semibold text-[#191b20]">
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
                  className="w-full py-2.5 px-4 bg-[#191b20] hover:bg-[#3f4753] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  {isSyncing ? "Connecting..." : cv ? "Sync Master CV & Get Code" : "Get Pairing Code"}
                </button>
                <div className="text-center pt-1">
                  <Link to="/app/extension" className="text-xs text-[var(--ui-accent)] hover:underline">
                    Or open dedicated Extension Setup page &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="text-center p-4 bg-[var(--ui-accent-soft)]/40 border border-[var(--ui-accent-line)] rounded-xl">
                  <span className="text-[11px] font-semibold text-[var(--ui-accent)] uppercase tracking-wider block mb-1">
                    One-Time Pairing Code
                  </span>
                  <div className="text-3xl font-mono font-extrabold text-[#191b20] tracking-widest select-all">
                    {pairingCode}
                  </div>
                  <span className="text-[11px] text-[#636c7a] block mt-2">
                    Enter this code in the extension popup (valid for 10 minutes)
                  </span>
                </div>

                {syncSuccess && (
                  <p className="text-xs text-emerald-600 text-center font-medium">
                    ✓ Master CV synced to local backend successfully
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="w-full py-2 bg-[#f1f3f6] hover:bg-[#e3e6eb] text-[#191b20] rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload CV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191b20]/50 backdrop-blur-xs no-print">
          <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-3">
              <h2 className="text-sm font-bold text-[#191b20] font-heading flex items-center gap-2">
                <span className="text-[var(--ui-accent)]">📄</span> Import Existing CV
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#636c7a] hover:text-[#191b20] text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {aiStatus && !aiStatus.configured && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200">
                <strong>AI Not Configured:</strong> CV structuring requires a configured AI provider. Please configure your key in{" "}
                <Link to="/app/settings/ai" className="underline font-semibold">
                  AI Settings
                </Link>{" "}
                first.
              </div>
            )}

            {overwriteCandidate ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--ui-accent-soft)] bg-[var(--ui-accent-soft)] p-3">
                  <p className="text-xs font-semibold text-[var(--ui-accent-hover)]">Step 2 of 2 · Review imported details</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ui-accent)]">
                    Here is the structured profile from your document. It will only replace your current editor content when you choose “Apply reviewed details.”
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--ui-accent)]">
                    {overwriteCandidate.contact.name || "Name not found"} · {overwriteCandidate.sections.reduce((count, section) => count + section.items.length, 0)} entries found
                  </p>
                  {overwriteCandidate.summary && <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-[#555159]">Summary: {overwriteCandidate.summary}</p>}
                  <ul className="mt-2 space-y-1 text-[11px] text-[#555159]">
                    {overwriteCandidate.sections.filter((section) => section.items.length > 0).slice(0, 3).map((section) => (
                      <li key={section.id}><span className="font-medium">{section.title}:</span> {section.items.slice(0, 2).map((item) => item.title || "Untitled entry").join(", ")}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverwriteCandidate(null)}
                    className="px-3 py-1.5 text-xs text-[#636c7a] hover:text-[#191b20] rounded-lg border border-[#e3e6eb]"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOverwrite}
                    className="px-3 py-1.5 text-xs text-white bg-[#191b20] hover:bg-[#3f4753] rounded-lg shadow-xs"
                  >
                    Apply reviewed details
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-[var(--ui-accent-soft)] bg-[var(--ui-accent-soft)] p-3">
                  <p className="text-xs font-semibold text-[var(--ui-accent-hover)]">Step 1 of 2 · Choose what to bring in</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--ui-accent)]">We’ll organize the details, then show you a review before anything is applied.</p>
                </div>
                <div className="flex border-b border-[#e3e6eb] text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`pb-2 px-3 font-medium transition cursor-pointer ${
                      uploadMode === "file"
                        ? "border-b-2 border-[var(--ui-accent)] text-[#191b20] font-semibold"
                        : "text-[#636c7a] hover:text-[#191b20]"
                    }`}
                  >
                    Upload File (PDF, DOCX)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("text")}
                    className={`pb-2 px-3 font-medium transition cursor-pointer ${
                      uploadMode === "text"
                        ? "border-b-2 border-[var(--ui-accent)] text-[#191b20] font-semibold"
                        : "text-[#636c7a] hover:text-[#191b20]"
                    }`}
                  >
                    Paste Text
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#636c7a]">
                      Select PDF or DOCX file (max 5MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-[#636c7a] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f1f3f6] file:text-[#191b20] hover:file:bg-[#e3e6eb] file:cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#636c7a]">
                      Paste CV text
                    </label>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      className="w-full text-xs p-2 rounded-lg border border-[#e3e6eb] bg-[#f7f8fa] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                    />
                  </div>
                )}

                <div className="p-3 bg-[#f7f8fa] rounded-xl border border-[#f1f3f6] text-[11px] text-[#636c7a] space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 rounded border-[#e3e6eb] text-[var(--ui-accent)] focus:ring-[var(--ui-accent)]"
                    />
                    <label htmlFor="consent-checkbox" className="text-[#191b20]">
                      I understand that the extracted text from this file or pasted CV will be sent to my configured AI provider
                      {aiStatus?.provider ? ` (${aiStatus.provider}${aiStatus.model ? ` · ${aiStatus.model}` : ""})` : ""}
                      {" "}to structure a draft profile. I will review it before applying it.
                    </label>
                  </div>
                </div>

                {extractError && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
                    <strong>Error:</strong> {extractError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#636c7a] hover:text-[#191b20] rounded-lg border border-[#e3e6eb]"
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
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#191b20] hover:bg-[#3f4753] disabled:opacity-50 text-white transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
                  >
                    {isExtracting ? extractProgress || "Extracting..." : "Extract & Structure CV"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
