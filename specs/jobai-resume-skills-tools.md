# Ticket: jobai-resume-skills-tools
Initiative: jobai-public-slice / Toolkit Expansion

## Product Anchor
JobAI Toolkit provides utility tools for job seekers. Goal: Add 9 new tools inspired by the `ResumeSkills` GitHub repository using a strictly unified layout.

## Scope
1. **Registry Expansion**: Add the following 9 tools to the Toolkit registry (e.g., `tools.ts` or `toolkit.ts`):
   - Resume ATS Optimizer
   - Resume Bullet Writer
   - Job Description Analyzer
   - Resume Tailor
   - Cover Letter Generator
   - LinkedIn Profile Optimizer
   - Interview Prep Generator
   - Cold Email Writer
   - Application Form Filler
2. **Unified Template**: All 9 tools MUST use the exact same underlying page template (e.g., `apps/web/app/routes/toolkit.$toolId.tsx` or shared `ToolLayout` component). Do NOT build 9 custom page layouts.
3. **Global Components**: Build the distinct input forms (textareas for JD/bullets, file uploads for resumes) using ONLY existing global UI components (Card, Button, Input, Textarea).
4. **Integration**: Ensure the new tools appear in the `/toolkit` hub index and route correctly.

## Out of Scope
- Backend AI processing (mock the success states or wire to generic fallback for now).
- Custom design variations per tool. 

## Acceptance
- 9 tools reachable via `/toolkit/<slug>`.
- All use the exact same responsive layout shell.
- Forms render correctly using global components.
- `npm run build` and tests pass.
