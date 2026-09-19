import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { TOOLS, PrivacyBadge, TOOL_ROUTES } from "../../components/tools/ToolPageLayout";

export const Route = createFileRoute("/toolkit/")({
  component: ToolkitIndexPage,
});

function ToolkitIndexPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="border-b border-[#e8e7e2] pb-5 space-y-3">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading">
          Toolkit
        </h1>
        <p className="text-sm text-[#73736b] max-w-2xl leading-relaxed">
          Free browser-based tools for your job search. Everything runs locally — no signup, no tracking, no data leaves your device.
        </p>
        <PrivacyBadge />
      </div>

      <div>
        <label htmlFor="toolkit-search" className="sr-only">
          Search tools
        </label>
        <input
          id="toolkit-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="w-full sm:max-w-md rounded-xl border border-[#dcd9ce] bg-[#faf9f6] px-4 py-2.5 text-sm text-[#292a27] placeholder:text-[#a8a89e] focus:border-[#9782d8] focus:outline-none focus:ring-1 focus:ring-[#9782d8] transition"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e7e2] bg-[#fffefa] p-8 text-center text-sm text-[#73736b]">
          No tools match “{query.trim()}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((tool) => (
            <Link
              key={tool.slug}
              to={TOOL_ROUTES[tool.slug]}
              className="block rounded-2xl border border-[#e2ded5] bg-[#fffefa] p-5 sm:p-6 shadow-sm hover:border-[#9782d8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-[#292a27] font-heading">{tool.name}</h2>
                <span className="text-sm text-[#625181] shrink-0">Try it →</span>
              </div>
              <p className="mt-2 text-sm text-[#73736b] leading-relaxed">{tool.description}</p>
              <div className="mt-4 text-xs text-[#8c8d81] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Runs 100% in your browser</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
