// Inline bounded extraction used where no Web Worker exists (Node test
// harness). Same contract as the worker path: per-page deadline + signal
// checks between pages, loadingTask.destroy() on every outcome.
import { getDocumentProxy } from "unpdf";
import { PdfTextError, PDF_TEXT_LIMITS, validatePdfBytes } from "./pdf-text";

type PdfProxy = Awaited<ReturnType<typeof getDocumentProxy>>;

function fail(code: InstanceType<typeof PdfTextError>["code"], message: string): never {
  throw new PdfTextError(code, message);
}

// Same page-text semantics as unpdf getPageText (str + hasEOL newline join).
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

export async function extractLocalPdfTextInline(
  bytes: Uint8Array,
  options?: { signal?: AbortSignal | null },
): Promise<{ text: string; pageCount: number }> {
  const signal = options?.signal ?? null;
  validatePdfBytes(bytes, signal);

  const deadline = Date.now() + PDF_TEXT_LIMITS.TIMEOUT_MS;

  // Copy: pdf.js may transfer/detach the buffer it is given; the caller's
  // bytes must remain unchanged (V03: original input unchanged).
  const data = bytes.slice();

  let pdf: PdfProxy | null = null;
  try {
    let proxy: PdfProxy;
    try {
      proxy = await getDocumentProxy(data);
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? "";
      const msg = (err as { message?: string })?.message ?? String(err);
      if (name === "PasswordException" || /password/i.test(msg)) {
        fail("ENCRYPTED", "PDF is password-protected.");
      }
      if (name === "InvalidPDFException" || /invalid pdf/i.test(msg)) {
        fail("INVALID_FILE", "PDF could not be parsed.");
      }
      fail("EXTRACTION_FAILED", "PDF could not be opened.");
    }
    pdf = proxy;

    if (signal?.aborted) fail("CANCELLED", "Extraction cancelled.");
    if (pdf.numPages > PDF_TEXT_LIMITS.MAX_PAGES) {
      fail("TOO_MANY_PAGES", `PDF has ${pdf.numPages} pages; limit is 20.`);
    }

    const texts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      // Per-page checks: the loop yields between pages, so the deadline and
      // the signal are observed during (not after) multi-page extraction.
      if (signal?.aborted) fail("CANCELLED", "Extraction cancelled.");
      if (Date.now() > deadline) fail("TIMEOUT", "Extraction timed out.");
      texts.push(await pageText(pdf, pageNumber));
    }

    const pageCount = pdf.numPages;
    // Clear page separators between pages (P02: page order + separators).
    const joined = texts.join("\n\n");
    if (joined.trim().length === 0) {
      fail("NO_TEXT", "No selectable text found in this PDF.");
    }
    if ([...joined].length > PDF_TEXT_LIMITS.MAX_CODEPOINTS) {
      fail("OUTPUT_TOO_LARGE", "Extracted text exceeds the 60,000 character limit.");
    }

    return { text: joined, pageCount };
  } catch (err: unknown) {
    if (err instanceof PdfTextError) throw err;
    const msg = (err as { message?: string })?.message ?? String(err);
    if (/password/i.test(msg)) fail("ENCRYPTED", "PDF is password-protected.");
    if (/terminated/i.test(msg)) fail("CANCELLED", "Extraction cancelled.");
    fail("EXTRACTION_FAILED", "Extraction failed.");
  } finally {
    await pdf?.loadingTask.destroy().catch(() => {});
  }
  throw new Error("unreachable");
}
