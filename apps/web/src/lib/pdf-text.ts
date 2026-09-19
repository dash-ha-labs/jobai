// Local-only PDF text extraction for the browser (tools-contract I03/P02).
//
// r2 repair (reviews r1 Findings 1): parsing runs inside a dedicated Web
// Worker (pdf-text.worker.ts). The main thread owns the wall clock and the
// AbortSignal and enforces both with worker.terminate(), which stops the
// parser mid-extraction by spec — no rejected-Promise-while-parser-continues.
// The worker reports per-page progress, so the harness can observe abort
// DURING extraction, not after it. Workers fetch nothing: the worker module
// is a local static asset bundled by vite and the bytes are transferred
// in-memory (transferable), never over the network (P02).
//
// Node has no Web Worker, so the same bounded extraction runs inline there
// with per-page deadline/signal checks (used only by the Node test harness).
import { extractLocalPdfTextInWorker } from "./pdf-text.worker-client";
import { extractLocalPdfTextInline } from "./pdf-text-inline";

export type PdfTextResult = { text: string; pageCount: number };

export type PdfTextErrorCode =
  | "INVALID_FILE"
  | "TOO_LARGE"
  | "TOO_MANY_PAGES"
  | "ENCRYPTED"
  | "NO_TEXT"
  | "OUTPUT_TOO_LARGE"
  | "TIMEOUT"
  | "CANCELLED"
  | "EXTRACTION_FAILED";

export class PdfTextError extends Error {
  code: PdfTextErrorCode;
  constructor(code: PdfTextErrorCode, message: string) {
    super(message);
    this.name = "PdfTextError";
    this.code = code;
  }
}

export const PDF_TEXT_LIMITS = {
  MAX_BYTES: 5_242_880, // 5 MiB (P02)
  MAX_PAGES: 20,
  MAX_CODEPOINTS: 60_000,
  TIMEOUT_MS: 15_000,
} as const;

function fail(code: PdfTextErrorCode, message: string): never {
  throw new PdfTextError(code, message);
}

// Shared pre-flight validation (P02): bytes, size, %PDF- header, signal.
export function validatePdfBytes(bytes: Uint8Array, signal: AbortSignal | null): void {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    fail("INVALID_FILE", "No PDF data provided.");
  }
  if (bytes.byteLength > PDF_TEXT_LIMITS.MAX_BYTES) {
    fail("TOO_LARGE", "PDF is larger than the 5 MiB limit.");
  }
  // Header must be %PDF- within the first 1024 bytes (P02); extension/MIME
  // alone is never sufficient validation.
  const head = new TextDecoder("latin1").decode(
    bytes.subarray(0, Math.min(1024, bytes.byteLength)),
  );
  if (!head.includes("%PDF-")) {
    fail("INVALID_FILE", "File does not look like a PDF.");
  }
  if (signal?.aborted) fail("CANCELLED", "Extraction cancelled.");
}

export async function extractLocalPdfText(
  bytes: Uint8Array,
  options?: { signal?: AbortSignal },
): Promise<PdfTextResult> {
  const signal = options?.signal ?? null;
  validatePdfBytes(bytes, signal);

  // Browser: dedicated worker with terminate-enforced bounds. Everywhere else
  // (Node test harness): inline bounded loop with the same contract.
  if (typeof Worker !== "undefined" && typeof window !== "undefined") {
    return extractLocalPdfTextInWorker(bytes, { signal });
  }
  return extractLocalPdfTextInline(bytes, { signal });
}
