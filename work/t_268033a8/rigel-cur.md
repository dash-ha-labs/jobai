# Work: t_268033a8 — rigel-cur
Initiative: jobai-public-site | Packet revision: jobai-pdf-export-fidelity r1 | Brief/plan revisions: brief r2 P00/J01/B01; plan r2 I02 (PF01 still queued, not this ticket)
Base revision: a860a6bd0fdb2deff0d5b864eec56b7dcca7a2b3 | Submitted revision/diff: uncommitted; tracked patch sha256 `459bff986eb60b2ff7b02db4a33bdb574658a77670b8977b8b9b8e9c27360658` (`work/t_268033a8/assigned.patch`)
Serving model: Cursor Grok 4.6

## Before implementation
**User outcome:** Export PDF from the editor yields a complete, correctly sized, unclipped document for any of the 20 templates.

**Journey position:** Supporting last-mile download after import/edit. Not a new export workflow, gallery, or renderer redesign.

**User-visible / internal boundary:** User still clicks existing Export PDF and receives `{FullName}-CV.pdf` (fallback `My-CV.pdf`) at the paper size already chosen in the editor. Internal: html2pdf pagebreak css+legacy, capture of `#cv-paper` / `.cv-print-target`, print CSS. No new screens, settings, or server upload.

**Approach:** Keep `exportCvPaperToPdf(element, filename, paperSize)` signature. Inside the module: resolve print target, temporarily lift one-page `aspect-ratio`/`minHeight` so long CVs paginate, force white paper, set jsPDF `a4`/`letter`, pagebreak `css`+`legacy` avoiding `.cv-item` / section headers / skill-group grids. Screen-computed page-break CSS (html2pdf does not use `@media print`). Filename normalized in-module because `editor.tsx` is owned elsewhere. Evidence: source/DOM check plus Chrome html2pdf of one long CV across all 20 template IDs.

**Dependencies checked:** t_bc00d5ea complete; renderer switch covers 20 layouts; templates already use `cv-section`/`cv-item` (tech skills grid handled by `.cv-section .grid > div`).

**Not promoted:** Client export remains the existing editor action.

References opened: spec r1 (full packet); brief P00/J01/B01; plan I02 PDF-fidelity note. No ON DEMAND extras.

## Result
| File | Why |
|---|---|
| `apps/web/src/lib/cv-pdf-export.ts` | Pagebreak css+legacy + avoid selectors; A4/Letter jsPDF; `#cv-paper` capture styles + `onclone`; `{Name}-CV.pdf` / `My-CV.pdf`. Public signature unchanged. |
| `apps/web/src/styles.css` | Print isolation keeps white paper; named Letter `@page`; item/header/skill-group break rules. Screen-scoped copy because html2pdf reads computed screen styles. |
| `test/pdf-export-check.js` | Source assertions, then tsx Chrome harness. |
| `test/pdf-export-templates.ts` | Filename/options unit checks; SSR of all 20 registry IDs; real html2pdf in headless Chrome. |
| `work/t_268033a8/pdf-evidence.json` | Per-template page/size table. |
| `work/t_268033a8/assigned.patch` | Exact tracked diff (export + styles). |

Intent preserved: client-side only; no renderer/registry/editor edits; no server upload.

File hashes:
- `cv-pdf-export.ts` `4a280c4b480b4eff230d50997ff13691c8ff95e26d0fd2c81bc594bfd2af75b5`
- `styles.css` `274b62efe98bc74e21339338b0eb560e8b0e237f36aece2377633c082955d806`
- `test/pdf-export-check.js` `d008eb0a53e56f8fe41a4f82ddf8e01e2d0af8ca654eee057d8dfa6c9d3685dc`
- `test/pdf-export-templates.ts` `634f0cffade15d382fd7278754156e519f8255c8acf0831bf980c39b600fa2d4`
- `pdf-evidence.json` `2835a9fe9e1ba22db5f6f551aba533d8fdab861333f5e4699c153c043d9e295d`

## Evidence
| Acceptance criterion | Actual check/artifact | Result |
|---|---|---|
| 20 template IDs export multi-page-safe PDF from a long CV | Chrome html2pdf via `node test/pdf-export-check.js`; all 20 A4 = 4 pages, `%PDF-`, 1.75–2.12 MB | PASS |
| A4 vs Letter honored | A4 210.0×297.0 mm all 20; Letter 215.9×279.4 mm on modern + executive | PASS |
| Filename uses full name | `resolveCvPdfFilename("Alexandra Chen.pdf")` → `Alexandra-Chen-CV.pdf`; empty/`cv` → `My-CV.pdf` (applied inside export; editor.tsx untouched) | PASS |
| Page breaks between sections/items | html2pdf `mode: ["css","legacy"]` + avoid `.cv-item`, `.cv-skill-group`, `.cv-section h2`, `.cv-section .grid > div`; matching CSS | PASS (config + pagination; visual orphan check not screenshot-verified) |
| Robust `#cv-paper` capture, white paper | `resolveCvPrintTarget`, `prepareCvPaperForCapture`, `onclone` white `#ffffff` | PASS (code + harness) |
| Client-side only | No fetch/upload in export module | PASS |
| No edits outside allowed files | git status limited to assigned surfaces + this work dir | PASS |
| `npm run check` | full monorepo tsc, exit 0 | PASS |
| `npm run build` | shared + web + extension, exit 0 | PASS |
| `test/editor-calm-check.js` | print CSS strings still present | PASS |
| `npm test` | contract 18, editor-calm, self-check 13, automation 12/12 (incl. 20-template server PDF sizes), byok, extension 22/22 | PASS |

A4 long-CV table (pages / bytes):

| ID | pages | bytes |
|---|---|---|
| modern | 4 | 2088283 |
| executive | 4 | 2073111 |
| tech | 4 | 1755669 |
| compact | 4 | 1781859 |
| creative | 4 | 2096700 |
| academic | 4 | 2080799 |
| corporate | 4 | 2079143 |
| minimal | 4 | 2068161 |
| bold | 4 | 2074369 |
| elegant | 4 | 2074369 |
| startup | 4 | 2075898 |
| legal | 4 | 2073671 |
| clinical | 4 | 2073647 |
| designer | 4 | 2090701 |
| timeline | 4 | 2074369 |
| aurora | 4 | 2121557 |
| classic | 4 | 2074369 |
| matrix | 4 | 1757240 |
| global | 4 | 2077518 |
| portfolio | 4 | 2086630 |

Letter: modern 4 / 2035338; executive 4 / 2020090.

**Not run / limits:** Live editor click of Export PDF with Tailwind-applied preview; pixel comparison of clipped headers; physical printer. Harness renders `CvTemplateRenderer` SSR without the production Tailwind bundle, so some layouts share similar byte sizes (bold/elegant/timeline/classic). Pagination and paper millimetres are still from the real html2pdf.js path.

## Handoff
**Deviations:** (1) Filename contract implemented inside `exportCvPaperToPdf` because `editor.tsx` is out of scope. (2) New tests are not wired into root `package.json` `test` (file ownership). Run `node test/pdf-export-check.js`. (3) `.cv-skill-group` is forward-compatible; tech skills currently match `.cv-section .grid > div`.

**Remaining risks:** Visual fidelity of Tailwind-heavy layouts in the live editor vs this SSR harness. html2pdf rasterizes (text not selectable). Kanban card was marked done by hydra-glm at 20:03 on this same uncommitted diff (`459bff98…`); this artifact is the implementation report, not a second completion.

**Next owner:** Argus then Nemesis on this uncommitted revision. Child t_5cb97a15 is not this seat.

**Decision needed from Astra:** none.

## Repair log
Chrome DevTools on a fixed port timed out on a second launch → `--remote-debugging-port=0` + `DevToolsActivePort` / stderr listen URL. Chrome `close()` hung after evidence write → SIGTERM then SIGKILL. tsc `image.type` string vs union → `"jpeg" as const`. Node SSR `React is not defined` (renderer JSX) → test-only `globalThis.React`; renderer.tsx not edited.
