import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  saveAICredentials,
  loadAICredentials,
  deleteAICredentials,
  getAICredentialsStatus,
} from "../apps/web/src/server/storage.js";
import {
  createProviderAdapter,
  OFFICIAL_PROVIDER_ENDPOINTS,
  DEFAULT_PROVIDER_MODELS,
  sanitizeErrorMessage,
  setTestFixtureOverride,
  resetAIEngine,
  tailorCV,
  structureCVFromText,
  testProviderConnection,
} from "../apps/web/src/server/ai.js";
import {
  parseDocumentBuffer,
  detectDocumentFormat,
  MAX_CV_FILE_SIZE,
  MAX_CV_TEXT_CHARS,
  FileTooLargeError,
  InvalidFileFormatError,
  ScannedPdfError,
  EmptyDocumentError,
} from "../apps/web/src/server/cv-parser.js";
import { handleApiRequest } from "../apps/web/src/server/api.js";
import { validateCV, type CV, type JobHandoffPayload } from "jobai-shared";

console.log("==================================================");
console.log("Running JobAI BYOK AI & Multi-Provider Test Suite");
console.log("==================================================");

// Isolated data directory for testing
const testDataDir = path.join(
  os.tmpdir(),
  `jobai-byok-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
);
process.env.JOBAI_DATA_DIR = testDataDir;

async function runTests() {
  try {
    await fs.mkdir(testDataDir, { recursive: true });

    // 1. Adapter exports & official endpoints
    console.log("\n1. Verifying Adapter Exports & Official Provider Endpoints...");
    assert.strictEqual(
      OFFICIAL_PROVIDER_ENDPOINTS.openai,
      "https://api.openai.com/v1",
      "OpenAI official endpoint must match"
    );
    assert.strictEqual(
      OFFICIAL_PROVIDER_ENDPOINTS.anthropic,
      "https://api.anthropic.com",
      "Anthropic official endpoint must match"
    );
    assert.strictEqual(
      OFFICIAL_PROVIDER_ENDPOINTS.glm,
      "https://open.bigmodel.cn/api/paas/v4",
      "GLM official BigModel endpoint must match"
    );

    const oaiAdapter = createProviderAdapter("openai", "sk-test-fake-key", "gpt-4o-mini");
    assert.ok(oaiAdapter, "OpenAI adapter instantiated successfully");

    const antAdapter = createProviderAdapter(
      "anthropic",
      "sk-ant-test-fake-key",
      "claude-3-5-haiku-20241022"
    );
    assert.ok(antAdapter, "Anthropic adapter instantiated successfully");

    const glmAdapter = createProviderAdapter("glm", "test-glm-key", "glm-4-flash");
    assert.ok(glmAdapter, "GLM adapter instantiated successfully");
    console.log("✓ All 3 provider adapters instantiated with official endpoints and defaults");

    // 2. Secret Redaction & Sanitization
    console.log("\n2. Verifying Secret Redaction & Sanitization...");
    const secretKey = "sk-proj-super-secret-key-1234567890abcdef";
    const leakedError = `Error calling https://api.openai.com/v1 with Bearer ${secretKey}: 401 Unauthorized`;
    const sanitized = sanitizeErrorMessage(leakedError, secretKey);
    assert.ok(!sanitized.includes(secretKey), "Sanitized message must not contain secret key");
    assert.ok(sanitized.includes("[REDACTED_API_KEY]") || sanitized.includes("[REDACTED"), "Key must be replaced with redaction marker");
    console.log("✓ Sensitive credentials strictly redacted from errors and logs");

    // 3. Credential Storage, Mode 0600 & Masked Status
    console.log("\n3. Verifying Local Credential Storage & Restrictive Permissions...");
    const saveRes = await saveAICredentials({
      provider: "openai",
      apiKey: "sk-test-secret-12345678",
      model: "gpt-4o-mini",
    });
    assert.strictEqual(saveRes.success, true, "Saving credentials must succeed");

    const credsFile = path.join(testDataDir, "credentials.json");
    const stat = await fs.stat(credsFile);
    // On POSIX, file mode should be 0600 (stat.mode & 0o777 === 0o600)
    const filePerm = stat.mode & 0o777;
    assert.strictEqual(filePerm, 0o600, `File permissions must be 0600, got ${filePerm.toString(8)}`);

    const loaded = await loadAICredentials();
    assert.ok(loaded, "Loaded credentials must exist");
    assert.strictEqual(loaded.provider, "openai");
    assert.strictEqual(loaded.model, "gpt-4o-mini");
    assert.strictEqual(loaded.apiKey, "sk-test-secret-12345678");

    const clientStatus = await getAICredentialsStatus();
    assert.strictEqual(clientStatus.configured, true);
    assert.strictEqual(clientStatus.provider, "openai");
    assert.strictEqual(clientStatus.model, "gpt-4o-mini");
    assert.strictEqual(clientStatus.maskedKey, "••••••••5678", "Status must return masked key suffix only");
    assert.strictEqual(clientStatus.storageType, "local-file-mode-0600");
    assert.ok(clientStatus.disclosure.includes("mode 0600"), "Status must disclose mode 0600 storage honest details");
    console.log("✓ Credential file created with mode 0600; masked suffix returned to client");

    // 4. Provider Switch & Removal
    console.log("\n4. Verifying Provider Switching & Removal...");
    // Switch to Anthropic
    await saveAICredentials({
      provider: "anthropic",
      apiKey: "sk-ant-test-8888",
      model: "claude-3-5-haiku-20241022",
    });
    let updatedStatus = await getAICredentialsStatus();
    assert.strictEqual(updatedStatus.provider, "anthropic");
    assert.strictEqual(updatedStatus.maskedKey, "••••••••8888");

    // Switch to GLM
    await saveAICredentials({
      provider: "glm",
      apiKey: "glm-secret-9999",
      model: "glm-4-flash",
    });
    updatedStatus = await getAICredentialsStatus();
    assert.strictEqual(updatedStatus.provider, "glm");
    assert.strictEqual(updatedStatus.maskedKey, "••••••••9999");

    // Remove credentials
    const delRes = await deleteAICredentials();
    assert.strictEqual(delRes.success, true);
    const unconfiguredStatus = await getAICredentialsStatus();
    assert.strictEqual(unconfiguredStatus.configured, false);
    assert.strictEqual(unconfiguredStatus.provider, null);
    assert.strictEqual(unconfiguredStatus.maskedKey, null);
    console.log("✓ Provider switching (OpenAI -> Anthropic -> GLM) and removal verified");

    // 5. CSRF & Origin Security on /api/ai/config
    console.log("\n5. Verifying CSRF & Extension Denial on Credential Endpoints...");
    // Direct request without CSRF
    const noCsrfReq = new Request("http://127.0.0.1:3000/api/ai/config", {
      method: "GET",
    });
    const noCsrfRes = await handleApiRequest(noCsrfReq);
    assert.strictEqual(noCsrfRes.status, 403, "Must reject request missing CSRF token");

    // Paired extension origin attempting to read key
    const extReq = new Request("http://127.0.0.1:3000/api/ai/config", {
      method: "GET",
      headers: {
        origin: "chrome-extension://test-fake-extension-id",
        "x-jobai-csrf": "1",
      },
    });
    const extRes = await handleApiRequest(extReq);
    assert.strictEqual(extRes.status, 403, "Must reject extension origin from accessing credentials endpoint");

    // Valid same-origin request
    const validReq = new Request("http://127.0.0.1:3000/api/ai/config", {
      method: "GET",
      headers: {
        origin: "http://127.0.0.1:3000",
        "x-jobai-csrf": "1",
      },
    });
    const validRes = await handleApiRequest(validReq);
    assert.strictEqual(validRes.status, 200, "Must accept valid same-origin request with CSRF");
    const validJson = await validRes.json();
    assert.strictEqual(validJson.ok, true);
    assert.strictEqual(typeof validJson.status, "object");
    assert.strictEqual(validJson.status.apiKey, undefined, "Raw key must NEVER be in response");
    console.log("✓ Credential endpoint CSRF enforced; Chrome extension strictly denied access");

    // 6. CV Document Parsing & Validation
    console.log("\n6. Verifying CV Document Parsers, Bounds & Magic Bytes...");
    // Format detection
    const fakePdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    assert.strictEqual(detectDocumentFormat(fakePdf), "pdf");

    const fakeDocx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    assert.strictEqual(detectDocumentFormat(fakeDocx), "docx");

    const textBuf = Buffer.from("John Doe\nSoftware Engineer\njohn@example.com");
    assert.strictEqual(detectDocumentFormat(textBuf, "cv.txt"), "text");

    // Rejection of unknown binary
    assert.throws(
      () => detectDocumentFormat(Buffer.from([0x00, 0x01, 0x02, 0x03])),
      (err: any) => err instanceof InvalidFileFormatError,
      "Unknown binary must be rejected as invalid file format"
    );

    // Oversize file (>5MB)
    const oversizeBuffer = Buffer.alloc(MAX_CV_FILE_SIZE + 100);
    oversizeBuffer.set(Buffer.from("%PDF-"));
    await assert.rejects(
      () => parseDocumentBuffer(oversizeBuffer, "oversize.pdf"),
      (err: any) => err instanceof FileTooLargeError,
      "File >5MB must be rejected"
    );

    // Scanned / empty PDF (valid PDF structure but zero text)
    const { PDFDocument } = await import("pdf-lib");
    const emptyPdfDoc = await PDFDocument.create();
    emptyPdfDoc.addPage();
    const emptyPdfBytes = await emptyPdfDoc.save();
    const emptyPdfBuffer = Buffer.from(emptyPdfBytes);

    await assert.rejects(
      () => parseDocumentBuffer(emptyPdfBuffer, "scanned.pdf"),
      (err: any) => err instanceof ScannedPdfError,
      "Empty / scanned PDF with <20 alphanumeric characters must trigger ScannedPdfError"
    );

    // Valid text buffer parsing
    const parsedTextDoc = await parseDocumentBuffer(textBuf, "resume.txt");
    assert.strictEqual(parsedTextDoc.format, "text");
    assert.ok(parsedTextDoc.text.includes("John Doe"));
    assert.strictEqual(parsedTextDoc.charCount, textBuf.length);
    console.log("✓ Document format magic check, 5MB cap, scanned PDF error, and text extraction verified");

    // 7. Multi-Provider Tailoring & Fact Safety with Labeled Fixtures
    console.log("\n7. Verifying Multi-Provider Tailoring with Labeled Fixtures...");
    const sampleMasterCV: CV = {
      id: "master-1",
      version: "1.0.0",
      contact: {
        name: "Jane Dev",
        email: "jane@example.com",
        phone: "+1 555-0100",
        website: "https://janedev.io",
        location: "San Francisco, CA",
      },
      summary: "Full-stack engineer with 6 years experience in distributed systems.",
      sections: [
        {
          id: "sec-exp",
          type: "experience",
          title: "Work Experience",
          items: [
            {
              id: "item-exp-1",
              title: "Senior Backend Engineer",
              subtitle: "Cloud Platforms Inc",
              date: "2021 - Present",
              description: "Distributed infrastructure",
              bullets: ["Engineered Kafka pipelines", "Scaled Postgres clusters"],
            },
            {
              id: "item-exp-2",
              title: "Software Engineer",
              subtitle: "StartCo",
              date: "2018 - 2021",
              description: "API development",
              bullets: ["Built GraphQL services"],
            },
          ],
        },
      ],
      stylePrefs: { templateId: "modern" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetJob: JobHandoffPayload = {
      title: "Distributed Systems Lead",
      company: "Scalable Corp",
      sourceUrl: "https://example.com/jobs/123",
      text: "We are looking for a Distributed Systems Lead with deep experience in Kafka pipelines, clustering, and scalable backend architecture.".repeat(
        2
      ),
    };

    // Set active provider to Anthropic
    await saveAICredentials({
      provider: "anthropic",
      apiKey: "sk-ant-valid-fixture-key",
      model: "claude-3-5-haiku-20241022",
    });

    // Inject labeled test fixture response
    setTestFixtureOverride(async (provider, _prompt) => {
      assert.strictEqual(provider, "anthropic", "Provider passed to adapter must match configured provider");
      return JSON.stringify({
        suggestedSummary: "Targeted distributed systems lead with proven expertise in Kafka pipelines.",
        selectedSections: [
          {
            sectionId: "sec-exp",
            itemIds: ["item-exp-1"], // Prioritize Kafka experience
          },
        ],
        changes: ["Prioritized Kafka pipeline scaling experience for distributed systems lead role."],
      });
    });

    const tailorResult = await tailorCV(sampleMasterCV, targetJob, "draft-123", "modern");
    assert.strictEqual(tailorResult.tailoredCV.id, "draft-123");
    // Fact safety: authentic summary in tailoredCV preserved
    assert.strictEqual(tailorResult.tailoredCV.summary, sampleMasterCV.summary);
    // Unapproved suggested summary isolated for review
    assert.strictEqual(
      tailorResult.unapprovedSuggestedSummary,
      "Targeted distributed systems lead with proven expertise in Kafka pipelines."
    );
    // Only item-exp-1 included in tailored experience section
    assert.strictEqual(tailorResult.tailoredCV.sections[0].items.length, 1);
    assert.strictEqual(tailorResult.tailoredCV.sections[0].items[0].id, "item-exp-1");
    console.log("✓ Tailoring with configured provider fixture verified; fact-safety strictly preserved");

    // 8. End-to-end /api/cv/extract with Structuring & Schema Validation
    console.log("\n8. Verifying /api/cv/extract Endpoint & Schema Validation...");
    setTestFixtureOverride(async (_provider, _prompt) => {
      return JSON.stringify({
        contact: {
          name: "Alice Engineer",
          email: "alice@example.com",
          phone: "555-1234",
          website: "https://alice.dev",
          location: "New York, NY",
        },
        summary: "Dedicated software engineer specialized in TypeScript and distributed systems.",
        sections: [
          {
            id: "sec-1",
            type: "experience",
            title: "Experience",
            items: [
              {
                id: "item-1",
                title: "Senior Developer",
                subtitle: "Tech Ltd",
                date: "2020 - 2024",
                description: "",
                bullets: ["Built microservices", "Led team of 4"],
              },
            ],
          },
        ],
        unsupportedFacts: [],
      });
    });

    const extractReq = new Request("http://127.0.0.1:3000/api/cv/extract", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        "Content-Type": "application/json",
        "x-jobai-csrf": "1",
      },
      body: JSON.stringify({
        text: "Alice Engineer\nalice@example.com\n555-1234\nSenior Developer at Tech Ltd 2020-2024",
      }),
    });

    const extractRes = await handleApiRequest(extractReq);
    assert.strictEqual(extractRes.status, 200, "Extract endpoint must return 200 OK");
    const extractData = await extractRes.json();
    assert.strictEqual(extractData.ok, true);
    assert.strictEqual(extractData.cv.contact.name, "Alice Engineer");
    assert.strictEqual(extractData.cv.contact.email, "alice@example.com");
    assert.strictEqual(extractData.cv.sections.length, 1);

    const cvValidation = validateCV(extractData.cv);
    assert.strictEqual(cvValidation.valid, true, "Structured CV must pass JobAI schema validation");
    console.log("✓ CV text upload, AI structuring, and schema validation verified");

    // Clean up test overrides
    setTestFixtureOverride(null as any);
    resetAIEngine();

    console.log("\n==================================================");
    console.log("All BYOK AI Multi-Provider Tests Passed! (8/8)");
    console.log("==================================================");
  } finally {
    await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

runTests().catch((err) => {
  console.error("BYOK AI Test Failure:", err);
  process.exit(1);
});
