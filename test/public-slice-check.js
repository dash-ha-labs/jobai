// Automated Verification for JobAI Public Site First Slice — Revision r2
// Tests SSR responses, routing contracts, legacy redirects, and conversion-r2 content fidelity

import assert from "node:assert";

const BASE_URL = process.env.JOB_AI_URL || "http://127.0.0.1:3006";

console.log("==================================================");
console.log(`Running Public Site Slice Verification against ${BASE_URL}`);
console.log("==================================================\n");

async function checkRoute(name, path, options = {}) {
  const { expectedStatus = 200, headers = {}, redirect = "manual", assertions } = options;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: "text/html",
        ...headers,
      },
      redirect,
    });

    assert.strictEqual(
      res.status,
      expectedStatus,
      `Expected status ${expectedStatus} for ${path}, got ${res.status}`
    );

    if (expectedStatus === 200) {
      const contentType = res.headers.get("content-type") || "";
      assert.ok(contentType.includes("text/html"), `Expected text/html, got ${contentType}`);
      const html = await res.text();
      if (assertions) {
        assertions(html, res);
      }
    } else if ([301, 302, 307, 308].includes(expectedStatus)) {
      const location = res.headers.get("location") || "";
      if (assertions) {
        assertions(location, res);
      }
    }

    console.log(`✓ [${res.status}] ${name} (${path}) - Verified`);
  } catch (err) {
    console.error(`✗ ${name} (${path}) failed: ${err.message}`);
    throw err;
  }
}

async function main() {
  let failed = false;

  try {
    // 1. Public Homepage SSR (/)
    await checkRoute("Public Homepage SSR", "/", {
      expectedStatus: 200,
      assertions: (html) => {
        // Document metadata & public shell
        assert.ok(html.includes("jobai") && html.includes("text-[#9782d8]\">.</span>"), "Header must include jobai. wordmark");
        assert.ok(html.includes("href=\"/#workflow\""), "Header must link to Product workflow");
        assert.ok(html.includes("href=\"/toolkit\""), "Header must link to Toolkit");
        assert.ok(html.includes("href=\"/templates\""), "Header must link to /templates");
        assert.ok(html.includes("href=\"/resources\""), "Header must link to /resources (Resources hub)");
        assert.ok(html.includes("href=\"/blog\""), "Public shell must keep /blog reachable (Advice)");
        assert.ok(html.includes("Create your CV"), "Header must have primary Create your CV CTA");
        assert.ok(html.includes("Open app"), "Header must have Open app secondary link");
        assert.ok(!html.includes("id=\"sidebar\""), "Public homepage must NOT render workspace sidebar");

        // Hero Section (conversion-r2)
        assert.ok(html.includes("One click."), "Hero must include primary headline");
        assert.ok(html.includes("A CV made for this job."), "Hero must include headline accent");
        assert.ok(html.includes("ONE-CLICK APPLICATION TAILORING"), "Hero must have section badge");
        assert.ok(html.includes("Import your master CV facts and pair the browser extension once"), "Hero must have setup qualifier");
        assert.ok(html.includes("Always review your customized CV before sending"), "Hero must state pre-send review qualifier");

        // Staged Illustrative Transformation Demonstration
        assert.ok(html.includes("Illustrative Transformation Demonstration (Not a Result Guarantee)"), "Hero must label demonstration clearly as illustrative and not a result guarantee");
        assert.ok(html.includes("Target Role"), "Hero must show Target Role card");
        assert.ok(html.includes("Staff Systems Engineer"), "Hero must show Staff Systems Engineer target role");
        assert.ok(html.includes("Tailored Variant"), "Hero must show Tailored Variant card");
        assert.ok(html.includes("Alex Rivera"), "Hero must show candidate Alex Rivera");
        assert.ok(html.includes("Truth preserved: 0 invented facts"), "Hero must show truth preservation guarantee");

        // Setup vs Repeat Workflow Section
        assert.ok(html.includes("Upfront setup once. One click for every job after."), "Workflow headline");
        assert.ok(html.includes("First-Time Setup"), "Phase 1 badge");
        assert.ok(html.includes("Phase 1 • Initial Setup"), "Phase 1 title without timed guarantee");
        assert.ok(!html.includes("(~3 Minutes)"), "Must not include unverified ~3 minutes guarantee");
        assert.ok(html.includes("Repeat Workflow"), "Phase 2 badge");
        assert.ok(!html.includes("(~10 Seconds)"), "Must not include unverified ~10 seconds guarantee");

        // Free Browser Tools Section
        assert.ok(html.includes("CV Bullet Impact &amp; Readability Analyzer") || html.includes("CV Bullet Impact & Readability Analyzer"), "Free tools headline");
        assert.ok(html.includes("bullet-input"), "Interactive bullet textarea element");
        assert.ok(html.includes("Pre-Flight Analysis Results"), "Analysis results heading");
        assert.ok(html.includes("Action Verb"), "Action verb feedback column");
        assert.ok(html.includes("Quantified Metrics"), "Quantified metrics feedback column");

        // Featured templates showcase (full document preview lives on /templates)
        assert.ok(html.includes("Print-Ready CV Templates"), "Gallery title");
        assert.ok(html.includes("20 Professional Layouts"), "Gallery layout counter");
        assert.ok(html.includes("Browse all templates"), "Section CTA to catalog");
        assert.ok(html.includes("data-featured-template=\"modern\""), "Featured template card present");
        assert.ok(html.includes("Modern Clean"), "Featured card shows template name");
        assert.ok(
          /<a[^>]*data-featured-template="modern"[^>]*href="\/templates"/.test(html) ||
            /<a[^>]*href="\/templates"[^>]*data-featured-template="modern"/.test(html),
          "Featured card name links to /templates"
        );
        assert.ok(!html.includes("tab-modern"), "Homepage must not render modern tab");
        assert.ok(!html.includes("tab-executive"), "Homepage must not render executive tab");
        assert.ok(!html.includes("tab-tech"), "Homepage must not render tech tab");
        assert.ok(!html.includes("tab-compact"), "Homepage must not render compact tab");
        assert.ok(!html.includes("Sample profile:"), "Homepage must not render sample profile bar");
        assert.ok(!html.includes("cv-paper"), "Homepage must not inline-render CV paper");

        // AI Freedom & BYOK section
        assert.ok(html.includes("AI Freedom. Use your preferred provider, or run local."), "AI freedom headline");
        assert.ok(html.includes("Bring Your Own Key (BYOK)"), "BYOK pillar");
        assert.ok(html.includes("Wholesale Pricing Transparency"), "Wholesale pricing pillar");
        assert.ok(html.includes("token costs vary by provider and prompt length"), "Wholesale pricing must state cost varies");
        assert.ok(!html.includes("$0.02"), "Must not claim fixed <$0.02 cost");
        assert.ok(html.includes("Local Ollama") || html.includes("Local Ollama &amp; Offline Models"), "Local offline LLMs pillar");

        // Extension companion feature panel
        assert.ok(html.includes("BROWSER EXTENSION COMPANION"), "Extension panel badge");
        assert.ok(html.includes("Pair extension. Clip listings with zero cloud leak."), "Extension panel headline");
        assert.ok(html.includes("CSRF-protected pairing"), "Extension panel feature item");
        assert.ok(html.includes("Strict localhost loopback"), "Extension panel loopback note");

        // Advice & Guides archive section
        assert.ok(html.includes("From the Advice &amp; Guides archive") || html.includes("From the Advice & Guides archive"), "Advice archive heading");
        assert.ok(html.includes("Tailor Your CV Without Inventing Experience"), "Article 1 link");
        assert.ok(html.includes("Write Experience Bullets That Show Contribution"), "Article 2 link");
        assert.ok(html.includes("Check Your CV Before Exporting to PDF"), "Article 3 link");

        // Final Conversion CTA
        assert.ok(html.includes("Start building your tailored CV today."), "Final CTA heading");

        // Extensive 5-Column Footer
        assert.ok(html.includes("Local-MVP Architecture &amp; Privacy Disclosure") || html.includes("Local-MVP Architecture & Privacy Disclosure"), "Footer disclosure heading");
        assert.ok(html.includes("via your local JobAI backend"), "Disclosure must reference local backend");
        assert.ok(!html.includes("without intermediate storage servers"), "Disclosure must not contradict server processing");
        assert.ok(!html.includes("Modern Clean (ATS-ready)"), "Templates list must not make ATS claim");
        assert.ok(html.includes("Modern Clean (Standard Structure)"), "Templates list should use neutral structure label");
        assert.ok(html.includes("Local MVP v0.2.0-slice"), "Footer version note");
      },
    });

    // 2. Public Templates Gallery SSR (/templates)
    await checkRoute("Public Templates Gallery SSR", "/templates", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("Print-Ready CV Templates"), "Templates heading");
        assert.ok(html.includes("Modern Clean"), "Modern Clean template");
        assert.ok(html.includes("Executive"), "Executive template");
        assert.ok(html.includes("Technical"), "Technical template");
        assert.ok(html.includes("Compact"), "Compact template");
        assert.ok(!html.includes("id=\"sidebar\""), "Public /templates must NOT render workspace sidebar");
      },
    });

    // 3. Public Blog Index SSR (/blog)
    await checkRoute("Public Blog Index SSR", "/blog", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("Advice for your job search"), "Blog index heading");
        assert.ok(html.includes("Tailor your CV without inventing experience"), "Article 1");
        assert.ok(html.includes("Write experience bullets that show your contribution"), "Article 2");
        assert.ok(html.includes("Check your CV before exporting to PDF"), "Article 3");
        assert.ok(!html.includes("id=\"sidebar\""), "Public /blog must NOT render workspace sidebar");
      },
    });

    // 4. Public Blog Article SSR (/blog/tailor-your-cv-without-inventing-experience)
    await checkRoute(
      "Public Blog Article SSR",
      "/blog/tailor-your-cv-without-inventing-experience",
      {
        expectedStatus: 200,
        assertions: (html) => {
          assert.ok(html.includes("Tailor your CV without inventing experience"), "Article heading");
          assert.ok(html.includes("JobAI Editorial"), "Article author tag");
          assert.ok(!html.includes("id=\"sidebar\""), "Public article must NOT render workspace sidebar");
        },
      }
    );

    // 5. Legacy Redirect: /?view=editor -> /app/editor
    await checkRoute("Legacy Deep Link /?view=editor", "/?view=editor", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app/editor", "Must redirect to /app/editor");
      },
    });

    // 6. Legacy Redirect: /?view=overview -> /app
    await checkRoute("Legacy Deep Link /?view=overview", "/?view=overview", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app", "Must redirect to /app");
      },
    });

    // 7. Legacy Redirect: /app?view=editor -> /app/editor
    await checkRoute("Legacy App Search /app?view=editor", "/app?view=editor", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app/editor", "Must redirect to /app/editor");
      },
    });

    // 8. Legacy Redirect: /app?view=overview -> /app
    await checkRoute("Legacy App Search /app?view=overview", "/app?view=overview", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app", "Must redirect to /app");
      },
    });

    // 9. Legacy Redirect: /drafts -> /app/applications
    await checkRoute("Legacy Route /drafts", "/drafts", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app/applications", "Must redirect to /app/applications");
      },
    });

    // 10. Legacy Redirect: /settings/ai -> /app/settings/ai
    await checkRoute("Legacy Route /settings/ai", "/settings/ai", {
      expectedStatus: 307,
      assertions: (location) => {
        assert.strictEqual(location, "/app/settings/ai", "Must redirect to /app/settings/ai");
      },
    });

    // 11. Workspace SSR (/app)
    await checkRoute("Workspace Shell SSR (/app)", "/app", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "Workspace must render sidebar");
        assert.ok(html.includes("Local workspace"), "Workspace indicator");
        assert.ok(html.includes("Your workspace"), "Breadcrumb header");
        assert.ok(html.includes("href=\"/app/editor\""), "Sidebar must link to /app/editor");
        assert.ok(html.includes("href=\"/app/templates\""), "Sidebar must link to /app/templates");
        assert.ok(html.includes("href=\"/app/applications\""), "Sidebar must link to /app/applications");
        assert.ok(html.includes("href=\"/app/blog\""), "Sidebar must link to /app/blog");
        assert.ok(html.includes("href=\"/app/toolkit\""), "Sidebar must link to /app/toolkit");
        assert.ok(html.includes("href=\"/app/settings/ai\""), "Sidebar must link to /app/settings/ai");
      },
    });

    // 12. Direct Editor Route (/app/editor)
    await checkRoute("Direct Editor Route (/app/editor)", "/app/editor", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "Editor route must render inside workspace shell");
        assert.ok(html.includes("My CV"), "Editor header title");
        assert.ok(html.includes("Save CV"), "Editor save button");
      },
    });

    // 13. Nested App Templates Route (/app/templates)
    await checkRoute("Nested App Templates Route (/app/templates)", "/app/templates", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "App templates must render inside workspace shell");
        assert.ok(html.includes("Print-Ready CV Templates"), "Templates heading");
      },
    });

    // 14. Nested App Applications Route (/app/applications)
    await checkRoute("Nested App Applications Route (/app/applications)", "/app/applications", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "App applications must render inside workspace shell");
        assert.ok(html.includes("Job Applications"), "Applications heading");
      },
    });

    // 15. Nested App Blog Index Route (/app/blog)
    await checkRoute("Nested App Blog Index Route (/app/blog)", "/app/blog", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "App blog must render inside workspace shell");
        assert.ok(html.includes("Advice for your job search"), "Blog heading");
        assert.ok(html.includes("href=\"/app/blog/tailor-your-cv-without-inventing-experience\""), "Article link must point inside /app/blog/*");
      },
    });

    // 16. Nested App Blog Article Route (/app/blog/tailor-your-cv-without-inventing-experience)
    await checkRoute(
      "Nested App Blog Article Route (/app/blog/tailor-your-cv-without-inventing-experience)",
      "/app/blog/tailor-your-cv-without-inventing-experience",
      {
        expectedStatus: 200,
        assertions: (html) => {
          assert.ok(html.includes("id=\"sidebar\""), "App blog article must render inside workspace shell");
          assert.ok(html.includes("Tailor your CV without inventing experience"), "Article title");
          assert.ok(html.includes("href=\"/app/blog\""), "Back link must point to /app/blog");
          assert.ok(html.includes("href=\"/app/editor\""), "CTA must link to /app/editor");
        },
      }
    );

    // 17. Nested App Settings AI Route (/app/settings/ai)
    await checkRoute("Nested App Settings AI Route (/app/settings/ai)", "/app/settings/ai", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "AI Settings must render inside workspace shell");
        assert.ok(html.includes("AI Provider Settings"), "AI settings heading");
      },
    });

    // 18. Nested App Toolkit Route (/app/toolkit)
    await checkRoute("Nested App Toolkit Route (/app/toolkit)", "/app/toolkit", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("id=\"sidebar\""), "Toolkit must render inside workspace shell");
        assert.ok(html.includes("Application Toolkit"), "Toolkit heading");
      },
    });

    // 19. Public Resources Hub SSR (/resources)
    await checkRoute("Public Resources Hub SSR", "/resources", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("Practical resources for your job search"), "Resources hub heading");
        assert.ok(html.includes("Tailor your CV without inventing experience"), "Guide 1 from articles.ts");
        assert.ok(html.includes("Write experience bullets that show your contribution"), "Guide 2 from articles.ts");
        assert.ok(html.includes("Check your CV before exporting to PDF"), "Guide 3 from articles.ts");
        assert.ok(html.includes("href=\"/blog/tailor-your-cv-without-inventing-experience\""), "Guide 1 must link to /blog/{slug}");
        assert.ok(html.includes("CV pre-flight checklist before you apply"), "Checklist 1 title");
        assert.ok(html.includes("Tailoring checklist: match the job without inventing facts"), "Checklist 2 title");
        assert.ok(html.includes("Application tracking checklist"), "Checklist 3 title");
        assert.ok(html.includes("href=\"/resources/cv-pre-flight\""), "Checklist 1 must link under /resources");
        assert.ok(!html.includes("id=\"sidebar\""), "Public /resources must NOT render workspace sidebar");
      },
    });

    // 20. Checklist: CV pre-flight
    await checkRoute("Resources Checklist SSR (cv-pre-flight)", "/resources/cv-pre-flight", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("CV pre-flight checklist before you apply"), "Pre-flight heading");
        assert.ok(html.includes("href=\"/app\""), "Checklist CTA must link to /app");
        assert.ok(!html.includes("id=\"sidebar\""), "Public checklist must NOT render workspace sidebar");
      },
    });

    // 21. Checklist: Tailor without inventing facts
    await checkRoute(
      "Resources Checklist SSR (tailor-without-inventing-facts)",
      "/resources/tailor-without-inventing-facts",
      {
        expectedStatus: 200,
        assertions: (html) => {
          assert.ok(
            html.includes("Tailoring checklist: match the job without inventing facts"),
            "Tailoring checklist heading"
          );
          assert.ok(html.includes("href=\"/app\""), "Checklist CTA must link to /app");
        },
      }
    );

    // 22. Checklist: Application tracking
    await checkRoute("Resources Checklist SSR (application-tracking)", "/resources/application-tracking", {
      expectedStatus: 200,
      assertions: (html) => {
        assert.ok(html.includes("Application tracking checklist"), "Tracking checklist heading");
        assert.ok(html.includes("href=\"/app\""), "Checklist CTA must link to /app");
      },
    });

    console.log("\n==================================================");
    console.log("All Public Site Slice Verification checks passed successfully!");
    console.log("==================================================");
  } catch {
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
}

main();
