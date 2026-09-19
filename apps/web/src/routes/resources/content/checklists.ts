export interface Checklist {
  slug: string;
  title: string;
  excerpt: string;
  lead: string;
  sections: Array<{
    heading: string;
    intro?: string;
    items: string[];
  }>;
}

export const checklists: Checklist[] = [
  {
    slug: "cv-pre-flight",
    title: "CV pre-flight checklist before you apply",
    excerpt:
      "A last-pass list for contact details, consistent facts, file naming, and the copy you are about to send — before you attach anything.",
    lead:
      "Use this once you have a draft you intend to send. It is a short inspection, not a rewrite. The aim is to catch contradictions, missing contact paths, and the wrong file — not to invent a stronger story.",
    sections: [
      {
        heading: "Facts and identity",
        intro: "Callers and application forms should match the document you attach.",
        items: [
          "Your name, email, and phone number are current and match the application form.",
          "The email is one you actually check; a forgotten student address is a common miss.",
          "Location or work-authorisation lines, if you include them, are still true.",
          "Employment dates, titles, and employer names do not contradict your LinkedIn or the form you just filled.",
          "If you list a portfolio, GitHub, or personal site, the URL opens and shows the work you claim.",
        ],
      },
      {
        heading: "The version you are sending",
        items: [
          "This file is the tailored draft for this job, not an older generic export sitting in Downloads.",
          "Your master CV is still intact. A tailored send should not overwrite the full history you keep locally.",
          "The filename is readable to a stranger (your name and the role or company), not Draft3-final-FINAL.pdf.",
          "If you added a cover note or form answers, they use the same facts as the CV — same dates, same title, same tools.",
        ],
      },
      {
        heading: "Readability before attach",
        intro: "You do not need a special ATS score. You do need a document a person can open and read.",
        items: [
          "Open the actual PDF (or the exported file you will attach) in a normal viewer, not only the editor preview.",
          "Section headings sit with their content; nothing important is stranded alone at a page break.",
          "Links in the file, if any, open the intended page.",
          "You have read the posting once more and can say, in a sentence, why this draft is for that role.",
        ],
      },
    ],
  },
  {
    slug: "tailor-without-inventing-facts",
    title: "Tailoring checklist: match the job without inventing facts",
    excerpt:
      "Reorder and rephrase what you actually did so the hiring team can find it. Do not add tools, titles, or outcomes you cannot defend.",
    lead:
      "Tailoring is selection and wording, not invention. If a requirement is not in your history, leave it off and be ready to talk about the closest real work instead.",
    sections: [
      {
        heading: "Read the posting against real work",
        items: [
          "Mark only the duties, tools, and outcomes you have actually done. Adjacent work stays adjacent — do not upgrade it.",
          "If the posting names a tool you have only seen in passing, do not put it in Skills. Mention related tools you used, if they are true.",
          "Note the two or three requirements you can evidence. Those belong near the top of the relevant roles.",
          "If you cannot evidence a must-have, do not invent it. Decide whether you still apply on the strength of what is real.",
        ],
      },
      {
        heading: "Edit the draft, not your biography",
        items: [
          "Keep a master document with the full history. Duplicate it for this application; do not delete real roles to make a prettier story.",
          "Move the most relevant bullets and projects up. Drop early or unrelated lines that dilute the match.",
          "Rephrase with the posting’s ordinary vocabulary only where it still describes your work. Do not paste their sentences into your experience.",
          "Do not change job titles, team size, budget, or ownership to look closer to the spec.",
          "Quantify only numbers you could explain if asked. If you do not remember the figure, describe the work without a fake metric.",
        ],
      },
      {
        heading: "Before you send",
        items: [
          "Read the draft aloud. Anything you would have to walk back in an interview comes out now.",
          "Save a copy of the version you sent, named for this company, so you know what they have.",
          "If JobAI (or any assistant) suggested wording, you still own every claim. Remove anything you cannot stand behind.",
        ],
      },
    ],
  },
  {
    slug: "application-tracking",
    title: "Application tracking checklist",
    excerpt:
      "Keep a simple record of what you sent, which CV version went with it, and when you last heard back — so follow-ups are based on facts you wrote down.",
    lead:
      "You do not need a CRM. You need a list you will actually update. Record enough to answer: what did I send, to whom, and what happens next.",
    sections: [
      {
        heading: "Log each send on the day you apply",
        items: [
          "Company, role title, and the URL or requisition ID from the posting.",
          "Date you submitted, and the channel (company site, agency, referral, or listing board).",
          "Which CV file you attached (filename is enough) and whether a cover note went with it.",
          "The name and email of a recruiter or hiring contact if the posting or confirmation gave one.",
          "Any stated timeline (“we aim to reply in two weeks”) copied as written — not a guessed industry average.",
        ],
      },
      {
        heading: "Keep drafts separate from the master",
        items: [
          "Store tailored files next to the log entry, not as the only copy of your career history.",
          "If you reuse a tailored draft for a similar role, note that it was reused so you remember what that employer saw.",
          "When a posting closes or you withdraw, mark the row. An open list of zombie applications is not a plan.",
        ],
      },
      {
        heading: "Follow up from the record, not from memory",
        items: [
          "If they published a timeline, wait for it before nudging. If they did not, one polite check after a stretch that feels long to you is enough; there is no universal day-count that guarantees a reply.",
          "When you follow up, mention the role title and date from your log so you are not reconstructing from inbox search.",
          "Record the outcome: interview, rejection, no reply, or withdrawn. That is how you stop applying into a closed loop.",
          "After an interview, add who you spoke with and any facts you promised to send. Then send only those facts.",
        ],
      },
    ],
  },
];

export function getChecklistBySlug(slug: string): Checklist | undefined {
  return checklists.find((item) => item.slug === slug);
}
