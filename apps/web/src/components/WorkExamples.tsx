import { useEffect, useState } from "react";
import { WORK_PROFILES, type WorkProfile } from "../content/work-profiles";

export function ResumeExample({ profile, improved = false }: { profile: WorkProfile; improved?: boolean }) {
  return <div className={`work-resume work-resume--${profile.id}`}>
    <div className="work-resume-top"><span>{profile.initials}</span><small>CV / 01</small></div>
    <h3>{profile.name}</h3><p className="work-resume-role">{profile.role}</p>
    <div className="work-resume-contact">City, Country <span>·</span> name@example.com</div>
    <section><h4>{profile.section}</h4><strong>{profile.context}</strong><p>{improved ? profile.after : profile.before}</p></section>
    <section><h4>{profile.id === "first-job" ? "TRANSFERABLE SKILLS" : "RELEVANT SKILLS"}</h4><div className="work-skill-list">{profile.skills.map(skill => <span key={skill}>{skill}</span>)}</div></section>
    <div className="work-resume-lines" aria-hidden="true"><i /><i /><i /></div>
    <footer>EXAMPLE CV <span>Made with jobai.</span></footer>
  </div>;
}

export function WorkExamples({ onProfileChange, onStart, initialProfile = "logistics" }: { onProfileChange?: (profile: WorkProfile) => void; onStart?: (profile: WorkProfile) => void; initialProfile?: string }) {
  const [profileId, setProfileId] = useState(initialProfile);
  const [phase, setPhase] = useState<"idle" | "reading" | "review">("idle");
  const [accepted, setAccepted] = useState(false);
  const profile = WORK_PROFILES.find(p => p.id === profileId) || WORK_PROFILES[4];
  useEffect(() => {
    if (phase !== "reading") return;
    const timer = window.setTimeout(() => setPhase("review"), 1600);
    return () => window.clearTimeout(timer);
  }, [phase]);
  function choose(next: WorkProfile) {
    setProfileId(next.id); setPhase("idle"); setAccepted(false); onProfileChange?.(next);
  }
  return <section className="work-examples" aria-labelledby="work-examples-title">
    <div className="work-section-heading"><div><span className="work-kicker">DIFFERENT WORK. SAME POTENTIAL.</span><h2 id="work-examples-title">A CV for the work you do.</h2></div><p>Choose a starting point. See what to highlight.</p></div>
    <div className="work-profile-tabs" role="group" aria-label="Choose your kind of work">
      {WORK_PROFILES.map(p => <button key={p.id} aria-pressed={p.id === profileId} onClick={() => choose(p)}>{p.label}{p.id === profileId && <span aria-hidden="true">↗</span>}</button>)}
    </div>
    <div className="work-example-grid">
      <div className="work-example-guidance" key={profileId}>
        <span className="work-example-index">0{WORK_PROFILES.indexOf(profile) + 1} / YOUR EXPERIENCE COUNTS</span>
        <h3>{profile.focus}</h3><p>{profile.help}</p>
        <ul>{profile.skills.map(skill => <li key={skill}><span aria-hidden="true">↗</span>{skill}</li>)}</ul>
        {onStart && <button className="work-primary work-profile-start" onClick={() => onStart(profile)}>Start with this structure <span aria-hidden="true">→</span></button>}
        <div className="work-ai-example">
          <div className="work-ai-example-label"><span className="work-ai-mark" aria-hidden="true">✳</span><strong>Find the words. Keep the facts.</strong><small>DEMO</small></div>
          {phase === "idle" ? <><p>See how a small edit can make your experience easier to read.</p><button className="work-text-link" onClick={() => setPhase("reading")}>Try a writing suggestion <span aria-hidden="true">→</span></button></> : phase === "reading" ? <div role="status" className="work-analysis"><div className="work-analysis-bar" /><p>Reading the example and finding clearer wording…</p></div> : <div className="work-suggestion" aria-live="polite">
            <small>ORIGINAL</small><p>{profile.before}</p><small>SUGGESTED</small><p className="work-suggested-copy">{profile.after}</p>
            <button className="work-text-link" aria-pressed={accepted} onClick={() => setAccepted(!accepted)}>{accepted ? "✓ Applied to example · Undo" : "Use this in the example →"}</button>
          </div>}
          <p className="work-demo-note">Fictional example. Your own CV isn’t changed.</p>
        </div>
      </div>
      <div className="work-document-stage"><span className="work-document-caption">YOUR EXPERIENCE, IN FOCUS</span><div className="work-document-wrap" key={profileId}><ResumeExample profile={profile} improved={accepted} /></div><div className="work-document-label"><span className="work-mini-dot" /> {accepted ? "Wording updated. Same experience." : "Clear structure. Room for your strengths."}</div></div>
    </div>
  </section>;
}
