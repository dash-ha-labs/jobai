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
    // 1. Check Root Route SSR (loader metadata present in initial HTML)
    await checkRoute("Root Page SSR", "/", (html) => {
      assert.ok(html.includes("JobAI — Local CV Manager"), "Document title must be in SSR HTML");
      assert.ok(html.includes("One click.") || html.includes("Canonical Master CV"), "H1 header must be in SSR HTML");
      assert.ok(html.includes("href=\"/templates\""), "Templates navigation link must be in SSR HTML");
      assert.ok(html.includes("href=\"/extension\""), "Extension setup navigation link must be in SSR HTML");
      assert.ok(html.includes("Modern Clean"), "SSR loader data (templates) must be present in HTML before JS runs");
    });

    // 2. Check Templates Route SSR
    await checkRoute("Templates Page SSR", "/templates", (html) => {
      assert.ok(html.includes("Print-Ready CV Templates"), "Templates title must be in SSR HTML");
      assert.ok(html.includes("Modern Clean"), "Template 'Modern Clean' must be rendered in SSR HTML");
      assert.ok(html.includes("Executive"), "Template 'Executive' must be rendered in SSR HTML");
      assert.ok(html.includes("Technical"), "Template 'Technical' must be rendered in SSR HTML");
      assert.ok(html.includes("Compact"), "Template 'Compact' must be rendered in SSR HTML");
    });

    // 3. Check Extension Route SSR (Public Marketing)
    await checkRoute("Extension Page SSR (Public Marketing)", "/extension", (html) => {
      assert.ok(html.includes("Browser Extension Companion"), "Extension page title must be in SSR HTML");
      assert.ok(html.includes("Clip listings with zero cloud leak"), "Value proposition heading must be in SSR HTML");
      assert.ok(html.includes("Strict localhost loopback"), "Localhost loopback architecture claim must be in SSR HTML");
      assert.ok(html.includes("Open App to Pair"), "CTA to /app/extension must be in SSR HTML");
      assert.ok(html.includes("href=\"/app/extension\""), "Link to workspace pairing must be in SSR HTML");
    });

    // 3b. Check Workspace Extension Route SSR (Authenticated Workspace Pairing)
    await checkRoute("Workspace Extension Page SSR", "/app/extension", (html) => {
      assert.ok(html.includes("Extension Setup &amp; Pairing") || html.includes("Extension Setup"), "Extension pairing page heading must be in SSR HTML");
      assert.ok(html.includes("Generate connection code"), "Code generation CTA must be in SSR HTML");
      assert.ok(html.includes("apps/extension/dist"), "Unpacked extension instructions must be in SSR HTML");
      assert.ok(html.includes("id=\"sidebar\""), "Workspace sidebar must be rendered in SSR HTML");
    });

    // 4. Check Import Job Route SSR (Retired migration screen)
    await checkRoute("Import Job Page SSR", "/import-job", (html) => {
      assert.ok(html.includes("Job Import Migration"), "Migration heading must be in SSR HTML");
      assert.ok(html.includes("browser extension"), "Extension reference must be in SSR HTML");
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
