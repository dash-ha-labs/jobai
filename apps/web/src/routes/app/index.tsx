import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { loadMasterCV, saveMasterCV } from "jobai-shared";
import type { CV } from "jobai-shared";
import { PageLayout } from "../../components/PageLayout";
import { CvJourney } from "../../components/CvJourney";

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

function HomeComponent() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload CV Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const uploadDialog = useRef<HTMLDivElement>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractProgress, setExtractProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    provider: string | null;
    model: string | null;
  } | null>(null);
  const [overwriteCandidate, setOverwriteCandidate] = useState<CV | null>(null);

  useEffect(() => {
    if (!isUploadModalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    uploadDialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExtracting) setIsUploadModalOpen(false);
      if (event.key !== "Tab") return;
      const controls = uploadDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === uploadDialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [isUploadModalOpen, isExtracting]);

  useEffect(() => {
    const res = loadMasterCV();
    if (res.success && res.data) {
      setCv(res.data);
    }
    setLoading(false);
  }, []);

  const handleOpenUploadModal = async (file?: File, mode: "file" | "text" = "file") => {
    setUploadMode(mode);
    setSelectedFile(null);
    setPastedText("");
    setConsentChecked(false);
    setExtractError(null);
    setExtractProgress("");
    setOverwriteCandidate(null);
    setIsUploadModalOpen(true);
    if (file) selectFile(file);

    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setAiStatus({ configured: Boolean(data.aiConfigured), provider: data.aiProvider || null, model: data.aiModel || null });
      }
    } catch {
      setAiStatus(null);
    }
  };

  const selectFile = (file: File | null) => {
    setExtractError(null);
    if (file && !/\.(pdf|docx|txt)$/i.test(file.name)) { setSelectedFile(null); setExtractError("Choose a PDF, Word (.docx), or plain text file."); return; }
    if (file && file.size > 5 * 1024 * 1024) { setSelectedFile(null); setExtractError("Please choose a file smaller than 5 MB."); return; }
    setSelectedFile(file);
  };

  const handleExtractCV = async () => {
    if (!consentChecked) {
      setExtractError("Please agree to send your CV text to your configured AI provider.");
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
    setExtractProgress("Reading your document…");

    try {
      let payload: { text?: string; fileBase64?: string; filename?: string };
      if (uploadMode === "file" && selectedFile) {
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        payload = { fileBase64: btoa(binary), filename: selectedFile.name };
      } else {
        if (pastedText.length > 60000) throw new Error("Please keep your CV text under 60,000 characters.");
        payload = { text: pastedText.trim() };
      }
      setExtractProgress("Organizing your experience into an editable CV…");
      const response = await fetch("/api/cv/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-jobai-csrf": "1" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.cv) throw new Error(result.message || "We couldn’t prepare your CV. Please try again.");
      setOverwriteCandidate(result.cv);
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
    const saved = saveMasterCV(overwriteCandidate);
    if (!saved.success) { setExtractError(saved.error || "Could not save your CV."); return; }
    setCv(overwriteCandidate);
    setOverwriteCandidate(null);
    setIsUploadModalOpen(false);
    navigate({ to: "/app/editor" });
  };

  const handleStartFromScratch = (template?: string, track?: string) => { navigate({ to: "/app/editor", search: { template, track } }); };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-sm text-[#636c7a]">Loading workspace...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <PageLayout variant="fixed" className="work-page-layout">
      <CvJourney onUpload={(file) => { void handleOpenUploadModal(file); }} onPaste={() => { void handleOpenUploadModal(undefined, "text"); }} onBlank={handleStartFromScratch} hasCV={Boolean(cv)} name={cv?.contact.name} sectionCount={cv?.sections.length} />

      {/* Upload CV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div ref={uploadDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Upload your CV" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-3 mb-4">
              <h3 className="text-lg font-medium text-[#191b20]">Bring your experience</h3>
              <button
                disabled={isExtracting}
                aria-label="Close upload"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#636c7a] hover:text-[#191b20] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {overwriteCandidate ? (
              <div className="space-y-4 my-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-xs">
                  <p className="font-semibold text-sm mb-1 text-amber-900">{cv ? "Review before replacing your CV" : "Your CV is ready to review"}</p>
                  {extractError && <p role="alert">{extractError}</p>}
                  {cv ? "Saving this import will replace your current profile. Review these details first." : "Check the imported details before saving your profile. You can edit everything in the next step."}
                </div>
                <div className="rounded-xl border border-[#e3e6eb] p-4 text-sm"><strong>{overwriteCandidate.contact.name || "Name not found"}</strong><p>{overwriteCandidate.contact.email || "Email not found"}</p><p className="mt-2 text-xs text-[#636c7a]">{overwriteCandidate.summary || "No summary found. You can add one in the editor."}</p><p className="mt-2 text-xs">{overwriteCandidate.sections.length} sections imported · Review all details in the editor before exporting.</p></div>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => {
                      setOverwriteCandidate(null);
                      setIsUploadModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg border border-[#e3e6eb] text-xs font-medium text-[#636c7a] hover:bg-[#e3e6eb] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverwrite}
                    className="px-4 py-2 rounded-lg bg-[var(--ui-accent)] text-xs font-medium text-white hover:bg-[var(--ui-accent-hover)] transition shadow-xs cursor-pointer"
                  >
                    {cv ? "Replace and review in editor" : "Save and review in editor"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Configuration Warning */}
                {aiStatus && !aiStatus.configured && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs flex items-center justify-between">
                    <span>Connect an AI provider to import your CV, or try the sample preview first.</span>
                    <Link to="/app/settings/ai" className="font-semibold underline ml-2 shrink-0">
                      Configure AI
                    </Link>
                  </div>
                )}

                {/* Upload Mode Selector */}
                <div className="flex rounded-lg bg-[#f1f3f6] p-1 border border-[#e3e6eb]">
                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={() => setUploadMode("file")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      uploadMode === "file" ? "bg-[#ffffff] text-[#191b20] shadow-xs" : "text-[#636c7a] hover:text-[#191b20]"
                    }`}
                  >
                    Upload a file
                  </button>
                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={() => setUploadMode("text")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      uploadMode === "text" ? "bg-[#ffffff] text-[#191b20] shadow-xs" : "text-[#636c7a] hover:text-[#191b20]"
                    }`}
                  >
                    Paste your text
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div data-dragging={isDragging} className="journey-dropzone rounded-xl border-2 border-dashed border-[#e3e6eb] p-6 text-center hover:border-[var(--ui-accent)] transition bg-[#ffffff]"
                    onDragOver={(event) => { event.preventDefault(); if (!isExtracting) setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(event) => { event.preventDefault(); setIsDragging(false); if (!isExtracting) selectFile(event.dataTransfer.files[0] || null); }}>
                    <svg className="w-8 h-8 text-[#8b939f] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-[#636c7a] mb-1">Drop your CV here, or choose a file · PDF, DOCX, TXT · up to 5 MB</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      aria-label="Choose your CV file"
                      disabled={isExtracting}
                      onChange={(e) => selectFile(e.target.files?.[0] || null)}
                      className="text-xs text-[#636c7a] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--ui-accent)] file:text-white hover:file:bg-[var(--ui-accent-hover)] cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-xs font-medium text-emerald-700 mt-2">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="cv-pasted-text" className="block text-xs font-medium text-[#636c7a] mb-1">
                      Paste full resume or CV text
                    </label>
                    <textarea
                      id="cv-pasted-text"
                      disabled={isExtracting}
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste text containing contact details, work experience, education, and skills..."
                      className="w-full rounded-xl border border-[#e3e6eb] bg-[#ffffff] p-3 text-xs text-[#191b20] focus:border-[var(--ui-accent)] focus:ring-1 focus:ring-[var(--ui-accent)] outline-none font-mono"
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
                    className="mt-0.5 rounded border-[#e3e6eb] text-[var(--ui-accent)] focus:ring-[var(--ui-accent)]"
                  />
                  <label htmlFor="consent-cv" className="text-xs text-[#636c7a] leading-tight">
                    I agree to send the text from this CV to my configured AI provider to create an editable profile. My saved CV will be stored in this browser.
                  </label>
                </div>

                {extractError && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                    {extractError}
                  </div>
                )}

                {extractProgress && (
                  <div className="rounded-lg bg-blue-50 p-2.5 text-xs text-[var(--ui-accent)] border border-blue-200 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span role="status" aria-live="polite">{extractProgress}</span>
                  </div>
                )}

                <div className="border-t border-[#e3e6eb] pt-4 mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isExtracting}
                aria-label="Cancel upload"
                onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#e3e6eb] text-xs font-medium text-[#636c7a] hover:bg-[#e3e6eb] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExtractCV}
                    disabled={isExtracting || !consentChecked}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#191b20] text-xs font-medium text-white hover:bg-[#3f4753] transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isExtracting ? "Preparing your CV…" : "Create my editable CV"}
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
