import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { PageLayout } from "../components/PageLayout";
import { useEffect, useRef, useState } from "react";
import "../components/welcome-companion.css";


interface SearchParams {
  template?: string;
  view?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      template: typeof search.template === "string" ? search.template : undefined,
      view: typeof search.view === "string" ? search.view : undefined,
    };
  },
  beforeLoad: ({ search }) => {
    // Legacy deep links compatibility: redirect ?view=editor or ?view=overview to canonical /app routes
    if (search.view === "editor") {
      throw redirect({
        to: "/app/editor",
        search: { template: search.template },
        statusCode: 307,
      });
    }
    if (search.view === "overview") {
      throw redirect({
        to: "/app",
        statusCode: 307,
      });
    }
  },
  component: PublicLandingComponent,
});

const journeySteps = [
  { title: "Bring your experience", description: "Upload your CV or start with your work, skills and education." },
  { title: "Make the words work", description: "Review suggestions, edit the details and keep your voice." },
  { title: "Make it ready to send", description: "Choose a layout, save your profile and download your CV." },
];
const wordingExamples = [
  { role: "Warehouse operations", before: "Checked deliveries and put stock away before each shift.", after: "Checked incoming deliveries and organised stock ahead of each shift." },
  { role: "Customer service", before: "Helped customers with questions and showed new starters what to do.", after: "Answered customer questions and helped new team members learn the role." },
  { role: "Software development", before: "Fixed bugs in the booking form and wrote tests for the fixes.", after: "Resolved booking-form bugs and added tests to cover each fix." },
];

export function PublicLandingComponent() {
  const [step, setStep] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [exampleVisible, setExampleVisible] = useState(false);
  const wordingResult = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = wordingResult.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") { setExampleVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        setExampleVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [exampleIndex]);
  const example = wordingExamples[exampleIndex];

  return <PageLayout variant="fluid" className="welcome-landing">
    <section className="welcome-landing-hero" aria-labelledby="hero-heading">
      <div>
        <p className="welcome-landing-eyebrow">A better way to build your CV</p>
        <h1 id="hero-heading">Your experience.<br />Ready for your<br /><span>next role.</span></h1>
        <p className="welcome-landing-intro">Turn the work you’ve done into a CV you’re ready to send. Clear writing, thoughtful layouts and a profile that grows with you.</p>
        <Link to="/app" className="welcome-landing-primary">Start your CV <span aria-hidden="true">→</span></Link>
        <p className="welcome-landing-note">Upload an existing CV or start fresh. No extension needed.</p>
      </div>
      <div className="welcome-wording" aria-label="Example of a writing suggestion">
        <div className="welcome-wording-heading"><span>Good experience. Clearer words.</span><span className="welcome-wording-index">0{exampleIndex + 1} / 03</span></div>
        <div className="welcome-wording-example" key={exampleIndex}>
          <p className="welcome-wording-label">{example.role} · fictional example</p>
          <div className="welcome-wording-before"><span>Your starting point</span><p>{example.before}</p></div>
          <div className="welcome-wording-after" ref={wordingResult} data-revealed={exampleVisible}><span><span aria-hidden="true">↳</span> A clearer version</span><p>{example.after}</p></div>
        </div>
        <div className="welcome-wording-footer"><p>Same experience. You choose the words.</p><button type="button" onClick={() => { setExampleVisible(false); setExampleIndex(index => (index + 1) % wordingExamples.length); }}>Try another example <span aria-hidden="true">↻</span></button></div>
      </div>
    </section>
    <div className="welcome-landing-audience"><p>Built for working life.</p><span>First jobs</span><span>Creative careers</span><span>Skilled trades</span><span>Office roles</span><span>New directions</span></div>
    <section id="workflow" className="welcome-landing-path" aria-labelledby="journey-heading">
      <div className="welcome-landing-section-heading"><h2 id="journey-heading">From experience to application.</h2><p>Three straightforward steps. Your decisions throughout.</p></div>
      <ol className="welcome-landing-steps">{journeySteps.map((item, index) => <li key={item.title}>
        <button type="button" className="welcome-landing-step" aria-pressed={step === index} onClick={() => setStep(index)} aria-controls="journey-example">
          <span className="welcome-landing-step-number">0{index + 1}</span><strong>{item.title}</strong><span className="welcome-landing-step-description">{item.description}</span><span className="welcome-landing-step-link">See how it works <span aria-hidden="true">↗</span></span>
        </button>
      </li>)}</ol>
      <div id="journey-example" className="welcome-landing-demo" key={step} aria-live="polite">
        {step === 0 ? <><h3>Start with what you already have.</h3><p>Upload a CV to bring your details into the editor, or build from a blank structure. Work experience, practical skills, projects and education all have a place.</p><Link to="/app" className="welcome-landing-text-link">Choose your starting point →</Link></> : step === 1 ? <><h3>Review the changes. Keep your voice.</h3><p>AI can help you describe your work more clearly. Review each suggestion before using it, edit anything that needs context and leave out anything that doesn’t represent you.</p><Link to="/blog/$slug" params={{ slug: "write-experience-bullets-that-show-contribution" }} className="welcome-landing-text-link">Read the writing guide →</Link></> : <><h3>Choose a layout that fits your work.</h3><p>When the content is ready, customise your layout and check the result. Save your profile to return to it, then download your finished CV.</p><Link to="/templates" className="welcome-landing-text-link">Explore the layouts →</Link></>}
      </div>
    </section>
    <section className="welcome-landing-trust">
      <div id="ai-freedom"><h3>Your experience stays the source.</h3><p>Writing help should make your work easier to understand. You review every suggestion and decide what belongs in your CV.</p><Link to="/blog/$slug" params={{ slug: "tailor-your-cv-without-inventing-experience" }} className="welcome-landing-text-link">Keep your CV honest and relevant →</Link></div>
      <div id="extension"><h3>Found a role worth applying for?</h3><p>Bring the job description to your workspace and tailor a copy of your CV. Connect the optional browser extension when you’re ready.</p><Link to="/extension" className="welcome-landing-text-link">See how the extension works →</Link></div>
    </section>
  </PageLayout>;
}
