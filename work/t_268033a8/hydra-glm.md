# Work: t_268033a8 — PDF export fidelity (hydra-glm)

Initiative: jobai-public-site | Packet: specs/jobai-pdf-export-fidelity.md r1
Base revision: a860a6b (working tree, no commits) | Continues partial by rigel-cur (run 75, reclaimed; code landed uncommitted)

## Continuation note
rigel-cur landed `cv-pdf-export.ts` rewrite, styles.css page-break rules, and both test files
(work/t_268033a8/rigel-cur.md "Result: pending"). This run verified the full implementation,
produced the 20-template evidence, ran check/build/test, and completed the artifact. No
redundant rewrite; implementation below is rigel-cur's, verified and accepted by hydra-glm.

## User outcome
Export PDF yields complete, correctly sized, unclipped multi-page PDF for all 20 templates,
A4 and Letter, named `{FullName}-CV.pdf` (fallback `My-CV.pdf`). Client-side only.

## Implementation (files changed — the only edits)
- `apps/web/src/lib/cv-pdf-export.ts` (+124/−19)
  - `exportCvPaperToPdf(element, filename, paperSize)` signature unchanged — editor.tsx untouched.
  - `pagebreak: { mode: ["css","legacy"], avoid: [".cv-item",".cv-skill-group",".cv-section h2",".cv-section .grid div"] }`.
  - `prepareCvPaperForCapture`: forces exact paper width (210mm / 8.5in), kills aspect-ratio/min-height, white bg, restore via try/finally.
  - `html2canvas.onclone` re-applies capture styles in cloned doc (html2canvas clones; live DOM styles alone are insufficient).
  - `resolveCvPdfFilename`: sanitize → `{FullName}-CV.pdf`, "cv"/empty → `My-CV.pdf`.
- `apps/web/src/styles.css` (print block + screen-scoped rules)
  - `@page` A4 + named `letter` page; `page: letter` bound via `[data-pdf-paper="Letter"]`.
  - `.cv-section h2/h3 { break-after: avoid }` (headers never orphaned).
  - `.cv-item, .cv-skill-group, .cv-section .grid > div { break-inside: avoid }` (items/skill cards never split).
  - Same rules duplicated screen-scoped under `.cv-print-target` — html2pdf css-mode reads screen computed styles, not @media print.
- NEW `test/pdf-export-check.js` (d008eb0a53e56f8f): headless assertions (filename helper, options, CSS presence) then spawns tsx harness.
- NEW `test/pdf-export-templates.ts` (cf5e9922af9f5a6a): real `CvTemplateRenderer` (renderToStaticMarkup) × 20 registry IDs, long CV (6 roles × 5 bullets, education, skills, 6 sections), served over local HTTP, exported in real Chrome via CDP with the real html2pdf bundle. Asserts: %PDF- magic, >2KB, ≥2 pages, page mm match paper size.
- `work/t_268033a8/pdf-evidence.json` (cbc122140baf811a): 22 exports.

Diff hash (both source files): 459bff986eb60b2f (sha256, git diff a860a6b → worktree)

## Evidence — 22/22 green (20 A4 + modern/executive Letter)
All templates: 4 pages, 1.75–2.12 MB, exact page size (210×297 mm / 215.9×279.4 mm).
Per-template table: work/t_268033a8/pdf-evidence.json (generatedAt 2026-09-19).
Template IDs match registry exactly: academic aurora bold classic clinical compact corporate
creative designer elegant executive global legal matrix minimal modern portfolio startup tech timeline.

- `node test/pdf-export-check.js` → PASS (includes Chrome evidence run)
- `npm run check` → PASS (tsc 0 errors, extension typecheck 0 errors)
- `npm run build` → PASS (shared + web + extension)
- `npm run test` → PASS (full suite incl. extension 22/22)

## Deviations / limits
- `npm run test` (root package.json) not wired to the new pdf tests — package.json is outside
  the allowed file list (spec constraint). Run directly: `node test/pdf-export-check.js`.
- `.cv-skill-group` selector currently matches no emitted node (skill cards are `.cv-section .grid > div` in tech template; SectionBlock items are `.cv-item`). Kept: harmless, forward-compat with t_5cb97a15 (unified preview spec requires the same avoid rules).
- Letter verified on 2 template layouts + paper-size assert for both; A4 verified on all 20.
- Multi-page visual clipping judged via page count + byte size + avoid-rule assertions; pixel-level eyeball not automated. Real-Chrome evidence is the harness output, not manual screenshots.

## Handoff
Next owner: reviewer (Nemesis behavior/integration). Child t_5cb97a15 (unified preview) released by this completion; its spec comment (astra-cx) requiring break-inside: avoid is satisfied by these shared rules.
