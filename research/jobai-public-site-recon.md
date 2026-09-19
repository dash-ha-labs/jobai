# JobAI Public Site & Routing Reconnaissance

## 1. Route Migration Table

| Old Path | Proposed Path | Notes |
| :--- | :--- | :--- |
| `/` | `/app` | Current dashboard moves to `/app`. `/` becomes public marketing homepage. |
| `/drafts` | `/app/drafts` | |
| `/extension` | `/app/extension` | |
| `/import-job` | `/app/import-job` | |
| `/settings/ai` | `/app/settings/ai` | |
| `/templates` | `/templates` & `/app/templates` | Marketing gallery and internal gallery. |
| `/blog/` | `/blog/` | Public route. |
| `/api/*` | `/api/*` | Stable. Origin checks in `api.ts` unaffected by frontend URL path shifts. |

## 2. Consumers Needing Migration/Legacy Redirects

The browser extension hardcodes multiple URLs that will break when paths move to `/app/`:
- **Pairing baseUrl:** `apps/extension/src/types.ts` (`http://127.0.0.1:3000/extension`)
- **Dashboard Open:** `apps/extension/src/popup.tsx` (`openTab("http://127.0.0.1:3000/")`)
- **Drafts Deep Link:** `apps/extension/src/popup.tsx` (`openTab("http://127.0.0.1:3000/drafts?id=...")`)
- **Settings Deep Link:** `apps/extension/src/popup.tsx` (`http://127.0.0.1:3000/settings/ai`)
- **Handoff URL:** `apps/extension/src/background.ts` and `test-urls.cjs` (`/import-job#job=...`)

*Next Step:* Extension needs an update to point to `/app/*`, or the web server needs SSR redirects from the old roots to `/app/*` for backward compatibility with already-installed extensions.

## 3. Auth Limitation Facts

- **Actual login:** Does not exist. No credentials or multi-tenant database.
- **Access model:** Local-first, single-tenant profile loaded via `loadServerProfile` from disk.
- **Protection:** API routes rely on `isAllowedOrigin` (`apps/web/src/server/api.ts`) to block cross-origin requests, except for the paired extension (which uses a pairing token). Moving to a public/private route split does not secure `/app` behind an auth wall, it only hides the UI.

## 4. Template Registry & Rendering

- **Current State:** Templates are split. Thumbnails in `apps/web/src/routes/templates.tsx` are hardcoded mock HTML `div` blocks. Actual PDF generation in `apps/web/src/server/pdf.ts` uses imperative canvas-like `pdf-lib` coordinates. There is no shared renderer.
- **Proposal for Shared Registry:** 
  1. Extract `TEMPLATE_METADATA` (id, name, description) into `packages/shared/src/templates.ts`.
  2. To satisfy "thumbnails using same renderer", either render the PDF server-side and convert the first page to an image for thumbnails, OR migrate PDF generation to print-css (HTML to PDF) so the exact same React components render the UI thumbnails and the final PDF. 
  3. Both `/templates` and `/app/templates` will import this exact same registry list and render mechanism.

## 5. Avatar Capability Gap

- **Current Capability:** None. `CVContact` (`packages/shared/src/types.ts`) has no photo/avatar field. The PDF generator (`pdf.ts`) does not implement image drawing.
- **Minimum Gap:** 
  1. Add `avatar?: string` (base64 data URI only, to prevent external tracking/fetch calls) to `CVContact`.
  2. Implement `pdfDoc.embedPng()` / `embedJpg()` in `apps/web/src/server/pdf.ts`.
  3. Add image upload/crop UI in the editor.
  *(Warning: External URLs for avatars must be blocked to prevent tracking/privacy leaks in exported PDFs).*

## 6. Exact Affected Ownership Surfaces

- `apps/web/src/routeTree.gen.ts` & `router.tsx` (TanStack routing config).
- `apps/web/src/server/api.ts` (if adding redirects).
- `apps/extension/src/*` (hardcoded URLs).
- `packages/shared/src/types.ts` (Avatar model update).
- `apps/web/src/server/pdf.ts` (Avatar PDF drawing update).
