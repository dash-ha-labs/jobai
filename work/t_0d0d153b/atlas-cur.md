# Work: t_0d0d153b — atlas-cur

Initiative: jobai-public-slice / Layout | Packet: `jobai-global-layout-wrappers` (`/Users/d/Code/jobai/specs/jobai-global-layout-wrappers.md`, r1 — not vendored in slice repo) | Brief/plan: ticket-only
Base revision: workspace HEAD (detached) + in-flight sibling edits | Submitted revision: uncommitted diff in `/Users/d/Code/jobai-public-slice`
Serving model: composer-2.5

## Before implementation

**User outcome:** Every JobAI page uses one of two layout widths (fixed `max-w-6xl` or full fluid), consistent vertical breathing room (`pt-12 pb-24`), and unified page-title typography when a title is supplied.

**Journey position:** Shell consistency only — not navigation, product copy, or editor/tool behavior.

**Boundary:** User-visible — page width, title block, top/bottom spacing on routed content. Internal — `PageLayout.tsx`, route wrappers, workspace `main` padding delegation. `ToolPageLayout` delegates outer shell to `PageLayout`.

**Approach:** Single `PageLayout` with `variant`, optional `title` / `description` / `leading` / `titleAddon` / `headerActions`. Migrate all route components; tool pages via `ToolPageLayout`. Remove duplicate `pt`/`pb`/page-level `max-w-*` from routes; workspace `main` drops vertical/horizontal padding so `PageLayout` owns inset.

**Dependencies:** None blocking. Spec file lives in parent `jobai` repo; read before implement.

## Result

| File | Why |
|------|-----|
| `apps/web/src/components/PageLayout.tsx` | **New** global fixed/fluid wrapper + unified `h1` header. |
| `apps/web/src/routes/__root.tsx` | Workspace `main`: remove `pt`/`pb`/`px` (layout owns inset). |
| `apps/web/src/components/tools/ToolPageLayout.tsx` | Outer shell → `PageLayout` fixed. |
| `apps/web/src/routes/**/*.tsx` (all content routes) | Wrap in `PageLayout`; strip bespoke page shells. Redirect-only routes unchanged. |
| `apps/web/src/routes/app/blog/*` | Unchanged files; use shared blog components already on `PageLayout`. |

## Acceptance

| Criterion | Evidence | Result |
|-----------|----------|--------|
| Exactly two variants | `PageLayoutVariant` = `fixed` \| `fluid` | PASS |
| Standard vertical spacing | `pt-12 pb-24` on wrapper | PASS (code) |
| Unified page titles | Single `h1` class in `PageLayout` | PASS (code) |
| All routes migrated | Grep: no route-level `max-w-5xl mx-auto` shells; tools via `ToolPageLayout` | PASS |
| Checks | `npm run check`, `npm run build` | PASS |

## Deviations / limits

- Horizontal padding (`px-5 sm:px-9 lg:px-10`) lives on `PageLayout` so public pages and workspace routes share inset after `main` padding removal — not spelled out in ticket but required for parity.
- Marketing home, extension hero, blog article, and checklist bodies keep **content** `h1`s (hero/article titles); shell titles use `PageLayout` only where the page is a standard document hub.
- Editor keeps compact toolbar `h1` (workspace control, not page chrome); wrapped in `fluid` `PageLayout` without `title`.
- No browser visual regression pass (capability gap: no automated layout snapshot in repo).

## Remaining risks

- Landing/editor fluid layouts untested in browser at multiple breakpoints.
- Sibling uncommitted work in workspace (PDF/toolkit) not part of this diff; reviewers should scope to layout files above.

## Next owner

Argus-nv / Nemesis-nv — product fidelity and integration review on this revision.
