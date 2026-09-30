# Ticket: jobai-global-layout-wrappers
Initiative: jobai-public-slice / Layout

## Product Anchor
Page layouts must be strictly standardized to exactly two variants: Fixed and Fluid. Random container widths, bespoke padding, and inconsistent titles erode trust and complicate maintenance.

## Scope
1. **Global Wrapper**: Create exactly one standard layout component `apps/web/src/components/PageLayout.tsx`.
   - Props: `variant: 'fixed' | 'fluid'`, `title?: string`, `description?: ReactNode`, `children`.
2. **Widths**:
   - `fixed`: Strict, single max-width for the entire app (e.g., `max-w-6xl mx-auto w-full`).
   - `fluid`: Full width (`w-full`).
3. **Spacing**: Enforce strict standard top/bottom padding inside the wrapper (e.g., `pt-12 pb-24`) so content never touches the header or footer.
4. **Titles**: If `title` is provided, render it using a single, unified typography standard at the top of the page layout. Separate public site vs app workspace titles if necessary, but keep the DOM structure unified.
5. **Integration**: Strip all custom `max-w-*`, `pt-*`, `pb-*`, and manual title headers from EVERY page in `apps/web/src/routes/**/*.tsx`. Wrap them all in `<PageLayout>`.

## Acceptance
- Exactly two layout variants exist.
- No page content touches the header or footer.
- Page titles use identical typography and spacing.
- All routes migrated to use the global wrapper.
