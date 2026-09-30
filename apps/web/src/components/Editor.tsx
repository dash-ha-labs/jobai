import { useState } from "react";
import type { CV, CVSection, CVSectionItem, CVSectionType, CVStylePrefs } from "jobai-shared";
import { CV_TEMPLATES } from "jobai-shared";
import { TemplateThumbnail } from "../lib/cv-templates/thumbnail";

interface EditorProps {
  cv: CV;
  onChange: (updatedCv: CV) => void;
  onSave?: () => void;
  onReset?: () => void;
  onConnectExtension?: () => void;
  onUploadCV?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "unsaved";
  storageError?: string | null;
  validationErrors?: string[];
}

export function Editor({
  cv,
  onChange,
  onSave: _onSave,
  onReset: _onReset,
  onConnectExtension: _onConnectExtension,
  onUploadCV: _onUploadCV,
  saveStatus: _saveStatus,
  storageError,
  validationErrors = [],
}: EditorProps) {
  const [activeTab, setActiveTab] = useState<"content" | "styles">("content");
  const exampleSuggestion =
    "[Role or specialty] with experience in [area of work]. Known for [strength or approach], with a focus on [kind of impact].";

  // Update contact field
  const handleContactChange = (field: keyof CV["contact"], value: string) => {
    onChange({
      ...cv,
      contact: {
        ...cv.contact,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Update summary
  const handleSummaryChange = (value: string) => {
    onChange({
      ...cv,
      summary: value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update style preferences
  const handleStylePrefChange = (field: keyof CVStylePrefs, value: string) => {
    onChange({
      ...cv,
      stylePrefs: {
        ...cv.stylePrefs,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // SECTION OPERATIONS
  const addSection = (type: CVSectionType) => {
    const titles: Record<CVSectionType, string> = {
      experience: "Work Experience",
      education: "Education",
      skills: "Skills & Proficiencies",
      projects: "Key Projects",
      custom: "Additional Information",
    };

    const newSection: CVSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: titles[type] || "New Section",
      items: [],
      ...(type === "custom" ? { customType: "Certifications" } : {}),
    };

    onChange({
      ...cv,
      sections: [...cv.sections, newSection],
      updatedAt: new Date().toISOString(),
    });
  };

  const removeSection = (sectionId: string) => {
    onChange({
      ...cv,
      sections: cv.sections.filter((s) => s.id !== sectionId),
      updatedAt: new Date().toISOString(),
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    // ponytail: section reorder uses in-memory array splice; upgrade to drag-and-drop pointer sensors when touch sorting requested.
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cv.sections.length) return;

    const updated = [...cv.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onChange({
      ...cv,
      sections: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateSection = (sectionId: string, updates: Partial<CVSection>) => {
    onChange({
      ...cv,
      sections: cv.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
      updatedAt: new Date().toISOString(),
    });
  };

  // ITEM OPERATIONS
  const addItem = (sectionId: string) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    if (!targetSec) return;

    const newItem: CVSectionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "",
      subtitle: "",
      date: "",
      description: "",
      bullets: [],
    };

    updateSection(sectionId, {
      items: [...targetSec.items, newItem],
    });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    if (!targetSec) return;

    updateSection(sectionId, {
      items: targetSec.items.filter((i) => i.id !== itemId),
    });
  };

  const moveItem = (sectionId: string, itemIndex: number, direction: "up" | "down") => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    if (!targetSec) return;

    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= targetSec.items.length) return;

    const updatedItems = [...targetSec.items];
    const [moved] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(targetIndex, 0, moved);

    updateSection(sectionId, {
      items: updatedItems,
    });
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<CVSectionItem>) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    if (!targetSec) return;

    updateSection(sectionId, {
      items: targetSec.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
    });
  };

  // BULLET OPERATIONS
  const addBullet = (sectionId: string, itemId: string) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    const targetItem = targetSec?.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const bullets = [...(targetItem.bullets || []), ""];
    updateItem(sectionId, itemId, { bullets });
  };

  const updateBullet = (sectionId: string, itemId: string, bulletIndex: number, value: string) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    const targetItem = targetSec?.items.find((i) => i.id === itemId);
    if (!targetItem || !targetItem.bullets) return;

    const bullets = [...targetItem.bullets];
    bullets[bulletIndex] = value;
    updateItem(sectionId, itemId, { bullets });
  };

  const removeBullet = (sectionId: string, itemId: string, bulletIndex: number) => {
    const targetSec = cv.sections.find((s) => s.id === sectionId);
    const targetItem = targetSec?.items.find((i) => i.id === itemId);
    if (!targetItem || !targetItem.bullets) return;

    const bullets = targetItem.bullets.filter((_, idx) => idx !== bulletIndex);
    updateItem(sectionId, itemId, { bullets });
  };

  return (
    <div className="editor-studio-inspector">
      <div
        className="studio-tabs"
        role="tablist"
        aria-label="Editor tabs"
      >
        <button
          type="button"
          role="tab"
          id="tab-content"
          aria-selected={activeTab === "content"}
          aria-controls="panel-content"
          onClick={() => setActiveTab("content")}
          className={`studio-tab ${
            activeTab === "content"
              ? "text-[#191b20] font-semibold"
              : "text-[#636c7a] hover:text-[#191b20]"
          }`}
        >
          <span>Content</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-styles"
          aria-selected={activeTab === "styles"}
          aria-controls="panel-styles"
          onClick={() => setActiveTab("styles")}
          className={`studio-tab ${
            activeTab === "styles"
              ? "text-[#191b20] font-semibold"
              : "text-[#636c7a] hover:text-[#191b20]"
          }`}
        >
          <span>Design &amp; Spacing</span>
        </button>
      </div>

      {/* Storage Error Alert */}
      {storageError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
          <span className="font-semibold">Storage Error:</span>
          <span>{storageError} (edits remain in memory)</span>
        </div>
      )}

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Please complete required fields before saving:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Tab Panels */}
      <div>
        {activeTab === "styles" ? (
          <div id="panel-styles" role="tabpanel" aria-labelledby="tab-styles">
            <StyleControls
              stylePrefs={cv.stylePrefs || {}}
              onChange={handleStylePrefChange}
            />
          </div>
        ) : (
          <div id="panel-content" role="tabpanel" aria-labelledby="tab-content" className="space-y-6">
            {/* Contact Details */}
            <nav className="studio-section-nav" aria-label="CV sections">
              <a href="#contact-details">Contact details</a>
              <a href="#professional-summary">Summary</a>
              {cv.sections.map((section, index) => <a key={section.id} href={`#studio-section-${index}`}>{section.title || section.type}</a>)}
            </nav>
            <section id="contact-details" className="studio-content-section">
              <h2>
                Contact Details
              </h2>
              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3f4753]">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    aria-label="Full name"
                    value={cv.contact.name}
                    onChange={(e) => handleContactChange("name", e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs text-[#191b20] transition-colors focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] ${
                      validationErrors.some((e) => e.toLowerCase().includes("name"))
                        ? "border-rose-300 bg-rose-50/40"
                        : "border-[#c5cbd4] bg-white hover:border-[#c5cbd4]"
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3f4753]">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    aria-label="Email address"
                    value={cv.contact.email}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    placeholder="e.g. alex.morgan@example.com"
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs text-[#191b20] transition-colors focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)] ${
                      validationErrors.some((e) => e.toLowerCase().includes("email"))
                        ? "border-rose-300 bg-rose-50/40"
                        : "border-[#c5cbd4] bg-white hover:border-[#c5cbd4]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#3f4753]">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      aria-label="Phone number"
                    value={cv.contact.phone || ""}
                      onChange={(e) => handleContactChange("phone", e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      className="w-full rounded-lg border border-[#c5cbd4] bg-white px-3 py-1.5 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#3f4753]">
                      Location
                    </label>
                    <input
                      type="text"
                      aria-label="Location"
                    value={cv.contact.location || ""}
                      onChange={(e) => handleContactChange("location", e.target.value)}
                      placeholder="e.g. London, UK"
                      className="w-full rounded-lg border border-[#c5cbd4] bg-white px-3 py-1.5 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3f4753]">
                    Website / Portfolio
                  </label>
                  <input
                    type="text"
                    aria-label="Website or portfolio"
                    value={cv.contact.website || ""}
                    onChange={(e) => handleContactChange("website", e.target.value)}
                    placeholder="e.g. https://alexmorgan.dev"
                    className="w-full rounded-lg border border-[#c5cbd4] bg-white px-3 py-1.5 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                  />
                </div>
              </div>
            </section>

            {/* Professional Summary */}
            <section id="professional-summary" className="studio-content-section">
              <div className="flex items-center justify-between">
                <h2>
                  Professional Summary
                </h2>
                <span className="text-[11px] text-[#8b939f]">Optional</span>
              </div>
              <textarea
                aria-label="Professional summary"
                value={cv.summary || ""}
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="A concise overview of your background, key achievements, and core specializations..."
                rows={3}
                className="w-full rounded-lg border border-[#c5cbd4] bg-white px-3 py-2 text-xs leading-relaxed text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
              <div className="rounded-xl border border-[var(--ui-accent-soft)] bg-[var(--ui-accent-soft)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[var(--ui-accent)]">Example AI suggestion · preview</span>
                  <span className="rounded-full bg-[var(--ui-accent-soft)] px-2 py-0.5 text-[10px] text-[var(--ui-accent)]">Mock example</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#555159]">{exampleSuggestion}</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-[#817b88]">
                  A fill-in framework only. Add your own facts; this example does not supply credentials or experience.
                </p>
                <button
                  type="button"
                  onClick={() => handleSummaryChange(exampleSuggestion)}
                  disabled={Boolean(cv.summary?.trim())}
                  className="mt-2 rounded-lg border border-[var(--ui-accent-soft)] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cv.summary?.trim() ? "Clear summary to try example" : "Apply example to empty summary"}
                </button>
                <p className="mt-1 text-[10px] text-[#817b88]">Review and edit it before saving. Existing text is never replaced.</p>
              </div>
            </section>

            {/* Document Sections */}
            <section id="document-sections" className="studio-content-section">
              <div className="studio-section-heading">
                <div className="flex items-center justify-between">
                  <h2>
                    Document Sections
                  </h2>
                </div>

                {/* Compact Add Section Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-0.5 text-[11px] text-[#8b939f]">Add:</span>
                  {(
                    [
                      { type: "experience", label: "+ Experience" },
                      { type: "education", label: "+ Education" },
                      { type: "skills", label: "+ Skills" },
                      { type: "projects", label: "+ Projects" },
                      { type: "custom", label: "+ Custom" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => addSection(btn.type)}
                      className="rounded border border-[#e3e6eb] bg-[#f1f3f6] px-2 py-1 text-xs font-medium text-[#3f4753] transition-colors hover:border-[#c5cbd4] hover:bg-[#e3e6eb] cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {cv.sections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#c5cbd4] p-6 text-center text-xs text-[#8b939f]">
                  No sections added yet. Click one of the buttons above to add experience, education, or skills.
                </div>
              ) : (
                <div className="space-y-4">
                  {cv.sections.map((section, secIndex) => (
                    <div
                      key={section.id}
                      id={`studio-section-${secIndex}`}
                      className="studio-entry-section"
                    >
                      {/* Section Header Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e6eb] pb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                          <span className="rounded bg-[#e3e6eb] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#636c7a] shrink-0">
                            {section.type}
                          </span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section Title"
                            aria-label={`${section.type} section title`}
                            className="flex-1 min-w-0 border-b border-dashed border-[#c5cbd4] bg-transparent px-1 py-0.5 text-xs font-semibold text-[#191b20] transition-colors focus:border-[var(--ui-accent)] focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={secIndex === 0}
                            onClick={() => moveSection(secIndex, "up")}
                            className="rounded p-1 text-[#8b939f] transition-colors hover:bg-[#e3e6eb] hover:text-[#191b20] disabled:opacity-30 cursor-pointer"
                            title="Move section up"
                            aria-label={`Move ${section.title || section.type} section up`}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={secIndex === cv.sections.length - 1}
                            onClick={() => moveSection(secIndex, "down")}
                            className="rounded p-1 text-[#8b939f] transition-colors hover:bg-[#e3e6eb] hover:text-[#191b20] disabled:opacity-30 cursor-pointer"
                            title="Move section down"
                            aria-label={`Move ${section.title || section.type} section down`}
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="rounded px-1.5 py-0.5 text-[11px] text-[#8b939f] transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            title="Remove section"
                            aria-label={`Remove ${section.title || section.type} section`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Section Items */}
                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className="space-y-2.5 rounded-lg border border-[#e3e6eb] bg-white p-3 shadow-2xs"
                          >
                            {/* Item Reorder & Delete Bar */}
                            <div className="flex items-center justify-between border-b border-[#f1f3f6] pb-1.5 text-xs">
                              <span className="text-[11px] font-medium text-[#8b939f]">
                                Item #{itemIndex + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={itemIndex === 0}
                                  onClick={() => moveItem(section.id, itemIndex, "up")}
                                  className="px-1 text-[#8b939f] transition-colors hover:text-[#191b20] disabled:opacity-30 cursor-pointer"
                                  title="Move item up"
                                  aria-label={`Move item ${itemIndex + 1} up`}
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={itemIndex === section.items.length - 1}
                                  onClick={() => moveItem(section.id, itemIndex, "down")}
                                  className="px-1 text-[#8b939f] transition-colors hover:text-[#191b20] disabled:opacity-30 cursor-pointer"
                                  title="Move item down"
                                  aria-label={`Move item ${itemIndex + 1} down`}
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(section.id, item.id)}
                                  className="rounded px-1.5 py-0.5 text-[11px] text-[#8b939f] transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                  title="Delete item"
                                  aria-label={`Delete item ${itemIndex + 1}`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Item Fields */}
                            <div className="space-y-2">
                              <div>
                                <label className="mb-0.5 block text-[11px] font-medium text-[#3f4753]">
                                  {section.type === "experience"
                                    ? "Job Title"
                                    : section.type === "education"
                                    ? "Degree / Program"
                                    : section.type === "skills"
                                    ? "Skill Category"
                                    : section.type === "projects"
                                    ? "Project Title"
                                    : "Title"}{" "}
                                  <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                                  placeholder="e.g. Lead Engineer"
                                  className="w-full rounded-md border border-[#c5cbd4] px-2.5 py-1 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="mb-0.5 block text-[11px] font-medium text-[#3f4753]">
                                    {section.type === "experience"
                                      ? "Organization"
                                      : section.type === "education"
                                      ? "School / University"
                                      : section.type === "projects"
                                      ? "Role / Client"
                                      : "Subtitle"}
                                  </label>
                                  <input
                                    type="text"
                                    value={item.subtitle || ""}
                                    onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full rounded-md border border-[#c5cbd4] px-2.5 py-1 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                                  />
                                </div>

                                <div>
                                  <label className="mb-0.5 block text-[11px] font-medium text-[#3f4753]">
                                    Date / Duration
                                  </label>
                                  <input
                                    type="text"
                                    value={item.date || ""}
                                    onChange={(e) => updateItem(section.id, item.id, { date: e.target.value })}
                                    placeholder="e.g. 2021 — Present"
                                    className="w-full rounded-md border border-[#c5cbd4] px-2.5 py-1 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-0.5 block text-[11px] font-medium text-[#3f4753]">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={item.description || ""}
                                  onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                                  placeholder="Brief summary or context"
                                  className="w-full rounded-md border border-[#c5cbd4] px-2.5 py-1 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                                />
                              </div>
                            </div>

                            {/* Bullets List */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-[#3f4753]">
                                  Highlights / Bullets
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addBullet(section.id, item.id)}
                                  className="text-[11px] font-medium text-[var(--ui-accent)] transition-colors hover:text-[var(--ui-accent-hover)] cursor-pointer"
                                >
                                  + Add bullet
                                </button>
                              </div>

                              {(item.bullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-1.5">
                                  <span className="text-xs text-[#8b939f]">•</span>
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => updateBullet(section.id, item.id, bIdx, e.target.value)}
                                    placeholder="Achievement or responsibility..."
                                    className="flex-1 rounded border border-[#c5cbd4] px-2 py-1 text-xs text-[#191b20] transition-colors hover:border-[#c5cbd4] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeBullet(section.id, item.id, bIdx)}
                                    className="p-0.5 text-xs text-[#8b939f] transition-colors hover:text-rose-600 cursor-pointer"
                                    title="Remove bullet"
                                    aria-label={`Remove bullet ${bIdx + 1}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addItem(section.id)}
                          className="w-full rounded-lg border border-dashed border-[#c5cbd4] bg-white py-1.5 text-xs font-medium text-[var(--ui-accent)] transition-colors hover:border-[var(--ui-accent)] hover:bg-[var(--ui-accent-soft)] cursor-pointer"
                        >
                          + Add item to {section.title || section.type}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// STYLE & DESIGN PREFERENCES CONTROLS: calm groups, small previews, named swatches
function StyleControls({
  stylePrefs,
  onChange,
}: {
  stylePrefs: CVStylePrefs;
  onChange: (field: keyof CVStylePrefs, value: string) => void;
}) {
  const currentTemplate = stylePrefs.templateId || "modern";
  const fontSize = stylePrefs.fontSize || "normal";
  const margin = stylePrefs.margin || "normal";
  const primaryColor = stylePrefs.primaryColor || "#245bd7";

  const templates = CV_TEMPLATES;

  const colorSwatches = [
    { name: "Blue", value: "#245bd7" },
    { name: "Navy", value: "#1e3a8a" },
    { name: "Slate", value: "#475569" },
    { name: "Charcoal", value: "#263445" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Template Previews */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="studio-design-heading">
            Template Layout
          </h2>
          <span className="text-[11px] text-[#8b939f]">{templates.length} available</span>
        </div>
        <div className="studio-template-grid">
          {templates.map((tmpl) => {
            const isSelected = currentTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onChange("templateId", tmpl.id)}
                className={`group relative flex flex-col rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] ring-1 ring-[var(--ui-accent)] shadow-2xs"
                    : "border-[#e3e6eb] bg-white hover:border-[#c5cbd4] hover:bg-[#f7f8fa]"
                }`}
                aria-pressed={isSelected}
              >
                <div
                  className="mb-2 h-10 w-full rounded-md border border-[#e3e6eb] bg-[#f7f8fa] p-1.5 flex flex-col justify-center overflow-hidden"
                  aria-hidden="true"
                >
                  <TemplateThumbnail layout={tmpl.layout} templateId={tmpl.id} accent={primaryColor} />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-semibold text-[#191b20] leading-tight">
                    {tmpl.name}
                  </div>
                  {isSelected && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--ui-accent)] text-[9px] text-white shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[10px] text-[#8b939f] line-clamp-1 leading-snug">
                  {tmpl.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Base Font Size */}
      <div>
        <h2 className="studio-design-heading">
          Font Size
        </h2>
        <div className="flex gap-1.5">
          {[
            { id: "small", label: "Compact", sub: "9.5pt" },
            { id: "normal", label: "Standard", sub: "10.5pt" },
            { id: "large", label: "Large", sub: "11.5pt" },
          ].map((size) => {
            const isSelected = fontSize === size.id;
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => onChange("fontSize", size.id)}
                className={`flex-1 rounded-lg border py-1.5 px-2 text-center text-xs transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] font-semibold ring-1 ring-[var(--ui-accent)]"
                    : "border-[#e3e6eb] bg-white text-[#636c7a] hover:bg-[#f7f8fa] hover:text-[#191b20]"
                }`}
                aria-pressed={isSelected}
              >
                <div className="leading-tight">{size.label}</div>
                <div className="text-[10px] text-[#8b939f] leading-none mt-0.5">{size.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Page Spacing & Margin */}
      <div>
        <h2 className="studio-design-heading">
          Spacing &amp; Margin
        </h2>
        <div className="flex gap-1.5">
          {[
            { id: "compact", label: "Tight", desc: "Max fit" },
            { id: "normal", label: "Balanced", desc: "Default" },
            { id: "spacious", label: "Spacious", desc: "Roomy" },
          ].map((m) => {
            const isSelected = margin === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange("margin", m.id)}
                className={`flex-1 rounded-lg border py-1.5 px-2 text-center text-xs transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] font-semibold ring-1 ring-[var(--ui-accent)]"
                    : "border-[#e3e6eb] bg-white text-[#636c7a] hover:bg-[#f7f8fa] hover:text-[#191b20]"
                }`}
                aria-pressed={isSelected}
              >
                <div className="leading-tight">{m.label}</div>
                <div className="text-[10px] text-[#8b939f] leading-none mt-0.5">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Paper Size with Dimensions */}
      <div>
        <h2 className="studio-design-heading">
          Paper Size
        </h2>
        <div className="flex gap-2">
          {[
            { id: "A4", label: "A4", dims: "210 × 297 mm" },
            { id: "Letter", label: "Letter", dims: "8.5 × 11 in" },
          ].map((paper) => {
            const isSelected = (stylePrefs.paperSize || "A4") === paper.id;
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => onChange("paperSize", paper.id)}
                className={`flex-1 rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[#191b20] font-semibold ring-1 ring-[var(--ui-accent)]"
                    : "border-[#e3e6eb] bg-white text-[#636c7a] hover:border-[#c5cbd4] hover:bg-[#f7f8fa]"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{paper.label}</span>
                  {isSelected && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--ui-accent)] text-[9px] text-white">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-[#8b939f] font-normal">{paper.dims}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Named Accent Color Swatches */}
      <div>
        <h2 className="studio-design-heading">
          Accent Color
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {colorSwatches.map((swatch) => {
            const isSelected = primaryColor.toLowerCase() === swatch.value.toLowerCase();
            return (
              <button
                key={swatch.value}
                type="button"
                onClick={() => onChange("primaryColor", swatch.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] text-[#191b20] ring-1 ring-[var(--ui-accent)]"
                    : "border-[#e3e6eb] bg-white text-[#636c7a] hover:bg-[#f7f8fa] hover:text-[#191b20]"
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-black/10"
                  style={{ backgroundColor: swatch.value }}
                >
                  {isSelected && <span className="h-1 w-1 rounded-full bg-white" />}
                </span>
                <span>{swatch.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
