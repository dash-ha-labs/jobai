import { createFileRoute } from "@tanstack/react-router";
import { getConfig } from "../../server/contracts";
import type { AppConfig } from "jobai-shared";
import { TemplatesComponent } from "../templates";

export const Route = createFileRoute("/app/templates")({
  loader: async (): Promise<AppConfig> => {
    return await getConfig();
  },
  component: AppTemplatesRouteComponent,
});

function AppTemplatesRouteComponent() {
  const config = Route.useLoaderData() as AppConfig;
  return <TemplatesComponent config={config} />;
}
