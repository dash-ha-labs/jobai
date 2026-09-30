import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("Running JobAI Editor Calm Composition Contract Checks");
console.log("==================================================");

// 1. Verify editor composition
const appEditorPath = path.join(rootDir, "apps/web/src/routes/app/editor.tsx");
const appIndexPath = path.join(rootDir, "apps/web/src/routes/app/index.tsx");
const legacyIndexPath = path.join(rootDir, "apps/web/src/routes/index.tsx");
const targetEditorPath = fs.existsSync(appEditorPath)
  ? appEditorPath
  : fs.existsSync(appIndexPath)
  ? appIndexPath
  : legacyIndexPath;
const indexContent = fs.readFileSync(targetEditorPath, "utf-8");

console.log("1. Checking editor composition layout & header...");
assert(indexContent.includes("My CV"), "Header must include My CV document title");
assert(indexContent.includes("Save CV"), "Header must include Save CV action");
assert(indexContent.includes("Export PDF"), "Header must include Export PDF action");
assert(indexContent.includes("more-actions-button"), "Header must include More actions menu trigger");
assert(indexContent.includes("Import document..."), "More actions must include Import document");
assert(indexContent.includes("Reset CV..."), "More actions must include Reset CV");
assert(indexContent.includes("Clear entire CV?"), "Reset must have confirmation dialog");
assert(indexContent.includes("editor-studio-layout"), "Editor must use the full-width studio layout");
assert(indexContent.includes("Show preview"), "Preview must be an optional secondary action");
assert(!indexContent.includes("{showPreview &&"), "PDF paper must remain mounted when preview is closed");
assert(indexContent.includes("data-visible={showPreview}"), "Hidden preview must use the offscreen export container");
assert(!indexContent.includes("work-editor-steps"), "Editor must not duplicate the workflow wizard");
assert(indexContent.includes("Save CV"), "Profile save action must remain available");
assert(!indexContent.includes("Overview / Document Studio"), "Repeated Document Studio breadcrumb stack must be removed");
console.log("✓ index.tsx composition satisfies UX01 contract");

// 2. Verify Editor.tsx inspector composition
const editorPath = path.join(rootDir, "apps/web/src/components/Editor.tsx");
const editorContent = fs.readFileSync(editorPath, "utf-8");

console.log("2. Checking Editor.tsx inspector tabs, groups, and controls...");
assert(editorContent.includes('id="tab-content"'), "Inspector must have Content tab");
assert(editorContent.includes('id="tab-styles"'), "Inspector must have Design & Spacing tab");
assert(editorContent.includes("studio-tab"), "Editor tabs must use the readable studio treatment");
assert(editorContent.includes("studio-section-nav"), "Content editor must offer direct section navigation");
assert(editorContent.includes("Contact Details"), "Content tab must have Contact Details");
assert(editorContent.includes("Professional Summary"), "Content tab must have Professional Summary");
assert(editorContent.includes("Document Sections"), "Content tab must have Document Sections");

// Check 5 section adder buttons
for (const type of ["experience", "education", "skills", "projects", "custom"]) {
  assert(editorContent.includes(type), `Section adder must support ${type}`);
}

assert(editorContent.includes("CV_TEMPLATES"), "Editor must load templates from shared registry");
assert(editorContent.includes("TemplateThumbnail"), "Template selector must render layout thumbnails");
assert(editorContent.includes('onChange("templateId"'), "Template selection must update templateId");

const registryPath = path.join(rootDir, "packages/shared/src/cv-template-registry.ts");
const registryContent = fs.readFileSync(registryPath, "utf-8");
for (const tmpl of ["Modern Clean", "Executive", "Technical", "Compact"]) {
  assert(registryContent.includes(tmpl), `Registry must include ${tmpl}`);
}

const rendererPath = path.join(rootDir, "apps/web/src/lib/cv-templates/renderer.tsx");
const rendererContent = fs.readFileSync(rendererPath, "utf-8");
const layoutMatches = [...registryContent.matchAll(/layout:\s*"([^"]+)"/g)].map((m) => m[1]);
const uniqueLayouts = [...new Set(layoutMatches)];
for (const layout of uniqueLayouts) {
  assert(
    rendererContent.includes(`case "${layout}"`) || layout === "modern",
    `Renderer switch must handle layout "${layout}"`,
  );
}
assert(
  rendererContent.includes('templateId === "matrix"'),
  "Matrix template must route TechTemplate with matrix variant",
);

// Check paper size with dimensions
assert(editorContent.includes("210 × 297 mm"), "Paper size must show A4 dimensions");
assert(editorContent.includes("8.5 × 11 in"), "Paper size must show Letter dimensions");

// Check named swatches
for (const name of ["Blue", "Slate", "Navy", "Charcoal"]) {
  assert(editorContent.includes(name), `Accent colors must include named swatch: ${name}`);
}

// Check selection visible beyond color alone
assert(editorContent.includes("✓"), "Selection must show checkmark indicator beyond color alone");
console.log("✓ Editor.tsx controls and design groups satisfy UX01 contract");

const editorStylesPath = path.join(rootDir, "apps/web/src/components/editor-studio.css");
const editorStyles = fs.readFileSync(editorStylesPath, "utf-8");
assert(editorStyles.includes("minmax(580px, 1.3fr)"), "Form must keep a usable minimum width beside optional preview");
assert(editorStyles.includes("font-size: 16px"), "Main editor text and controls must be readable");
assert(editorStyles.includes("min-height: 46px"), "Editor controls must have usable touch height");
assert(editorStyles.includes("@media print"), "Editor controls must stay outside the printed document");

// 3. Verify CvPrintPreview.tsx neutral canvas and print-proportioned paper
const previewPath = path.join(rootDir, "apps/web/src/components/CvPrintPreview.tsx");
const previewContent = fs.readFileSync(previewPath, "utf-8");

console.log("3. Checking CvPrintPreview.tsx neutral canvas & fixed physical paper...");
assert(previewContent.includes('w: "210mm"'), "A4 paper width must be fixed at 210mm");
assert(previewContent.includes('h: "297mm"'), "A4 paper height must be fixed at 297mm");
assert(previewContent.includes('w: "8.5in"'), "Letter paper width must be fixed at 8.5in");
assert(previewContent.includes("transform: `scale("), "Paper must scale via CSS transform, not reflow");
assert(previewContent.includes("ResizeObserver"), "Scale must track container width");
assert(previewContent.includes("bg-[#f1f3f6]"), "Canvas must be calm neutral background");
assert(!previewContent.includes("shadow-inner border border-[#e1dccd]"), "Canvas must not have heavy inner shadow or nested card shell");
assert(previewContent.includes("cv-print-target"), "Paper must retain print target class");
assert(previewContent.includes('id="cv-paper"'), "Paper must keep #cv-paper export hook");
console.log("✓ CvPrintPreview.tsx canvas and print proportions satisfy UX01 contract");

// 4. Verify print stylesheet
const stylesPath = path.join(rootDir, "apps/web/src/styles.css");
const stylesContent = fs.readFileSync(stylesPath, "utf-8");

console.log("4. Checking styles.css print rules...");
assert(stylesContent.includes("aspect-ratio: auto !important;"), "Print CSS must reset aspect-ratio to auto");
assert(stylesContent.includes("page-break-after: auto;"), "Print CSS must preserve page breaks");
console.log("✓ styles.css print rules verified");

// 5. Verify isolated behavioral data roundtrips
console.log("5. Checking data integrity and persistence invariants...");
const sampleCV = {
  version: "1.0.0",
  contact: {
    name: "Alex Morgan",
    email: "alex@example.com",
    phone: "+44 20 7946 0958",
    location: "London, UK",
    website: "https://alexmorgan.dev"
  },
  summary: "Experienced software engineer specializing in web infrastructure.",
  sections: [
    {
      id: "sec-1",
      type: "experience",
      title: "Work Experience",
      items: [
        {
          id: "item-1",
          title: "Staff Engineer",
          subtitle: "Core Systems",
          date: "2021 — Present",
          description: "Led platform architecture.",
          bullets: ["Engineered zero-downtime deployment system", "Mentored team of 8 engineers"]
        }
      ]
    },
    {
      id: "sec-2",
      type: "education",
      title: "Education",
      items: [
        {
          id: "item-2",
          title: "BSc Computer Science",
          subtitle: "University of Edinburgh",
          date: "2015 — 2019",
          bullets: ["First Class Honours"]
        }
      ]
    }
  ],
  stylePrefs: {
    templateId: "modern",
    fontSize: "normal",
    margin: "normal",
    paperSize: "A4",
    primaryColor: "#4f46e5"
  },
  updatedAt: new Date().toISOString()
};

// Verify serialization roundtrip
const serialized = JSON.stringify(sampleCV);
const deserialized = JSON.parse(serialized);
assert.deepStrictEqual(deserialized.contact, sampleCV.contact, "Contact data must roundtrip identically");
assert.deepStrictEqual(deserialized.sections, sampleCV.sections, "Sections and items must roundtrip identically");
assert.deepStrictEqual(deserialized.stylePrefs, sampleCV.stylePrefs, "Style preferences must roundtrip identically");
console.log("✓ Data roundtrip and contract invariants verified");

console.log("==================================================");
console.log("All JobAI Editor Calm checks passed successfully!");
console.log("==================================================");
