# Work: t_bc00d5ea — atlas-cur
Initiative: jobai-public-site | Packet revision: jobai-20-templates-repair r1 | Brief/plan revisions: (packet anchor only)
Base revision: e3b3b84 + t_672511a4 workspace | Submitted revision/diff: uncommitted; renderer `17b0336d…`, editor-calm-check `08d29e54…`
Serving model: composer-2.5

## Before implementation
**User outcome:** Selecting any of the 20 CV templates in the editor preview shows that template’s real layout (not a silent Modern fallback); PDF export still captures the visible DOM.

**Journey position:** Bounded repair after Nemesis FAIL on renderer switch — supports truthful template choice in edit/export, not new gallery or registry work.

**User-visible / internal boundary:** User sees distinct layouts per template ID and unchanged Export PDF action. Internal: `CvTemplateRenderer` maps registry `layout` (+ `matrix` variant on `tech`) to existing React components; calm-check asserts registry/renderer wiring.

**Approach:** Confirm Nemesis findings against `renderer.tsx`; wire all registry layouts and matrix variant (already present in workspace); refresh `editor-calm-check.js` for `CV_TEMPLATES` + static renderer coverage; clean `npm install` (single install after killing concurrent installs); run check/test/build. Minimal unpdf `TextItem` map typing fix only because `npm run check` failed on unrelated `pdf-text*` after reinstall.

**Dependencies checked:** `packages/shared/src/cv-template-registry.ts`, `Preview.tsx` → `CvTemplateRenderer`, `editor.tsx` `handleExportPdf` + Export PDF UI.

**Capability gap:** None. Editor preview distinctness verified via contract tests (automation PDF for all 20 IDs); no live browser spot-check of DOM layout chrome.

## Result
| File | Change |
|---|---|
| `apps/web/src/lib/cv-templates/renderer.tsx` | Full switch: `executive`, `tech` (matrix variant), `compact`, `creative`, `academic`, `banner`, `minimal`, `bold`, `elegant`, `international`, plus existing extended layouts; default `modern`. (Untracked from t_672511a4; verified complete for this repair.) |
| `test/editor-calm-check.js` | Template assertions use registry + renderer switch coverage instead of hardcoded names in `Editor.tsx`. |
| `apps/web/src/lib/pdf-text-inline.ts`, `pdf-text.worker.ts` | Removed invalid map param types so `tsc` accepts unpdf `TextItem \| TextMarkedContent`. **Deviation:** outside ticket surfaces; required for acceptance `npm run check`. |

Intent preserved: no new templates, routes, or PDF pipeline changes.

## Evidence
| Acceptance criterion | Actual check/artifact | Result |
|---|---|---|
| Renderer binds 11 missing layouts | `editor-calm-check.js` layout cases + file review | PASS |
| Matrix variant | `templateId === "matrix"` on `tech` case | PASS |
| `editor-calm-check` updated | `node test/editor-calm-check.js` | PASS |
| `npm run build` | `npm run build` (exit 0, consola/nitro resolved after clean install) | PASS |
| `npm test` | full suite incl. automation 20-template PDF | PASS |
| `npm run check` | `npm run check` after pdf-text typing fix | PASS |
| PDF export wired | `editor.tsx` Export PDF + automation PDF tests | PASS (server PDF path; client html2pdf not exercised in CLI) |
| 20 distinct editor preview layouts | Not browser-verified; automation PDF generation for all 20 IDs | PARTIAL — structural export OK; visual distinctness assumed from renderer routing |

**Not run:** Interactive browser preview spot-check of 11 templates; client-side html2pdf click path.

## Handoff
**Remaining risks:** Visual regression on any template still needs Argus/Nemesis re-review in browser. `pdf-text` typing touch is outside renderer scope — revert if another owner owns that module.

**Next owner:** Nemesis-nv re-review on same uncommitted revision; Argus for preview fidelity if needed.

**Decision needed from Astra:** none.

## Repair log
Nemesis FAIL (11 layouts → Modern) → verified/filled `renderer.tsx` switch + matrix variant → editor-calm-check PASS + automation 20/20 PDF PASS.

Build FAIL (consola ENOTEMPTY) → kill duplicate `npm install`, `rm -rf node_modules`, single `npm install` → build PASS.

`npm run check` FAIL (pdf-text map types) → narrow item guard without explicit wrong annotation → check PASS.
