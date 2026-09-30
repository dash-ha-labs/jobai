import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { WORK_PROFILES, type WorkProfile } from "../content/work-profiles";
import "./cv-journey.css";

function UploadIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function WritingExample() {
  const [profileId, setProfileId] = useState("service");
  const [phase, setPhase] = useState<"idle" | "reading" | "ready">("idle");
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const suggestionArea = useRef<HTMLDivElement>(null);
  const [decision, setDecision] = useState<"used" | "kept" | null>(null);
  const profile = WORK_PROFILES.find(item => item.id === profileId) || WORK_PROFILES[5];
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const target = suggestionArea.current;
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      setIsVisible(entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35));
    }, { threshold: 0.35 });
    if (target) observer?.observe(target);
    // The explicit Start example button also works when observation is unavailable.
    return () => { observer?.disconnect(); preference.removeEventListener("change", updatePreference); };
  }, []);
  useEffect(() => {
    if (phase === "idle" && isVisible) setPhase(reducedMotion ? "ready" : "reading");
  }, [isVisible, phase, reducedMotion]);
  useEffect(() => {
    if (phase !== "reading") return;
    if (reducedMotion) { setPhase("ready"); return; }
    const timer = window.setTimeout(() => setPhase("ready"), 1800);
    return () => window.clearTimeout(timer);
  }, [phase, profileId, reducedMotion]);
  return <section className="cv-wording-demo" aria-labelledby="wording-title">
    <div className="cv-wording-heading"><div><span className="cv-example-label">TRY A WRITING EXAMPLE</span><h2 id="wording-title">Your experience, better expressed.</h2></div><label className="cv-example-select">Example for<select value={profileId} onChange={event => { setProfileId(event.target.value); setDecision(null); setPhase("idle"); }}>{WORK_PROFILES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
    <div className="cv-wording-grid"><div className="cv-original"><span>Original</span><p>{profile.before}</p></div><div className="cv-suggestion" ref={suggestionArea}><span className="cv-suggestion-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3z" /></svg> {decision === "kept" ? "Your original, kept" : "Suggested wording"}</span>{phase === "idle" ? <p className="cv-example-waiting">See how a clearer version takes shape.</p> : phase === "reading" ? <div key={profileId + phase} className="cv-rewrite-progress" role="status"><p>Finding a clearer way to say it…</p><div className="cv-rewrite-track"><i /></div></div> : <p key={profileId + phase} className="cv-rewritten" role="status">{decision === "kept" ? profile.before : profile.after}</p>}</div></div>
    <div className="cv-demo-footer"><p>{decision === "used" ? "Suggestion applied to this example." : decision === "kept" ? "Original wording kept in this example." : "Same facts. Clearer wording. You choose what stays."}<span>Simulated example — your CV isn’t changed.</span></p><div>{phase === "idle" ? <button className="cv-outline-button" onClick={() => setPhase(reducedMotion ? "ready" : "reading")}>Start example →</button> : phase === "ready" && !decision ? <><button className="cv-text-button" onClick={() => setDecision("kept")}>Keep original</button><button className="cv-outline-button" onClick={() => setDecision("used")}>Use suggestion <span aria-hidden="true">✓</span></button></> : phase === "ready" ? <button className="cv-text-button" onClick={() => { setDecision(null); setPhase(reducedMotion ? "ready" : "reading"); }}>Replay example ↻</button> : null}</div></div>
  </section>;
}

export function CvJourney({ onUpload, onPaste, onBlank, hasCV, name, sectionCount = 0 }: {
  onUpload: (file?: File) => void; onPaste: () => void;
  onBlank: (template?: string, track?: string) => void;
  hasCV: boolean; name?: string; sectionCount?: number;
}) {
  const [choosingStructure, setChoosingStructure] = useState(false);
  const [profile, setProfile] = useState<WorkProfile | null>(null);
  const [dragging, setDragging] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const changedStep = useRef(false);
  useEffect(() => {
    if (changedStep.current) heading.current?.focus({ preventScroll: true });
    changedStep.current = true;
  }, [choosingStructure]);
  return <div className="cv-start-page">
    <header className="cv-page-title">
      {choosingStructure && <button className="cv-back-button" onClick={() => setChoosingStructure(false)}>← Back to getting started</button>}
      <div><h1 ref={heading} tabIndex={-1}>{choosingStructure ? "Give your CV a starting point." : hasCV ? `Your next move${name ? `, ${name.split(" ")[0]}` : ""}.` : "Create a CV that opens doors."}</h1><p>{choosingStructure ? "Choose the kind of work that fits. We’ll organize the blank sections for you." : "Bring your experience. Find the right words. Make it yours."}</p></div>
    </header>
    {choosingStructure ? <section className="cv-structure-panel" aria-label="Choose a starting structure"><div className="cv-role-grid">{WORK_PROFILES.map(item => <button key={item.id} aria-pressed={profile?.id === item.id} onClick={() => setProfile(item)}><span>{item.label}</span><span aria-hidden="true">{profile?.id === item.id ? "✓" : "↗"}</span></button>)}</div><div className="cv-structure-help" aria-live="polite">{profile ? <><h2>{profile.focus}</h2><p>{profile.help}</p></> : <><h2>Every kind of experience counts.</h2><p>Work, training, projects and volunteering can all belong on a CV. You can also continue with a general structure.</p></>}</div><div className="cv-structure-actions"><p>You can change the sections later.</p><button className="cv-primary-button" onClick={() => onBlank(profile?.template || "modern", profile?.id)}>Continue to my details <span aria-hidden="true">→</span></button></div></section> : <>
      <div className="cv-entry-options">
        <section className="cv-import-card" aria-labelledby="cv-import-title"><div className="cv-card-heading"><span className="cv-icon-tile"><UploadIcon /></span><div><h2 id="cv-import-title">{hasCV ? "Pick up where you left off." : "Already have a CV?"}</h2><p>{hasCV ? "Your saved profile is ready for your next application." : "Turn your current CV into a stronger one."}</p></div></div>
          {hasCV ? <div className="cv-saved-profile"><div><strong>{name || "My CV"}</strong><p>{sectionCount} sections · Saved in this browser</p></div><Link to="/app/editor" className="cv-primary-button">Continue editing <span aria-hidden="true">→</span></Link></div> : <button className="cv-upload-target" data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) onUpload(file); }} onClick={() => onUpload()}><span className="cv-upload-title">{dragging ? "Drop your CV to get started" : "Drop your CV here"}</span><span className="cv-file-types">PDF, Word or text · Up to 5 MB</span><span className="cv-upload-action">Choose a file <span aria-hidden="true">↑</span></span></button>}
          <div className="cv-import-alternatives"><span>We’ll help you review and improve it.</span><button className="cv-text-button" onClick={onPaste}>Paste text instead</button></div>
        </section>
        <section className="cv-scratch-card" aria-labelledby="cv-scratch-title"><div className="cv-scratch-art" aria-hidden="true"><svg viewBox="0 0 120 64" fill="none"><path d="M11 50h85M17 35h54M17 19h31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path className="cv-pencil-line" d="m68 29 25-25 13 13-25 25-18 5 5-18Z" fill="#fff" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="m90 8 12 12M67 33l11 10" stroke="currentColor" strokeWidth="2.5" /></svg></div><h2 id="cv-scratch-title">Start with a blank page.</h2><p>First job or a fresh direction. Build a CV around the experience you bring.</p><button className="cv-dark-button" onClick={() => setChoosingStructure(true)}>Build my CV <span aria-hidden="true">→</span></button><span className="cv-scratch-note">No existing CV needed.</span></section>
      </div>
      <div className="cv-next-strip" aria-label="What happens next"><strong>A clear way forward</strong><ol><li><span>1</span>Add your experience</li><li><span>2</span>Review the wording</li><li><span>3</span>Choose a layout & save</li></ol></div>
      <WritingExample />
    </>}
    <footer className="cv-start-footer"><span>Your profile stays in this browser.</span><Link to="/app/career">Explore career paths <span aria-hidden="true">↗</span></Link><Link to="/app/extension">Connect the optional extension <span aria-hidden="true">↗</span></Link></footer>
  </div>;
}
