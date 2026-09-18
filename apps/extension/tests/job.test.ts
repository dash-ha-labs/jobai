/**
 * Runnable assert check for src/job.ts — no test framework, no new deps.
 * Run: node apps/extension/tests/job.test.ts
 *
 * Runs under plain Node type stripping. The DOM here is a minimal structural
 * stub, NOT a browser check: the spec's real DOM/browser verification stays
 * pending until a DOM test facility or a real browser run exists.
 */
import assert from "node:assert/strict";
import { extractJob, validateJobPayload, type JobPayload } from "../src/job.ts";

// ---------------------------------------------------------------------------
// Minimal DOM stubs. Only the surface job.ts actually touches: nodeType,
// tagName, childNodes, getAttribute/hasAttribute, querySelector for the
// main/article/[role=main] scope, and the text node shape.
// ---------------------------------------------------------------------------

type Attrs = Record<string, string>;

class TextNode {
  nodeType = 3;
  nodeValue: string;
  constructor(nodeValue: string) {
    this.nodeValue = nodeValue;
  }
  get childNodes(): never[] {
    return [];
  }
}

class Element {
  nodeType = 1;
  childNodes: Array<Element | TextNode> = [];
  tagName: string;
  attrs: Attrs;
  constructor(tagName: string, attrs: Attrs = {}, children: Array<Element | TextNode> = []) {
    this.tagName = tagName;
    this.attrs = attrs;
    this.childNodes = children;
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  hasAttribute(name: string): boolean {
    return name in this.attrs;
  }
  get textContent(): string {
    return this.collect();
  }
  private collect(): string {
    return this.childNodes
      .map((c) => (c.nodeType === 3 ? (c as TextNode).nodeValue : (c as Element).collect()))
      .join("");
  }
}

const ROLE_NAV = new Element("div", { role: "navigation" }, [
  new TextNode("navigation links should be excluded"),
]);

const page = (main: Element | null, bodyExtra: Array<Element | TextNode> = []) => ({
  querySelector(sel: string): Element | null {
    if (sel === "main") return main?.tagName === "MAIN" ? main : null;
    if (sel === "article") return main?.tagName === "ARTICLE" ? main : null;
    if (sel === '[role="main"]') return main?.attrs["role"] === "main" ? main : null;
    if (sel === "h1") return main?.tagName === "MAIN" ? h1Of(main) : null;
    return null;
  },
  querySelectorAll(sel: string): Array<Element | TextNode> {
    if (sel === 'script[type="application/ld+json"]') return bodyExtra.filter((n) => n.nodeType === 1 && (n as Element).tagName === "SCRIPT");
    return [];
  },
  title: "Senior Engineer at Example Corp - Example Corp Careers",
  body: new Element("BODY", {}, [
    ROLE_NAV,
    ...(main ? [main] : []),
    ...bodyExtra,
  ]),
});

function h1Of(scope: Element): Element | null {
  const find = (n: Element): Element | null => {
    for (const c of n.childNodes) {
      if (c.nodeType === 1) {
        if ((c as Element).tagName === "H1") return c as Element;
        const deep = find(c as Element);
        if (deep) return deep;
      }
    }
    return null;
  };
  return find(scope);
}

const LONG_PARAGRAPH =
  "We are looking for a senior engineer to join the platform team. " +
  "You will design services, mentor colleagues, and improve reliability. " +
  "Requirements include strong TypeScript experience and care for accessibility. ";
const BODY_NOISE = new Element("DIV", {}, [
  new Element("SCRIPT", {}, [new TextNode("var x = 1; <not text>")]),
  new Element("STYLE", {}, [new TextNode(".a { color: red }")]),
  new Element("INPUT", { value: "typed secret" }),
  ROLE_NAV,
  new Element("P", { style: "display: none" }, [new TextNode("hidden promo text should not appear")]),
  new Element("FORM", {}, [
    new Element("TEXTAREA", {}, [new TextNode("form input value excluded")]),
  ]),
  new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
]);

const OK_URL = "https://example.com/jobs/123";

// ---------------------------------------------------------------------------
// extractJob — happy paths
// ---------------------------------------------------------------------------

function test_extract_prefers_main() {
  const main = new Element("MAIN", {}, [
    new Element("H1", {}, [new TextNode("  Senior\tEngineer  ")]),
    new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
  ]);
  const doc = page(main);
  const job = extractJob(doc as unknown as Document, OK_URL);
  assert.equal(job.title, "Senior Engineer");
  assert.ok(job.text.includes("platform team"), "main text present");
  assert.ok(!job.text.includes("navigation links"), "nav excluded");
  assert.ok(!job.text.includes("typed secret"), "input value excluded");
  assert.ok(!job.text.includes("hidden promo"), "display:none excluded");
  assert.ok(!job.text.includes("form input value"), "textarea excluded");
  assert.equal(job.sourceUrl, "https://example.com/jobs/123");
}

function test_extract_falls_back_to_body_when_main_too_short() {
  const main = new Element("MAIN", {}, [new TextNode("too short")]);
  const doc = page(main, [BODY_NOISE, new Element("ARTICLE", {}, [new Element("P", {}, [new TextNode("Article fallback. " + LONG_PARAGRAPH)])])]);
  const job = extractJob(doc as unknown as Document, OK_URL);
  assert.ok(job.text.includes("Article fallback"), "body fallback used when main <100 chars");
  assert.ok(job.text.length >= 100, "fallback text usable");
}

function test_extract_title_falls_back_to_document_title() {
  const main = new Element("MAIN", {}, [new Element("P", {}, [new TextNode(LONG_PARAGRAPH)])]);
  const doc = page(main);
  const job = extractJob(doc as unknown as Document, OK_URL);
  assert.equal(job.title, "Senior Engineer at Example Corp - Example Corp Careers");
}

function test_extract_company_from_jobposting_jsonld() {
  const main = new Element("MAIN", {}, [new Element("P", {}, [new TextNode(LONG_PARAGRAPH)])]);
  const ld = new Element(
    "SCRIPT",
    { type: "application/ld+json" },
    [new TextNode(JSON.stringify({
      "@graph": [{ "@type": "JobPosting", hiringOrganization: { "@type": "Organization", name: " Example GmbH " } }],
    }))]
  );
  const doc = page(main, [ld]);
  assert.equal(extractJob(doc as unknown as Document, OK_URL).company, "Example GmbH");
  // hiringOrganization may be an array of organizations
  const ldArr = new Element("SCRIPT", { type: "application/ld+json" }, [
    new TextNode(JSON.stringify({
      "@type": "JobPosting",
      hiringOrganization: [{ name: "Array Corp" }, { name: "Other Corp" }],
    })),
  ]);
  assert.equal(extractJob(page(main, [ldArr]) as unknown as Document, OK_URL).company, "Array Corp");
}

function test_extract_company_empty_when_absent() {
  const main = new Element("MAIN", {}, [new Element("P", {}, [new TextNode(LONG_PARAGRAPH)])]);
  const doc = page(main);
  assert.equal(extractJob(doc as unknown as Document, OK_URL).company, "");
}

// ---------------------------------------------------------------------------
// extractJob — contract errors (empty/short text, protocol, credentials)
// ---------------------------------------------------------------------------

function test_extract_rejects_short_text() {
  const doc = page(new Element("MAIN", {}, [new TextNode("short")]));
  assert.throws(() => extractJob(doc as unknown as Document, OK_URL), /under 100 characters/);
}

function test_extract_rejects_non_http_protocol() {
  const doc = page(new Element("MAIN", {}, [new TextNode(LONG_PARAGRAPH)]));
  assert.throws(() => extractJob(doc as unknown as Document, "file:///etc/passwd"), /only http\/https/);
  assert.throws(() => extractJob(doc as unknown as Document, "javascript:alert(1)"), /only http\/https/);
}

function test_extract_rejects_url_credentials() {
  const doc = page(new Element("MAIN", {}, [new TextNode(LONG_PARAGRAPH)]));
  assert.throws(
    () => extractJob(doc as unknown as Document, "https://user:pass@example.com/jobs"),
    /must not contain embedded credentials/
  );
}

function test_extract_rejects_invalid_url() {
  const doc = page(new Element("MAIN", {}, [new TextNode(LONG_PARAGRAPH)]));
  assert.throws(() => extractJob(doc as unknown as Document, "not a url"), /not a valid URL/);
}

function test_extract_bounds_text_to_30000() {
  const chunk = LONG_PARAGRAPH.repeat(600); // ~39000 chars
  const main = new Element("MAIN", {}, [new Element("P", {}, [new TextNode(chunk)])]);
  const job = extractJob(page(main) as unknown as Document, OK_URL);
  assert.ok(job.text.length <= 30000, `text bounded, got ${job.text.length}`);
}

function test_extract_bounds_title_to_300() {
  const main = new Element("MAIN", {}, [
    new Element("H1", {}, [new TextNode("x".repeat(500) + " " + LONG_PARAGRAPH)]),
  ]);
  const job = extractJob(page(main) as unknown as Document, OK_URL);
  assert.ok(job.title.length === 300, `title bounded to 300, got ${job.title.length}`);
}

// ---------------------------------------------------------------------------
// validateJobPayload — malformed payload / protocol / oversize / short text
// ---------------------------------------------------------------------------

function goodPayload(): JobPayload {
  return { title: "Senior Engineer", company: "", sourceUrl: OK_URL, text: LONG_PARAGRAPH };
}

function test_validate_accepts_valid_payload() {
  assert.equal(validateJobPayload(goodPayload()), true);
}

function test_validate_rejects_malformed() {
  for (const bad of [null, undefined, 42, "x", [], {}, { title: "t" }]) {
    assert.equal(validateJobPayload(bad), false, `should reject ${JSON.stringify(bad)}`);
  }
  const wrongTypes = { ...goodPayload(), text: 123 };
  assert.equal(validateJobPayload(wrongTypes), false);
  const extra = { ...goodPayload(), sneaky: 1 };
  assert.equal(validateJobPayload(extra), false, "extra keys rejected");
}

function test_validate_rejects_bad_protocol() {
  assert.equal(validateJobPayload({ ...goodPayload(), sourceUrl: "ftp://example.com/x" }), false);
  assert.equal(validateJobPayload({ ...goodPayload(), sourceUrl: "file:///etc/passwd" }), false);
}

function test_validate_rejects_url_credentials() {
  assert.equal(
    validateJobPayload({ ...goodPayload(), sourceUrl: "https://user:pass@example.com/jobs" }),
    false
  );
}

function test_validate_rejects_short_text() {
  assert.equal(validateJobPayload({ ...goodPayload(), text: "too short" }), false);
  assert.equal(validateJobPayload({ ...goodPayload(), text: "" }), false);
}

function test_validate_rejects_oversize() {
  assert.equal(validateJobPayload({ ...goodPayload(), text: "x".repeat(30001) }), false);
  assert.equal(validateJobPayload({ ...goodPayload(), title: "x".repeat(301) }), false);
}

// ---------------------------------------------------------------------------
// Repair round 1 regressions: sourceUrl/company bounds, computed-style
// visibility, bounded iterative traversal, well-formed UTF-16 slicing.
// ---------------------------------------------------------------------------

function test_extract_rejects_oversize_url() {
  const doc = page(new Element("MAIN", {}, [new TextNode(LONG_PARAGRAPH)]));
  const long = "https://example.com/" + "a".repeat(4096); // 4116 units
  assert.throws(() => extractJob(doc as unknown as Document, long), /exceeds 4096/);
}

function test_validate_bounds_company_and_url() {
  assert.equal(validateJobPayload({ ...goodPayload(), company: "x".repeat(300) }), true);
  assert.equal(validateJobPayload({ ...goodPayload(), company: "x".repeat(301) }), false);
  assert.equal(
    validateJobPayload({ ...goodPayload(), sourceUrl: "https://example.com/" + "a".repeat(4076) }),
    true,
    "4096-unit sourceUrl accepted"
  );
  assert.equal(
    validateJobPayload({ ...goodPayload(), sourceUrl: "https://example.com/" + "a".repeat(4077) }),
    false,
    "4097-unit sourceUrl rejected"
  );
}

function setOwnerDocument(node: Element | TextNode, doc: unknown): void {
  (node as unknown as { ownerDocument?: unknown }).ownerDocument = doc;
  if (node.nodeType === 1) {
    for (const c of (node as Element).childNodes) setOwnerDocument(c, doc);
  }
}

function test_extract_excludes_class_hidden_via_computed_style() {
  const main = new Element("MAIN", {}, [
    new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
    new Element("DIV", { class: "collapsed-ad" }, [new TextNode("css class hidden ad text")]),
    new Element("DIV", { class: "gone" }, [new TextNode("visibility collapse ad")]),
    new Element("DIV", { class: "invisible" }, [new TextNode("visibility hidden note")]),
  ]);
  // Fake layout engine reached through the real API surface: defaultView.
  const doc = page(main) as unknown as Record<string, unknown>;
  doc.defaultView = {
    getComputedStyle: (el: Element) => {
      switch (el.getAttribute("class")) {
        case "collapsed-ad":
          return { display: "none", visibility: "visible" };
        case "gone":
          return { display: "block", visibility: "collapse" };
        case "invisible":
          return { display: "block", visibility: "hidden" };
        default:
          return { display: "block", visibility: "visible" };
      }
    },
  };
  setOwnerDocument(main, doc);
  const job = extractJob(doc as unknown as Document, OK_URL);
  assert.ok(!job.text.includes("css class hidden ad"), "computed display:none excluded");
  assert.ok(!job.text.includes("visibility collapse"), "computed visibility:collapse excluded");
  assert.ok(!job.text.includes("visibility hidden note"), "computed visibility:hidden excluded");
  assert.ok(job.text.includes("platform team"), "visible text kept");
}

function nest(depth: number, leaf: Element): Element {
  let node: Element | TextNode = leaf;
  for (let i = 0; i < depth; i++) node = new Element("DIV", {}, [node]);
  return node as Element;
}

function test_extract_bounded_traversal_depth() {
  // Leaf P at depth exactly 500: allowed, extraction succeeds.
  const ok = page(
    new Element("MAIN", {}, [nest(499, new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]))])
  );
  extractJob(ok as unknown as Document, OK_URL);
  // Leaf P at depth 501: clear depth-limit error, no stack overflow.
  const tooDeep = page(
    new Element("MAIN", {}, [nest(500, new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]))])
  );
  assert.throws(() => extractJob(tooDeep as unknown as Document, OK_URL), /nesting exceeds 500/);
}

function test_extract_slices_keep_utf16_well_formed() {
  const emoji = "\u{1F468}\u{1F3FF}"; // two surrogate pairs
  // Cut lands mid-pair: the orphan surrogate unit is dropped, not emitted.
  const t1 = page(
    new Element("MAIN", {}, [
      new Element("H1", {}, [new TextNode("x".repeat(299) + emoji + LONG_PARAGRAPH)]),
      new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
    ])
  );
  const title1 = extractJob(t1 as unknown as Document, OK_URL).title;
  assert.equal(title1.length, 299, `orphan surrogate dropped, got ${title1.length}`);
  assert.ok(title1.isWellFormed(), "title has no lone surrogate");
  // Cut lands exactly between pairs: full units kept, length exactly 300.
  const t2 = page(
    new Element("MAIN", {}, [
      new Element("H1", {}, [new TextNode("y".repeat(298) + emoji)]),
      new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
    ])
  );
  const title2 = extractJob(t2 as unknown as Document, OK_URL).title;
  assert.equal(title2.length, 300);
  assert.ok(title2.isWellFormed(), "boundary-aligned pair kept intact");
  // Combining mark fragmented from its base is allowed (well-formed), never a lone surrogate.
  const t3 = page(
    new Element("MAIN", {}, [
      new Element("H1", {}, [new TextNode("z".repeat(299) + "e\u0301")]),
      new Element("P", {}, [new TextNode(LONG_PARAGRAPH)]),
    ])
  );
  const title3 = extractJob(t3 as unknown as Document, OK_URL).title;
  assert.equal(title3.length, 300);
  assert.ok(title3.isWellFormed(), "combining boundary is well-formed");
}

// ---------------------------------------------------------------------------

const tests: Array<[string, () => void]> = [
  ["extract_prefers_main", test_extract_prefers_main],
  ["extract_falls_back_to_body_when_main_too_short", test_extract_falls_back_to_body_when_main_too_short],
  ["extract_title_falls_back_to_document_title", test_extract_title_falls_back_to_document_title],
  ["extract_company_from_jobposting_jsonld", test_extract_company_from_jobposting_jsonld],
  ["extract_company_empty_when_absent", test_extract_company_empty_when_absent],
  ["extract_rejects_short_text", test_extract_rejects_short_text],
  ["extract_rejects_non_http_protocol", test_extract_rejects_non_http_protocol],
  ["extract_rejects_url_credentials", test_extract_rejects_url_credentials],
  ["extract_rejects_invalid_url", test_extract_rejects_invalid_url],
  ["extract_bounds_text_to_30000", test_extract_bounds_text_to_30000],
  ["extract_bounds_title_to_300", test_extract_bounds_title_to_300],
  ["validate_accepts_valid_payload", test_validate_accepts_valid_payload],
  ["validate_rejects_malformed", test_validate_rejects_malformed],
  ["validate_rejects_bad_protocol", test_validate_rejects_bad_protocol],
  ["validate_rejects_url_credentials", test_validate_rejects_url_credentials],
  ["validate_rejects_short_text", test_validate_rejects_short_text],
  ["validate_rejects_oversize", test_validate_rejects_oversize],
  ["extract_rejects_oversize_url", test_extract_rejects_oversize_url],
  ["validate_bounds_company_and_url", test_validate_bounds_company_and_url],
  ["extract_excludes_class_hidden_via_computed_style", test_extract_excludes_class_hidden_via_computed_style],
  ["extract_bounded_traversal_depth", test_extract_bounded_traversal_depth],
  ["extract_slices_keep_utf16_well_formed", test_extract_slices_keep_utf16_well_formed],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log("ok -", name);
  } catch (err) {
    failed++;
    console.log("FAIL -", name, "-", (err as Error).message);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
if (failed > 0) process.exit(1);
