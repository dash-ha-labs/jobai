# Work: t_f082d44f — rigel-cur
Initiative: jobai-public-site | Packet revision: jobai-homepage-featured-templates r1 | Brief/plan revisions: brief r2 P00/J01/UX01, plan r2 I01/I02
Base revision: e3b3b84439cd8d6fd4e38683bf014f2d1bc3a88a (working tree already held public homepage WIP) | Submitted revision/diff: uncommitted; `apps/web/src/routes/index.tsx` sha256 `3b1e1b076786943c27bbc25cf7ddfe3fa3849861cb53f798a9438e2eec4b94cd`; `test/public-slice-check.js` sha256 `88300572a7add29fc5a72206e7329acaf3a8c5494c2489694a2a426d2f6cc750`; excerpt `work/t_f082d44f/assigned.patch` sha256 `cea9a01d9c5f55cd23a5a321f78133451318bf95a5c72702fa4b36abdf3f839c`
Serving model: Cursor Grok 4.6

## Before implementation
**User outcome:** Homepage visitors see a compact featured-template showcase and continue to `/templates` for full preview/apply. They no longer interact with a live document demo on `/`.

**Journey position:** Supporting first public beat after hero/workflow. Not a new gallery, onboarding step, or catalog replacement. Full preview stays on `/templates` (orion).

**User-visible / internal boundary:** User sees 8 cards (thumbnail, name, category), badge “20 Professional Layouts”, catalog link, and “Browse all templates →”. Internal: `CV_TEMPLATES.slice(0, 8)` + existing `TemplateThumbnail`; no new registry, carousel lib, or homepage Preview.

**Approach:** Delete section-4 tabs, live Preview sheet, sample-profile bar, `selectedTemplateId`, unused Preview/`FICTIONAL_SAMPLES` imports. Replace with snap-x mobile track / 4-col desktop grid of catalog-first 8 templates; each card `Link`s to `/templates`. Keep `id="templates"` and “View all in template catalog”. Update public-slice assertions. No custom arrows (native focus-into-view + snap); plum focus rings.

**Dependencies checked:** t_a4d779bd complete; `CV_TEMPLATES` and `TemplateThumbnail` already land personas. Surfaces owned by others left untouched.

**Not promoted:** Homepage remains a route into `/templates`, not a second gallery.

References opened: spec r1; brief P00/J01/UX01 (anchor); plan I01/I02 (catalog reuse). No ON DEMAND extras.

## Result
| File | Change |
|---|---|
| `apps/web/src/routes/index.tsx` | Removed demo viewer state/tabs/live Preview. Featured 8 cards from shared catalog, persona thumbnails, snap-x carousel + desktop grid, badge, section CTA. |
| `test/public-slice-check.js` | Homepage assertions: new badge/CTA/card link; removed tabs/sample-profile/`cv-paper`. |
| `work/t_f082d44f/assigned.patch` | Excerpt of this ticket’s section (not the mixed vs-HEAD homepage rewrite). |
| `work/t_f082d44f/files.sha256` | SHA256 of the two assigned product files. |

Intent preserved: `/templates` remains the full preview/apply surface; homepage only showcases and routes. No new deps, screens, or catalog array. Forbidden files not edited.

## Evidence
| Acceptance criterion | Actual check/artifact | Result |
|---|---|---|
| Remove demo viewer (tabs, live Preview, sample bar) | curl :3010 `/` SSR: no `tab-modern`/`tab-executive`/`Sample profile:`/`cv-paper` | PASS |
| Badge “20 Professional Layouts”; heading kept | SSR contains both strings; `id="templates"` retained | PASS |
| 6–8 featured cards with thumbnail, name, category, link to `/templates` | 8 `data-featured-template` anchors `href="/templates"`; names include Modern Clean / Executive / Technical / Compact / Creative Studio / Academic CV | PASS |
| One section CTA “Browse all templates →”; keep catalog link | SSR both present | PASS |
| Keyboard focus styles #9782d8; snap-x; no new carousel lib | Markup: `snap-x snap-mandatory`, `focus-visible:ring-[#9782d8]`; Tailwind only | PASS (markup) |
| No 390px page overflow | CSS: `min-w-0` + `overflow-x-auto` on track, cards `w-[72%] max-w-[16.5rem]` | UNVERIFIED visually (no browser tool) |
| `npm run check` | exit 0 | PASS |
| `npm run build` | exit 0 | PASS |
| `npm test` | exit 0 (18 contract, calm editor, 13 self-check, 12 automation, 8 BYOK, 22 extension) | PASS |
| `test/public-slice-check.js` against built server :3010 | 22/22 | PASS |
| Folio visual / carousel swipe / keyboard tab order | No browser automation in this Cursor session | UNVERIFIED |

Temporary SSR server: `PORT=3010 node apps/web/.output/server/index.mjs` (stopped after checks). Canonical :3000 left running, not restarted.

## Handoff
**Deviations:** (1) No custom carousel arrow buttons; spec allowed “arrows if used”. Cards are native links with plum focus rings; mobile uses scroll-snap. (2) Featured set is `CV_TEMPLATES.slice(0, 8)` (catalog order: modern, executive, tech, compact, creative, academic, corporate, minimal) — not a separate marketing ranking. (3) vs-HEAD git diff of `index.tsx` includes prior public-homepage WIP; reviewers should use file hashes + section excerpt, not that mixed diff.

**Remaining risks:** Visual overflow at 390px and desktop 4-col rhythm need Argus. Interaction (snap scroll, focus-into-view) unverified in a real browser.

**Next owner:** Argus then Nemesis on this uncommitted revision (file hashes above). Not release.

**Decision needed from Astra:** none.

## Repair log
public-slice-check FAIL (featured card link regex assumed `href` before `data-*` and a 400-char window to “Modern Clean”) → assertion matches either attribute order on the same `<a>` → 22/22 PASS. Test-only repair.
