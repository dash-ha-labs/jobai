import { useEffect, useState } from "react";
export type VisualTheme = "blueprint" | "neutral" | "signal";
const valid = (value: string | null): VisualTheme => value === "blueprint" || value === "signal" ? value : "neutral";
export function useVisualTheme() {
  const [theme, setTheme] = useState<VisualTheme>("neutral");
  useEffect(() => {
    const read = () => { try { setTheme(valid(localStorage.getItem("jobai_visual_theme"))); } catch { /* Optional visual preference. */ } };
    const sync = (event: Event) => setTheme(valid((event as CustomEvent<VisualTheme>).detail));
    read(); window.addEventListener("jobai-theme", sync);
    return () => window.removeEventListener("jobai-theme", sync);
  }, []);
  function choose(next: VisualTheme) {
    setTheme(next);
    try { localStorage.setItem("jobai_visual_theme", next); } catch { /* Theme still changes in this view. */ }
    window.dispatchEvent(new CustomEvent("jobai-theme", { detail: next }));
  }
  return [theme, choose] as const;
}
