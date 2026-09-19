import { createFileRoute, redirect } from "@tanstack/react-router";

interface SearchParams {
  id?: string;
}

export const Route = createFileRoute("/drafts")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/app/applications",
      search: { id: search.id },
      statusCode: 307,
    });
  },
  component: () => null,
});
