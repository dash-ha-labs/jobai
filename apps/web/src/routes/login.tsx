import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "../components/PageLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Open your workspace — JobAI" },
      {
        name: "description",
        content: "Open your local JobAI workspace in this browser, or explore CV templates.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <PageLayout variant="fluid" className="flex min-h-[64vh] items-center justify-center py-8 sm:py-12">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-2xl rounded-2xl border border-[#d9e0e9] bg-white p-6 shadow-[0_16px_48px_rgba(23,33,47,0.07)] sm:p-9"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#d9e0e9] bg-[#f4f7fb] px-3 py-1.5 text-sm font-semibold tracking-wide text-[#245bd7]">
          <span className="h-2 w-2 rounded-full bg-[#245bd7]" aria-hidden="true" />
          LOCAL PREVIEW
        </div>

        <h1 id="login-title" className="max-w-md font-heading text-3xl font-semibold tracking-[-0.035em] text-[#17212f] sm:text-4xl">
          Open your workspace
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-[#536174]">
          Continue to the JobAI workspace saved in this browser, or browse the available CV layouts first.
        </p>

        <div className="mt-6 rounded-xl border border-[#d9e0e9] border-l-4 border-l-[#245bd7] bg-[#f7f9fc] p-4 sm:p-5">
          <h2 className="text-base font-semibold text-[#17212f]">Account sign-in is not available in this preview</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#536174]">
            No account or password is created here. Continue to the local workspace saved in this browser.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/app"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#245bd7] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#1949b7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245bd7] focus-visible:ring-offset-2"
          >
            Continue in this browser
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/templates"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d9e0e9] bg-white px-5 py-3 text-base font-medium text-[#17212f] transition hover:bg-[#f4f7fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245bd7] focus-visible:ring-offset-2"
          >
            Explore templates
          </Link>
        </div>

        <p className="mt-5 text-center text-sm text-[#68768a]">
          Your CV profile stays saved in this browser.
        </p>
      </section>
    </PageLayout>
  );
}
