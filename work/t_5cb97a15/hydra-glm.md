# t_5cb97a15 — Unified CV Preview Component with Print Proportions

SEAT: hydra-glm | Date: 2026-09-19 | Spec: `specs/jobai-unified-cv-preview.md` (referenced, file absent from board — requirements reconstructed from task body, astra-cx comment 2026-09-19 18:04, PF01 contract in specs/jobai-print-fidelity.md r1, parent t_268033a8 handoff). Flagged in card comment.

## Approach

Single `CvPrintPreview` component (apps/web/src/components/CvPrintPreview.tsx) replacing all previews:

- Paper rendered at FIXED physical size: A4 210mm×297mm (794×1123px @96dpi), Letter 8.5in×11in (816×1056px). No `max-w` reflow, no viewport-dependent wrapping — paper width set in mm/in, `minHeight` = page height.
- Uniform fit via CSS `transform: scale(k)` computed from container width (`ResizeObserver`), `transformOrigin: top left`. Wrapper div reserves `height = paperHeight × scale` so scroll bounds match visual size.
- Keeps `id="cv-paper"`, `cv-paper`, `cv-print-target` classes → PDF export hook and print CSS unchanged contract.
- Props: `cv` only. Dead `onPrint`/`onTemplateChange` props dropped; unused `handleTemplateChange` removed from editor.tsx.
- Page-break rules (astra-cx spec update): parent t_268033a8 already ships `break-inside: avoid` for `.cv-item`/`.cv-skill-group`/section grids + `break-after: avoid` on h2/h3, scoped to `.cv-print-target` on screen and in `@media print` (styles.css:104-145). Component inherits them via `cv-print-target` class — verified present, not weakened.
- PDF capture: `applyPaperCaptureStyles` now also resets `transform: none` + `position: static` (capture at 1:1) and restore() puts the exact previous values back.
- Print CSS: `.cv-print-target` gains `transform: none !important; position: static !important;` in `@media print` so native print ignores screen scaling.

## Changed files

- NEW `apps/web/src/components/CvPrintPreview.tsx` (component)
- DEL `apps/web/src/components/Preview.tsx` (replaced)
- `apps/web/src/routes/templates.tsx` — modal uses CvPrintPreview; dropped nested white card shell (paper IS the page)
- `apps/web/src/routes/app/editor.tsx` — swap + remove dead handleTemplateChange
- `apps/web/src/routes/app/applications.tsx` — draft preview swap (in-place template picker removed with props; template change stays in Editor inspector)
- `apps/web/src/lib/cv-pdf-export.ts` — capture/restore transform+position
- `apps/web/src/styles.css` — print transform reset
- `test/editor-calm-check.js` — assertions now target CvPrintPreview.tsx (fixed mm paper, transform scale, ResizeObserver, #cv-paper, cv-print-target)

Untouched per constraint: renderer.tsx, cv-template-registry.ts, sample-cvs.ts, thumbnail.tsx. (Other dirty files in workspace — ToolPageLayout, toolkit routes, resume-skills — belong to sibling tasks, not this diff.)

Diff artifact: `work/t_5cb97a15/t_5cb97a15.patch`, sha256_16 = `b2af36f8b3ef9e7b`.

## Evidence (real Chrome, vite dev 127.0.0.1:3999, CDP)

- Editor desktop 1280px: paper offset 794×1123 (exact A4@96dpi), aspect 0.7071 = 210/297, scale matrix(0.680357).
- Narrow 390px (Preview tab): SAME layout box 794×1123 — zero reflow; only scale 0.400655.
- Letter toggle via Paper Size control: 816×1056, aspect 0.7727, width 8.5in/minHeight 11in. Scale matrix(0.661765).
- /templates modal: paper 210mm, aspect 0.7071 exact, fits container (718px ≤ 768px), 0 horizontal overflow elements. Screenshot: work/t_5cb97a15/modal-preview.png.
- PDF export path with new paper: `exportCvPaperToPdf` resolves OK; paper transform identical before/after export (matrix(0.680357) → matrix(0.680357)) — capture reset + restore verified on live DOM.
- `npm run check` PASS (0 errors), `npm run build` PASS, `npm run test` PASS (18 + 12/12 + 22/22), `node test/editor-calm-check.js` PASS, `node test/pdf-export-check.js` PASS (22/22, parent harness).

## Known pre-existing issue (NOT from this diff, verified)

Live-app PDF export throws `html2canvas: Attempting to parse an unsupported color function "oklch"` — Tailwind v4 emits `text-slate-900` etc. as oklch; html2pdf.js 0.14 cannot parse. Reproduced identically at HEAD (parent's cv-pdf-export.ts, fresh page: same error) and with my version. Parent's 22/22 harness passed because it exports a synthetic fixture with hex colors, not the live app DOM. Fix belongs to pdf-export/template owner (hex palette inside cv-print-target or oklch-parsing html2canvas fork); reported here so it is not lost.

## Remaining limits / next owner

- oklch parse failure above blocks live-DOM PDF export until separately fixed.
- Physical printer check not possible (PF03 allows browser print-to-PDF only); native print dialog behavior verified via CSS only.
- Review owner: Argus (product/UX fidelity) + Nemesis (behavior/integration), same revision b2af36f8b3ef9e7b.
