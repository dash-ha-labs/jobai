# Work: t_672511a4 — atlas-cur
Initiative: jobai-public-site | Packet revision: jobai-20-templates r1
Base revision: workspace HEAD (detached) | Submitted revision/diff: uncommitted (template slice)
Serving model: unknown

## Before implementation
Twenty CV layouts for galleries/editor with PDF export. Internal registry + DOM renderers; user sees templates and Export PDF only.

## Result
- `packages/shared/src/cv-template-registry.ts` — 20 templates (category, layout, pdfFamily)
- `apps/web/src/lib/cv-templates/*` — DOM layouts + thumbnails
- `apps/web/src/lib/cv-pdf-export.ts` — html2pdf from `#cv-paper`
- Preview, Editor, templates route, editor export, server config/pdf updated

## Evidence
| Criterion | Result |
|---|---|
| 20 templates | `CV_TEMPLATES.length === 20` (built shared) |
| `npm run check` | pass |
| `npm run build` | fail — missing `@rolldown/binding-darwin-universal` (env) |
| Browser PDF/gallery | not run |

## Handoff
Server PDF uses pdfFamily mapping (not pixel WYSIWYG for all 20). Client export is WYSIWYG. Next: reviewers; fix rolldown binding for build.
