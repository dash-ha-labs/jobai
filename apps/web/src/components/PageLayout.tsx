import type { ReactNode } from "react";

export type PageLayoutVariant = "fixed" | "fluid";

const WIDTH: Record<PageLayoutVariant, string> = {
  fixed: "max-w-6xl mx-auto w-full",
  fluid: "w-full",
};

export function PageLayout({
  variant,
  title,
  titleAddon,
  description,
  leading,
  headerActions,
  children,
  className = "",
}: {
  variant: PageLayoutVariant;
  title?: string;
  titleAddon?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const showHeader = Boolean(title || description || headerActions || titleAddon);

  return (
    <div
      className={`${WIDTH[variant]} px-5 sm:px-9 lg:px-10 pt-12 pb-24 ${className}`.trim()}
    >
      {leading ? <div className="mb-4">{leading}</div> : null}

      {showHeader ? (
        <header className="border-b border-[#e8e7e2] pb-5 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 space-y-3">
              {title || titleAddon ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  {title ? (
                    <h1
                      className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292a27] font-heading"
                    >
                      {title}
                    </h1>
                  ) : null}
                  {titleAddon}
                </div>
              ) : null}
              {description ? (
                <div className="text-sm text-[#73736b] max-w-2xl leading-relaxed">{description}</div>
              ) : null}
            </div>
            {headerActions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{headerActions}</div> : null}
          </div>
        </header>
      ) : null}

      {children}
    </div>
  );
}
