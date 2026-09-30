import { Outlet, createRootRoute, HeadContent, Scripts, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { getConfig } from "../server/contracts";
import "../styles.css";
import "../product-system.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "theme-color", content: "#ffffff" },
      { title: "JobAI — Your experience. Your next move." },
      { name: "description", content: "Create, improve and tailor your CV with clear suggestions you control." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" },
    ],
  }),
  loader: async () => await getConfig(),
  component: RootComponent,
});

function RootComponent() {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const isWorkspace = pathname.startsWith("/app");
  const isEditor = pathname === "/app/editor";
  const moreMenu = useRef<HTMLDetailsElement>(null);
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (moreMenu.current) moreMenu.current.open = false;
    if (mobileMenu.current) mobileMenu.current.open = false;
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      for (const menu of [moreMenu.current, mobileMenu.current]) if (menu?.open) {
        menu.open = false; menu.querySelector("summary")?.focus();
      }
    };
    const outside = (event: MouseEvent) => {
      for (const menu of [moreMenu.current, mobileMenu.current]) if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener("keydown", close); document.addEventListener("click", outside);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("click", outside); };
  }, []);
  const navigation = isWorkspace ? [
    { to: "/app", label: "Home" }, { to: "/app/editor", label: "My CV" },
    { to: "/app/applications", label: "Applications" }, { to: "/app/career", label: "Career paths" },
  ] : [
    { to: "/templates", label: "Templates" }, { to: "/blog", label: "Advice" }, { to: "/extension", label: "Extension" },
  ];
  const extra = isWorkspace ? [
    { to: "/app/templates", label: "Templates" }, { to: "/app/blog", label: "Advice & guides" },
    { to: "/app/toolkit", label: "CV tools" }, { to: "/app/extension", label: "Connect extension" },
    { to: "/app/settings/ai", label: "AI settings" }, { to: "/app/design-lab", label: "Design research" },
  ] : [{ to: "/resources", label: "Resources" }, { to: "/toolkit", label: "CV tools" }, { to: "/login", label: "Your workspace" }];
  const navLink = (item: { to: string; label: string }) => <Link key={item.to} to={item.to} activeOptions={{ exact: !item.to.endsWith("blog") }} aria-current={pathname === item.to || (item.to.endsWith("blog") && pathname.startsWith(item.to + "/")) ? "page" : undefined}>{item.label}</Link>;
  return <html lang="en" data-product="studio"><head><HeadContent /></head><body className="product-body">
    <a className="product-skip" href="#main-content">Skip to content</a>
    <div className={`product-shell ${isWorkspace ? "product-workspace" : "product-public"} ${isEditor ? "product-editor" : ""}`}>
      <header className="product-header no-print"><div className="product-header-inner">
        <Link to={isWorkspace ? "/app" : "/"} className="product-wordmark" aria-label="JobAI home"><svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 22 22 5M7 5h15v15" stroke="currentColor" strokeWidth="4" /><path d="M5 12v10h10" stroke="currentColor" strokeWidth="4" /></svg><span>JobAI</span></Link>
        <nav className="product-nav" aria-label="Main navigation">{navigation.map(navLink)}</nav>
        <div className="product-header-actions"><details ref={moreMenu} className="product-more"><summary>More <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg></summary><nav aria-label="More navigation">{extra.map(navLink)}</nav></details>
          {!isWorkspace && <Link to="/app" className="product-start-link">Start your CV <span aria-hidden="true">↗</span></Link>}
          <details ref={mobileMenu} className="product-mobile-menu"><summary aria-label="Open navigation"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg><span>Menu</span></summary><nav aria-label="Mobile navigation">{[...navigation, ...extra].map(navLink)}<Link to="/app">Start a CV</Link></nav></details>
        </div>
      </div></header>
      <main id="main-content" className="product-main" tabIndex={-1}><Outlet /></main>
      {!isEditor && <footer className="product-footer no-print"><span>Built around your next move.</span><nav aria-label="Footer navigation"><Link to="/app">Create a CV</Link><Link to="/templates">Templates</Link><Link to="/blog">Advice</Link><Link to="/app/settings/ai">AI settings</Link><details><summary>Privacy</summary><p>Your profile is saved in this browser. CV content is sent to your chosen AI provider only when you use an AI feature that requests it. This local preview has no account sign-in.</p></details></nav></footer>}
    </div><Scripts />
  </body></html>;
}
