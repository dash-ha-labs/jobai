# JobAI — Local MVP

A locally running CV management application. No data leaves your browser.

## Current status

Foundation shell only. Editor, AI tailoring, and extension features not yet implemented.

## Run locally

```bash
# Install dependencies (first time only)
npm install

# Start dev server (website on 3000, server on 3100)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run contract checks
npm test
```

## Local storage

All data is stored in `localStorage` of your browser.

- **Master CV**: Your canonical CV (saved as `jobai_cv_master`)
- **Drafts**: Job-specific tailored versions (saved as `jobai_cv_drafts`)

Deleting data in your browser will erase your work. Export PDF before clearing cache.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health (no auth) |
| POST | `/api/import` | Import CV (501 — not implemented) |
| POST | `/api/tailor` | Tailor CV to job (501 — not implemented) |

## Security

- No authentication service (local single-user only)
- No cloud sync
- No background browsing collection
- CV content rendered as text only
- Server binds loopback only (127.0.0.1)
- Foreign `Origin` rejected on mutation endpoints

## Limitations

- PDF export uses browser print → Save as PDF (native, no library)
- No OCR for scanned documents
- No auto-save (explicit save required)
- No multi-device sync
- No extension integration yet

## Future scope

See `board/specs/jobai-mvp-plan.md` for the full delivery sequence.
