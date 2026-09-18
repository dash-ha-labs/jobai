import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// 1. Isolate test execution environment completely from user data (.jobai-data)
const testDataDir = path.join(os.tmpdir(), `jobai-test-suite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
process.env.JOBAI_DATA_DIR = testDataDir;

// Dynamic imports so storage reads process.env.JOBAI_DATA_DIR
const { handleApiRequest } = await import("../apps/web/src/server/api.ts");
const {
  isAIConfigured,
  setTestAIEngine,
  resetAIEngine,
  reconstructFactSafeCV,
  MalformedModelOutputError,
} = await import("../apps/web/src/server/ai.ts");
const { canonicalExtractJob } = await import("../apps/extension/src/job.ts");
const { generateCVPdf } = await import("../apps/web/src/server/pdf.ts");
const { loadServerProfile } = await import("../apps/web/src/server/storage.ts");
import type { CV } from "jobai-shared";

async function runTests() {
  console.log("==================================================");
  console.log("Running JobAI Automation Correction Test Suite");
  console.log("Isolated test data directory:", testDataDir);
  console.log("==================================================");

  try {
    const testCV: CV = {
      id: "cv-master-uuid-1",
      version: "1.0.0",
      contact: {
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        phone: "+1 555-0144",
        location: "Seattle, WA",
        website: "https://jordanlee.dev",
      },
      summary: "Authentic Master Summary: Experienced Systems Engineer specializing in high-throughput distributed networks.",
      sections: [
        {
          id: "sec-experience",
          type: "experience",
          title: "Work Experience",
          items: [
            {
              id: "item-exp-1",
              title: "Staff Systems Engineer",
              subtitle: "StreamCore Tech",
              date: "2020 - Present",
              bullets: [
                "Scaled distributed message broker to 1.2M msg/sec",
                "Reduced P99 tail latency from 80ms to 14ms",
              ],
            },
            {
              id: "item-exp-2",
              title: "Senior Backend Developer",
              subtitle: "DataLink Labs",
              date: "2017 - 2020",
              bullets: [
                "Built resilient microservices in Go and TypeScript",
                "Maintained 99.99% service uptime across three availability zones",
              ],
            },
          ],
        },
        {
          id: "sec-education",
          type: "education",
          title: "Education",
          items: [
            {
              id: "item-edu-1",
              title: "B.S. Computer Engineering",
              subtitle: "University of Washington",
              date: "2013 - 2017",
            },
          ],
        },
        {
          id: "sec-skills",
          type: "skills",
          title: "Technical Skills",
          items: [
            {
              id: "item-skills-1",
              title: "Core Infrastructure",
              bullets: ["Go", "TypeScript", "Distributed Systems", "PostgreSQL", "Docker"],
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

    // -------------------------------------------------------------
    // Test 1: GET /api/status (Unauthenticated probe)
    // -------------------------------------------------------------
    console.log("\n1. Testing GET /api/status...");
    const req1 = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: { Origin: "http://127.0.0.1:3000" },
    });
    const res1 = await handleApiRequest(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.ok, true);
    assert.equal(typeof data1.hasProfile, "boolean");
    assert.equal(typeof data1.aiConfigured, "boolean");
    console.log("✓ /api/status responds with valid server state");

    // -------------------------------------------------------------
    // Test 2: Pairing Code Generation Requires CSRF
    // -------------------------------------------------------------
    console.log("\n2. Testing pairing code CSRF protection...");
    const reqNoCsrf = new Request("http://127.0.0.1:3000/api/pair/code", {
      method: "POST",
    });
    const resNoCsrf = await handleApiRequest(reqNoCsrf);
    assert.equal(resNoCsrf.status, 403, "Missing CSRF header must be rejected with 403");

    const reqCode = new Request("http://127.0.0.1:3000/api/pair/code", {
      method: "POST",
      headers: { "x-jobai-csrf": "1" },
    });
    const resCode = await handleApiRequest(reqCode);
    assert.equal(resCode.status, 200);
    const codeData = await resCode.json();
    assert.ok(codeData.code && codeData.code.length === 6, "Code must be 6 alphanumeric characters");
    assert.ok(codeData.expiresInMs > 0, "Code must have positive expiry");
    console.log(`✓ Pairing code generated: ${codeData.code} (CSRF enforced)`);

    // -------------------------------------------------------------
    // Test 3: Pairing Confirmation and Origin Binding
    // -------------------------------------------------------------
    console.log("\n3. Testing pairing confirmation and origin binding...");
    const boundExtensionOrigin = "chrome-extension://mfakemfa-legit-jobai-ext";
    const reqConfirm = new Request("http://127.0.0.1:3000/api/pair/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: boundExtensionOrigin,
      },
      body: JSON.stringify({ code: codeData.code }),
    });
    const resConfirm = await handleApiRequest(reqConfirm);
    assert.equal(resConfirm.status, 200);
    const confirmData = await resConfirm.json();
    assert.equal(confirmData.ok, true);
    assert.ok(confirmData.authToken && confirmData.authToken.length >= 32, "Auth token returned");
    const authToken = confirmData.authToken;
    console.log(`✓ Extension paired successfully; token issued and bound to: ${boundExtensionOrigin}`);

    // -------------------------------------------------------------
    // Test 4: Origin Security & Strict Denial Cases
    // -------------------------------------------------------------
    console.log("\n4. Testing origin security and denial cases...");

    // 4a. Authenticated request from bound extension origin -> 200 OK
    const reqBoundStatus = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Origin: boundExtensionOrigin,
      },
    });
    const resBoundStatus = await handleApiRequest(reqBoundStatus);
    assert.equal(resBoundStatus.status, 200, "Bound extension with valid token must succeed");
    const boundStatusData = await resBoundStatus.json();
    assert.equal(boundStatusData.paired, true);
    console.log("✓ Bound extension with valid token accepted (200 OK)");

    // 4b. Attacker extension trying to use valid token from different origin -> 403 Forbidden
    const reqAttackerExt = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Origin: "chrome-extension://malicious-fake-extension-id",
      },
    });
    const resAttackerExt = await handleApiRequest(reqAttackerExt);
    assert.equal(resAttackerExt.status, 403, "Token reused from unbound extension origin must be rejected with 403");
    console.log("✓ Token use from foreign extension origin denied with 403 Forbidden");

    // 4c. Arbitrary website origin -> 403 Forbidden
    const reqMaliciousSite = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Origin: "http://malicious-website.com",
      },
    });
    const resMaliciousSite = await handleApiRequest(reqMaliciousSite);
    assert.equal(resMaliciousSite.status, 403, "Arbitrary web origins must be rejected with 403");
    console.log("✓ Untrusted web origin denied with 403 Forbidden");

    // 4d. Extension trying to bypass auth using CSRF marker without Bearer token -> 401 Unauthorized
    const reqCsrfOnlyExt = new Request("http://127.0.0.1:3000/api/profile", {
      method: "GET",
      headers: {
        "x-jobai-csrf": "1",
        Origin: boundExtensionOrigin,
      },
    });
    const resCsrfOnlyExt = await handleApiRequest(reqCsrfOnlyExt);
    assert.equal(resCsrfOnlyExt.status, 401, "Extension cannot authenticate via CSRF header alone; Bearer token required");
    console.log("✓ CSRF marker alone rejected for extension without Bearer token (401 Unauthorized)");

    // 4e. Invalid / wrong pairing code rejection -> 400 PAIRING_FAILED
    const reqWrongCode = new Request("http://127.0.0.1:3000/api/pair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: boundExtensionOrigin,
      },
      body: JSON.stringify({ code: "WRONG1" }),
    });
    const resWrongCode = await handleApiRequest(reqWrongCode);
    assert.equal(resWrongCode.status, 400, "Invalid pairing code must be rejected with 400");
    const wrongCodeData = await resWrongCode.json();
    assert.equal(wrongCodeData.code, "PAIRING_FAILED");
    console.log("✓ Invalid pairing code rejected with 400 PAIRING_FAILED");

    // 4f. Re-pairing from a new unpacked extension origin when boundOrigin is already set
    // Generates fresh code from website and pairs new extension ID
    const reqFreshCode = new Request("http://127.0.0.1:3000/api/pair/code", {
      method: "POST",
      headers: { "x-jobai-csrf": "1" },
    });
    const resFreshCode = await handleApiRequest(reqFreshCode);
    assert.equal(resFreshCode.status, 200);
    const freshCodeData = await resFreshCode.json();

    const reloadedExtensionOrigin = "chrome-extension://reloaded-extension-id-5678";
    const reqRePair = new Request("http://127.0.0.1:3000/api/pair", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: reloadedExtensionOrigin,
      },
      body: JSON.stringify({ code: freshCodeData.code }),
    });
    const resRePair = await handleApiRequest(reqRePair);
    assert.equal(resRePair.status, 200, "New extension origin must not be blocked by origin allowlist during code exchange");
    const rePairData = await resRePair.json();
    assert.equal(rePairData.ok, true);
    console.log(`✓ Re-pairing succeeded from new extension origin (${reloadedExtensionOrigin})`);

    // Verify new origin is now bound and old origin is now rejected
    const reqNewOriginStatus = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${rePairData.token}`,
        Origin: reloadedExtensionOrigin,
      },
    });
    const resNewOriginStatus = await handleApiRequest(reqNewOriginStatus);
    assert.equal(resNewOriginStatus.status, 200, "Newly bound extension origin must be accepted");

    const reqOldOriginStatus = new Request("http://127.0.0.1:3000/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${rePairData.token}`,
        Origin: boundExtensionOrigin,
      },
    });
    const resOldOriginStatus = await handleApiRequest(reqOldOriginStatus);
    assert.equal(resOldOriginStatus.status, 403, "Superseded extension origin must be denied 403");
    console.log("✓ Origin binding cleanly updated to new extension; superseded origin denied with 403");

    // Re-bind to boundExtensionOrigin for subsequent test suite consistency
    const reqRestoreCode = new Request("http://127.0.0.1:3000/api/pair/code", {
      method: "POST",
      headers: { "x-jobai-csrf": "1" },
    });
    const resRestoreCode = await handleApiRequest(reqRestoreCode);
    const restoreCodeData = await resRestoreCode.json();
    await handleApiRequest(new Request("http://127.0.0.1:3000/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: boundExtensionOrigin },
      body: JSON.stringify({ code: restoreCodeData.code }),
    }));

    // -------------------------------------------------------------
    // Test 5: Profile Persistence & Authentication
    // -------------------------------------------------------------
    console.log("\n5. Testing Profile persistence...");
    const reqSaveProfile = new Request("http://127.0.0.1:3000/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Origin: boundExtensionOrigin,
      },
      body: JSON.stringify({ cv: testCV }),
    });
    const resSaveProfile = await handleApiRequest(reqSaveProfile);
    assert.equal(resSaveProfile.status, 200);
    const saveProfileData = await resSaveProfile.json();
    assert.equal(saveProfileData.ok, true);

    const reqGetProfile = new Request("http://127.0.0.1:3000/api/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Origin: boundExtensionOrigin,
      },
    });
    const resGetProfile = await handleApiRequest(reqGetProfile);
    assert.equal(resGetProfile.status, 200);
    const getProfileData = await resGetProfile.json();
    assert.equal(getProfileData.ok, true);
    assert.equal(getProfileData.cv.contact.name, "Jordan Lee");
    assert.equal(getProfileData.cv.summary, testCV.summary);
    console.log("✓ Profile persisted cleanly to isolated test directory");

    // -------------------------------------------------------------
    // Test 6: Canonical URL Extraction & Credential Rejection
    // -------------------------------------------------------------
    console.log("\n6. Testing Canonical URL extraction & credential rejection...");
    const dummyDomDoc = {
      querySelector: () => null,
      querySelectorAll: () => [],
      title: "Job Title",
      body: { childNodes: [] },
    } as any;

    // Test rejection of credentials in URL
    const credUrlRes = canonicalExtractJob(dummyDomDoc, "https://username:password@careers.example.com/job/123");
    assert.equal(credUrlRes.ok, false);
    assert.ok(credUrlRes.error?.includes("embedded credentials"), "Must reject embedded credentials in URL");

    // Test rejection of non-http/https URL
    const fileUrlRes = canonicalExtractJob(dummyDomDoc, "file:///path/to/job.html");
    assert.equal(fileUrlRes.ok, false);
    assert.ok(fileUrlRes.error?.includes("unsupported source URL protocol"), "Must reject non-http/https protocols");
    console.log("✓ Canonical URL extraction strictly rejects credentials and unsupported protocols");

    // -------------------------------------------------------------
    // Test 7: Strict Bounded Model JSON Validation & Rejection Regressions
    // -------------------------------------------------------------
    console.log("\n7. Testing Strict Model Output validation in ai.ts...");

    // 7a. Rejection of unknown section ID
    assert.throws(
      () => {
        reconstructFactSafeCV(testCV, "draft-test-err", {
          selectedSections: [
            {
              sectionId: "unknown-section-uuid-999",
              itemIds: ["item-exp-1"],
            },
          ],
        });
      },
      (err: any) => {
        return err instanceof MalformedModelOutputError && err.message.includes("Unknown sectionId");
      },
      "Must throw MalformedModelOutputError on unknown sectionId"
    );

    // 7b. Rejection of duplicate section ID
    assert.throws(
      () => {
        reconstructFactSafeCV(testCV, "draft-test-err", {
          selectedSections: [
            { sectionId: "sec-experience", itemIds: ["item-exp-1"] },
            { sectionId: "sec-experience", itemIds: ["item-exp-2"] },
          ],
        });
      },
      (err: any) => {
        return err instanceof MalformedModelOutputError && err.message.includes("Duplicate sectionId");
      },
      "Must throw MalformedModelOutputError on duplicate sectionId"
    );

    // 7c. Rejection of unknown item ID
    assert.throws(
      () => {
        reconstructFactSafeCV(testCV, "draft-test-err", {
          selectedSections: [
            {
              sectionId: "sec-experience",
              itemIds: ["unknown-item-uuid-999"],
            },
          ],
        });
      },
      (err: any) => {
        return err instanceof MalformedModelOutputError && err.message.includes("Unknown itemId");
      },
      "Must throw MalformedModelOutputError on unknown itemId"
    );

    // 7d. Rejection of duplicate item ID
    assert.throws(
      () => {
        reconstructFactSafeCV(testCV, "draft-test-err", {
          selectedSections: [
            {
              sectionId: "sec-experience",
              itemIds: ["item-exp-1", "item-exp-1"],
            },
          ],
        });
      },
      (err: any) => {
        return err instanceof MalformedModelOutputError && err.message.includes("Duplicate itemId");
      },
      "Must throw MalformedModelOutputError on duplicate itemId"
    );

    // 7e. Rejection of oversized suggestedSummary
    assert.throws(
      () => {
        reconstructFactSafeCV(testCV, "draft-test-err", {
          suggestedSummary: "a".repeat(2500),
        });
      },
      (err: any) => {
        return err instanceof MalformedModelOutputError && err.message.includes("exceeds maximum length bound");
      },
      "Must throw MalformedModelOutputError on oversized suggestedSummary"
    );

    console.log("✓ Strict model JSON validation: all unknown/duplicate IDs and malformed inputs rejected");

    // -------------------------------------------------------------
    // Test 8: Fact Safety, Authentic Summary Preservation & Derived Diff
    // -------------------------------------------------------------
    console.log("\n8. Testing authentic summary preservation & derived diff...");
    const proposedSummary = "AI Hallucinated summary claiming 15 years experience and VP title";
    const validModelOutput = {
      suggestedSummary: proposedSummary,
      selectedSections: [
        {
          sectionId: "sec-experience",
          itemIds: ["item-exp-1"], // Omitted item-exp-2
        },
        {
          sectionId: "sec-skills",
          itemIds: ["item-skills-1"],
        },
        // Omitted sec-education entirely
      ],
    };

    const tailoringResult = reconstructFactSafeCV(testCV, "draft-fact-safe-1", validModelOutput, "executive");

    // 8a. Verify authentic summary strictly preserved in tailored CV
    assert.equal(
      tailoringResult.tailoredCV.summary,
      testCV.summary,
      "Tailored CV summary MUST strictly match master CV summary, NOT AI proposed summary"
    );
    assert.equal(
      tailoringResult.unapprovedSuggestedSummary,
      proposedSummary,
      "AI proposed summary MUST be isolated in unapprovedSuggestedSummary"
    );

    // 8b. Verify derived diff notes (derived from actual structural differences, not model claims)
    assert.ok(
      tailoringResult.changes.some((c) => c.includes("Omitted section: Education")),
      "Changes must accurately list omitted section Education"
    );
    assert.ok(
      tailoringResult.changes.some((c) => c.includes("Omitted 1 less relevant item from Work Experience")),
      "Changes must accurately reflect count of omitted items"
    );
    assert.ok(
      tailoringResult.changes.some((c) => c.includes("Generated unapproved suggested summary for review")),
      "Changes must accurately indicate unapproved suggested summary was generated"
    );
    // Ensure no fake default strings
    assert.ok(
      !tailoringResult.changes.some((c) => c.toLowerCase().includes("prioritized for this target role")),
      "Changes must NOT contain fake default 'prioritized' claims"
    );

    console.log("✓ Authentic summary preserved; unapproved summary isolated; diff accurately derived");

    // -------------------------------------------------------------
    // Test 9: Live-AI Blocker (Honest 503 without fake credentials)
    // -------------------------------------------------------------
    console.log("\n9. Testing Honest Live-AI Blocker (503 AI_CREDENTIALS_REQUIRED)...");
    const jobHandoff = {
      title: "Senior Distributed Systems Architect",
      company: "Apex Cloud Services",
      sourceUrl: "https://apexcloud.example/careers/job/901",
      text: "We are seeking a Senior Distributed Systems Architect to scale our cloud storage layer using Go, TypeScript, and high-throughput streaming systems.",
    };

    if (!isAIConfigured()) {
      const reqLiveAi = new Request("http://127.0.0.1:3000/api/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          Origin: boundExtensionOrigin,
        },
        body: JSON.stringify({ job: jobHandoff }),
      });
      const resLiveAi = await handleApiRequest(reqLiveAi);
      assert.equal(resLiveAi.status, 503, "Must return 503 when OPENAI_API_KEY is not set");
      const errBody = await resLiveAi.json();
      assert.equal(errBody.code, "AI_CREDENTIALS_REQUIRED");
      assert.ok(errBody.message.includes("OPENAI_API_KEY"), "Error must clearly name missing OPENAI_API_KEY");
      console.log("✓ Honest live-AI blocker verified: returns 503 AI_CREDENTIALS_REQUIRED (no fabricated credentials)");
    } else {
      console.log("ℹ OPENAI_API_KEY is present in environment; skipping 503 check");
    }

    // -------------------------------------------------------------
    // Test 10: End-to-End Tailoring & Durable Server Job Record
    // -------------------------------------------------------------
    console.log("\n10. Testing End-to-End Tailoring with Test Engine & Durable Job Record...");
    // Inject test AI engine test double
    setTestAIEngine(async (masterCV, job, templateId) => {
      return reconstructFactSafeCV(
        masterCV,
        "draft-test-double",
        {
          suggestedSummary: "Proposed summary for Apex Cloud Services",
          selectedSections: [
            { sectionId: "sec-experience", itemIds: ["item-exp-1"] },
            { sectionId: "sec-skills", itemIds: ["item-skills-1"] },
          ],
        },
        templateId
      );
    });

    const reqTailor = new Request("http://127.0.0.1:3000/api/tailor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Origin: boundExtensionOrigin,
      },
      body: JSON.stringify({
        job: jobHandoff,
        templateId: "tech",
      }),
    });
    const resTailor = await handleApiRequest(reqTailor);
    assert.equal(resTailor.status, 200, "Tailor request with test engine must succeed");
    const tailorData = await resTailor.json();

    // Verify response shape matching contract TailorResponse
    assert.ok(tailorData.jobId && tailorData.jobId.startsWith("job-"), "Must return durable jobId");
    assert.ok(tailorData.draftId && tailorData.draftId.startsWith("draft-"), "Must return draftId");
    assert.equal(tailorData.jobTitle, jobHandoff.title);
    assert.equal(tailorData.company, jobHandoff.company);
    assert.equal(tailorData.templateId, "tech");
    assert.equal(tailorData.tailoredCV.summary, testCV.summary, "Tailored CV summary must be authentic master summary");
    assert.equal(tailorData.unapprovedSuggestedSummary, "Proposed summary for Apex Cloud Services");
    assert.ok(Array.isArray(tailorData.changes) && tailorData.changes.length > 0);
    console.log(`✓ Tailor endpoint returned valid TailorResponse with jobId: ${tailorData.jobId} and draftId: ${tailorData.draftId}`);

    // Test durable job record polling: GET /api/tailor/jobs/:id (MV3 suspension recovery)
    console.log("\n10b. Testing Durable Job Polling (GET /api/tailor/jobs/:id)...");
    const reqJobPoll = new Request(`http://127.0.0.1:3000/api/tailor/jobs/${tailorData.jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Origin: boundExtensionOrigin,
      },
    });
    const resJobPoll = await handleApiRequest(reqJobPoll);
    assert.equal(resJobPoll.status, 200);
    const jobPollData = await resJobPoll.json();
    assert.equal(jobPollData.ok, true);
    assert.equal(jobPollData.job.id, tailorData.jobId);
    assert.equal(jobPollData.job.status, "completed");
    assert.equal(jobPollData.job.draftId, tailorData.draftId);
    console.log("✓ Durable job record poll confirmed: status completed, result preserved for MV3 recovery");

    // Reset AI engine back to default
    resetAIEngine();

    // -------------------------------------------------------------
    // Test 11: Four-Template PDF Fidelity & Authentic Summary in PDF
    // -------------------------------------------------------------
    console.log("\n11. Testing Four-Template PDF Generation...");
    const templates = ["modern", "executive", "tech", "compact"] as const;

    for (const tmpl of templates) {
      const cvWithTemplate: CV = {
        ...tailorData.tailoredCV,
        stylePrefs: { ...tailorData.tailoredCV.stylePrefs, templateId: tmpl },
      };
      const pdfBuffer = await generateCVPdf(cvWithTemplate);
      assert.ok(pdfBuffer.length > 1000, `PDF for template "${tmpl}" must have substantial size`);
      const magic = Buffer.from(pdfBuffer).subarray(0, 5).toString("latin1");
      assert.equal(magic, "%PDF-", `PDF for template "${tmpl}" must start with %PDF-`);

      const pdfString = Buffer.from(pdfBuffer).toString("latin1");
      console.log(`PDF size for ${tmpl}:`, pdfBuffer.length);
      assert.ok(pdfBuffer.length > 500, `Template "${tmpl}" PDF generated successfully`);
      // Ensure unapproved AI summary was NOT inserted into PDF
      assert.ok(
        !pdfString.includes("Proposed summary for Apex Cloud Services"),
        `Unapproved suggested summary must NOT be present in template "${tmpl}" PDF`
      );
      console.log(`✓ Template "${tmpl}" PDF verified (${pdfBuffer.length} bytes, authentic summary preserved)`);
    }

    // -------------------------------------------------------------
    // Test 12: Browser Editor Draft Management & Isolation
    // -------------------------------------------------------------
    console.log("\n12. Testing Browser Editor Draft Route & Profile Isolation...");
    // 12a. Read draft via same-origin + CSRF
    const reqGetDraft = new Request(`http://127.0.0.1:3000/api/drafts/${tailorData.draftId}`, {
      method: "GET",
      headers: {
        Origin: "http://127.0.0.1:3000",
        "x-jobai-csrf": "1",
      },
    });
    const resGetDraft = await handleApiRequest(reqGetDraft);
    assert.equal(resGetDraft.status, 200);
    const draftDetail = await resGetDraft.json();
    assert.equal(draftDetail.ok, true);
    assert.equal(draftDetail.draft.id, tailorData.draftId);
    assert.equal(draftDetail.draft.unapprovedSuggestedSummary, "Proposed summary for Apex Cloud Services");

    // 12b. Update draft CV (e.g. adopting summary or editing bullets) via PUT
    const editedDraftCV: CV = {
      ...draftDetail.draft.tailoredCV,
      summary: "User explicitly adopted and edited this summary.",
    };
    const reqUpdateDraft = new Request(`http://127.0.0.1:3000/api/drafts/${tailorData.draftId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:3000",
        "x-jobai-csrf": "1",
      },
      body: JSON.stringify({ cv: editedDraftCV }),
    });
    const resUpdateDraft = await handleApiRequest(reqUpdateDraft);
    assert.equal(resUpdateDraft.status, 200);

    // 12c. Verify master profile was NOT mutated by draft edit
    const currentMasterProfile = await loadServerProfile();
    assert.ok(currentMasterProfile);
    assert.equal(
      currentMasterProfile.summary,
      testCV.summary,
      "Master profile MUST remain completely untouched when editing drafts"
    );
    console.log("✓ Draft updated independently; master profile strictly preserved without mutation");

    console.log("\n==================================================");
    console.log("All JobAI Automation Correction checks passed! (12/12)");
    console.log("==================================================");
  } finally {
    // Clean up isolated test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
      console.log("✓ Cleaned up isolated test data directory");
    } catch {
      // Ignore cleanup error
    }
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
