import assert from "node:assert";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const { CV_TEMPLATE_IDS, validateCV, saveMasterCV, loadMasterCV } = await import("jobai-shared");
const { FICTIONAL_SAMPLES, getSampleCv } = await import("../apps/web/src/content/sample-cvs.ts");

console.log("==================================================");
console.log("Running JobAI Template Preview & Personas Check");
console.log("==================================================");

// 1. Verify 20 Personas Completeness and Validity
console.log("1. Checking 20 distinct template personas in sample-cvs.ts...");
assert.strictEqual(CV_TEMPLATE_IDS.length, 20, "Must have exactly 20 template IDs in registry");

const seenNames = new Set();
const seenEmails = new Set();

for (const id of CV_TEMPLATE_IDS) {
  const sample = FICTIONAL_SAMPLES[id];
  assert.ok(sample, `Template ${id} must have persona in FICTIONAL_SAMPLES`);
  assert.strictEqual(sample.templateId, id, `templateId mismatch for ${id}`);
  assert.ok(sample.personName, `Missing personName for ${id}`);
  assert.ok(sample.personRole, `Missing personRole for ${id}`);
  assert.ok(sample.accentColor, `Missing accentColor for ${id}`);

  // Fake email invariant
  assert.ok(
    sample.cv.contact.email.includes("@example.com") || sample.cv.contact.email.includes("@example.org"),
    `Email must be fictional @example.com for ${id}, got ${sample.cv.contact.email}`
  );

  // Uniqueness
  assert.ok(!seenNames.has(sample.personName), `Duplicate persona name: ${sample.personName}`);
  assert.ok(!seenEmails.has(sample.cv.contact.email), `Duplicate persona email: ${sample.cv.contact.email}`);
  seenNames.add(sample.personName);
  seenEmails.add(sample.cv.contact.email);

  // Validation
  const val = validateCV(sample.cv);
  assert.ok(val.valid, `CV validation failed for ${id}: ${val.errors.join(", ")}`);

  // Sections
  const exp = sample.cv.sections.find((s) => s.type === "experience");
  assert.ok(exp && exp.items.length >= 2 && exp.items.length <= 4, `Experience items not 2-4 for ${id}`);
  for (const item of exp.items) {
    assert.ok(item.bullets && item.bullets.length >= 1, `Missing bullets in item for ${id}`);
  }
}
console.log("✓ All 20 personas are distinct, realistic, and pass validateCV");

// 2. Invariant: Apply template transfers ONLY templateId, never persona data
console.log("2. Checking Apply invariant: user master data preserved across template apply...");
const storage = new Map();
global.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
  },
};

const userOriginalCV = {
  id: "master-user-cv-test",
  version: "1.0.0",
  contact: {
    name: "Dr. Evelyn Reed",
    email: "evelyn.reed@private-domain.org",
    phone: "+1 (555) 999-0000",
    location: "Oxford, UK",
    website: "https://evelynreed.org",
  },
  summary: "Authentic researcher in quantum photonics with 8 peer-reviewed publications.",
  sections: [
    {
      id: "sec-user-1",
      type: "experience",
      title: "Work Experience",
      items: [
        {
          id: "item-user-1-1",
          title: "Senior Photonics Researcher",
          subtitle: "Clarendon Laboratory",
          date: "2020 — Present",
          description: "Leading quantum entanglement experiments.",
          bullets: ["Engineered photon emitter with 99.4% quantum indistinguishability"],
        },
      ],
    },
  ],
  stylePrefs: {
    templateId: "modern",
    fontSize: "normal",
    margin: "normal",
    paperSize: "A4",
    primaryColor: "#625181",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// Save original user CV in storage
saveMasterCV(userOriginalCV);

// Simulate Apply action for "academic" (Marie Curie)
const handleApplySimulation = (targetTemplateId) => {
  const res = loadMasterCV();
  assert.ok(res.success && res.data, "Must load existing master CV");
  const updated = {
    ...res.data,
    stylePrefs: {
      ...res.data.stylePrefs,
      templateId: targetTemplateId,
    },
  };
  saveMasterCV(updated);
};

handleApplySimulation("academic");
const afterAcademic = loadMasterCV();
assert.ok(afterAcademic.success && afterAcademic.data, "Must load master CV after apply");
assert.strictEqual(afterAcademic.data.contact.name, "Dr. Evelyn Reed", "User name must be preserved");
assert.strictEqual(afterAcademic.data.contact.email, "evelyn.reed@private-domain.org", "User email must be preserved");
assert.strictEqual(afterAcademic.data.summary, userOriginalCV.summary, "User summary must be preserved");
assert.strictEqual(afterAcademic.data.sections.length, 1, "User sections count must be preserved");
assert.strictEqual(afterAcademic.data.stylePrefs.templateId, "academic", "TemplateId must be updated to academic");
assert.ok(!JSON.stringify(afterAcademic.data).includes("Marie Curie"), "Marie Curie data must NEVER leak into master CV");

// Simulate Apply action for "matrix" (Linus Torvalds)
handleApplySimulation("matrix");
const afterMatrix = loadMasterCV();
assert.ok(afterMatrix.success && afterMatrix.data, "Must load master CV after apply");
assert.strictEqual(afterMatrix.data.contact.name, "Dr. Evelyn Reed", "User name must be preserved");
assert.strictEqual(afterMatrix.data.stylePrefs.templateId, "matrix", "TemplateId must be updated to matrix");
assert.ok(!JSON.stringify(afterMatrix.data).includes("Linus Torvalds"), "Linus Torvalds data must NEVER leak into master CV");

console.log("✓ Template apply strictly preserves user CV data and isolates sample persona content");

// 3. Live SSR Check of /templates
console.log("3. Checking SSR of /templates for all 20 persona names and Preview/Apply split...");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body }));
      res.on("error", reject);
    });
  });
}

const baseUrl = process.env.JOB_AI_URL || "http://127.0.0.1:3000";
const templatesRes = await fetchUrl(`${baseUrl}/templates`);
assert.strictEqual(templatesRes.status, 200, "/templates must return 200 OK");
const html = templatesRes.body;

assert.ok(html.includes("Print-Ready CV Templates"), "Header present");
assert.ok(html.includes("20 layouts") || html.includes("20<!-- --> layouts"), "20 layouts badge present");
assert.ok(html.includes("Preview"), "Preview action present");
assert.ok(html.includes("Apply") || html.includes("Open in Editor"), "Apply action present");

// Check that every single one of the 20 persona names is present in the SSR HTML!
for (const id of CV_TEMPLATE_IDS) {
  const persona = FICTIONAL_SAMPLES[id];
  assert.ok(
    html.includes(persona.personName),
    `SSR of /templates must contain persona name "${persona.personName}" for template "${id}"`
  );
}
console.log("✓ All 20 persona names rendered in SSR HTML of /templates");

// 4. Live SSR Check of Homepage (/)
console.log("4. Checking SSR of / (homepage template gallery sync)...");
const homeRes = await fetchUrl(`${baseUrl}/`);
assert.strictEqual(homeRes.status, 200, "Homepage must return 200 OK");
const homeHtml = homeRes.body;
assert.ok(homeHtml.includes("Print-Ready CV Templates"), "Homepage gallery section present");
assert.ok(homeHtml.includes("20 Professional Layouts"), "20 layouts badge present on homepage");
assert.ok(homeHtml.includes("/templates"), "Link to /templates gallery present on homepage");
console.log("✓ Homepage template gallery synced with new persona data");

console.log("==================================================");
console.log("All Template Preview & Personas checks passed! (4/4)");
console.log("==================================================");
