# Work: t_90c46ec1 — atlas-cur

Initiative: jobai-public-slice / Toolkit Expansion | Packet revision: jobai-resume-skills-tools (spec in `/Users/d/Code/jobai/specs/jobai-resume-skills-tools.md`) | Brief/plan revisions: n/a (ticket-only)
Base revision: e3b3b84 + prior toolkit hub (t_927b39ef) | Submitted revision/diff: uncommitted in `/Users/d/Code/jobai-public-slice`
Serving model: composer-2.5

## Before implementation

**User outcome:** Job seekers browse `/toolkit`, open ResumeSkills-inspired utilities, fill forms, and get an on-device preview (mock/heuristic until AI is wired).

**Journey position:** Extends the public Toolkit hub with nine additional cards and pages; does not change editor, extension, or app shell flows.

**Boundary:** User-visible — tool names, hub cards, unified tool shell (back link, privacy, how-it-works, related tools), form fields, local preview output. Internal — registry config, dynamic `$toolSlug` route, heuristic `generate()` functions (no backend AI).

**Approach:** Single `resume-skills-registry.ts` for nine tools; shared `ResumeSkillsToolkitTool` form/output UI; one TanStack route `toolkit/$toolSlug.tsx` for all nine (legacy bullet/PDF tools keep dedicated routes). Extend `TOOLS` / hub index via `ToolPageLayout`; `toolkitLinkProps()` for typed router links.

**Dependencies:** Existing `ToolPageLayout`, toolkit index, global field styling aligned with `BulletAnalyzer` (no separate Card/Button package in repo).

**Capability gap:** None for this ticket (mock output explicitly in scope).

## Result

| File | Why |
|------|-----|
| `apps/web/src/components/tools/resume-skills-registry.ts` | Nine tool definitions (meta, fields, how-it-works, local `generate`). |
| `apps/web/src/components/tools/ResumeSkillsToolkitTool.tsx` | Unified textarea/text/file form + Generate preview panel. |
| `apps/web/src/routes/toolkit/$toolSlug.tsx` | One page template for all nine tools (`ToolPageLayout` + shared tool UI). |
| `apps/web/src/components/tools/ToolPageLayout.tsx` | Registry merge, `toolkitLinkProps`, related-tool links. |
| `apps/web/src/routes/toolkit/index.tsx` | Hub cards for all 11 tools via `toolkitLinkProps`. |
| `apps/web/src/routeTree.gen.ts` | Auto-updated for `/toolkit/$toolSlug`. |

Intent preserved: no per-tool custom layouts; no server AI; hub search covers new tools via shared `TOOLS` array.

## Evidence

| Acceptance criterion | Actual check/artifact | Result |
|---|---|---|
| 9 tools at `/toolkit/<slug>` | SSR `fetch` `/toolkit/resume-ats-optimizer` → 200, contains “Generate preview” + “Resume ATS Optimizer” | PASS |
| Unknown slug 404 | `fetch` `/toolkit/not-a-tool` → 404 | PASS |
| Hub lists new tools | `fetch` `/toolkit` → 200, includes “Resume ATS Optimizer” | PASS |
| Same layout shell | All nine use `$toolSlug` → `ToolPageLayout` + `ResumeSkillsToolkitTool` | PASS (code) |
| `npm run build` | `apps/web` build succeeded | PASS |
| `npm run check` | `tsc --noEmit` after link helper fix | PASS |
| `npm test` | 22/22 (root) | PASS |
| Live browser interaction per tool | Not run | UNVERIFIED |
| Related-tools grid with 11 tools (10 cards) | Not visually reviewed | UNVERIFIED |

## Handoff

**Deviations:** Spec mentions Card/Button/Input abstractions; repo uses the same Tailwind field patterns as existing toolkit tools. AI is mock/heuristic only per ticket out-of-scope.

**Risks:** Related-tools section shows up to ten cards per page; may feel long until paginated (product call). Dynamic route coexists with static bullet/PDF routes — links use `toolkitLinkProps` to avoid type/runtime mismatch.

**Next owner:** Argus/Nemesis review on this uncommitted revision; future seat wires AI via settings when available.

**Decision needed from Astra:** none.

## Repair log

(n/a — initial implementation)
