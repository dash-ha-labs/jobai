import { useEffect, useId, useState } from "react";
import "./welcome-companion.css";

interface WelcomeCompanionProps {
  mood?: "welcome" | "thinking" | "celebrate";
  className?: string;
}

/** A small, gender-neutral companion. Motion can always be stopped. */
export function WelcomeCompanion({ mood = "welcome", className = "" }: WelcomeCompanionProps) {
  const [paused, setPaused] = useState(false);
  const [motionOptIn, setMotionOptIn] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => { setPaused(preference.matches); setMotionOptIn(false); };
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  return <div className={`welcome-companion ${className}`} data-mood={mood} data-paused={paused} data-motion-opt-in={motionOptIn}>
    <svg viewBox="0 0 460 380" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{mood === "thinking" ? "A friendly companion thinking through the next step" : mood === "celebrate" ? "A friendly companion celebrating your progress" : "A friendly companion waving hello beside a path of stepping stones"}</title>
      <path d="M61 281C9 225 36 124 100 85C160 49 201 89 269 56C348 17 427 86 427 174C427 262 366 323 263 332C173 339 106 330 61 281Z" fill="#E7F1ED" />
      <path d="M88 302C143 289 190 306 238 293C286 280 296 252 360 249" fill="none" stroke="#FFF" strokeWidth="19" strokeLinecap="round" />
      <ellipse cx="138" cy="302" rx="33" ry="10" fill="#C1D8CD" />
      <ellipse cx="269" cy="286" rx="28" ry="9" fill="#BDD8E6" />
      <ellipse cx="363" cy="249" rx="31" ry="10" fill="#F3C2AE" />
      <g className="welcome-companion-spark" aria-hidden="true">
        <circle cx="345" cy="101" r="27" fill="#F7D9B9" />
        <path d="M345 64V57M345 145V138M309 101H302M388 101H381M319 75L314 70M375 131L370 126M370 76L375 71M319 127L314 132" stroke="#C58A59" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="welcome-companion-float" aria-hidden="true">
        <path d="M80 147C84 133 99 130 108 139C114 121 135 126 139 140C156 139 162 154 153 163H86C76 162 73 153 80 147Z" fill="#FFF" />
      </g>
      <ellipse cx="222" cy="282" rx="57" ry="12" fill="#B6CFC1" opacity=".6" />
      <g className="welcome-companion-body">
        <path d="M201 253L196 275L181 278M239 253L247 275L261 276" fill="none" stroke="#354B46" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M173 202C157 213 153 229 153 240" fill="none" stroke="#354B46" strokeWidth="8" strokeLinecap="round" />
        <g className="welcome-companion-wave">
          <path d="M271 202C296 195 301 177 301 155" fill="none" stroke="#354B46" strokeWidth="8" strokeLinecap="round" />
          <path d="M301 159L291 151M301 157L309 145" fill="none" stroke="#354B46" strokeWidth="6" strokeLinecap="round" />
        </g>
        <path d="M164 188C165 145 187 124 219 123C257 122 282 149 282 190L278 234C276 255 249 267 219 265C184 264 161 254 161 233Z" fill="#7FB6A0" />
        <path d="M176 172C179 151 193 138 213 136" fill="none" stroke="#A8D2BE" strokeWidth="7" strokeLinecap="round" />
        <g className="welcome-companion-eyes" fill="#263F36"><ellipse cx="202" cy="190" rx="4" ry="6" /><ellipse cx="240" cy="190" rx="4" ry="6" /></g>
        {mood === "thinking" ? <path d="M213 211C218 208 223 208 227 210" fill="none" stroke="#263F36" strokeWidth="3.5" strokeLinecap="round" /> : <path d="M210 208C216 218 229 218 235 207" fill="none" stroke="#263F36" strokeWidth="3.5" strokeLinecap="round" />}
        <ellipse cx="189" cy="207" rx="8" ry="4" fill="#C5DDC7" /><ellipse cx="252" cy="207" rx="8" ry="4" fill="#C5DDC7" />
      </g>
      {mood === "thinking" && <g className="welcome-companion-thought" fill="#5F91AB"><circle cx="300" cy="121" r="4" /><circle cx="312" cy="106" r="6" /><circle cx="328" cy="89" r="8" /></g>}
      {mood === "celebrate" && <g className="welcome-companion-confetti" fill="none" strokeWidth="5" strokeLinecap="round"><path d="M129 182L122 173M329 189L337 179" stroke="#D9967B" /><path d="M151 105L144 93M298 80L302 65" stroke="#709FB6" /><path d="M114 224L104 227M354 222L364 221" stroke="#7FB6A0" /></g>}
      <path d="M365 240V217M365 226C350 226 350 215 350 212C360 212 365 217 365 226ZM365 232C379 230 381 219 381 216C370 217 365 223 365 232Z" fill="#81A991" stroke="#81A991" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <button className="welcome-motion-control" type="button" onClick={() => { setMotionOptIn(paused); setPaused(value => !value); }} aria-label={paused ? "Play character animation" : "Pause character animation"} aria-pressed={paused}>
      <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span> {paused ? "Play motion" : "Pause motion"}
    </button>
  </div>;
}
