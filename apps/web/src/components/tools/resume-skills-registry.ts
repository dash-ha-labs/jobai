export type ResumeSkillsField = {
  id: string;
  label: string;
  type: "textarea" | "text" | "file";
  placeholder?: string;
  rows?: number;
  required?: boolean;
  accept?: string;
};

export type ResumeSkillsToolDef = {
  slug: string;
  name: string;
  short: string;
  description: string;
  howItWorks: { title: string; body: string }[];
  fields: ResumeSkillsField[];
  generate: (values: Record<string, string>) => string;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function excerpt(text: string, max = 120) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export const RESUME_SKILLS_SLUGS = [
  "resume-ats-optimizer",
  "resume-bullet-writer",
  "job-description-analyzer",
  "resume-tailor",
  "cover-letter-generator",
  "linkedin-profile-optimizer",
  "interview-prep-generator",
  "cold-email-writer",
  "application-form-filler",
] as const;

export type ResumeSkillsSlug = (typeof RESUME_SKILLS_SLUGS)[number];

export const RESUME_SKILLS_TOOLS: ResumeSkillsToolDef[] = [
  {
    slug: "resume-ats-optimizer",
    name: "Resume ATS Optimizer",
    short: "ATS Optimizer",
    description:
      "Paste your resume and an optional job description to get a quick ATS-oriented checklist: keyword overlap, section cues, and formatting risks — preview only, no upload to servers.",
    howItWorks: [
      {
        title: "Paste resume text",
        body: "Use plain text from your editor or the PDF Text Preview tool. ATS parsers read text, not layout.",
      },
      {
        title: "Add target JD (optional)",
        body: "When provided, important terms from the posting are compared against your resume text.",
      },
      {
        title: "Review checklist",
        body: "Deterministic heuristics flag missing sections, thin keyword overlap, and risky characters — not a hiring guarantee.",
      },
    ],
    fields: [
      {
        id: "resume",
        label: "Resume text",
        type: "textarea",
        rows: 8,
        required: true,
        placeholder: "Paste your resume as plain text…",
      },
      {
        id: "jd",
        label: "Job description (optional)",
        type: "textarea",
        rows: 5,
        placeholder: "Paste the job posting…",
      },
    ],
    generate: (v) => {
      const resume = v.resume?.trim() ?? "";
      const jd = v.jd?.trim() ?? "";
      const sections = ["experience", "education", "skills"].filter((s) =>
        resume.toLowerCase().includes(s),
      );
      const jdWords = jd
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((w) => w.length > 4);
      const unique = [...new Set(jdWords)].slice(0, 12);
      const hits = unique.filter((w) => resume.toLowerCase().includes(w));
      return [
        "## ATS preview (local heuristic)",
        "",
        `- Resume length: ~${wordCount(resume)} words`,
        `- Section cues found: ${sections.length ? sections.join(", ") : "none — add clear headings (Experience, Education, Skills)"}`,
        jd
          ? `- JD keyword overlap: ${hits.length}/${unique.length} sampled terms (${hits.slice(0, 6).join(", ") || "none yet"})`
          : "- Add a job description to score keyword overlap.",
        "- Tip: avoid tables, text boxes, and header-only contact lines in the text layer.",
        "",
        "_Full AI rewriting is not wired in this preview — connect your JobAI API key in settings when available._",
      ].join("\n");
    },
  },
  {
    slug: "resume-bullet-writer",
    name: "Resume Bullet Writer",
    short: "Bullet Writer",
    description:
      "Turn a role and rough notes into structured bullet drafts using the action + scope + result pattern — instant local preview.",
    howItWorks: [
      {
        title: "Describe the role",
        body: "Title and team context help the draft use relevant verbs and scope.",
      },
      {
        title: "Add rough notes",
        body: "Messy notes are fine — metrics, tools, and outcomes improve the draft.",
      },
      {
        title: "Copy bullets",
        body: "Edit the preview bullets before adding them to your CV in the editor.",
      },
    ],
    fields: [
      {
        id: "role",
        label: "Role title",
        type: "text",
        required: true,
        placeholder: "e.g. Senior Backend Engineer",
      },
      {
        id: "notes",
        label: "Notes / accomplishments",
        type: "textarea",
        rows: 6,
        required: true,
        placeholder: "What you built, improved, or led — include numbers if you have them…",
      },
    ],
    generate: (v) => {
      const role = v.role?.trim() || "your role";
      const notes = excerpt(v.notes ?? "", 200);
      return [
        "## Draft bullets (template)",
        "",
        `• Delivered measurable outcomes as **${role}** — ${notes || "add specific scope and metrics."}`,
        `• Partnered with cross-functional stakeholders to ship priorities tied to ${role.toLowerCase()} goals.`,
        `• Improved reliability and clarity of deliverables; quantify impact (%, $, time saved) before publishing.`,
        "",
        "_Replace bold placeholders and merge with your master CV facts in JobAI._",
      ].join("\n");
    },
  },
  {
    slug: "job-description-analyzer",
    name: "Job Description Analyzer",
    short: "JD Analyzer",
    description:
      "Break a job posting into themes, must-have skills, and seniority signals with a fast local parse — no account required.",
    howItWorks: [
      {
        title: "Paste the posting",
        body: "Include responsibilities and requirements for better skill extraction.",
      },
      {
        title: "Scan themes",
        body: "Repeated nouns and requirement lines are grouped into a short summary.",
      },
      {
        title: "Tailor next",
        body: "Use Resume Tailor or your editor to align bullets with highlighted themes.",
      },
    ],
    fields: [
      {
        id: "jd",
        label: "Job description",
        type: "textarea",
        rows: 10,
        required: true,
        placeholder: "Paste the full job description…",
      },
    ],
    generate: (v) => {
      const jd = v.jd?.trim() ?? "";
      const lines = jd.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const req = lines.filter((l) => /^(\d+\.|[-•*])\s|required|must have/i.test(l)).slice(0, 5);
      const skills = [...new Set(
        jd
          .toLowerCase()
          .match(/\b(react|typescript|python|aws|kubernetes|sql|leadership|communication|node\.?js|go|java)\b/g) ?? [],
      )];
      return [
        "## JD snapshot",
        "",
        `- Lines parsed: ${lines.length}`,
        `- Likely skills mentioned: ${skills.length ? skills.join(", ") : "add more technical terms to detect"}`,
        req.length
          ? `- Requirement-style lines:\n${req.map((l) => `  - ${l}`).join("\n")}`
          : "- No bullet requirements detected — check you pasted the full posting.",
        "",
        "_AI summarization can be connected later; this preview stays on-device._",
      ].join("\n");
    },
  },
  {
    slug: "resume-tailor",
    name: "Resume Tailor",
    short: "Resume Tailor",
    description:
      "Compare resume text to a job description and surface gaps, aligned bullets to emphasize, and keywords to weave in — preview workflow for tailoring.",
    howItWorks: [
      {
        title: "Paste master resume",
        body: "Start from truthful master facts — tailoring should not invent experience.",
      },
      {
        title: "Paste target JD",
        body: "The tool highlights overlap and missing themes between the two texts.",
      },
      {
        title: "Edit in JobAI",
        body: "Use the extension or editor to produce a job-specific draft from your master CV.",
      },
    ],
    fields: [
      {
        id: "resume",
        label: "Resume text",
        type: "textarea",
        rows: 8,
        required: true,
        placeholder: "Paste your current resume text…",
      },
      {
        id: "jd",
        label: "Job description",
        type: "textarea",
        rows: 6,
        required: true,
        placeholder: "Paste the job you are targeting…",
      },
    ],
    generate: (v) => {
      const resume = v.resume?.trim() ?? "";
      const jd = v.jd?.trim() ?? "";
      const jdTerms = [...new Set(
        jd.toLowerCase().split(/[^a-z0-9+#]+/).filter((w) => w.length > 5),
      )].slice(0, 15);
      const missing = jdTerms.filter((t) => !resume.toLowerCase().includes(t)).slice(0, 8);
      return [
        "## Tailoring preview",
        "",
        `- Shared focus: emphasize bullets that mention ${jdTerms.slice(0, 4).join(", ") || "core JD themes"}`,
        missing.length
          ? `- Terms in JD not seen in resume sample: ${missing.join(", ")}`
          : "- Good overlap on sampled JD terms — still verify each bullet is truthful.",
        "- Suggested action: reorder top 3 bullets to mirror the posting’s top responsibilities.",
        "",
        "_Automated rewrite requires AI settings; this page only guides your edits._",
      ].join("\n");
    },
  },
  {
    slug: "cover-letter-generator",
    name: "Cover Letter Generator",
    short: "Cover Letter",
    description:
      "Draft a concise cover letter outline from your highlights, company, and role — local template you can refine before sending.",
    howItWorks: [
      {
        title: "Add highlights",
        body: "Pull 2–3 proof points from your resume — metrics beat generic enthusiasm.",
      },
      {
        title: "Company + role",
        body: "Personalize the opening line; avoid duplicate templates recruiters recognize.",
      },
      {
        title: "Export mentally",
        body: "Copy the preview into email or a document; keep under one page.",
      },
    ],
    fields: [
      {
        id: "highlights",
        label: "Resume highlights",
        type: "textarea",
        rows: 5,
        required: true,
        placeholder: "2–3 accomplishments you want to lead with…",
      },
      {
        id: "company",
        label: "Company",
        type: "text",
        required: true,
        placeholder: "Company name",
      },
      {
        id: "role",
        label: "Role",
        type: "text",
        required: true,
        placeholder: "Role you are applying for",
      },
      {
        id: "jd",
        label: "Job description (optional)",
        type: "textarea",
        rows: 4,
        placeholder: "Optional — used to mirror their language",
      },
    ],
    generate: (v) => {
      const company = v.company?.trim() || "the team";
      const role = v.role?.trim() || "this role";
      const hi = excerpt(v.highlights ?? "", 160);
      return [
        `Dear hiring team at ${company},`,
        "",
        `I am applying for the ${role} position. ${hi}`,
        "",
        "In my recent work I focus on outcomes that map to your posting: shipping reliably, collaborating across functions, and communicating trade-offs clearly.",
        "",
        "I would welcome a conversation about how my background fits your roadmap.",
        "",
        "Best regards,",
        "[Your name]",
        "",
        "_AI-polished letters can be enabled later; edit this draft for accuracy._",
      ].join("\n");
    },
  },
  {
    slug: "linkedin-profile-optimizer",
    name: "LinkedIn Profile Optimizer",
    short: "LinkedIn Optimizer",
    description:
      "Paste your LinkedIn About + headline text for a readability and keyword scan aligned with recruiter search patterns.",
    howItWorks: [
      {
        title: "Paste profile text",
        body: "Headline, About, and top experience lines work best.",
      },
      {
        title: "Check scanability",
        body: "Short paragraphs and concrete skills improve search and skim reading.",
      },
      {
        title: "Sync with CV",
        body: "Keep facts consistent with your JobAI master CV.",
      },
    ],
    fields: [
      {
        id: "profile",
        label: "Profile text",
        type: "textarea",
        rows: 10,
        required: true,
        placeholder: "Headline, About section, and key experience lines…",
      },
    ],
    generate: (v) => {
      const profile = v.profile?.trim() ?? "";
      const wc = wordCount(profile);
      const hasMetrics = /\d+%|\$\d|\d+\+/.test(profile);
      return [
        "## LinkedIn scan (local)",
        "",
        `- Length: ~${wc} words`,
        `- Metrics present: ${hasMetrics ? "yes" : "consider adding 1–2 quantified outcomes"}`,
        `- Paragraphs: ${profile.split(/\n\n+/).filter(Boolean).length} — aim for 2–4 short blocks in About`,
        "- Headline tip: lead with role + specialty + outcome (≤ 220 characters).",
        "",
        "_Profile rewriting via AI is not enabled in this preview._",
      ].join("\n");
    },
  },
  {
    slug: "interview-prep-generator",
    name: "Interview Prep Generator",
    short: "Interview Prep",
    description:
      "Generate a starter question list and talking points from a job description and your resume notes — practice locally.",
    howItWorks: [
      {
        title: "Add the JD",
        body: "Responsibilities drive behavioral and technical question themes.",
      },
      {
        title: "Add resume cues",
        body: "Each claim in your CV should have a STAR-style story ready.",
      },
      {
        title: "Practice aloud",
        body: "Use the list as a script, not a verbatim answer bank.",
      },
    ],
    fields: [
      {
        id: "jd",
        label: "Job description",
        type: "textarea",
        rows: 6,
        required: true,
        placeholder: "Paste the job description…",
      },
      {
        id: "resume",
        label: "Resume notes (optional)",
        type: "textarea",
        rows: 5,
        placeholder: "Bullets you expect to discuss…",
      },
    ],
    generate: (v) => {
      const roleHint = excerpt(v.jd ?? "", 80);
      return [
        "## Practice questions (starter set)",
        "",
        "1. Tell me about a project most relevant to this role.",
        "2. Describe a time you disagreed with a teammate — what happened?",
        `3. How would you approach the first 30 days in a role like: ${roleHint || "this position"}?`,
        "4. Walk through a technical decision you would revisit and what you learned.",
        "5. What questions do you have for us about team priorities?",
        "",
        "_Pair with your JobAI master CV so stories stay consistent._",
      ].join("\n");
    },
  },
  {
    slug: "cold-email-writer",
    name: "Cold Email Writer",
    short: "Cold Email",
    description:
      "Outline a short outreach email for networking or recruiting contact — local template with your background and ask.",
    howItWorks: [
      {
        title: "Who and why",
        body: "Name the recipient context (team, product, mutual connection).",
      },
      {
        title: "Your hook",
        body: "One credible line on what you have built or researched.",
      },
      {
        title: "Clear ask",
        body: "15-minute chat, referral, or feedback — keep it specific and small.",
      },
    ],
    fields: [
      {
        id: "recipient",
        label: "Recipient / context",
        type: "text",
        required: true,
        placeholder: "e.g. Engineering manager, Acme — met at meetup",
      },
      {
        id: "background",
        label: "Your background",
        type: "textarea",
        rows: 4,
        required: true,
        placeholder: "One paragraph on relevant experience…",
      },
      {
        id: "ask",
        label: "Your ask",
        type: "textarea",
        rows: 2,
        required: true,
        placeholder: "e.g. 15-minute call about platform team culture",
      },
    ],
    generate: (v) => {
      const recipient = v.recipient?.trim() || "there";
      const bg = excerpt(v.background ?? "", 140);
      const ask = v.ask?.trim() || "a brief conversation";
      return [
        `Subject: Quick question — ${recipient}`,
        "",
        `Hi ${recipient.split(",")[0] || "there"},`,
        "",
        bg,
        "",
        `Would you be open to ${ask}? Happy to work around your schedule.`,
        "",
        "Thank you,",
        "[Your name]",
      ].join("\n");
    },
  },
  {
    slug: "application-form-filler",
    name: "Application Form Filler",
    short: "Form Filler",
    description:
      "Map resume text to common application fields (headline, summary, skills) for copy-paste into employer portals — no auto-submit.",
    howItWorks: [
      {
        title: "Paste resume",
        body: "Plain text works best; keep facts identical to your master CV.",
      },
      {
        title: "Paste form prompts",
        body: "List the textarea labels from the employer site.",
      },
      {
        title: "Copy answers",
        body: "Use suggested snippets; review each field before submitting externally.",
      },
    ],
    fields: [
      {
        id: "resume",
        label: "Resume text",
        type: "textarea",
        rows: 8,
        required: true,
        placeholder: "Paste resume text…",
      },
      {
        id: "form",
        label: "Form fields / questions",
        type: "textarea",
        rows: 5,
        required: true,
        placeholder: "Paste labels, e.g. Summary, Why this company?, LinkedIn URL…",
      },
    ],
    generate: (v) => {
      const resume = v.resume?.trim() ?? "";
      const form = v.form?.trim() ?? "";
      const firstLine = resume.split(/\n/).map((l) => l.trim()).find(Boolean) ?? "Candidate";
      const summary = excerpt(resume, 280);
      const fields = form.split(/\n/).map((l) => l.trim()).filter(Boolean);
      return [
        "## Suggested copy blocks",
        "",
        `**Headline / name line:** ${firstLine}`,
        "",
        `**Short summary:** ${summary}`,
        "",
        fields.length
          ? fields.map((f) => `**${f}:** Pull 2–3 sentences from your resume that match “${f}”.`).join("\n")
          : "Add form field labels to get per-field hints.",
        "",
        "_This tool does not submit forms or store data — copy manually into the employer site._",
      ].join("\n");
    },
  },
];

export function getResumeSkillsTool(slug: string): ResumeSkillsToolDef | undefined {
  return RESUME_SKILLS_TOOLS.find((t) => t.slug === slug);
}

export function resumeSkillsToolRoute(slug: ResumeSkillsSlug) {
  return `/toolkit/${slug}`;
}
