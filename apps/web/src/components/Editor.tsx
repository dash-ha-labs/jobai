import { useState } from "react";
import type { CV, CVSection, CVSectionItem, CVSectionType, CVStylePrefs } from "jobai-shared";

interface EditorProps {
  cv: CV;
  onChange: (updatedCv: CV) => void;
  onSave: () => void;
  onReset: () => void;
  onConnectExtension?: () => void;
  onUploadCV?: () => void;
  saveStatus: "idle" | "saving" | "saved" | "unsaved";
  storageError: string | null;
  validationErrors: string[];
}

export function Editor({
  cv,
  onChange,
  onSave,
  onReset,
  onConnectExtension,
  onUploadCV,
  saveStatus,
  storageError,
  validationErrors,
}: EditorProps) {
  const [activeTab, setActiveTab] = useState<"content" | "styles">("content");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Editor Header Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "content"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Content & Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("styles")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "styles"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Design & Spacing
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {saveStatus === "saved" && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Unsaved edits
            </span>
          )}

          {/* Explicit Save Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {saveStatus === "saving" ? (
              <span>Saving...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save CV</span>
              </>
            )}
          </button>

          {/* Import / Upload CV Button */}
          {onUploadCV && (
            <button
              type="button"
              onClick={onUploadCV}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Import or replace CV from document or text"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import CV</span>
            </button>
          )}

          {/* Connect to extension Button */}
          {onConnectExtension && (
            <button
              type="button"
              onClick={onConnectExtension}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Sync CV with local server and pair Chrome extension"
            >
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Connect to extension</span>
            </button>
          )}

          {/* Destructive Reset */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            title="Reset CV and start over"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Storage Error Alert */}
      {storageError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
          <span className="font-bold">Storage Error:</span>
          <span>{storageError} (your edits remain in memory)</span>
        </div>
      )}

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Please complete required fields before saving:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="p-4 bg-red-50 border-b border-red-200 flex flex-wrap items-center justify-between gap-3 text-xs text-red-800">
          <div>
            <span className="font-bold">Clear entire CV?</span> All content and saved changes will be deleted.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowResetConfirm(false);
                onReset();
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow-xs cursor-pointer"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {activeTab === "styles" ? (
          <StyleControls
            stylePrefs={cv.stylePrefs || {}}
            onChange={handleStylePrefChange}
          />
        ) : (
          <div className="space-y-8">
            {/* Contact Details */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cv.contact.name}
                    onChange={(e) => handleContactChange("name", e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-3 py-1.5 text-xs rounded-md border ${
                      validationErrors.some((e) => e.toLowerCase().includes("name"))
                        ? "border-red-400 bg-red-50/50"
                        : "border-slate-300"
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={cv.contact.email}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    placeholder="e.g. alex.morgan@example.com"
                    className={`w-full px-3 py-1.5 text-xs rounded-md border ${
                      validationErrors.some((e) => e.toLowerCase().includes("email"))
                        ? "border-red-400 bg-red-50/50"
                        : "border-slate-300"
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={cv.contact.phone || ""}
                    onChange={(e) => handleContactChange("phone", e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location (Optional)</label>
                  <input
                    type="text"
                    value={cv.contact.location || ""}
                    onChange={(e) => handleContactChange("location", e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website / Portfolio (Optional)</label>
                  <input
                    type="text"
                    value={cv.contact.website || ""}
                    onChange={(e) => handleContactChange("website", e.target.value)}
                    placeholder="e.g. https://alexmorgan.dev"
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Professional Summary */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Summary</h2>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <textarea
                value={cv.summary || ""}
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="A concise overview of your background, key achievements, and core specializations..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />
            </section>

            {/* Sections List */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Sections</h2>

                {/* Add Section Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Add:</span>
                  <button
                    type="button"
                    onClick={() => addSection("experience")}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Experience
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("education")}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Education
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("skills")}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Skills
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("projects")}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("custom")}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    + Custom
                  </button>
                </div>
              </div>

              {cv.sections.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-xs">
                  No sections yet. Click "+ Experience", "+ Education", or another section button above to add your first section.
                </div>
              ) : (
                <div className="space-y-6">
                  {cv.sections.map((section, secIndex) => (
                    <div
                      key={section.id}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4"
                    >
                      {/* Section Header Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {section.type}
                          </span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section Title"
                            className="text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-full"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={secIndex === 0}
                            onClick={() => moveSection(secIndex, "up")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 cursor-pointer"
                            title="Move section up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={secIndex === cv.sections.length - 1}
                            onClick={() => moveSection(secIndex, "down")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200 cursor-pointer"
                            title="Move section down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded cursor-pointer transition-colors"
                            title="Delete section"
                          >
                            Remove Section
                          </button>
                        </div>
                      </div>

                      {/* Section Items */}
                      <div className="space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs"
                          >
                            {/* Item Reorder & Delete Bar */}
                            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                              <span className="font-semibold text-slate-500 text-[11px]">
                                Item #{itemIndex + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={itemIndex === 0}
                                  onClick={() => moveItem(section.id, itemIndex, "up")}
                                  className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  title="Move item up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={itemIndex === section.items.length - 1}
                                  onClick={() => moveItem(section.id, itemIndex, "down")}
                                  className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  title="Move item down"
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(section.id, item.id)}
                                  className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Item Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  {section.type === "experience"
                                    ? "Job Title"
                                    : section.type === "education"
                                    ? "Degree / Program"
                                    : section.type === "skills"
                                    ? "Skill Group / Category"
                                    : section.type === "projects"
                                    ? "Project Title"
                                    : "Title"}{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                                  placeholder="e.g. Lead Software Engineer"
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  {section.type === "experience"
                                    ? "Company / Organization"
                                    : section.type === "education"
                                    ? "School / University"
                                    : section.type === "projects"
                                    ? "Role / Organization"
                                    : "Subtitle"}
                                </label>
                                <input
                                  type="text"
                                  value={item.subtitle || ""}
                                  onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                                  placeholder="e.g. Acme Corp"
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  Date / Duration
                                </label>
                                <input
                                  type="text"
                                  value={item.date || ""}
                                  onChange={(e) => updateItem(section.id, item.id, { date: e.target.value })}
                                  placeholder="e.g. 2021 — Present"
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                                  Short Description
                                </label>
                                <input
                                  type="text"
                                  value={item.description || ""}
                                  onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                                  placeholder="Brief summary or context"
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            {/* Bullets List */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-slate-700">
                                  Key Highlights / Bullets
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addBullet(section.id, item.id)}
                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                                >
                                  + Add bullet point
                                </button>
                              </div>

                              {(item.bullets || []).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-1.5">
                                  <span className="text-slate-400 text-xs">•</span>
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => updateBullet(section.id, item.id, bIdx, e.target.value)}
                                    placeholder="Achievement or responsibility..."
                                    className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeBullet(section.id, item.id, bIdx)}
                                    className="text-slate-400 hover:text-red-600 px-1 text-xs cursor-pointer"
                                    title="Remove bullet"
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
                          className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
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

// STYLE & DESIGN PREFERENCES CONTROLS
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
  const primaryColor = stylePrefs.primaryColor || "#4f46e5";

  const colorSwatches = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Slate", value: "#334155" },
    { name: "Navy", value: "#1e3a8a" },
    { name: "Emerald", value: "#059669" },
    { name: "Burgundy", value: "#991b1b" },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          CV Layout Template
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "modern", name: "Modern Clean", desc: "Contemporary sans-serif with color highlights" },
            { id: "executive", name: "Executive", desc: "Formal serif structure for leadership roles" },
            { id: "tech", name: "Technical", desc: "Monospace accents and engineering focus" },
            { id: "compact", name: "Compact", desc: "High density layout maximizing page space" },
          ].map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onChange("templateId", tmpl.id)}
              className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                currentTemplate === tmpl.id
                  ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="font-bold text-xs text-slate-900">{tmpl.name}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">{tmpl.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Base Font Size
        </h2>
        <div className="flex gap-2">
          {[
            { id: "small", label: "Compact (9.5pt)" },
            { id: "normal", label: "Standard (10.5pt)" },
            { id: "large", label: "Large (11.5pt)" },
          ].map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onChange("fontSize", size.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                fontSize === size.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Page Spacing & Margin
        </h2>
        <div className="flex gap-2">
          {[
            { id: "compact", label: "Tight Margins" },
            { id: "normal", label: "Balanced" },
            { id: "spacious", label: "Spacious" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange("margin", m.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md border text-center transition-all cursor-pointer ${
                margin === m.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Accent Color
        </h2>
        <div className="flex items-center gap-3">
          {colorSwatches.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              onClick={() => onChange("primaryColor", swatch.value)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                primaryColor.toLowerCase() === swatch.value.toLowerCase()
                  ? "scale-110 ring-2 ring-offset-2 ring-slate-800"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: swatch.value }}
              title={swatch.name}
            >
              {primaryColor.toLowerCase() === swatch.value.toLowerCase() && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
