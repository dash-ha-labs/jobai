# JobAI Browser Extension

Reads the job posting from your current Chrome tab, lets you review and edit
the details in a popup, and opens them in the JobAI website as a draft.

Users do not need this document — install instructions live on the website at
`/extension` (with a downloadable ZIP). This README is for developers.

## What it does today

- Extract job text from the active tab (http/https pages only; credentials in
  the tab URL are rejected).
- Review/edit extracted fields in the popup before transferring.
- Open the JobAI website with the job prefilled (URL fragment handoff, stripped
  by the website on arrival; bounded validation).

## Not available yet

- AI tailoring — no AI features exist in the extension.
- PDF attachment / export from the extension.

## Build and package

From the repository root:

```bash
# 1. Build the extension (output in apps/extension/dist, verified automatically)
npm run build -w apps/extension

# 2. Package dist contents into apps/web/public/downloads/jobai-extension.zip
node scripts/package-extension.mjs

# Optional: standalone archive verification (CRC/size round-trip, layout asserts)
node scripts/verify-extension-zip.mjs

# 3. Rebuild the website so the new ZIP is served at /downloads/jobai-extension.zip
npm run build
```

`scripts/package-extension.mjs` is reproducible (no machine-specific paths; all
paths are resolved relative to the repository) and fails loudly if the build is
missing, if `manifest.json` is not at the archive root, or if the archive would
contain sources, `node_modules`, CVs, or key material.

## Development

```bash
npm run dev -w apps/extension          # watch build to dist/
npm run typecheck -w apps/extension    # tsc --noEmit
npm run test -w apps/extension         # extension checks
```

After a watch rebuild, reload the extension in Chrome via
`chrome://extensions` → reload button on the JobAI card.

The website must be running locally (`npm run dev` from the repo root, default
`http://localhost:3000`) for the extension's transfer step to land anywhere.
