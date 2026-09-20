import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/app/toolkit")({
  component: AppToolkitRoute,
});

function AppToolkitRoute() {
  return (
    <PageLayout
      variant="fixed"
      title="Application Toolkit"
      description="Quiet utility tools for CV editing, readability analysis, and application preparation."
      className="space-y-6"
    >
      <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-8 text-center text-[#73736b]">
        <p className="text-sm">Toolkit modules are readying for release.</p>
      </div>
    </PageLayout>
  );
}
