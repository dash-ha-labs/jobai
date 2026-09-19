// Worker-side extraction (dedicated Web Worker). Runs the installed unpdf
// serverless PDF.js bundle off the main thread; reports per-page progress so
// the main thread can observe mid-extraction state. The pdfjs bundle detects
// the worker scope itself (`initializeFromPort(self)` guard requires `window`
// absent), runs its LoopbackPort fake worker inline — zero network.
//
// r2 (Finding 2): before unpdf is imported, every network API reachable in
// worker scope is wrapped with a logging no-op guard. Any attempt — including
// one from an executed PDF action — is reported to the main thread as a
// `netguard` message instead of reaching the network. unpdf is imported
// dynamically AFTER the guards exist (module top level, before extraction).
type PdfProxy = Awaited<ReturnType<typeof import("unpdf")["getDocumentProxy"]>>;

import { PDF_TEXT_LIMITS } from "./pdf-text";

export type WorkerRequest = {
  type: "extract";
  id: number;
  bytes: Uint8Array;
  // INSTRUMENTATION (test harness only): artificial per-page delay so a
  // deadline/abort can be observed firing mid-extraction on fast machines.
  // Production callers omit it; semantics/limits are unchanged.
  slowMs?: number;
};

export type WorkerResponse =
  | { type: "page"; id: number; page: number; pageCount: number }
  | { type: "done"; id: number; result: { text: string; pageCount: number } }
  | { type: "error"; id: number; code: string; message: string }
  | { type: "netguard"; id: number; url: string; channel: string };

// Worker-scope net guards: log + block, never fetch. Installed at module
// load, before any parser code runs.
function installNetGuards(report: (url: string, channel: string) => void) {
  const ctx = self as unknown as Record<string, unknown>;
  if (typeof ctx.fetch === "function") {
    ctx.fetch = (...args: unknown[]) => {
      report(String(args[0]), "fetch");
      return Promise.reject(new Error("blocked by pdf-text netguard"));
    };
  }
  if (typeof ctx.XMLHttpRequest === "function") {
    const XHR = ctx.XMLHttpRequest as new () => XMLHttpRequest;
    ctx.XMLHttpRequest = function (this: XMLHttpRequest) {
      const xhr = new XHR();
      xhr.open = (() => {
        throw new Error("blocked by pdf-text netguard");
      }) as XMLHttpRequest["open"];
      return xhr;
    } as unknown as { new (): XMLHttpRequest };
  }
  if (typeof ctx.WebSocket === "function") {
    ctx.WebSocket = function (url: string | URL) {
      report(String(url), "websocket");
      throw new Error("blocked by pdf-text netguard");
    };
  }
  if (typeof ctx.EventSource === "function") {
    ctx.EventSource = function (url: string | URL) {
      report(String(url), "eventsource");
      throw new Error("blocked by pdf-text netguard");
    };
  }
  if (typeof ctx.importScripts === "function") {
    ctx.importScripts = (...urls: string[]) => {
      for (const u of urls) report(String(u), "importScripts");
      throw new Error("blocked by pdf-text netguard");
    };
  }
}

// Guarded dynamic import: unpdf (and pdf.js) code cannot out-race guards.
installNetGuards((url, channel) => {
  const msg: WorkerResponse = { type: "netguard", id: 0, url, channel };
  self.postMessage(msg);
});

async function getDocumentProxy(data: Uint8Array): Promise<PdfProxy> {
  const { getDocumentProxy: open } = await import("unpdf");
  return open(data);
}

async function pageText(pdf: PdfProxy, pageNumber: number): Promise<string> {
  const content = await (await pdf.getPage(pageNumber)).getTextContent();
  return content.items
    .map((item) =>
      "str" in item && typeof item.str === "string"
        ? item.str + ("hasEOL" in item && item.hasEOL ? "\n" : "")
        : "",
    )
    .join("");
}

async function extract(bytes: Uint8Array, id: number, slowMs = 0): Promise<void> {
  let pdf: PdfProxy | null = null;
  try {
    let proxy: PdfProxy;
    try {
      proxy = await getDocumentProxy(bytes);
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? "";
      const msg = (err as { message?: string })?.message ?? String(err);
      if (name === "PasswordException" || /password/i.test(msg)) {
        throw { code: "ENCRYPTED", message: "PDF is password-protected." };
      }
      if (name === "InvalidPDFException" || /invalid pdf/i.test(msg)) {
        throw { code: "INVALID_FILE", message: "PDF could not be parsed." };
      }
      throw { code: "EXTRACTION_FAILED", message: "PDF could not be opened." };
    }
    pdf = proxy;

    if (pdf.numPages > PDF_TEXT_LIMITS.MAX_PAGES) {
      throw {
        code: "TOO_MANY_PAGES",
        message: `PDF has ${pdf.numPages} pages; limit is 20.`,
      };
    }

    const texts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      texts.push(await pageText(pdf, pageNumber));
      if (slowMs > 0) {
        // INSTRUMENTATION delay only (see WorkerRequest.slowMs).
        await new Promise<void>((r) => setTimeout(r, slowMs));
      }
      // Mid-extraction progress heartbeat: lets the main thread (and tests)
      // see parsing is ongoing and which page is active.
      const msg: WorkerResponse = {
        type: "page",
        id,
        page: pageNumber,
        pageCount: pdf.numPages,
      };
      self.postMessage(msg);
    }

    const joined = texts.join("\n\n");
    if (joined.trim().length === 0) {
      throw { code: "NO_TEXT", message: "No selectable text found in this PDF." };
    }
    if ([...joined].length > PDF_TEXT_LIMITS.MAX_CODEPOINTS) {
      throw {
        code: "OUTPUT_TOO_LARGE",
        message: "Extracted text exceeds the 60,000 character limit.",
      };
    }

    const done: WorkerResponse = {
      type: "done",
      id,
      result: { text: joined, pageCount: pdf.numPages },
    };
    self.postMessage(done);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const msg: WorkerResponse = {
      type: "error",
      id,
      code: e.code ?? "EXTRACTION_FAILED",
      message: e.message ?? "Extraction failed.",
    };
    self.postMessage(msg);
  } finally {
    await pdf?.loadingTask.destroy().catch(() => {});
  }
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const req = ev.data;
  if (req?.type !== "extract") return;
  void extract(req.bytes, req.id, req.slowMs ?? 0);
};
