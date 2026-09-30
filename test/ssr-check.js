// Real SSR Live Verification Check
// Makes actual HTTP requests to the running server and validates SSR rendered HTML & loader payloads

import assert from "node:assert";

const BASE_URL = process.env.JOB_AI_URL || "http://127.0.0.1:3000";

console.log("==================================================");
console.log(`Running SSR Live Verification against ${BASE_URL}`);
console.log("==================================================\n");

async function checkRoute(name, path, assertions) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: "text/html",
      },
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    assert.ok(contentType.includes("text/html"), `Expected text/html, got ${contentType}`);

    const html = await res.text();
    assertions(html);

    console.log(`✓ [${res.status}] ${name} (${path}) - SSR verified`);
  } catch (err) {
    console.error(`✗ ${name} (${path}) failed: ${err.message}`);
    throw err;
  }
}

async function main() {
  let failed = false;

  try {
    // 1. Check current public landing page and its working paths.
    await checkRoute("Public Landing SSR", "/", (html) => {
      assert.ok(html.includes("Your experience."), "Landing page must render its current main heading");
      assert.ok(html.includes("next role."), "Landing page must render its current supporting heading");
      assert.ok(html.includes("href=\"/templates\""), "Landing page must link to templates");
      assert.ok(html.includes("href=\"/extension\""), "Landing page must link to the optional browser extension");
      assert.ok(html.includes("Bring your experience"), "Landing page must explain the first setup step");
      assert.ok(!html.includes('class="welcome-companion'), "Landing must not restore the retired mascot");
      assert.ok(!html.includes("work-hero-documents"), "Landing must not lead with a CV preview");
    });

    await checkRoute("Design Comparison SSR", "/app/design-lab", (html) => {
      for (const name of ["Neutral", "Blueprint", "Signal"]) assert.ok(html.includes(name), `Design lab must include ${name}`);
      assert.ok(html.includes("/design-options/blueprint.html"), "Must link to a working interactive concept");
    });

    // 2. Check Templates Route SSR
    await checkRoute("Templates Page SSR", "/templates", (html) => {
      assert.ok(html.includes("Print-Ready CV Templates"), "Templates title must be in SSR HTML");
      assert.ok(html.includes("Modern Clean"), "Template 'Modern Clean' must be rendered in SSR HTML");
      assert.ok(html.includes("Executive"), "Template 'Executive' must be rendered in SSR HTML");
      assert.ok(html.includes("Technical"), "Template 'Technical' must be rendered in SSR HTML");
      assert.ok(html.includes("Compact"), "Template 'Compact' must be rendered in SSR HTML");
    });

    // 3. The extension is an optional companion and should explain local setup honestly.
    await checkRoute("Optional Extension Page SSR", "/extension", (html) => {
      assert.ok(html.includes("Tailor a CV from a job listing, right in your browser."), "Extension page must explain its purpose");
      assert.ok(html.includes("optional JobAI companion extension"), "Extension must be described as optional");
      assert.ok(html.includes("127.0.0.1:3000"), "Extension page must identify the local JobAI setup");
      assert.ok(html.includes("href=\"/app/extension\""), "Page must link to local extension setup");
      assert.ok(html.includes("Download extension (.zip)"), "Page must expose the extension download");
    });

    // 3b. Check local extension setup and pairing instructions.
    await checkRoute("Workspace Extension Page SSR", "/app/extension", (html) => {
      assert.ok(html.includes("Create a short-lived code"), "Setup must explain one-time pairing");
      assert.ok(html.includes("Pair Extension with One-Time Code"), "Setup must render its pairing step");
      assert.ok(html.includes("apps/extension/dist"), "Setup must render local unpacked extension instructions");
      assert.ok(html.includes("aria-label=\"Main navigation\""), "Workspace navigation must be rendered in SSR HTML");
    });

    // 4. Career explorer is a self-contained demo; its copy must not imply CV mutation or AI estimates.
    await checkRoute("Career Explorer SSR", "/app/career", (html) => {
      assert.ok(html.includes("There’s more than one way forward."), "Career explorer must render its heading");
      assert.ok(html.includes("What would you like to explore?"), "Career explorer must render its direction picker");
      assert.ok(html.includes("Illustrative examples"), "Career paths must be identified as examples");
      assert.ok(html.includes("No AI connection required"), "Career demo must state that it does not require AI");
      assert.ok(html.includes("Your CV stays exactly as it is."), "Career exploration must preserve the current CV");
    });

    // 5. Login preview should describe the local setup without promising unavailable accounts.
    await checkRoute("Login Preview SSR", "/login", (html) => {
      assert.ok(html.includes("Open your workspace"), "Login page must render its heading");
      assert.ok(html.includes("Account sign-in is not available in this preview"), "Preview must describe current sign-in availability");
      assert.ok(html.includes("Continue in this browser"), "Preview must offer the local workspace path");
      assert.ok(html.includes("Your CV profile stays saved in this browser."), "Preview must explain local setup");
      assert.ok(!html.includes("name=\"password\""), "Preview must not imply that it collects a password");
    });

    // 6. Import job remains a helpful bridge to the optional local extension setup.
    await checkRoute("Import Job Setup SSR", "/import-job", (html) => {
      assert.ok(html.includes("Job Import Migration"), "Import guide must render its heading");
      assert.ok(html.includes("browser extension"), "Import guide must explain the optional extension route");
      assert.ok(html.includes("Go to Extension Setup"), "Import guide must link to local setup");
      assert.ok(!html.includes("Waiting for Job Data"), "Obsolete waiting label must not be in SSR HTML");
    });

    console.log("\n==================================================");
    console.log("All SSR verification checks passed successfully!");
    console.log("==================================================");
  } catch {
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
}

main();
