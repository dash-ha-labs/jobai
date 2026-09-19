import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { articles } from "./content";

const articleContent: Record<string, string> = {
  "tailor-your-cv-without-inventing-experience": `# Tailor Your CV Without Inventing Experience

**Published:** January 15, 2024  
**Reading time:** 4 min

JobAI editorial — practical guidance for job seekers.

When you tailor your CV, focus on highlighting relevant experience rather than expanding it. Recruiters spot invented responsibilities quickly.

## The Right Approach

1. **Identify matching requirements** — read the job description and note required skills and experience levels
2. **Reorder your sections** — place your most relevant roles and achievements first
3. **Rephrase bullet points** — use keywords from the job description while keeping facts accurate
4. **Remove outdated info** — cut early-career roles that don't support your current target

## What Not to Do

- Don't claim responsibilities you didn't have
- Don't inflate your title or company impact
- Don't add skills you've only used briefly

## Fictional Example

Target role: Senior Product Manager

**Before (generic):**
- Managed cross-functional teams
- Delivered features on time
- Worked with engineering and design

**After (tailored, factual):**
- Led 5-person product team delivering B2B SaaS MVP, 30% faster than projected
- Collaborated with engineering (7 devs) and design (2 UX) to ship quarterly roadmap
- Defined KPIs adopted company-wide for feature success measurement

Notice how each bullet remains factual while matching the target role's expectations.`,
  "write-experience-bullets-that-show-contribution": `# Write Experience Bullets That Show Your Contribution

**Published:** January 22, 2024  
**Reading time:** 5 min

JobAI editorial — practical guidance for job seekers.

Generic bullets describe duties. Strong bullets show impact. The difference determines whether recruiters save your CV for review.

## The STAR Method, Simplified

Situation-Task-Action-Result works, but focus on the Result component:

- **What changed** — quantify the outcome
- **Your role** — specify what YOU did (not the team)
- **Scope** — mention team size, budget, or user count when relevant

## Weak vs. Strong Bullets

**Weak:**
- Responsible for user interface design
- Helped improve application performance

**Strong:**
- Redesigned checkout flow resulting in 22% higher conversion
- Optimized database queries reducing API latency from 450ms to 85ms

## Fictional Example

Target role: Backend Engineer

**Before:**
- Improved system reliability
- Collaborated on architecture decisions

**After:**
- Implemented circuit breaker pattern across 12 microservices, reducing cascading failures by 78%
- Architected event-driven order processing replacing legacy batch jobs, cutting daily reconciliation time from 4 hours to 12 minutes

Notice how each bullet remains factual while demonstrating scale and personal contribution.`,
  "check-your-cv-before-exporting-to-pdf": `# Check Your CV Before Exporting to PDF

**Published:** February 5, 2024  
**Reading time:** 3 min

JobAI editorial — practical guidance for job seekers.

Exporting to PDF too early hides formatting issues that disappear once printed. Run these final checks before finalizing.

## Critical Checks

1. **Link verification** — ensure all URLs and email addresses remain clickable
2. **Font embedding** — confirm custom fonts embed properly or use standard fonts
3. **Page breaks** — check section headings don't appear at bottom of page alone
4. **Metadata** — remove personal file paths from document properties

## Quick Visual Inspection

Print to PDF and open in a fresh viewer:
- Read at 150% zoom — small typos and spacing issues appear
- Read aloud — sentences that sound awkward in speech stand out
- Check contrast — light gray text may disappear on some printers

## What Gets Fixed Later

| Issue | Visible in PDF? | Fix required |
|-------|-----------------|--------------|
| Broken links | No | Edit source file |
| Font substitution | Yes | Embed fonts or change |
| Column overflow | Yes | Adjust widths |
| Page headers/footers | Sometimes | Re-check page setup |

## Fictional Example

**Problem found during final check:**
- LinkedIn URL truncated to 2 lines in footer
- Custom branding font missing on client machine
- Two-page CV with 1-inch margin wasting 25% space

**Fixed before export:**
- Shortened URL with link shortener (disclosed)
- Switched to system fonts with fallback
- Reduced margins to 0.75 inch, kept to one page

These fixes won't show in the source file until rendered as PDF.`,
};

export const Route = createFileRoute("/blog/$slug")({
  component: BlogSlug,
  notFoundComponent: BlogNotFound,
});

function BlogSlug() {
  const { slug } = Route.useParams();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const article = articles.find((a) => a.slug === slug);
  const content = article ? articleContent[slug] : null;

  if (!article || !content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6"
          >
            <span className="mr-2">←</span> Back to blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          <div className="flex items-center text-sm text-gray-500 mb-8 space-x-4">
            <time>{article.date}</time>
            <span>•</span>
            <span>{article.readTime}</span>
          </div>
          <article className="prose max-w-none">
            <div className="prose-lg prose-gray">{content}</div>
          </article>
        </motion.div>
      </div>
    </div>
  );
}

function BlogNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Article not found
        </h1>
        <p className="text-gray-600 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/blog"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to blog
        </Link>
      </div>
    </div>
  );
}
