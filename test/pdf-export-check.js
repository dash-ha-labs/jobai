import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("Running JobAI client PDF export fidelity checks");
console.log("==================================================");

const exportPath = path.join(rootDir, "apps/web/src/lib/cv-pdf-export.ts");
const stylesPath = path.join(rootDir, "apps/web/src/styles.css");
const exportSrc = fs.readFileSync(exportPath, "utf8");
const stylesSrc = fs.readFileSync(stylesPath, "utf8");

assert.match(exportSrc, /export async function exportCvPaperToPdf\(/);
assert.match(exportSrc, /element: HTMLElement/);
assert.match(exportSrc, /filename: string/);
assert.match(exportSrc, /paperSize: CvPdfPaperSize = "A4"/);
assert.match(exportSrc, /mode:\s*\[\s*"css"\s*,\s*"legacy"\s*\]/);
assert.match(exportSrc, /avoid:\s*\[/);
assert.match(exportSrc, /\.cv-item/);
assert.match(exportSrc, /\.cv-skill-group/);
assert.match(exportSrc, /\.cv-section h2/);
assert.match(exportSrc, /backgroundColor:\s*"#ffffff"/);
assert.match(exportSrc, /scale:\s*2/);
assert.match(exportSrc, /type:\s*"jpeg"/);
assert.match(exportSrc, /quality:\s*0\.95/);
assert.match(exportSrc, /format = paperSize === "Letter" \? "letter" : "a4"/);
assert.match(exportSrc, /#cv-paper/);
assert.match(exportSrc, /cv-print-target/);
assert.match(exportSrc, /My-CV\.pdf/);
assert.match(exportSrc, /html2pdf\.js/);
assert.doesNotMatch(exportSrc, /fetch\(|XMLHttpRequest|upload/i);
console.log("✓ cv-pdf-export.ts keeps signature, client-only html2pdf, pagebreak css+legacy, A4/Letter");

assert.match(stylesSrc, /aspect-ratio: auto !important;/);
assert.match(stylesSrc, /page-break-after: auto;/);
assert.match(stylesSrc, /page-break-inside: avoid;/);
assert.match(stylesSrc, /break-after: avoid;/);
assert.match(stylesSrc, /size: A4 portrait;/);
assert.match(stylesSrc, /size: letter portrait;/);
assert.match(stylesSrc, /data-pdf-paper="Letter"/);
assert.match(stylesSrc, /\.cv-print-target \.cv-item/);
assert.match(stylesSrc, /\.cv-print-target \.cv-skill-group/);
assert.match(stylesSrc, /html2pdf css-mode reads screen computed styles/);
console.log("✓ styles.css print + screen page-break rules present for html2pdf");

const helperScript = path.join(__dirname, "pdf-export-templates.ts");
assert.ok(fs.existsSync(helperScript), "pdf-export-templates.ts must exist for helper + Chrome evidence");

console.log("\nRunning helper + 20-template html2pdf evidence (tsx + Chrome)...");
const result = spawnSync("npx", ["tsx", "--tsconfig", "apps/web/tsconfig.json", helperScript], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});
assert.equal(result.status, 0, "pdf-export-templates.ts must exit 0");

console.log("==================================================");
console.log("Client PDF export fidelity checks passed");
console.log("==================================================");
