import { Outlet, createRootRoute, HeadContent, Scripts, Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { getConfig } from "../server/contracts";
import "../styles.css";

export const Route = createRootRoute({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "theme-color", content: "#faf9f6" },
      { title: loaderData?.title ?? "JobAI — Local CV Manager" },
      { name: "description", content: loaderData?.description ?? "Local CV Manager" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  loader: async () => {
    return await getConfig();
  },
  component: RootComponent,
});

function RootComponent() {
  const config = Route.useLoaderData();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const search = (routerState.location.search || {}) as Record<string, any>;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute active breadcrumb label
  let activeSectionName = "Overview";
  if (pathname === "/") {
    activeSectionName = search.view === "editor" ? "My CV" : "Overview";
  } else if (pathname === "/templates") {
    activeSectionName = "Templates";
  } else if (pathname === "/drafts") {
    activeSectionName = search.id ? "Draft Details" : "Applications";
  } else if (pathname === "/extension") {
    activeSectionName = "Browser Extension";
  } else if (pathname === "/settings/ai") {
    activeSectionName = "AI Settings";
  } else if (pathname === "/import-job") {
    activeSectionName = "Job Import";
  }

  const isOverviewActive = pathname === "/" && (!search.view || search.view === "overview");
  const isEditorActive = pathname === "/" && search.view === "editor";
  const isTemplatesActive = pathname === "/templates";
  const isDraftsActive = pathname === "/drafts";
  const isExtensionActive = pathname === "/extension";
  const isAiActive = pathname === "/settings/ai";

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#faf9f6] text-[#292a27] antialiased min-h-screen">
        <div className="flex min-h-screen">
          {/* Desktop Fixed Sidebar: 240px width */}
          <aside
            id="sidebar"
            className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[#e8e7e2] bg-[#f5f4f0] px-5 py-8 lg:flex no-print"
          >
            {/* Wordmark Logo */}
            <Link
              to="/"
              search={{ view: "overview" }}
              className="ml-3 w-fit text-4xl font-semibold tracking-[-0.08em] font-heading"
              aria-label="JobAI home"
            >
              jobai
              <span className="text-[#9782d8]">.</span>
            </Link>

            {/* Workspace Indicator Card */}
            <div className="mb-7 mt-8 flex items-center gap-3 rounded-xl border border-[#e4e3dd] bg-white/70 p-3 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6e0f4] text-xs font-semibold text-[#625181]">
                JA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#292a27] truncate">Local workspace</p>
                <p className="text-[11px] text-[#93938a] truncate">Private &amp; on-device</p>
              </div>
              <svg className="w-4 h-4 text-[#9b9a92] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Section Header */}
            <p className="mb-3 pl-3 text-xs font-medium tracking-widest text-[#9a9a91]">
              WORKSPACE
            </p>

            {/* Navigation links mapped per spec: Overview, My CV, Templates, Applications, Browser extension, AI settings */}
            <nav className="space-y-1.5" aria-label="Main navigation">
              <Link
                to="/"
                search={{ view: "overview" }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isOverviewActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </Link>

              <Link
                to="/"
                search={{ view: "editor" }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isEditorActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>My CV</span>
              </Link>

              <Link
                to="/templates"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isTemplatesActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Templates</span>
              </Link>

              <Link
                to="/drafts"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isDraftsActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span>Applications</span>
              </Link>
            </nav>

            <div className="mx-3 my-5 border-t border-[#e2e1db]"></div>

            <nav className="space-y-1.5" aria-label="Secondary navigation">
              <Link
                to="/extension"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isExtensionActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Browser extension</span>
                <svg className="w-3.5 h-3.5 ml-auto text-[#9b9a92]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>

              <Link
                to="/settings/ai"
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isAiActive
                    ? "bg-[#e8e3f1] font-medium text-[#625181]"
                    : "text-[#73736b] hover:bg-[#eeede7]"
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>AI settings</span>
              </Link>
            </nav>

            {/* Bottom Card */}
            <div className="mt-auto pt-8">
              <div className="relative overflow-hidden rounded-xl border border-[#e1dccd] bg-[#eeeadd] p-4">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ded4ec] text-[#79648f]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </span>
                <p className="text-xs font-semibold text-[#292a27]">Private &amp; Local</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#858174]">
                  All profile data is saved on your device. Zero cloud tracking.
                </p>
                <Link
                  to="/extension"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d6d1c3] bg-white/70 py-1.5 text-xs font-medium text-[#292a27] transition hover:bg-white"
                >
                  Pair Extension
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-2 px-1 text-xs text-[#73736b]">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-[11px]">127.0.0.1:3000</span>
                <span className="ml-auto text-[10px] text-[#a2a096]">v{config.version || "1.0"}</span>
              </div>
            </div>
          </aside>

          {/* Mobile Collapsible Navigation Drawer */}
          {mobileMenuOpen && (
            <div
              id="mobile-sidebar-drawer"
              className="fixed inset-0 z-50 flex lg:hidden no-print"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
            >
              <div
                className="fixed inset-0 bg-[#292a27]/30 backdrop-blur-xs transition-opacity"
                onClick={closeMobile}
              />
              <div className="relative flex w-64 max-w-[80vw] flex-col border-r border-[#e8e7e2] bg-[#f5f4f0] p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#e4e3dd]">
                  <Link
                    to="/"
                    search={{ view: "overview" }}
                    onClick={closeMobile}
                    className="text-3xl font-semibold tracking-[-0.08em] font-heading"
                  >
                    jobai<span className="text-[#9782d8]">.</span>
                  </Link>
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="rounded-lg p-1 text-[#73736b] hover:bg-[#eeede7]"
                    aria-label="Close navigation"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="mt-6 space-y-1.5" aria-label="Mobile menu">
                  <Link
                    to="/"
                    search={{ view: "overview" }}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isOverviewActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    Overview
                  </Link>
                  <Link
                    to="/"
                    search={{ view: "editor" }}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isEditorActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    My CV
                  </Link>
                  <Link
                    to="/templates"
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isTemplatesActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    Templates
                  </Link>
                  <Link
                    to="/drafts"
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isDraftsActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    Applications
                  </Link>
                  <Link
                    to="/extension"
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isExtensionActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    Browser extension
                  </Link>
                  <Link
                    to="/settings/ai"
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isAiActive ? "bg-[#e8e3f1] text-[#625181]" : "text-[#73736b]"
                    }`}
                  >
                    AI settings
                  </Link>
                </nav>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="content-shell min-w-0 flex-1 lg:ml-60 flex flex-col min-h-screen">
            {/* Header: 80px (h-20), border-b border-[#e9e8e2] */}
            <header className="flex h-20 items-center justify-between gap-4 border-b border-[#e9e8e2] bg-[#faf9f6]/90 backdrop-blur-xs px-5 sm:px-9 lg:px-10 sticky top-0 z-30 no-print">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex p-1.5 lg:hidden text-[#73736b] hover:text-[#292a27] rounded-md hover:bg-[#f0efe7]"
                  aria-label="Open navigation"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div id="breadcrumb" className="text-sm text-[#85857d] flex items-center">
                  <span>Your workspace</span>
                  <span className="mx-2.5 sm:mx-3 text-[#c7c5bc]">/</span>
                  <span className="text-[#41423c] font-medium">{activeSectionName}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                {/* Real-time server connection indicator */}
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#e4e3dd] bg-white/70 px-3 py-1 text-xs text-[#73736b]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono text-[11px]">127.0.0.1:3000</span>
                </div>

                <Link
                  to="/settings/ai"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#e4e3dd] bg-white/60 px-2.5 py-1 text-xs font-medium text-[#73736b] hover:bg-white hover:text-[#292a27] transition"
                  title="Configure AI API credentials"
                >
                  <svg className="w-3.5 h-3.5 text-[#9782d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="hidden sm:inline">AI Settings</span>
                </Link>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6e0f4] text-xs font-semibold text-[#625181]">
                  JA
                </div>
              </div>
            </header>

            {/* Roomy Content Workspace */}
            <main className="mx-auto max-w-[1440px] w-full px-5 pb-12 pt-8 sm:px-9 lg:px-10 flex-1">
              <Outlet />
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-[#e9e8e2] py-7 px-5 sm:px-9 lg:px-10 text-xs text-[#8c8d81] no-print">
              <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-medium text-[#41423c]">JobAI Local CV Manager</span>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/" search={{ view: "overview" }} className="hover:text-[#292a27] transition-colors">
                    Overview
                  </Link>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/" search={{ view: "editor" }} className="hover:text-[#292a27] transition-colors">
                    My CV
                  </Link>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/templates" className="hover:text-[#292a27] transition-colors">
                    Templates
                  </Link>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/drafts" className="hover:text-[#292a27] transition-colors">
                    Applications
                  </Link>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/extension" className="hover:text-[#292a27] transition-colors">
                    Extension setup
                  </Link>
                  <span className="text-[#c7c5bc]">•</span>
                  <Link to="/settings/ai" className="hover:text-[#292a27] transition-colors">
                    AI settings
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#a2a298]">
                  <span>{config.privacyNotice || "Private, on-device data storage."}</span>
                </div>
              </div>
            </footer>
          </div>
        </div>

        <Scripts />
      </body>
    </html>
  );
}
