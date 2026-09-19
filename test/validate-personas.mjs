import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const { CV_TEMPLATE_IDS, validateCV } = await import("jobai-shared");
const { FICTIONAL_SAMPLES, getSampleCv } = await import("../apps/web/src/content/sample-cvs.js").catch(async () => {
  // if not compiled, import ts or dynamically inspect
  return await import("../apps/web/src/content/sample-cvs.ts");
});

console.log("==================================================");
console.log("Validating 20 Template Personas & Integrity");
console.log("==================================================");

assert.strictEqual(CV_TEMPLATE_IDS.length, 20, "Expected 20 template IDs in registry");

const names = new Set();
const emails = new Set();

for (const id of CV_TEMPLATE_IDS) {
  const sample = FICTIONAL_SAMPLES[id];
  assert.ok(sample, `Missing sample persona for template ID "${id}"`);
  assert.strictEqual(sample.templateId, id, `templateId mismatch for ${id}`);
  assert.ok(sample.personName, `Missing personName for ${id}`);
  assert.ok(sample.personRole, `Missing personRole for ${id}`);
  assert.ok(sample.accentColor, `Missing accentColor for ${id}`);

  // Fake email check
  assert.ok(
    sample.cv.contact.email.includes("@example.com") || sample.cv.contact.email.includes("@example.org"),
    `Email must be fictional @example.com for ${id}, got: ${sample.cv.contact.email}`
  );

  // Uniqueness
  assert.ok(!names.has(sample.personName), `Duplicate persona name: ${sample.personName}`);
  assert.ok(!emails.has(sample.cv.contact.email), `Duplicate persona email: ${sample.cv.contact.email}`);
  names.add(sample.personName);
  emails.add(sample.cv.contact.email);

  // CV structure validation via shared validator
  const validation = validateCV(sample.cv);
  assert.ok(
    validation.valid,
    `CV validation failed for ${id} (${sample.personName}): ${validation.errors.join(", ")}`
  );

  // Summary
  assert.ok(sample.cv.summary && sample.cv.summary.length > 50, `Summary too short for ${id}`);

  // Experience entries check: 2-4 entries with bullets
  const expSection = sample.cv.sections.find((s) => s.type === "experience");
  assert.ok(expSection, `Missing experience section for ${id}`);
  assert.ok(
    expSection.items.length >= 2 && expSection.items.length <= 4,
    `Experience items count out of 2-4 range for ${id}: ${expSection.items.length}`
  );
  for (const item of expSection.items) {
    assert.ok(item.bullets && item.bullets.length >= 1, `Missing bullets in experience item for ${id}`);
  }

  // Education
  const eduSection = sample.cv.sections.find((s) => s.type === "education");
  assert.ok(eduSection && eduSection.items.length >= 1, `Missing education for ${id}`);

  // Skills
  const skillsSection = sample.cv.sections.find((s) => s.type === "skills");
  assert.ok(skillsSection && skillsSection.items.length >= 1, `Missing skills for ${id}`);

  // Projects
  const projSection = sample.cv.sections.find((s) => s.type === "projects");
  assert.ok(projSection && projSection.items.length >= 1, `Missing projects for ${id}`);

  console.log(`✓ [${id}] ${sample.personName} (${sample.personRole}) verified`);
}

console.log("==================================================");
console.log(`All 20 personas verified successfully! (20/20)`);
console.log("==================================================");
