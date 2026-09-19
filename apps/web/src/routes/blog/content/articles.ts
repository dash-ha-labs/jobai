export interface Article {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  excerpt: string;
  lead: string;
  colorTheme: "lavender" | "sage" | "sand";
  tip: {
    title: string;
    content: string;
  };
  sections: Array<{
    heading: string;
    paragraphs?: string[];
    orderedItems?: Array<{ label: string; text: string }>;
    unorderedItems?: string[];
    fictionalExample?: {
      targetRole: string;
      before: { label: string; items: string[] };
      after: { label: string; items: string[] };
      note?: string;
    };
    table?: {
      headers: string[];
      rows: string[][];
    };
  }>;
}

export const articles: Article[] = [
  {
    slug: "tailor-your-cv-without-inventing-experience",
    title: "Tailor your CV without inventing experience",
    category: "CV Strategy",
    readTime: "4 min read",
    date: "JobAI Editorial",
    excerpt: "Align your genuine experience with job requirements through targeted phrasing and section ordering, without exaggerating responsibilities.",
    lead: "When tailoring your CV for a specific position, focus on bringing forward your most relevant achievements rather than expanding duties beyond what happened. Recruiters spot invented responsibilities quickly, but appreciate clear alignment with their core requirements.",
    colorTheme: "lavender",
    tip: {
      title: "Practical Tip",
      content: "Keep a single master document containing your full career history. When preparing an application draft, curate and condense what is relevant rather than inventing new claims from scratch.",
    },
    sections: [
      {
        heading: "The right approach to tailoring",
        paragraphs: [
          "Tailoring is an exercise in prioritization and clarity, not creative fiction. An effective tailored CV uses the vocabulary of the hiring team to describe real accomplishments.",
        ],
        orderedItems: [
          {
            label: "Identify matching requirements",
            text: "Read the target job description carefully. Mark required technical skills, team collaboration patterns, and scope expectations.",
          },
          {
            label: "Reorder your sections",
            text: "Place your most relevant projects and responsibilities near the top of each role. Lead with the experience that directly addresses their needs.",
          },
          {
            label: "Rephrase bullet points truthfully",
            text: "Use standard terminology from the target industry to describe what you already did, without claiming tools or outcomes you were not involved in.",
          },
          {
            label: "Prune distracting details",
            text: "Remove early-career roles, deprecated tools, or unrelated side duties that dilute the focus of your application.",
          },
        ],
      },
      {
        heading: "What to avoid",
        paragraphs: [
          "It is tempting to mirror every keyword from a job posting, but over-tailoring damages credibility during subsequent interview stages.",
        ],
        unorderedItems: [
          "Do not claim individual ownership of team-wide deliverables",
          "Do not inflate your job title, direct reports, or managed budget",
          "Do not list tools, libraries, or frameworks you have only explored casually",
          "Do not copy full phrases verbatim from the job description into your experience",
        ],
      },
      {
        heading: "Fictional example: Generic vs. Tailored",
        paragraphs: [
          "The following fictional comparison illustrates how the same factual product experience can be communicated with higher relevance without introducing false claims.",
        ],
        fictionalExample: {
          targetRole: "Senior Product Manager — Fictional Example",
          before: {
            label: "Before (Generic)",
            items: [
              "Managed cross-functional product teams",
              "Delivered software features on time",
              "Collaborated with engineering and UX design",
            ],
          },
          after: {
            label: "After (Tailored, Factual)",
            items: [
              "Led 5-person product team delivering B2B SaaS MVP 30% faster than projected timeline",
              "Partnered with engineering (7 engineers) and UX (2 designers) to ship quarterly roadmap deliverables",
              "Defined core product KPIs adopted across the business unit for release evaluation",
            ],
          },
          note: "Notice how the tailored version adds specific scope, team size, and outcome metrics while remaining faithful to the original responsibilities.",
        },
      },
    ],
  },
  {
    slug: "write-experience-bullets-that-show-contribution",
    title: "Write experience bullets that show your contribution",
    category: "Writing Guide",
    readTime: "5 min read",
    date: "JobAI Editorial",
    excerpt: "Transform passive task lists into clear statements of personal impact, scope, and measurable outcomes that hiring managers remember.",
    lead: "Generic bullet points describe routine day-to-day duties. Strong bullets explain the tangible difference your work made. That distinction frequently determines whether an application proceeds to an introductory conversation.",
    colorTheme: "sage",
    tip: {
      title: "Practical Tip",
      content: "Begin every bullet with a strong action verb (such as architected, automated, coordinated, or negotiated) instead of passive formulations like 'responsible for' or 'assisted with'.",
    },
    sections: [
      {
        heading: "The STAR method, simplified",
        paragraphs: [
          "The classic Situation-Task-Action-Result framework is useful, but resumes work best when you emphasize the Action and Result components in a single punchy line.",
        ],
        orderedItems: [
          {
            label: "What changed",
            text: "State the quantifiable or qualitative outcome: time saved, latency reduced, revenue supported, or team velocity improved.",
          },
          {
            label: "Your specific contribution",
            text: "Clarify what you designed, built, or led, rather than hiding behind passive group phrasing.",
          },
          {
            label: "Context and scale",
            text: "Incorporate meaningful context such as team size, codebase complexity, user scale, or operating environment.",
          },
        ],
      },
      {
        heading: "Contrasting weak and strong bullets",
        paragraphs: [
          "Compare these common resume statements with their impact-oriented revisions:",
        ],
        unorderedItems: [
          "Weak: Responsible for user interface design. → Strong: Redesigned checkout workflow, decreasing form abandonments and boosting completion rate by 18%.",
          "Weak: Helped improve application performance. → Strong: Profiled database queries and implemented redis caching, reducing API latency from 420ms to 75ms.",
          "Weak: Handled customer onboarding requests. → Strong: Built standardized onboarding template adopted by 4 team members, cutting setup time from 3 days to 4 hours.",
        ],
      },
      {
        heading: "Fictional example: Engineering role",
        paragraphs: [
          "Here is how an engineer can articulate architectural achievements truthfully:",
        ],
        fictionalExample: {
          targetRole: "Backend Engineer — Fictional Example",
          before: {
            label: "Before (Duty-Focused)",
            items: [
              "Maintained backend services and microservices",
              "Participated in system architecture and reliability discussions",
              "Wrote automated tests and ran deployments",
            ],
          },
          after: {
            label: "After (Impact-Focused)",
            items: [
              "Implemented circuit-breaker pattern across 12 distributed services, cutting cascading downtime incidents by 78%",
              "Architected event-driven order processing replacing legacy nightly batch jobs, reducing daily data sync from 4 hours to 12 minutes",
              "Introduced end-to-end integration test suite, preventing critical checkout regressions across 6 major releases",
            ],
          },
          note: "Every bullet clearly articulates personal ownership, technical mechanism, and concrete operational benefit.",
        },
      },
    ],
  },
  {
    slug: "check-your-cv-before-exporting-to-pdf",
    title: "Check your CV before exporting to PDF",
    category: "Export & Review",
    readTime: "3 min read",
    date: "JobAI Editorial",
    excerpt: "Catch truncated links, font substitutions, and awkward page breaks before sending your application to recruiters.",
    lead: "A CV layout that looks balanced on screen can develop surprising visual defects once exported to PDF. Running a disciplined five-minute pre-flight review prevents formatting flaws from distracting reviewers.",
    colorTheme: "sand",
    tip: {
      title: "Practical Tip",
      content: "Open your exported PDF in a standalone PDF viewer at 150% zoom. Read every line aloud: typographical errors and unnatural cadence become immediately obvious.",
    },
    sections: [
      {
        heading: "Critical pre-flight checks",
        paragraphs: [
          "Before submitting or attaching your document, verify these four essential dimensions:",
        ],
        orderedItems: [
          {
            label: "Clickable link verification",
            text: "Click every link (LinkedIn profile, portfolio, GitHub, contact email) inside the actual PDF to confirm they open the intended destination without truncation.",
          },
          {
            label: "Font rendering and embedding",
            text: "Ensure clean standard typography so text renders sharply across macOS, Windows, Linux, and mobile PDF viewers without unexpected substitution.",
          },
          {
            label: "Page boundaries and orphan headings",
            text: "Check that section headings never appear isolated at the bottom of page one with their accompanying content pushed to page two.",
          },
          {
            label: "Document metadata review",
            text: "Inspect the PDF document properties to ensure your export does not leak internal machine file paths or outdated working titles.",
          },
        ],
      },
      {
        heading: "Pre-export inspection checklist",
        paragraphs: [
          "Use this quick reference table during your final proofreading pass:",
        ],
        table: {
          headers: ["Inspection Area", "Common Failure Mode", "Recommended Fix"],
          rows: [
            ["Hyperlinks", "Broken URL query or missing mailto: protocol", "Test links directly in fresh PDF reader window"],
            ["Page Budget", "Single stray sentence overflowing onto page 2", "Adjust line-height, tighten margins, or trim 1-2 words"],
            ["Visual Contrast", "Faint gray metadata invisible on printed paper", "Use high-contrast neutral tones (#292a27 / #5a5b54)"],
            ["Section Flow", "Skills list separated across page break", "Keep related bullet points grouped within section bounds"],
          ],
        },
      },
      {
        heading: "Fictional example: Pre-flight findings",
        paragraphs: [
          "A realistic example of minor export defects caught during final inspection:",
        ],
        fictionalExample: {
          targetRole: "Designer & Writer — Fictional Example",
          before: {
            label: "Identified in Initial PDF",
            items: [
              "Portfolio URL wrapped awkwardly across two lines in footer",
              "Two-page draft had only three bullet points spilling onto page two",
              "Heading for 'Technical Skills' sat alone at the bottom of first page",
            ],
          },
          after: {
            label: "Resolved Before Submission",
            items: [
              "Shortened portfolio display label to clean domain handle",
              "Tightened vertical section spacing to fit clean, balanced single page",
              "Kept 'Technical Skills' heading unified with its bullet items",
            ],
          },
          note: "Taking two minutes to address export quirks protects the first impression of your application.",
        },
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
