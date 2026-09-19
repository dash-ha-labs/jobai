// Main-thread side of the PDF worker (tools-contract P02 r2 repair).
// Enforces the 15 s wall clock and AbortSignal with worker.terminate():
// a spec-level hard stop of ongoing parsing (Finding 1). Bytes move to the
// worker as an in-memory transferable copy; the caller's buffer is untouched.
import { PdfTextError, PDF_TEXT_LIMITS, type PdfTextResult } from "./pdf-text";
import type { WorkerResponse } from "./pdf-text.worker";

let workerUrl: string | null = null;

// The worker module is a local static asset (P02 allows local static worker
// assets; no CDN). `new URL(...)` keeps vite bundling it correctly.
function getWorkerUrl(): string {
  if (!workerUrl) {
    workerUrl = new URL("./pdf-text.worker.ts", import.meta.url).href;
  }
  return workerUrl;
}

export type WorkerProgress = (page: number, pageCount: number) => void;
export type WorkerNetGuard = (url: string, channel: string) => void;

export async function extractLocalPdfTextInWorker(
  bytes: Uint8Array,
  options?: {
    signal?: AbortSignal | null;
    onProgress?: WorkerProgress;
    onNetGuard?: WorkerNetGuard;
    timeoutMs?: number;
    /** INSTRUMENTATION (test harness only): artificial per-page delay. */
    slowMs?: number;
  },
): Promise<PdfTextResult> {
  const signal = options?.signal ?? null;
  const timeoutMs = options?.timeoutMs ?? PDF_TEXT_LIMITS.TIMEOUT_MS;

  const worker = new Worker(getWorkerUrl(), { type: "module" });
  // Copy: the transferable would detach the caller's buffer (V03 immutability).
  const data = bytes.slice();

  const reqId = 1;
  let lastPage = 0;
  let lastPageCount = 0;

  const cleanup = () => {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    worker.onmessage = null;
    worker.onerror = null;
  };
  const finish = () => {
    cleanup();
    // Hard stop of any ongoing worker parsing (P02: stop resource work).
    worker.terminate();
  };

  let timer: ReturnType<typeof setTimeout>;
  let onAbort: () => void;

  const promise = new Promise<PdfTextResult>((resolve, reject) => {
    let settled = false;
    const settleOk = (r: PdfTextResult) => {
      if (settled) return;
      settled = true;
      finish();
      resolve(r);
    };
    const settleErr = (code: string, message: string) => {
      if (settled) return;
      settled = true;
      finish();
      reject(new PdfTextError(code as PdfTextError["code"], message));
    };

    worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const m = ev.data;
      if (m?.id !== reqId) return;
      if (m.type === "page") {
        lastPage = m.page;
        lastPageCount = m.pageCount;
        options?.onProgress?.(m.page, m.pageCount);
        return;
      }
      if (m.type === "netguard") {
        // Parser or an executed PDF action tried a network API inside the
        // worker; it was blocked. Surface, do not fail the extraction.
        options?.onNetGuard?.(m.url, m.channel);
        return;
      }
      if (m.type === "done") {
        settleOk(m.result);
        return;
      }
      settleErr(m.code, m.message);
    };
    worker.onerror = () => {
      settleErr("EXTRACTION_FAILED", "Extraction failed.");
    };

    timer = setTimeout(() => {
      settleErr(
        "TIMEOUT",
        `Extraction timed out (stopped at page ${lastPage}/${lastPageCount || "?"}).`,
      );
    }, timeoutMs);

    if (signal) {
      onAbort = () => {
        settleErr(
          "CANCELLED",
          `Extraction cancelled (stopped at page ${lastPage}/${lastPageCount || "?"}).`,
        );
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }

    worker.postMessage(
      { type: "extract", id: reqId, bytes: data, slowMs: options?.slowMs ?? 0 },
      [data.buffer],
    );
  });

  return promise;
}
