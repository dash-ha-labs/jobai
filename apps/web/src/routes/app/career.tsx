import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/app/career")({ component: CareerPage });
const paths = {
  logistics: { label: "Logistics & operations", roles: ["Warehouse operative", "Senior operative", "Warehouse team leader", "Shift manager"], skills: ["Build experience in stock handling, order checking and safe working procedures.", "Learn new responsibilities and help colleagues follow established processes.", "Practice allocating tasks and supporting a team through a shift.", "Develop scheduling, safety and people-management skills." ] },
  business: { label: "Business & administration", roles: ["Administrative assistant", "Operations coordinator", "Operations manager", "Head of operations"], skills: ["Build confidence organising information and supporting colleagues.", "Take responsibility for a recurring project or team process.", "Learn planning, reporting and people-management skills.", "Connect operations to organisational goals and develop team leaders." ] },
  first: { label: "Starting out", roles: ["First role or placement", "Experienced team member", "Specialist or team lead", "Choose your next direction"], skills: ["Identify skills from study, volunteering, projects or part-time work.", "Build confidence with everyday tasks and ask for useful feedback.", "Explore whether you enjoy specialising, training or supporting others.", "Compare growing in your role, retraining or moving to a different field." ] },
  customer: { label: "Retail & customer service", roles: ["Support specialist", "Senior support specialist", "Customer experience lead", "Head of customer experience"], skills: ["Build confidence resolving a range of customer questions.", "Coach a colleague and improve a recurring support process.", "Lead a small team and learn how to plan service improvements.", "Connect customer feedback to business strategy and develop team leaders."] },
  design: { label: "Product design", roles: ["Product designer", "Senior product designer", "Design lead", "Head of design"], skills: ["Build a portfolio that explains your process and decisions.", "Own a complex project and practice research and facilitation.", "Guide a team and bring product partners into design decisions.", "Develop a design strategy and support other design leaders."] },
  engineering: { label: "Software engineering", roles: ["Software engineer", "Senior software engineer", "Staff engineer", "Principal engineer"], skills: ["Build reliable features and learn from code reviews.", "Own a system and help teammates make technical decisions.", "Solve problems across teams and document tradeoffs clearly.", "Guide long-term technical direction across several teams."] },
};
type PathKey = keyof typeof paths;
function CareerPage() {
  const [path, setPath] = useState<PathKey>("logistics");
  const [phase, setPhase] = useState<"choose" | "loading" | "result">("choose");
  const [activeRole, setActiveRole] = useState(1);
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => setPhase("result"), 1400);
    return () => window.clearTimeout(timer);
  }, [phase]);
  const selected = paths[path];
  return <PageLayout variant="fixed" title="Explore your next move." description="Different work opens different doors. Explore a direction that fits your interests." leading={<span className="journey-badge">Career explorer · Demo</span>}>
    <section className="career-intro"><div><span className="journey-eyebrow">A SPACE TO THINK AHEAD</span><h2>There’s more than one way forward.</h2><p>Try an example path to explore a few possible next roles and the skills that connect them. Your CV stays exactly as it is.</p></div><span className="career-constellation" aria-hidden="true">✦</span></section>
    <section className="career-picker" aria-labelledby="career-picker-title"><span className="journey-eyebrow">STEP 1 · CHOOSE A DIRECTION</span><h2 id="career-picker-title">What would you like to explore?</h2>
      <div className="career-options" role="group" aria-label="Career direction">{(Object.keys(paths) as PathKey[]).map(key => <button key={key} disabled={phase === "loading"} aria-pressed={path === key} onClick={() => { setPath(key); setPhase("choose"); setActiveRole(1); }}>{paths[key].label}<span aria-hidden="true">{path === key ? " ✓" : " ↗"}</span></button>)}</div>
      <div className="journey-actions"><button className="journey-button" disabled={phase === "loading"} onClick={() => setPhase("loading")}>{phase === "loading" ? "Exploring possibilities…" : "Explore this example path ✦"}</button><p className="journey-note">Illustrative examples · No AI connection required</p></div>
    </section>
    {phase === "loading" && <div className="career-loading" role="status"><span className="journey-orbit" aria-hidden="true">✦</span><h2>Connecting the next few dots…</h2><p>Preparing a sample journey in {selected.label.toLowerCase()}.</p></div>}
    {phase === "result" && <section className="career-result" aria-live="polite"><span className="journey-eyebrow">STEP 2 · EXPLORE THE POSSIBILITIES</span><h2>A possible path in {selected.label.toLowerCase()}</h2><p className="journey-note">These are fictional planning ranges, not predictions or labor-market estimates. Actual paths depend on your starting point, opportunities and preferences. Changing fields or growing in your current role are valid choices too.</p>
      <ol className="career-timeline">{selected.roles.map((role, index) => <li key={role}><button onClick={() => setActiveRole(index)} aria-pressed={activeRole === index}><span className="journey-step-number">0{index + 1}</span><small>{["Starting point", "Example: +2–4 years", "Example: +4–7 years", "Example: +7–10+ years"][index]}</small><h3>{role}</h3><span className="journey-text-button">Explore skills →</span></button></li>)}</ol>
      <div className="career-action"><span className="journey-eyebrow">STEP 3 · PICK ONE SMALL ACTION</span><h3>{selected.roles[activeRole]}</h3><p>{selected.skills[activeRole]}</p><p className="journey-note">Reflect on an example from your own experience. Add it to your CV only when it’s something you’ve actually done.</p><Link className="journey-button secondary" to="/app/editor">Return to my CV →</Link></div>
    </section>}
    <div className="journey-section-title mt-10"><Link className="journey-text-button" to="/app">← Back to your workspace</Link><Link className="journey-text-button" to="/app/blog">Explore practical advice →</Link></div>
  </PageLayout>;
}
