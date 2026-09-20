import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CV_TEMPLATE_IDS, type CV } from "jobai-shared";
import { CvTemplateRenderer } from "../apps/web/src/lib/cv-templates/renderer.tsx";
import {
  buildCvPdfExportOptions,
  resolveCvPdfFilename,
  type CvPdfPaperSize,
} from "../apps/web/src/lib/cv-pdf-export.ts";

Object.assign(globalThis, { React });

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = path.join(ROOT, "node_modules/html2pdf.js/dist/html2pdf.bundle.min.js");
const EVIDENCE = path.join(ROOT, "work/t_268033a8/pdf-evidence.json");
const PAGE_BREAK_CSS = fs.readFileSync(path.join(ROOT, "apps/web/src/styles.css"), "utf8");

function buildLongCv(templateId: string, paperSize: CvPdfPaperSize): CV {
  const roles = [
    ["Principal Engineer", "Northwind Systems", "2022 — Present"],
    ["Staff Engineer", "Contoso Cloud", "2019 — 2022"],
    ["Senior Engineer", "Fabrikam Labs", "2016 — 2019"],
    ["Engineer", "Wide World Robotics", "2014 — 2016"],
    ["Software Developer", "Adventure Works", "2012 — 2014"],
    ["Junior Developer", "Litware Analytics", "2010 — 2012"],
    ["Research Intern", "University Compute Lab", "2008 — 2010"],
    ["Teaching Assistant", "State University", "2006 — 2008"],
  ] as const;

  return {
    id: "cv-pdf-export-long",
    version: "1.0.0",
    contact: {
      name: "Alexandra Chen",
      email: "alexandra.chen@example.com",
      phone: "+1 555-0144",
      location: "Seattle, WA",
      website: "https://alexandrachen.dev",
    },
    summary:
      "Systems engineer focused on truthful, reviewable delivery of large-scale platforms. This deliberately long summary exists so export pagination is exercised: distributed messaging, storage, observability, incident response, mentorship, and cross-team program work spanning multiple decades of documented employment history with measurable outcomes.",
    sections: [
      {
        id: "sec-exp",
        type: "experience",
        title: "Work Experience",
        items: roles.map(([title, subtitle, date], index) => ({
          id: `exp-${index}`,
          title,
          subtitle,
          date,
          description: `Owned reliability and delivery for ${subtitle} product surfaces used by thousands of internal and external customers.`,
          bullets: [
            "Cut p99 latency from 180ms to 22ms on the core read path while keeping error budgets intact.",
            "Led a 14-person working group through an incremental storage migration with no customer-visible downtime.",
            "Published runbooks and on-call shadows that reduced mean time to restore by 41% over two quarters.",
            "Mentored engineers on incident writing so reports stayed factual and free of invented metrics.",
            "Partnered with design and support so exported customer artifacts matched the on-screen document.",
            "Replaced ad-hoc scripts with a reviewed pipeline that kept secrets off laptops and out of tickets.",
          ],
        })),
      },
      {
        id: "sec-edu",
        type: "education",
        title: "Education",
        items: [
          {
            id: "edu-1",
            title: "M.S. Computer Science",
            subtitle: "University of Washington",
            date: "2008 — 2010",
            bullets: ["Distributed systems, thesis on replicated logs"],
          },
          {
            id: "edu-2",
            title: "B.S. Computer Engineering",
            subtitle: "University of Washington",
            date: "2004 — 2008",
            bullets: ["First-class project in compilers"],
          },
        ],
      },
      {
        id: "sec-skills",
        type: "skills",
        title: "Skills",
        items: [
          {
            id: "sk-1",
            title: "Languages",
            bullets: ["TypeScript", "Go", "Python", "SQL", "Rust"],
          },
          {
            id: "sk-2",
            title: "Platforms",
            bullets: ["Kubernetes", "PostgreSQL", "Kafka", "AWS", "Observability"],
          },
        ],
      },
      {
        id: "sec-proj",
        type: "projects",
        title: "Projects",
        items: [
          {
            id: "pr-1",
            title: "Document export path",
            subtitle: "Internal platform",
            date: "2024",
            bullets: [
              "Client-side PDF capture of live paper so preview and download stay on one layout.",
              "Page-break rules that keep section headers with the following item.",
            ],
          },
          {
            id: "pr-2",
            title: "Incident review kit",
            subtitle: "Reliability guild",
            date: "2023",
            bullets: ["Templates for factual timelines and follow-up owners."],
          },
        ],
      },
    ],
    stylePrefs: {
      templateId,
      paperSize,
      primaryColor: "#4f46e5",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function serializableOptions(filename: string, paperSize: CvPdfPaperSize) {
  const options = buildCvPdfExportOptions(filename, paperSize);
  return {
    margin: options.margin,
    filename: options.filename,
    image: options.image,
    html2canvas: {
      scale: options.html2canvas.scale,
      useCORS: options.html2canvas.useCORS,
      logging: options.html2canvas.logging,
      backgroundColor: options.html2canvas.backgroundColor,
    },
    jsPDF: options.jsPDF,
    pagebreak: options.pagebreak,
  };
}

function pageBreakCss(): string {
  const screenStart = PAGE_BREAK_CSS.indexOf("html2pdf css-mode");
  const extra = screenStart >= 0 ? PAGE_BREAK_CSS.slice(screenStart - 80) : "";
  return `
    body { margin: 0; background: #fff; color: #292a27; font-family: "DM Sans", system-ui, sans-serif; }
    #cv-paper { background: #fff; color: #292a27; box-sizing: border-box; padding: 16mm; }
    ${extra}
    .cv-print-target .cv-section h2, .cv-print-target .cv-section h3 { break-after: avoid; page-break-after: avoid; }
    .cv-print-target .cv-item, .cv-print-target .cv-skill-group, .cv-print-target .cv-section .grid > div {
      break-inside: avoid; page-break-inside: avoid;
    }
  `;
}

function fixtureHtml(templateId: string, paperSize: CvPdfPaperSize, inner: string, optionsJson: string): string {
  const width = paperSize === "Letter" ? "8.5in" : "210mm";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CV PDF export ${templateId} ${paperSize}</title>
  <style>${pageBreakCss()}</style>
</head>
<body>
  <div id="cv-paper" class="cv-paper cv-print-target" data-pdf-paper="${paperSize}"
    style="aspect-ratio:auto;min-height:auto;height:auto;overflow:visible;background:#ffffff;color:#292a27;width:${width};max-width:${width};">
    ${inner}
  </div>
  <script src="/html2pdf.bundle.min.js"></script>
  <script>
    window.__pdfOptions = ${optionsJson};
    window.exportPaper = async function exportPaper() {
      const el = document.getElementById("cv-paper");
      const worker = html2pdf().set(window.__pdfOptions).from(el);
      const ab = await worker.outputPdf("arraybuffer");
      const pdf = await worker.get("pdf");
      const bytes = new Uint8Array(ab);
      const size = pdf.internal.pageSize;
      const width = typeof size.getWidth === "function" ? size.getWidth() : size.width;
      const height = typeof size.getHeight === "function" ? size.getHeight() : size.height;
      return {
        pageCount: pdf.internal.getNumberOfPages(),
        width: width,
        height: height,
        byteLength: bytes.byteLength,
        magic: String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]),
      };
    };
  </script>
</body>
</html>`;
}

type CdpPending = { resolve: (value: unknown) => void; reject: (err: Error) => void };

class ChromeCdp {
  private child: ReturnType<typeof spawn> | null = null;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private nextId = 0;
  private pending = new Map<number, CdpPending>();
  private port = 0;
  private userData = "";
  private stderr = "";

  async start(): Promise<void> {
    this.userData = fs.mkdtempSync(path.join(os.tmpdir(), "jobai-pdf-chrome-"));
    this.child = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        `--user-data-dir=${this.userData}`,
        "--remote-debugging-port=0",
        "--remote-debugging-address=127.0.0.1",
        "--remote-allow-origins=*",
        "--window-size=1200,1800",
        "about:blank",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    this.child.stderr?.on("data", (chunk: Buffer) => {
      this.stderr += chunk.toString();
    });

    const version = await this.waitForVersion();
    this.ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws!.addEventListener("open", () => resolve());
      this.ws!.addEventListener("error", () => reject(new Error("Chrome CDP websocket failed")));
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.method && msg.sessionId && this.sessionId && msg.sessionId !== this.sessionId) return;
      const id = msg.id as number | undefined;
      if (id == null) return;
      const pending = this.pending.get(id);
      if (!pending) return;
      this.pending.delete(id);
      if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
      else pending.resolve(msg.result);
    });

    const created = (await this.send("Target.createTarget", { url: "about:blank" })) as { targetId: string };
    const attached = (await this.send("Target.attachToTarget", {
      targetId: created.targetId,
      flatten: true,
    })) as { sessionId: string };
    this.sessionId = attached.sessionId;
    await this.send("Page.enable", {});
    await this.send("Runtime.enable", {});
  }

  private waitForVersion(): Promise<{ webSocketDebuggerUrl: string }> {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const tick = async () => {
        if (this.child?.exitCode != null) {
          reject(new Error(`Chrome exited ${this.child.exitCode}: ${this.stderr}`));
          return;
        }
        const portFile = path.join(this.userData, "DevToolsActivePort");
        if (fs.existsSync(portFile)) {
          const first = fs.readFileSync(portFile, "utf8").split("\n")[0]?.trim();
          const port = Number(first);
          if (port > 0) this.port = port;
        }
        const listen = this.stderr.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:\d+\/[^\s]+)/);
        if (listen?.[1] && !this.port) {
          const m = listen[1].match(/:(\d+)\//);
          if (m) this.port = Number(m[1]);
        }
        if (this.port) {
          try {
            const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
            if (res.ok) {
              resolve((await res.json()) as { webSocketDebuggerUrl: string });
              return;
            }
          } catch {
            /* still booting */
          }
        }
        if (Date.now() - started > 40000) {
          reject(new Error(`Chrome DevTools endpoint did not start. stderr=${this.stderr}`));
          return;
        }
        setTimeout(tick, 200);
      };
      tick();
    });
  }

  private send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = ++this.nextId;
    const payload: Record<string, unknown> = { id, method, params };
    if (this.sessionId) payload.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 120000);
    });
  }

  async navigateAndExport(url: string): Promise<{
    pageCount: number;
    width: number;
    height: number;
    byteLength: number;
    magic: string;
  }> {
    await this.send("Page.navigate", { url });
    const ready = (await this.send("Runtime.evaluate", {
      expression: `new Promise((resolve) => {
        const done = () => resolve(typeof window.exportPaper === "function");
        if (document.readyState === "complete") done();
        else window.addEventListener("load", done, { once: true });
      })`,
      awaitPromise: true,
      returnByValue: true,
    })) as { result?: { value?: boolean }; exceptionDetails?: unknown };
    if (ready?.exceptionDetails || ready?.result?.value !== true) {
      throw new Error(`export harness did not load for ${url}: ${JSON.stringify(ready)}`);
    }
    const evaluated = (await this.send("Runtime.evaluate", {
      expression: "window.exportPaper()",
      awaitPromise: true,
      returnByValue: true,
    })) as {
      result?: { value?: { pageCount: number; width: number; height: number; byteLength: number; magic: string } };
      exceptionDetails?: { text?: string; exception?: { description?: string } };
    };
    if (evaluated?.exceptionDetails) {
      throw new Error(
        `html2pdf failed for ${url}: ${evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text}`,
      );
    }
    if (!evaluated?.result?.value) {
      throw new Error(`html2pdf returned no value for ${url}: ${JSON.stringify(evaluated)}`);
    }
    return evaluated.result.value;
  }

  async close(): Promise<void> {
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    const child = this.child;
    if (!child?.pid) return;
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 2000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

async function serveFixtures(files: Map<string, string>): Promise<{ origin: string; close: () => Promise<void> }> {
  const bundle = fs.readFileSync(BUNDLE);
  const server = createServer((req, res) => {
    const url = req.url?.split("?")[0] || "/";
    if (url === "/html2pdf.bundle.min.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(bundle);
      return;
    }
    const key = url.replace(/^\//, "");
    const html = files.get(key);
    if (!html) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("server address missing");
  return {
    origin: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

function assertPaperSize(paperSize: CvPdfPaperSize, width: number, height: number, templateId: string) {
  if (paperSize === "Letter") {
    assert.ok(Math.abs(width - 215.9) < 0.5, `${templateId} Letter width mm, got ${width}`);
    assert.ok(Math.abs(height - 279.4) < 0.5, `${templateId} Letter height mm, got ${height}`);
  } else {
    assert.ok(Math.abs(width - 210) < 0.5, `${templateId} A4 width mm, got ${width}`);
    assert.ok(Math.abs(height - 297) < 0.5, `${templateId} A4 height mm, got ${height}`);
  }
}

assert.equal(resolveCvPdfFilename("cv.pdf"), "My-CV.pdf");
assert.equal(resolveCvPdfFilename(""), "My-CV.pdf");
assert.equal(resolveCvPdfFilename("cv"), "My-CV.pdf");
assert.equal(resolveCvPdfFilename("Alexandra Chen.pdf"), "Alexandra-Chen-CV.pdf");
assert.equal(resolveCvPdfFilename("Alexandra-Chen.pdf"), "Alexandra-Chen-CV.pdf");
assert.equal(resolveCvPdfFilename("Alexandra-Chen-CV.pdf"), "Alexandra-Chen-CV.pdf");
const a4 = buildCvPdfExportOptions("Alexandra Chen.pdf", "A4");
const letter = buildCvPdfExportOptions("cv.pdf", "Letter");
assert.equal(a4.filename, "Alexandra-Chen-CV.pdf");
assert.equal(a4.jsPDF.format, "a4");
assert.deepEqual(a4.pagebreak.mode, ["css", "legacy"]);
assert.ok(a4.pagebreak.avoid.includes(".cv-item"));
assert.equal(a4.html2canvas.backgroundColor, "#ffffff");
assert.equal(a4.html2canvas.scale, 2);
assert.equal(typeof a4.html2canvas.onclone, "function");
assert.equal(letter.filename, "My-CV.pdf");
assert.equal(letter.jsPDF.format, "letter");
assert.equal(CV_TEMPLATE_IDS.length, 20, "registry must still list 20 template IDs");
console.log("✓ filename + export option helpers");

const jobs: { templateId: string; paperSize: CvPdfPaperSize }[] = [
  ...CV_TEMPLATE_IDS.map((templateId) => ({ templateId, paperSize: "A4" as const })),
  { templateId: "modern", paperSize: "Letter" },
  { templateId: "executive", paperSize: "Letter" },
];

const files = new Map<string, string>();
for (const job of jobs) {
  const cv = buildLongCv(job.templateId, job.paperSize);
  const inner = renderToStaticMarkup(
    createElement(CvTemplateRenderer, {
      cv,
      templateId: job.templateId,
      primaryColor: "#4f46e5",
    }),
  );
  const options = serializableOptions("Alexandra Chen.pdf", job.paperSize);
  const name = `${job.templateId}-${job.paperSize}.html`;
  files.set(name, fixtureHtml(job.templateId, job.paperSize, inner, JSON.stringify(options)));
  assert.match(inner, /Alexandra Chen|Your Name/, `${job.templateId} renderer must emit a name`);
}

assert.ok(fs.existsSync(BUNDLE), "html2pdf bundle must exist");
assert.ok(fs.existsSync(CHROME), "Google Chrome must exist for html2pdf evidence");

const server = await serveFixtures(files);
const chrome = new ChromeCdp();
const table: Array<{
  templateId: string;
  paperSize: CvPdfPaperSize;
  pages: number;
  bytes: number;
  widthMm: number;
  heightMm: number;
  magic: string;
}> = [];

try {
  await chrome.start();
  for (const job of jobs) {
    const url = `${server.origin}/${job.templateId}-${job.paperSize}.html`;
    const result = await chrome.navigateAndExport(url);
    assert.equal(result.magic, "%PDF-", `${job.templateId} ${job.paperSize} must be a PDF`);
    assert.ok(result.byteLength > 2000, `${job.templateId} ${job.paperSize} PDF too small (${result.byteLength})`);
    assert.ok(result.pageCount >= 2, `${job.templateId} ${job.paperSize} long CV must paginate (pages=${result.pageCount})`);
    assertPaperSize(job.paperSize, result.width, result.height, job.templateId);
    table.push({
      templateId: job.templateId,
      paperSize: job.paperSize,
      pages: result.pageCount,
      bytes: result.byteLength,
      widthMm: result.width,
      heightMm: result.height,
      magic: result.magic,
    });
    console.log(
      `✓ ${job.templateId} ${job.paperSize}: ${result.pageCount} pages, ${result.byteLength} bytes, ${result.width.toFixed(1)}×${result.height.toFixed(1)} mm`,
    );
  }
} finally {
  await chrome.close();
  await server.close();
}

fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true });
fs.writeFileSync(EVIDENCE, JSON.stringify({ generatedAt: new Date().toISOString(), table }, null, 2));
console.log(`Wrote ${EVIDENCE}`);
console.log("✓ 20-template html2pdf evidence recorded");
