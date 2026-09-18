import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { getConfig } from "../server/contracts";
import "../styles.css";

export const Route = createRootRoute({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: loaderData?.title ?? "JobAI — Local CV Manager" },
      { name: "description", content: loaderData?.description ?? "Local CV Manager" },
    ],
  }),
  loader: async () => {
    return await getConfig();
  },
  component: RootComponent,
});

function RootComponent() {
  const config = Route.useLoaderData();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-100/70 text-slate-900 antialiased flex flex-col font-sans">
        <header className="bg-slate-900 text-white shadow-xs sticky top-0 z-30 no-print">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap justify-between items-center gap-4">
            <Link to="/" className="text-lg font-bold tracking-tight hover:text-slate-200 transition-colors flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-xs font-black text-white">J</span>
              <span>JobAI</span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-slate-800 text-white" }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                My CV
              </Link>
              <Link
                to="/templates"
                activeProps={{ className: "bg-slate-800 text-white" }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Templates
              </Link>
              <Link
                to="/drafts"
                activeProps={{ className: "bg-slate-800 text-white" }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Applications
              </Link>
              <a
                href="/extension"
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Extension setup
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          <Outlet />
        </main>

        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs no-print">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
              <span className="font-medium text-slate-300">JobAI Local CV Manager</span>
              <span>•</span>
              <Link to="/templates" className="hover:text-slate-200 transition-colors">
                Templates
              </Link>
              <span>•</span>
              <Link to="/drafts" className="hover:text-slate-200 transition-colors">
                Applications
              </Link>
              <span>•</span>
              <Link to="/extension" className="hover:text-slate-200 transition-colors">
                Extension setup
              </Link>
            </div>
            <p className="text-slate-500 text-[11px]">{config.privacyNotice}</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  );
}
