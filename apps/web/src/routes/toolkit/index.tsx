import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { TOOLS, PrivacyBadge, toolkitLinkProps } from "../../components/tools/ToolPageLayout";
import { PageLayout } from "../../components/PageLayout";

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
    <PageLayout
      variant="fixed"
      title="Toolkit"
      description={
        <>
          Free browser-based tools for your job search. Everything runs locally — no signup, no tracking, no data leaves your device.
          <div className="mt-3">
            <PrivacyBadge />
          </div>
        </>
      }
      className="space-y-8"
    >
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
          className="w-full sm:max-w-md rounded-xl border border-[#c5cbd4] bg-[#f7f8fa] px-4 py-2.5 text-sm text-[#191b20] placeholder:text-[#8b939f] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] transition"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-8 text-center text-sm text-[#636c7a]">
          No tools match “{query.trim()}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((tool) => (
            <Link
              key={tool.slug}
              {...toolkitLinkProps(tool.slug)}
              className="block rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-5 sm:p-6 shadow-sm hover:border-[var(--ui-accent)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-[#191b20] font-heading">{tool.name}</h2>
                <span className="text-sm text-[var(--ui-accent)] shrink-0">Try it →</span>
              </div>
              <p className="mt-2 text-sm text-[#636c7a] leading-relaxed">{tool.description}</p>
              <div className="mt-4 text-xs text-[#8b939f] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Runs 100% in your browser</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
