import { createFileRoute, Link } from "@tanstack/react-router";
import { getChecklistBySlug } from "./content/checklists";

export const Route = createFileRoute("/resources/$slug")({
  head: ({ params }) => {
    const checklist = getChecklistBySlug(params.slug);
    return {
      meta: [
        {
          title: checklist
            ? `${checklist.title} — JobAI`
            : "Checklist not found — JobAI",
        },
        {
          name: "description",
          content: checklist?.excerpt ?? "Practical job-search checklists from JobAI.",
        },
      ],
    };
  },
  loader: ({ params }) => ({
    checklist: getChecklistBySlug(params.slug),
  }),
  component: ResourcesSlugPage,
  notFoundComponent: ResourcesNotFound,
});

function ResourcesSlugPage() {
  const { slug } = Route.useParams();
  const checklist = getChecklistBySlug(slug);

  if (!checklist) {
    return <ResourcesNotFound />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-9 lg:px-10 py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-sm text-[#73736b] hover:text-[#292a27] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8] rounded-sm"
        >
          <svg
            className="w-4 h-4 text-[#9b9a92]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to resources</span>
        </Link>
      </nav>

      <article className="mx-auto max-w-[65ch]" aria-labelledby="checklist-header-title">
        <header className="mb-8">
          <span className="inline-flex text-xs font-medium text-[#625181] bg-[#e8e3f1] px-2.5 py-0.5 rounded-full">
            Checklist
          </span>
          <h1
            id="checklist-header-title"
            className="mt-3 text-3xl sm:text-4xl font-medium tracking-tight text-[#292a27] font-heading leading-[1.2]"
          >
            {checklist.title}
          </h1>
          <p className="mt-4 text-lg text-[#5a5b54] leading-relaxed">{checklist.lead}</p>
        </header>

        <div className="space-y-10">
          {checklist.sections.map((section, idx) => (
            <section key={section.heading} aria-labelledby={`checklist-section-${idx}`}>
              <h2
                id={`checklist-section-${idx}`}
                className="text-xl sm:text-2xl font-medium text-[#292a27] font-heading tracking-tight mb-3"
              >
                {section.heading}
              </h2>
              {section.intro ? (
                <p className="text-[15px] sm:text-base text-[#41423c] leading-relaxed mb-4">
                  {section.intro}
                </p>
              ) : null}
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-[#e8e7e2] bg-[#fffefa] px-4 py-3 text-sm sm:text-[15px] text-[#41423c] leading-relaxed"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#e2ded5] bg-white"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-12 pt-8 border-t border-[#e8e7e2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[#292a27]">Use these steps on your current CV</h2>
            <p className="text-xs text-[#8c8d81] mt-0.5">
              Open the local workspace to import, edit, and keep a master copy before you tailor.
            </p>
          </div>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#41423c] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
          >
            <span>Open the app</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </footer>
      </article>
    </div>
  );
}

function ResourcesNotFound() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-9 lg:px-10 py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-medium tracking-tight text-[#292a27] font-heading mb-2">
          Checklist not found
        </h1>
        <p className="text-sm text-[#73736b] mb-6 leading-relaxed">
          That resources page does not exist. The checklists live on the hub.
        </p>
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 rounded-lg bg-[#30332d] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#41423c] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#9782d8]"
        >
          Return to resources
        </Link>
      </div>
    </div>
  );
}
