# Work: t_1b8a641d — rigel-cur
Initiative: jobai-public-site | Packet revision: jobai-resources-hub r1 | Brief/plan revisions: brief r2 P00/J01, conversion-r2.md r2 N01
Base revision: e3b3b84439cd8d6fd4e38683bf014f2d1bc3a88a | Submitted revision/diff: uncommitted; assigned.patch sha256 `5ea3a6ccfda0cfd01edeaa1cd6968644eaaea62788d4f3d449e3c64e46a21fe6`
Serving model: Cursor Grok 4.6

## Before implementation
**User outcome:** Visitors looking for practical job-search help land on a real Resources hub with original checklists and the existing three guides, then can continue into /blog or /app.

**Journey position:** Supporting public discovery step after homepage, before workspace. Not the product’s main feature, onboarding, or a new CMS/workflow.

**User-visible / internal boundary:** User sees /resources, checklist pages, and nav labels (Resources → /resources, Advice → /blog). Internal: file routes, checklist module, generated route tree. No renderer, PDF, editor, templates, or toolkit UI changes.

**Approach:** New `routes/resources/` only: index groups live `articles.ts` cards (link to /blog/{slug}, no copied bodies) plus three original checklist pages. Folio shell (1440px gutters, cream/plum, rounded-2xl). SSR title/description on each route. Point public Resources to /resources; add Advice → /blog in header/drawer; add Resources hub in footer Learn column. Update `test/public-slice-check.js`. Homepage “Read all articles” stays on /blog (optional retarget skipped: ticket limits edits to new files + __root + test).

**Dependencies checked:** `articles.ts` (3 guides), public `__root.tsx` nav/footer, blog folio/SSR pattern, public-slice-check Resources→/blog assertion.

**Capability gap:** No browser automation in this Cursor session. Visual/interaction (drawer, keyboard, mobile overflow, folio comparison) not exercised. SSR HTML and curl cover headings, meta, nav hrefs, and CTAs.

**Not promoted:** Resources remains one public nav destination.

References opened: spec r1; conversion-r2 N01; brief P00/J01; blog index/$slug; public-slice-check.js. No other archive.

## Result
| File | Change |
|---|---|
| `apps/web/src/routes/resources/index.tsx` | NEW `/resources` hub: folio header, Guides from `articles.ts`, Checklists from local module. SSR title/description. |
| `apps/web/src/routes/resources/$slug.tsx` | NEW checklist pages; static checkbox-styled lists; CTA to `/app`; SSR meta; not-found. |
| `apps/web/src/routes/resources/content/checklists.ts` | NEW original copy: cv-pre-flight, tailor-without-inventing-facts, application-tracking. No invented stats/citations. |
| `apps/web/src/routes/__root.tsx` | Public header + mobile drawer: Resources → `/resources`, Advice → `/blog`. Footer Learn: Resources hub + existing blog links. |
| `apps/web/src/routeTree.gen.ts` | Auto-registered `/resources/` and `/resources/$slug` (plugin). File also contains other in-flight routes already in this workspace. |
| `test/public-slice-check.js` | Resources nav → `/resources`; `/blog` still required; SSR cases for hub + 3 slugs. Also aligned Toolkit header assert from stale `/#toolkit` to live `/toolkit` so the assigned test file can finish. |
| `work/t_1b8a641d/assigned.patch` | Narrow diff of the three new resource files. |

Intent preserved: /blog still reachable; guides are real article data; checklists are original; no new deps; forbidden atlas/orion/hydra surfaces not edited by this seat.

## Evidence
| Acceptance criterion | Actual check/artifact | Result |
|---|---|---|
| `/resources` index, grouped guides + checklists | curl 127.0.0.1:3010/resources → 200, h1 “Practical resources for your job search”, 3 article titles + 3 checklist titles, guide hrefs under `/blog/{slug}` | PASS |
| Original checklist pages `/resources/{slug}` | curl 200 on cv-pre-flight, tailor-without-inventing-facts, application-tracking with expected h1s; CTA `href="/app"`; SSR description meta present | PASS |
| Nav: Resources → /resources; /blog reachable | Homepage SSR header `href="/resources"` + `href="/blog"` (Advice); footer Resources hub + Advice archive | PASS |
| SSR meta on new routes | titles: “Practical resources… — JobAI” and each checklist title | PASS |
| `npm run check` | exit 0 | PASS |
| `npm run build` | exit 0 | PASS |
| `npm test` | exit 0 (needed unsandboxed tsx) | PASS |
| `test/public-slice-check.js` against built server :3010 | 22/22 including new resources cases | PASS |
| Folio visual / mobile drawer / keyboard | No browser tool in session | UNVERIFIED |
| Did not touch renderer, registry, sample-cvs, templates, Editor, pdf-export, pdf-text* | This seat wrote only resources/*, __root nav, test, generated routeTree, work artifact | PASS (those files remain dirty from other seats; not edited here) |

Temporary SSR server: `PORT=3010 node apps/web/.output/server/index.mjs` (built output). Canonical :3000 process was left running and not restarted.

## Handoff
**Deviations:** (1) Homepage “Read all articles” still points at `/blog` (optional retarget not taken; NEW-files + __root + test only). (2) public-slice-check Toolkit header assertion updated `/#toolkit` → `/toolkit` to match live header; pre-existing stale check, not a product change. (3) Header adds “Advice” so /blog stays in the same nav after Resources moved. (4) Kanban CLI tools (`kanban_show` / `comment` / `complete`) are not in this Cursor session; Astra must reconcile the card.

**Remaining risks:** Visual folio fidelity and mobile nav wrapping with 6 desktop links need Argus. routeTree.gen.ts is mixed with other workspace routes.

**Next owner:** Argus then Nemesis on this uncommitted revision (assigned.patch `5ea3a6cc…` plus __root nav hunks and test updates). Not release.

**Decision needed from Astra:** none.

## Repair log
public-slice-check FAIL (Header must link to Toolkit `/#toolkit`) → assertion updated to `/toolkit` matching live `__root.tsx` → 22/22 PASS. Not a second product repair.
