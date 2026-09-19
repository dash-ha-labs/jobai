import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/toolkit")({
  component: AppToolkitRoute,
});

function AppToolkitRoute() {
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="border-b border-[#e8e7e2] pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#292a27] font-heading">
          Application Toolkit
        </h1>
        <p className="text-sm text-[#73736b] mt-1.5 leading-relaxed">
          Quiet utility tools for CV editing, readability analysis, and application preparation.
        </p>
      </div>
      <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-8 text-center text-[#73736b]">
        <p className="text-sm">Toolkit modules are readying for release.</p>
      </div>
    </div>
  );
}
