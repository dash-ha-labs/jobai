// Real executable contract check — assert-based, no external test framework
// Validates CV schema, job handoff bounds, master/draft separation, and persistence error handling

import assert from "node:assert";
import {
  CV_VERSION,
  isValidCV,
  validateCV,
  validateJobHandoff,
  isValidJobMetadata,
  validateJobMetadata,
  STORAGE_KEY_MASTER,
  STORAGE_KEY_DRAFTS,
  loadMasterCV,
  saveMasterCV,
  deleteMasterCV,
  loadDrafts,
  saveDraft,
  deleteDraft,
  loadDraftById,
  isStorageAvailable,
} from "jobai-shared";

console.log("==================================================");
console.log("Running JobAI Foundation Behavioral Contract Tests");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Schema & Validator Tests
runTest("CV validation passes for valid canonical CV", () => {
  const validCV = {
    id: "cv-uuid-1",
    version: CV_VERSION,
    contact: {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1-555-0199",
      location: "San Francisco, CA",
    },
    summary: "Senior Full Stack Engineer with 10 years of experience",
    sections: [
      {
        id: "sec-1",
        type: "experience",
        title: "Work History",
        items: [
          {
            id: "item-1",
            title: "Staff Engineer",
            subtitle: "Cloud Tech Inc",
            date: "2020-2024",
            bullets: ["Led platform modernization", "Built SSR pipelines"],
          },
        ],
      },
    ],
    stylePrefs: {
      templateId: "modern",
      primaryColor: "#2563eb",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = validateCV(validCV);
  assert.strictEqual(result.valid, true, `Expected valid, got errors: ${result.errors.join(", ")}`);
  assert.strictEqual(isValidCV(validCV), true);
});

runTest("CV validation rejects invalid version", () => {
  const invalidCV = {
    id: "cv-1",
    version: "2.0.0",
    contact: { name: "A", email: "a@b.com" },
    sections: [],
  };
  const result = validateCV(invalidCV);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Invalid CV version")));
});

runTest("CV validation rejects missing contact name or email", () => {
  const invalidCV = {
    id: "cv-1",
    version: CV_VERSION,
    contact: { name: "", email: "a@b.com" },
    sections: [],
  };
  assert.strictEqual(validateCV(invalidCV).valid, false);
});

runTest("CV validation rejects invalid section type", () => {
  const invalidCV = {
    id: "cv-1",
    version: CV_VERSION,
    contact: { name: "A", email: "a@b.com" },
    sections: [
      { id: "s1", type: "unsupported-section-type", title: "Test", items: [] },
    ],
  };
  assert.strictEqual(validateCV(invalidCV).valid, false);
});

runTest("CV validation accepts legacy CV with omitted paperSize (backward compatible)", () => {
  const legacyCV = {
    id: "cv-legacy-1",
    version: CV_VERSION,
    contact: { name: "Legacy User", email: "legacy@example.com" },
    sections: [],
    stylePrefs: {
      templateId: "modern",
      primaryColor: "#2563eb",
      // paperSize intentionally omitted
    },
  };
  const result = validateCV(legacyCV);
  assert.strictEqual(result.valid, true, `Legacy CV must validate, errors: ${result.errors.join(", ")}`);
});

runTest("CV validation accepts valid paperSize (A4 and Letter)", () => {
  for (const paperSize of ["A4", "Letter"]) {
    const cv = {
      id: `cv-${paperSize}`,
      version: CV_VERSION,
      contact: { name: "User", email: "user@example.com" },
      sections: [],
      stylePrefs: {
        templateId: "modern",
        paperSize,
      },
    };
    const result = validateCV(cv);
    assert.strictEqual(result.valid, true, `paperSize ${paperSize} must validate`);
  }
});

runTest("CV validation rejects invalid paperSize", () => {
  for (const invalidSize of ["Legal", "Tabloid", "a4", "letter", 123, true]) {
    const cv = {
      id: "cv-invalid-size",
      version: CV_VERSION,
      contact: { name: "User", email: "user@example.com" },
      sections: [],
      stylePrefs: {
        templateId: "modern",
        paperSize: invalidSize,
      },
    };
    const result = validateCV(cv);
    assert.strictEqual(result.valid, false, `Invalid paperSize ${invalidSize} must be rejected`);
    assert.ok(
      result.errors.some((e) => e.includes("Invalid paperSize")),
      `Error must mention Invalid paperSize, got: ${result.errors.join(", ")}`
    );
  }
});

// 2. Extension Handoff Contract Tests
runTest("validateJobHandoff accepts valid payload within bounds", () => {
  const validHandoff = {
    title: "Senior Full Stack Engineer",
    company: "Acme Corp",
    sourceUrl: "https://jobs.example.com/posting/123",
    text: "A".repeat(150),
  };
  const res = validateJobHandoff(validHandoff);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.data.title, validHandoff.title);
  assert.strictEqual(res.data.company, validHandoff.company);
});

runTest("validateJobHandoff rejects sourceUrl exceeding 4096 characters", () => {
  const invalidHandoff = {
    title: "Title",
    company: "Company",
    sourceUrl: "https://jobs.example.com/" + "a".repeat(4090),
    text: "A".repeat(150),
  };
  const res = validateJobHandoff(invalidHandoff);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("4096")));
});

runTest("validateJobHandoff rejects sourceUrl containing credentials", () => {
  const invalidHandoff = {
    title: "Title",
    company: "Company",
    sourceUrl: "https://user:password@jobs.example.com/listing",
    text: "A".repeat(150),
  };
  const res = validateJobHandoff(invalidHandoff);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("credentials")));
});

runTest("validateJobHandoff rejects non-http/https sourceUrl", () => {
  const invalidHandoff = {
    title: "Title",
    company: "Company",
    sourceUrl: "javascript:alert(1)",
    text: "A".repeat(150),
  };
  const res = validateJobHandoff(invalidHandoff);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("protocol")));
});

runTest("validateJobHandoff enforces text length boundaries (100..30000)", () => {
  const tooShort = {
    title: "Title",
    company: "Company",
    sourceUrl: "https://example.com",
    text: "Only 50 characters in this short description.",
  };
  assert.strictEqual(validateJobHandoff(tooShort).valid, false);

  const tooLong = {
    title: "Title",
    company: "Company",
    sourceUrl: "https://example.com",
    text: "A".repeat(30001),
  };
  assert.strictEqual(validateJobHandoff(tooLong).valid, false);
});

runTest("validateJobHandoff enforces company and title max length (300)", () => {
  const longCompany = {
    title: "Title",
    company: "C".repeat(301),
    sourceUrl: "https://example.com",
    text: "A".repeat(150),
  };
  assert.strictEqual(validateJobHandoff(longCompany).valid, false);

  const longTitle = {
    title: "T".repeat(301),
    company: "Company",
    sourceUrl: "https://example.com",
    text: "A".repeat(150),
  };
  assert.strictEqual(validateJobHandoff(longTitle).valid, false);
});

// 3. Persistence & Storage Isolation Tests
runTest("Persistence functions return safe error when window is undefined (SSR safety)", () => {
  // In Node.js environment without window:
  assert.strictEqual(typeof window === "undefined", true);
  assert.strictEqual(isStorageAvailable(), false);

  const masterRes = loadMasterCV();
  assert.strictEqual(masterRes.success, false);
  assert.strictEqual(masterRes.data, null);
  assert.ok(masterRes.error.includes("unavailable"));

  const draftsRes = loadDrafts();
  assert.strictEqual(draftsRes.success, false);
  assert.deepStrictEqual(draftsRes.data, []);
});

runTest("Persistence functions isolate master from drafts in browser mock", () => {
  // Simulate browser environment with in-memory storage mock
  const storage = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
    },
  };

  assert.strictEqual(isStorageAvailable(), true);

  const sampleMaster = {
    id: "master-1",
    version: CV_VERSION,
    contact: { name: "Alice", email: "alice@example.com" },
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleDraft = {
    id: "draft-1",
    masterId: "master-1",
    jobTitle: "Software Engineer",
    company: "Google",
    sourceUrl: "https://google.com/careers/123",
    jobText: "Job description text here...",
    createdAt: new Date().toISOString(),
  };

  // Save master
  const saveMasterRes = saveMasterCV(sampleMaster);
  assert.strictEqual(saveMasterRes.success, true);
  assert.ok(storage.has(STORAGE_KEY_MASTER));
  assert.strictEqual(storage.has(STORAGE_KEY_DRAFTS), false);

  // Save draft
  const saveDraftRes = saveDraft(sampleDraft);
  assert.strictEqual(saveDraftRes.success, true);
  assert.ok(storage.has(STORAGE_KEY_DRAFTS));

  // Verify master was NOT affected by draft save
  const loadedMaster = loadMasterCV();
  assert.strictEqual(loadedMaster.success, true);
  assert.strictEqual(loadedMaster.data.id, "master-1");

  // Verify draft loading
  const loadedDrafts = loadDrafts();
  assert.strictEqual(loadedDrafts.success, true);
  assert.strictEqual(loadedDrafts.data.length, 1);
  assert.strictEqual(loadedDrafts.data[0].id, "draft-1");

  // Verify delete draft does not delete master
  deleteDraft("draft-1");
  assert.strictEqual(loadDrafts().data.length, 0);
  assert.strictEqual(loadMasterCV().data.id, "master-1");

  // Clean up mock
  delete global.window;
});

runTest("Persistence handles corrupted stored JSON safely", () => {
  const storage = new Map();
  storage.set(STORAGE_KEY_MASTER, "CORRUPTED_NOT_JSON{[");
  storage.set(STORAGE_KEY_DRAFTS, "CORRUPTED_NOT_JSON{[");

  global.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
    },
  };

  const masterRes = loadMasterCV();
  assert.strictEqual(masterRes.success, false);
  assert.strictEqual(masterRes.data, null);
  assert.ok(masterRes.error.includes("corrupted"));

  const draftsRes = loadDrafts();
  assert.strictEqual(draftsRes.success, false);
  assert.deepStrictEqual(draftsRes.data, []);
  assert.ok(draftsRes.error.includes("corrupted"));

  delete global.window;
});

// 4. Editor Content & Template Persistence Regression Tests
runTest("CV editor content persists across template switches without content loss", () => {
  const storage = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
    },
  };

  const initialCV = {
    id: "test-editor-cv",
    version: CV_VERSION,
    contact: {
      name: "Morgan Freeman",
      email: "morgan@example.com",
      phone: "+1 555-0199",
      location: "Los Angeles, CA",
      website: "https://morgan.example.com",
    },
    summary: "Senior Narrator and Systems Architect.",
    sections: [
      {
        id: "sec-exp",
        type: "experience",
        title: "Professional Experience",
        items: [
          {
            id: "item-1",
            title: "Staff Platform Engineer",
            subtitle: "Global Media Corp",
            date: "2020 - Present",
            description: "Led distributed streaming infrastructure.",
            bullets: ["Zero downtime migration", "Latency reduced by 40%"],
          },
        ],
      },
      {
        id: "sec-skills",
        type: "skills",
        title: "Technical Proficiencies",
        items: [
          {
            id: "item-2",
            title: "Cloud Architecture",
            subtitle: "Kubernetes, AWS, Terraform",
          },
        ],
      },
    ],
    stylePrefs: {
      templateId: "modern",
      fontSize: "normal",
      margin: "normal",
      primaryColor: "#4f46e5",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Initial save
  const saveRes = saveMasterCV(initialCV);
  assert.strictEqual(saveRes.success, true);

  // 2. Switch across all 4 templates and verify content is never modified
  const templates = ["executive", "tech", "compact", "modern"];
  for (const tmplId of templates) {
    const loaded = loadMasterCV();
    assert.strictEqual(loaded.success, true);
    assert.ok(loaded.data);

    // Update templateId only
    const updated = {
      ...loaded.data,
      stylePrefs: {
        ...loaded.data.stylePrefs,
        templateId: tmplId,
      },
    };

    saveMasterCV(updated);

    const reloaded = loadMasterCV().data;
    assert.strictEqual(reloaded.stylePrefs.templateId, tmplId);
    assert.strictEqual(reloaded.contact.name, initialCV.contact.name);
    assert.strictEqual(reloaded.contact.email, initialCV.contact.email);
    assert.strictEqual(reloaded.summary, initialCV.summary);
    assert.strictEqual(reloaded.sections.length, 2);
    assert.strictEqual(reloaded.sections[0].items[0].title, "Staff Platform Engineer");
    assert.deepStrictEqual(reloaded.sections[0].items[0].bullets, ["Zero downtime migration", "Latency reduced by 40%"]);
  }

  delete global.window;
});

runTest("CV editor allows empty contact during edit but requires valid fields on save", () => {
  const blankContactCV = {
    id: "blank-contact-cv",
    version: CV_VERSION,
    contact: {
      name: "",
      email: "",
    },
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Schema validator correctly catches empty name & email
  const validation = validateCV(blankContactCV);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("contact name")));
  assert.ok(validation.errors.some((e) => e.includes("contact email")));

  // Once populated, passes validation cleanly
  blankContactCV.contact.name = "Alice Smith";
  blankContactCV.contact.email = "alice@example.com";
  assert.strictEqual(validateCV(blankContactCV).valid, true);
});

console.log("\n==================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
