# Ticket: jobai-unified-cv-preview
Initiative: jobai-public-slice / Rendering

## Product Anchor
CV previews must exactly match the final printed PDF. Reflowing text based on container width breaks this trust. 

## Scope
1. **Component**: Create a single `<CvPrintPreview>` global component.
2. **Proportions**: Enforce strict physical print aspect ratio (A4: `210/297` or US Letter: `8.5/11`).
3. **Scaling**: Render the CV at full physical pixel width internally, then use CSS `transform: scale(...)` (via ResizeObserver or CSS container units) to shrink it to fit the parent container. The DOM must NEVER reflow differently than the print output.
4. **Page Breaks**: Implement robust page breaks directly in the shared CV layout components. Use common CSS rules (e.g., `break-inside: avoid`, `page-break-inside: avoid`) so that design elements (cards, sections, headers) never snap or break in the middle across pages.
5. **Integration**: Replace all existing preview implementations across the app:
   - Public `/templates` gallery cards and full-preview modal.
   - App editor sidebar / thumbnail view.
   - Any homepage/marketing carousels.

## Dependencies
- Coordinates with `orion-ag` (persona data) and `hydra-glm` (PDF export).

## Acceptance
- One component used everywhere.
- Resizing the browser window scales the preview like an image, maintaining exact text wrapping and page breaks.
