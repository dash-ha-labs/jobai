import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/ai")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/settings/ai",
      statusCode: 307,
    });
  },
  component: () => null,
});


