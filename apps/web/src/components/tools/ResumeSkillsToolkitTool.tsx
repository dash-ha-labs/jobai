import { useMemo, useState } from "react";
import type { ResumeSkillsToolDef } from "./resume-skills-registry";

const fieldClass =
  "w-full rounded-xl border border-[#dcd9ce] bg-[#faf9f6] p-3.5 text-sm text-[#292a27] focus:border-[#9782d8] focus:outline-none focus:ring-1 focus:ring-[#9782d8] transition leading-relaxed font-sans";

export function ResumeSkillsToolkitTool({ tool }: { tool: ResumeSkillsToolDef }) {
  const initial = useMemo(() => {
    const v: Record<string, string> = {};
    for (const f of tool.fields) v[f.id] = "";
    return v;
  }, [tool]);

  const [values, setValues] = useState(initial);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setOutput(null);
    setError(null);
  }

  function onGenerate() {
    for (const f of tool.fields) {
      if (f.required && !values[f.id]?.trim()) {
        setError(`“${f.label}” is required.`);
        setOutput(null);
        return;
      }
    }
    setError(null);
    setOutput(tool.generate(values));
  }

  return (
    <div className="rounded-3xl border border-[#e2ded5] bg-[#fffefa] p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-4">
        {tool.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={`rs-${tool.slug}-${field.id}`} className="block text-xs font-medium text-[#41423c]">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={`rs-${tool.slug}-${field.id}`}
                rows={field.rows ?? 4}
                value={values[field.id] ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={fieldClass}
              />
            ) : field.type === "text" ? (
              <input
                id={`rs-${tool.slug}-${field.id}`}
                type="text"
                value={values[field.id] ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={fieldClass}
              />
            ) : (
              <input
                id={`rs-${tool.slug}-${field.id}`}
                type="file"
                accept={field.accept ?? ".txt,.pdf"}
                className="block w-full text-sm text-[#52534a] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f4f3ee] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#292a27]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setField(field.id, "");
                    return;
                  }
                  if (!file.name.toLowerCase().endsWith(".txt")) {
                    setError("For this preview, paste plain text or use PDF Text Preview for PDFs.");
                    setField(field.id, "");
                    return;
                  }
                  void file.text().then((text) => setField(field.id, text));
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex items-center justify-center rounded-xl bg-[#292a27] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#41423c] transition cursor-pointer"
        >
          Generate preview
        </button>
        <p className="text-xs text-[#73736b]">Runs locally — mock output until AI is connected in settings.</p>
      </div>

      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="alert">
          {error}
        </p>
      )}

      {output && (
        <div className="rounded-2xl border border-[#e8e5dc] bg-[#f8f7f2] p-5 space-y-3">
          <div className="text-xs font-semibold text-[#292a27] uppercase tracking-wider font-heading">
            Preview output
          </div>
          <pre className="whitespace-pre-wrap text-sm text-[#292a27] leading-relaxed font-sans">{output}</pre>
        </div>
      )}
    </div>
  );
}

export default ResumeSkillsToolkitTool;
