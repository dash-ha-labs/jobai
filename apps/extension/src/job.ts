/**
 * jobai extension — canonical job page extraction and payload validation.
 * Frozen candidate contract: board/specs/jobai-extension-core.md.
 *
 * Pure DOM data extraction: never fetches, never mutates the page, never
 * evaluates page content. Job page text is untrusted data, not instructions.
 * No top-level browser globals and no side effects at import: this module
 * loads cleanly under plain Node type stripping.
 */

export interface JobPayload {
  title: string;
  company: string;
  sourceUrl: string;
  text: string;
}

export interface ExtractionResult {
  ok: boolean;
  job?: JobPayload;
  error?: string;
}

export const JOB_TITLE_MAX = 300;
export const JOB_TEXT_MAX = 30000;
export const JOB_TEXT_MIN = 100;
export const SOURCE_URL_MAX = 4096;
export const MAX_DOM_DEPTH = 500;

/**
 * The ONE canonical self-contained job extractor function.
 * Can be executed either in Node (passing doc and pageUrl) or injected
 * directly into the browser tab DOM via chrome.scripting.executeScript(func).
 */
export function canonicalExtractJob(
  docArg?: Document,
  pageUrlArg?: string
): ExtractionResult {
  try {
    const doc: Document = docArg || document;
    const pageUrl: string = pageUrlArg || (typeof window !== "undefined" ? window.location.href : "");

    // 1. Safe source URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(pageUrl);
    } catch {
      return { ok: false, error: `jobai: source URL is not a valid URL: ${pageUrl}` };
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return {
        ok: false,
        error: `jobai: unsupported source URL protocol "${parsedUrl.protocol}" — only http/https is allowed`,
      };
    }

    if (parsedUrl.username !== "" || parsedUrl.password !== "") {
      return { ok: false, error: "jobai: source URL must not contain embedded credentials" };
    }

    const canonicalUrl = parsedUrl.toString();
    if (pageUrl.length > 4096 || canonicalUrl.length > 4096) {
      return {
        ok: false,
        error: `jobai: source URL exceeds 4096 (4,096) code units — refusing oversized URL`,
      };
    }

    function oneline(s: string): string {
      return s.replace(/\s+/g, " ").trim();
    }

    function sliceWellFormed(s: string, max: number): string {
      let out = s.slice(0, max);
      const tail = out.slice(-2);
      if (tail.length > 0 && typeof (tail as any).isWellFormed === "function" && !(tail as any).isWellFormed()) {
        out = out.slice(0, -1);
      }
      return out;
    }

    // 2. Title extraction: h1 first, document.title fallback
    function extractTitle(): string {
      const h1 = doc.querySelector("h1");
      const raw = oneline(h1?.textContent ?? "") || oneline(doc.title ?? "");
      return sliceWellFormed(raw, 300);
    }

    // 3. Company extraction from schema.org JobPosting JSON-LD
    function extractCompany(): string {
      for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
        let data: unknown;
        try {
          data = JSON.parse(script.textContent ?? "");
        } catch {
          continue;
        }
        const stack: unknown[] = [data];
        while (stack.length > 0) {
          const cur = stack.pop();
          if (Array.isArray(cur)) {
            stack.push(...cur);
            continue;
          }
          if (typeof cur !== "object" || cur === null) continue;
          const obj = cur as Record<string, unknown>;
          const type = obj["@type"];
          if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
            const orgs = Array.isArray(obj["hiringOrganization"])
              ? obj["hiringOrganization"]
              : [obj["hiringOrganization"]];
            for (const org of orgs) {
              const orgObj =
                typeof org === "object" && org !== null ? (org as Record<string, unknown>) : undefined;
              const name =
                typeof orgObj?.["name"] === "string"
                  ? orgObj["name"]
                  : typeof orgObj?.["legalName"] === "string"
                    ? orgObj["legalName"]
                    : undefined;
              if (typeof name === "string" && name.trim() !== "") {
                return sliceWellFormed(oneline(name), 300);
              }
            }
          }
          const graph = obj["@graph"];
          if (Array.isArray(graph)) stack.push(...graph);
        }
      }
      return "";
    }

    const SKIP_TAGS = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "TEMPLATE",
      "NAV",
      "INPUT",
      "SELECT",
      "TEXTAREA",
      "BUTTON",
      "OPTION",
      "DATALIST",
      "SVG",
      "CANVAS",
      "IFRAME",
    ]);

    const BLOCK_TAGS = new Set([
      "P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE",
      "UL", "OL", "LI", "TABLE", "TR", "H1", "H2", "H3", "H4", "H5", "H6",
      "BR", "BLOCKQUOTE", "PRE", "FIGURE", "FIGCAPTION", "HR", "DL", "DT", "DD",
      "FORM", "FIELDSET", "LABEL",
    ]);

    function isHidden(el: Element): boolean {
      if (el.hasAttribute("hidden")) return true;
      if (el.getAttribute("aria-hidden") === "true") return true;
      const view = el.ownerDocument?.defaultView;
      const style =
        view && typeof view.getComputedStyle === "function"
          ? view.getComputedStyle(el)
          : null;
      if (style) {
        return (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse"
        );
      }
      const inline = el.getAttribute("style") ?? "";
      return /display\s*:\s*none|visibility\s*:\s*(hidden|collapse)/i.test(inline);
    }

    function collectText(root: Node, out: string[]): void {
      const stack: Array<{ node: Node; depth: number }> = [{ node: root, depth: 0 }];
      while (stack.length > 0) {
        const { node, depth } = stack.pop()!;
        if (node.nodeType === 3) {
          out.push(node.nodeValue ?? "");
          continue;
        }
        if (node.nodeType !== 1) continue;
        if (depth > 500) {
          throw new Error("jobai: DOM nesting exceeds 500 levels — page structure is pathologically deep");
        }
        const el = node as Element;
        const tag = el.tagName.toUpperCase();
        if (SKIP_TAGS.has(tag) || el.getAttribute("role") === "navigation" || isHidden(el)) continue;
        const block = BLOCK_TAGS.has(tag);
        if (block) out.push("\n");
        const kids = el.childNodes;
        for (let i = kids.length - 1; i >= 0; i--) stack.push({ node: kids[i], depth: depth + 1 });
        if (block) out.push("\n");
      }
    }

    function scopeText(scope: Element): string {
      const out: string[] = [];
      collectText(scope, out);
      const joined = out
        .join("")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
        .filter((line) => line !== "")
        .join("\n");
      return sliceWellFormed(joined, 30000);
    }

    function mainScope(): Element | null {
      return (
        doc.querySelector("main") ??
        doc.querySelector("article") ??
        doc.querySelector('[role="main"]')
      );
    }

    const scope = mainScope() ?? doc.body;
    let text = scope ? scopeText(scope) : "";
    if (text.length < 100 && scope !== doc.body && doc.body) {
      const bodyText = scopeText(doc.body);
      if (bodyText.length > text.length) text = bodyText;
    }

    if (text.length < 100) {
      return {
        ok: false,
        error:
          "jobai: extracted job text is empty or under 100 characters — " +
          "this page does not look like a job listing; paste the job text manually instead",
      };
    }

    return {
      ok: true,
      job: {
        title: extractTitle() || "Untitled Position",
        company: extractCompany(),
        sourceUrl: canonicalUrl,
        text,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `jobai extraction error: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Extract job data from a document. Throws on error (for test suite compatibility).
 */
export function extractJob(doc: Document, pageUrl: string): JobPayload {
  const result = canonicalExtractJob(doc, pageUrl);
  if (!result.ok || !result.job) {
    throw new Error(result.error || "Extraction failed");
  }
  return result.job;
}

/**
 * Shape/bounds check for job payloads.
 */
export function validateJobPayload(input: unknown): input is JobPayload {
  if (typeof input !== "object" || input === null) return false;
  const p = input as Record<string, unknown>;
  if (Object.keys(p).length !== 4) return false;
  if (
    typeof p.title !== "string" ||
    typeof p.company !== "string" ||
    typeof p.sourceUrl !== "string" ||
    typeof p.text !== "string"
  ) {
    return false;
  }
  if (p.title.length > JOB_TITLE_MAX) return false;
  if (p.company.length > JOB_TITLE_MAX) return false;
  if (p.text.length < JOB_TEXT_MIN || p.text.length > JOB_TEXT_MAX) return false;
  if (p.sourceUrl.length > SOURCE_URL_MAX) return false;
  try {
    const url = new URL(p.sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username !== "" || url.password !== "") return false;
  } catch {
    return false;
  }
  return true;
}
