import assert from "node:assert";

const BASE_URL = process.env.JOB_AI_URL || "http://127.0.0.1:3005";

console.log("==================================================");
console.log(`Running Blog SSR and Content Checks against ${BASE_URL}`);
console.log("==================================================\n");

async function checkRoute(name, path, expectedStatus, assertions) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: "text/html",
      },
    });

    assert.strictEqual(res.status, expectedStatus, `Expected ${expectedStatus}, got ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    assert.ok(contentType.includes("text/html"), `Expected text/html, got ${contentType}`);

    const html = await res.text();
    assertions(html);

    console.log(`✓ [${res.status}] ${name} (${path}) - Verified`);
  } catch (err) {
    console.error(`✗ ${name} (${path}) failed: ${err.message}`);
    throw err;
  }
}

async function main() {
  let failed = false;

  try {
    // 1. Check Blog Index Route
    await checkRoute("Blog Index", "/blog", 200, (html) => {
      assert.ok(html.includes("Advice for your job search"), "Heading must be present");
      assert.ok(html.includes("Practical Guidance"), "Category badge must be present");
      assert.ok(html.includes("Tailor your CV without inventing experience"), "Featured article title must be present");
      assert.ok(html.includes("Write experience bullets that show your contribution"), "Article 2 title must be present");
      assert.ok(html.includes("Check your CV before exporting to PDF"), "Article 3 title must be present");
      assert.ok(html.includes("href=\"/blog/tailor-your-cv-without-inventing-experience\""), "Featured link must be present");
      assert.ok(html.includes("href=\"/blog/write-experience-bullets-that-show-contribution\""), "Article 2 link must be present");
      assert.ok(html.includes("href=\"/blog/check-your-cv-before-exporting-to-pdf\""), "Article 3 link must be present");
      
      // Absence of old developer content
      assert.ok(!html.includes("TanStack Start with TypeScript"), "No old dev title 1");
      assert.ok(!html.includes("Router v6 Migration Guide"), "No old dev title 2");
      assert.ok(!html.includes("Modern CSS Architecture"), "No old dev title 3");
    });

    // 2. Check Article 1: Tailor without inventing
    await checkRoute("Article 1: Tailoring", "/blog/tailor-your-cv-without-inventing-experience", 200, (html) => {
      assert.ok(html.includes("Tailor your CV without inventing experience"), "Article title must be present");
      assert.ok(html.includes("Practical Tip"), "Practical tip callout must be present");
      assert.ok(html.includes("The right approach to tailoring"), "Section heading must be present");
      assert.ok(html.includes("Senior Product Manager — Fictional Example"), "Fictional example must be present");
      assert.ok(html.includes("Back to all articles"), "Back to blog breadcrumb must be present");
      assert.ok(html.includes("href=\"/blog\""), "Link to /blog must be present");
      assert.ok(html.includes("Open CV Editor"), "Link to CV editor must be present");
      assert.ok(html.includes("href=\"/?view=editor\""), "Link target to CV editor must be present");
    });

    // 3. Check Article 2: Experience bullets
    await checkRoute("Article 2: Bullets", "/blog/write-experience-bullets-that-show-contribution", 200, (html) => {
      assert.ok(html.includes("Write experience bullets that show your contribution"), "Article title must be present");
      assert.ok(html.includes("The STAR method, simplified"), "STAR method section must be present");
      assert.ok(html.includes("Backend Engineer — Fictional Example"), "Fictional example must be present");
      assert.ok(html.includes("Back to all articles"), "Back to blog breadcrumb must be present");
      assert.ok(html.includes("href=\"/?view=editor\""), "Link target to CV editor must be present");
    });

    // 4. Check Article 3: PDF export
    await checkRoute("Article 3: PDF Export", "/blog/check-your-cv-before-exporting-to-pdf", 200, (html) => {
      assert.ok(html.includes("Check your CV before exporting to PDF"), "Article title must be present");
      assert.ok(html.includes("Critical pre-flight checks"), "Pre-flight heading must be present");
      assert.ok(html.includes("Inspection Area"), "Table header must be present in SSR");
      assert.ok(html.includes("Hyperlinks"), "Table data cell must be present in SSR");
      assert.ok(html.includes("Designer &amp; Writer — Fictional Example") || html.includes("Designer & Writer — Fictional Example"), "Fictional example must be present");
      assert.ok(html.includes("href=\"/?view=editor\""), "Link target to CV editor must be present");
    });

    // 5. Check Non-existent article slug returns clear not-found
    await checkRoute("Invalid Slug Not Found", "/blog/this-slug-does-not-exist", 200, (html) => {
      assert.ok(html.includes("Article not found"), "Not found message must be present");
      assert.ok(html.includes("Return to all articles"), "Return to articles link must be present");
      assert.ok(html.includes("href=\"/blog\""), "Link back to /blog must be present");
    });

    console.log("\n==================================================");
    console.log("All Blog SSR and Content verification checks passed!");
    console.log("==================================================");
  } catch {
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
}

main();
