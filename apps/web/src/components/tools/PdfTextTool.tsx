import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractLocalPdfText,
  PdfTextError,
  PDF_TEXT_LIMITS,
  type PdfTextErrorCode,
} from "../../lib/pdf-text";

// Local-only PDF text preview tool (tools-contract U02 / spec jobai-pdf-tool-ui-slice).
// Standalone functional component for a future public /tools/pdf-text page.
// Bytes stay in memory; no upload, no storage, no network (core P02 contract).

type Phase = "idle" | "ready" | "extracting" | "done" | "error";

type Extraction = { text: string; pageCount: number };

const ERROR_HELP: Record<PdfTextErrorCode, string> = {
  INVALID_FILE: "That file does not look like a PDF. Choose a standard PDF file and try again.",
  TOO_LARGE: `PDF is larger than the ${PDF_TEXT_LIMITS.MAX_BYTES / 1024 / 1024} MiB limit. Try a smaller file.`,
  TOO_MANY_PAGES: `PDF has more than ${PDF_TEXT_LIMITS.MAX_PAGES} pages. Use a PDF with ${PDF_TEXT_LIMITS.MAX_PAGES} pages or fewer.`,
  ENCRYPTED:
    "This PDF is password-protected, which is not supported. Remove the password on your own copy (for example by printing to PDF) and try again.",
  NO_TEXT:
    "No text layer was found — this PDF looks scanned or image-only. This tool does not perform OCR, so there is no text to preview.",
  OUTPUT_TOO_LARGE: "The extracted text is too large to show here. Use a shorter PDF.",
  TIMEOUT: "Extraction took too long and was stopped. Try again, or use a smaller PDF.",
  CANCELLED: "Extraction was cancelled.",
  EXTRACTION_FAILED: "Text could not be extracted from this PDF. Try again, or use a different PDF.",
};

const MAX_FILE_BYTES = PDF_TEXT_LIMITS.MAX_BYTES;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfTextTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Extraction | null>(null);
  const [errorCode, setErrorCode] = useState<PdfTextErrorCode | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "denied">("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  // Hard stop for any in-flight extraction on unmount (stale-result guard).
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetOutput = useCallback(() => {
    setResult(null);
    setErrorCode(null);
    setCopyState("idle");
    setAnnouncement("");
  }, []);

  const handleFileChosen = useCallback(
    (chosen: File | null) => {
      abortRef.current?.abort(); // new choice cancels any in-flight run
      runIdRef.current += 1; // and invalidates its eventual result
      resetOutput();
      setFile(chosen);
      setPhase(chosen ? "ready" : "idle");
      if (chosen) {
        setAnnouncement(`Selected ${chosen.name}. Nothing has been read yet.`);
      }
    },
    [resetOutput],
  );

  const handlePreview = useCallback(async () => {
    if (!file || phase === "extracting") return;
    const runId = ++runIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("extracting");
    setErrorCode(null);
    setResult(null);
    setCopyState("idle");
    setAnnouncement("Reading text from your PDF on this device. This can take a moment.");

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const outcome = await extractLocalPdfText(bytes, { signal: controller.signal });
      if (runIdRef.current !== runId) return; // stale run — discard silently
      setResult(outcome);
      setPhase("done");
      setAnnouncement(
        `Text preview ready — ${outcome.pageCount} ${outcome.pageCount === 1 ? "page" : "pages"}.`,
      );
    } catch (err) {
      if (runIdRef.current !== runId) return; // stale run — discard silently
      const code = err instanceof PdfTextError ? err.code : "EXTRACTION_FAILED";
      if (code === "CANCELLED") {
        setPhase(file ? "ready" : "idle");
        setAnnouncement("Extraction cancelled. Choose Preview text to try again.");
      } else {
        setErrorCode(code);
        setPhase("error");
        setAnnouncement(`Extraction failed: ${ERROR_HELP[code]}`);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [file, phase]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    runIdRef.current += 1;
    resetOutput();
    setFile(null);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
    setAnnouncement("Cleared. Your file and its text are no longer on this page.");
    inputRef.current?.focus();
  }, [resetOutput]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopyState("copied");
      setAnnouncement("Text copied to clipboard.");
    } catch {
      setCopyState("denied");
      setAnnouncement(
        "Clipboard access was refused. The text below stays selected — select it manually or use Download .txt.",
      );
      outputRef.current?.querySelector("pre")?.focus();
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pdf-text.txt";
    anchor.rel = "noopener";
    anchor.click();
    URL.revokeObjectURL(url);
    setAnnouncement("Text file download started (pdf-text.txt).");
  }, [result]);

  const handleRetry = useCallback(() => {
    void handlePreview();
  }, [handlePreview]);

  const fileName = file?.name ?? "";
  const fileSize = file ? formatBytes(file.size) : "";
  const oversize = file !== null && file.size > MAX_FILE_BYTES;
  const canPreview = file !== null && !oversize && phase !== "extracting";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <section
        aria-labelledby="pdf-text-tool-title"
        className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-5 sm:p-8 shadow-xs"
      >
        <h2
          id="pdf-text-tool-title"
          className="text-xl sm:text-2xl font-medium tracking-tight text-[#191b20] font-heading"
        >
          Preview text from your PDF
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#636c7a]">
          Read the text layer of a PDF you choose, entirely on this device. Your file is never
          uploaded, stored, or sent anywhere — text extraction happens in this page and is cleared
          when you leave or press Clear. Extracted text can differ from what you see in a PDF
          viewer, and it is not an employer ATS output. No OCR: scanned, image-only PDFs have no
          text to extract.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#8b939f]">
          Limits: PDF up to {MAX_FILE_BYTES / 1024 / 1024} MiB, up to {PDF_TEXT_LIMITS.MAX_PAGES}{" "}
          pages, up to {PDF_TEXT_LIMITS.MAX_CODEPOINTS / 1000},000 characters of text.
        </p>

        {/* File chooser */}
        <div className="mt-6">
          <label
            htmlFor="pdf-text-file"
            className="block text-sm font-medium text-[#191b20]"
          >
            Choose a PDF from your device
          </label>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <input
              ref={inputRef}
              id="pdf-text-file"
              type="file"
              accept="application/pdf,.pdf"
              className="block w-full text-sm text-[#191b20] rounded-lg border border-[#e3e6eb] bg-white px-3 py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-[#f1f3f6] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#191b20] cursor-pointer"
              onChange={(event) => handleFileChosen(event.target.files?.[0] ?? null)}
            />
            {phase === "extracting" ? (
              <button
                key="cancel"
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e3e6eb] bg-white px-4 py-2.5 text-sm font-medium text-[#191b20] shadow-2xs transition hover:bg-[#f1f3f6] cursor-pointer w-full sm:w-auto shrink-0"
              >
                Cancel
              </button>
            ) : (
              <button
                key="preview"
                type="button"
                onClick={handlePreview}
                disabled={!canPreview}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#191b20] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-[#3f4753] cursor-pointer w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                Preview text
              </button>
            )}
          </div>
          {file && (
            <p className="mt-2 text-xs text-[#636c7a]">
              Selected: <span className="font-medium text-[#191b20]">{fileName}</span> ({fileSize}
              ){oversize ? " — over the 5 MiB limit" : ""}. Nothing is read until you press
              Preview text.
            </p>
          )}
        </div>

        {/* Errors near input */}
        {phase === "error" && errorCode && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-[#ecd9d3] bg-[#f7f8fa] p-4"
          >
            <p className="text-sm font-medium text-[#7a3b24]">
              Could not extract text{file ? ` from ${fileName}` : ""}.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#657080]">{ERROR_HELP[errorCode]}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#e3e7ed] bg-white px-3.5 py-2 text-xs font-medium text-[#191b20] transition hover:bg-[#f7f8fa] cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === "extracting" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-[#636c7a]" aria-hidden="false">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[#8b939f] motion-safe:animate-pulse"
              aria-hidden="true"
            />
            Reading your PDF on this device…
          </p>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-[#191b20]">
                Extracted text — {result.pageCount} {result.pageCount === 1 ? "page" : "pages"}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#191b20] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#3f4753] cursor-pointer"
                >
                  Copy text
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e6eb] bg-white px-3.5 py-1.5 text-xs font-medium text-[#191b20] transition hover:bg-[#f7f8fa] cursor-pointer"
                >
                  Download .txt
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e6eb] bg-[#f1f3f6] px-3.5 py-1.5 text-xs font-medium text-[#191b20] transition hover:bg-[#e3e6eb] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
            {copyState === "copied" && (
              <p className="mt-2 text-xs font-medium text-emerald-700">Copied to clipboard.</p>
            )}
            {copyState === "denied" && (
              <p className="mt-2 text-xs font-medium text-[#7a3b24]">
                Clipboard access was refused. Select the text below manually, or use Download .txt.
              </p>
            )}
            <div
              ref={outputRef}
              className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-[#e3e6eb] bg-white p-4"
            >
              <pre
                tabIndex={0}
                className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#191b20] font-sans focus:outline-none focus:ring-2 focus:ring-[#c5cbd4] focus:rounded-lg"
                aria-label="Extracted PDF text"
              >
                {result.text}
              </pre>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#8b939f]">
              Pages appear in order, separated by a blank line. Text comes from the PDF&rsquo;s
              text layer only; images and scanned content are not recognised, so parts of the
              visible document may be missing here.
            </p>
            <div className="mt-4 rounded-xl border border-[#e3e6eb] bg-[#f1f3f6] p-4">
              <p className="text-sm font-medium text-[#191b20]">Have a CV to write?</p>
              <p className="mt-1 text-xs leading-relaxed text-[#636c7a]">
                Use this text as a reference while you build a clean, truthful CV in the editor.
              </p>
              <a
                href="/app"
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#c5cbd4] bg-white/60 px-3.5 py-2 text-xs font-medium text-[#191b20] transition hover:bg-white cursor-pointer no-underline"
              >
                Create your CV
              </a>
            </div>
          </div>
        )}

        {/* Live announcements */}
        <p aria-live="polite" role="status" className="sr-only">
          {announcement}
        </p>
      </section>
    </div>
  );
}

export default PdfTextTool;
