import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { canonicalExtractJob, type JobPayload } from "./job";
import type { ExtensionJobState } from "jobai-shared";
import "./styles.css";

export function Popup() {
  const [state, setState] = useState<ExtensionJobState>({
    status: "awaiting_setup",
    reason: "not_paired",
    message: "Connecting...",
  });
  const [pairingCodeInput, setPairingCodeInput] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [attachFeedback, setAttachFeedback] = useState<string | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "changes">("preview");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  const [manualJob, setManualJob] = useState<JobPayload>({
    title: "",
    company: "",
    sourceUrl: "",
    text: "",
  });

  // Safe runtime message helper that always reads chrome.runtime.lastError
  const sendRuntimeMessage = (
    message: Record<string, any>,
    callback?: (response: any, error?: string) => void
  ) => {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
      callback?.(null, "Extension runtime messaging unavailable.");
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          callback?.(null, lastError.message || "Could not establish connection. Receiving end does not exist.");
        } else {
          callback?.(response ?? null);
        }
      });
    } catch (err: any) {
      callback?.(null, err?.message || String(err));
    }
  };

  // Fetch state on mount and listen to storage updates
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      return;
    }

    // 1. Initial state check
    sendRuntimeMessage({ type: "CHECK_STATUS" }, (res, error) => {
      if (error) {
        setState({
          status: "error",
          message: `Extension background service worker connection failed (${error}). Open chrome://extensions, ensure Developer mode is ON, and click reload ↻ on JobAI.`,
          retryable: true,
        });
        return;
      }
      if (res && res.state) {
        setState(res.state);
        if (res.state.status === "ready" && res.state.templateId) {
          setSelectedTemplate(res.state.templateId);
        }
      }
    });

    // 2. Real-time storage listener
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.jobai_extension_state) {
        const next = changes.jobai_extension_state.newValue as ExtensionJobState;
        setState(next);
        if (next.status === "ready" && next.templateId) {
          setSelectedTemplate(next.templateId);
        }
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  // Action: Pair with code
  const handlePair = async () => {
    const code = pairingCodeInput.trim().toUpperCase();
    if (!code) return;
    setIsPairing(true);
    sendRuntimeMessage({ type: "PAIR", code }, (res, error) => {
      setIsPairing(false);
      if (error) {
        alert(
          `Service Worker Connection Error:\n${error}\n\nThe extension popup cannot communicate with its background service worker. Please reload the JobAI extension in chrome://extensions and retry.`
        );
        return;
      }
      if (res && res.success && res.state) {
        setState(res.state);
        setPairingCodeInput("");
      } else {
        alert(res?.error || "Pairing rejected by server. Ensure the 6-character code matches http://127.0.0.1:3000/extension and has not expired.");
      }
    });
  };

  // Action: Primary 'Tailor my CV'
  const handleTailorActiveTab = async () => {
    setState({ status: "extracting" });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error("No active browser tab found.");
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: canonicalExtractJob,
      });

      const res = results?.[0]?.result as import("./job").ExtractionResult | undefined;
      if (!res || !res.ok || !res.job) {
        throw new Error(res?.error || "No readable job content found on this page.");
      }

      // Hand off to background service worker
      sendRuntimeMessage(
        {
          type: "START_TAILORING",
          job: res.job,
        },
        (_reply, error) => {
          if (error) {
            setState({
              status: "error",
              message: `Failed to dispatch tailoring to background worker: ${error}. Reload extension in chrome://extensions.`,
              retryable: true,
            });
          }
        }
      );
    } catch (err: any) {
      setState({
        status: "error",
        message: err?.message || String(err),
        retryable: true,
      });
    }
  };

  // Action: Tailor manual entry
  const handleTailorManual = () => {
    if (!manualJob.title.trim() || manualJob.text.length < 100) {
      alert("Job title and at least 100 characters of description text are required.");
      return;
    }
    sendRuntimeMessage(
      {
        type: "START_TAILORING",
        job: manualJob,
      },
      (_reply, error) => {
        if (error) {
          alert(`Worker error: ${error}`);
        }
      }
    );
    setShowManualForm(false);
  };

  // Action: Download PDF
  const handleDownloadPdf = () => {
    if (state.status !== "ready" || !state.pdfBase64) return;
    const cleanCompany = (state.job.company || "tailored").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `CV_${cleanCompany}.pdf`;

    const blobUrl = `data:application/pdf;base64,${state.pdfBase64}`;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Action: Preview PDF in tab
  const handlePreviewPdf = () => {
    if (state.status !== "ready" || !state.pdfBase64) return;
    const blobUrl = `data:application/pdf;base64,${state.pdfBase64}`;
    chrome.tabs.create({ url: blobUrl });
  };

  // Safe open tab helper
  const openTab = (url: string) => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  // Action: Edit this CV on web editor
  const handleEditThisCv = () => {
    if (state.status !== "ready") return;
    const editUrl = `http://127.0.0.1:3000/drafts?id=${state.draftId}`;
    openTab(editUrl);
  };

  // Action: Attach to application
  const handleAttach = () => {
    if (state.status !== "ready") return;
    setIsAttaching(true);
    setAttachFeedback(null);
    const cleanCompany = (state.job.company || "tailored").replace(/[^a-zA-Z0-9_-]/g, "_");

    sendRuntimeMessage(
      {
        type: "ATTACH_TO_PAGE",
        pdfBase64: state.pdfBase64,
        filename: `CV_${cleanCompany}.pdf`,
      },
      (res, error) => {
        setIsAttaching(false);
        if (error) {
          setAttachFeedback(`Attachment failed: ${error}`);
        } else {
          setAttachFeedback(res?.message || "Attachment process completed.");
        }
      }
    );
  };

  // Action: Reset
  const handleReset = () => {
    sendRuntimeMessage({ type: "RESET_STATE" }, (res, error) => {
      if (error) {
        setState({
          status: "error",
          message: `Worker communication error: ${error}`,
          retryable: true,
        });
      } else if (res && res.state) {
        setState(res.state);
      }
    });
  };

  return (
    <main className="popup-container" role="region" aria-label="JobAI CV Tailor">
      <header className="popup-header">
        <div className="brand-row">
          <h1 className="brand-title">
            JobAI <span className="badge">Automation</span>
          </h1>
          <span className="server-status">● 127.0.0.1:3000</span>
        </div>
        <p className="honest-notice">
          One-click active-tab extraction &amp; AI CV tailoring with instant PDF generation.
        </p>
      </header>

      {/* 1. AWAITING SETUP STATE */}
      {state.status === "awaiting_setup" && (
        <div className="setup-card">
          <div className="setup-icon">⚙️</div>
          <h2 className="setup-title">
            {state.reason === "not_paired"
              ? "Connect to JobAI Server"
              : state.reason === "no_profile"
              ? "Sync Master CV"
              : "AI Credentials Required"}
          </h2>
          <p className="setup-desc">{state.message}</p>

          {state.reason === "not_paired" && (
            <div className="pair-form space-y-3">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => openTab("http://127.0.0.1:3000/extension")}
              >
                Connect JobAI
              </button>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  or enter code
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <input
                type="text"
                className="input-text text-center uppercase tracking-widest font-mono"
                placeholder="6-LETTER CODE"
                maxLength={6}
                value={pairingCodeInput}
                onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handlePair}
                disabled={isPairing || pairingCodeInput.trim().length < 6}
              >
                {isPairing ? "Connecting..." : "Pair with Code"}
              </button>
              <span className="field-help text-center block text-xs text-slate-500">
                Click "Connect JobAI" to generate a connection code on the website, then enter it here.
              </span>
            </div>
          )}

          {state.reason === "no_profile" && (
            <div className="space-y-2">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed">
                Extension is paired! Save and sync your Master CV in the JobAI editor to enable AI tailoring.
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => openTab("http://127.0.0.1:3000/")}
              >
                Open CV Editor
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() =>
                  sendRuntimeMessage({ type: "CHECK_STATUS" }, (res) => {
                    if (res?.state) setState(res.state);
                  })
                }
              >
                Refresh Status
              </button>
            </div>
          )}

          {state.reason === "no_ai" && (
            <div className="space-y-2">
              <div className="alert-notice">
                AI provider is not configured. Configure your API key (OpenAI, Anthropic, or GLM) in AI settings.
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => openTab("http://127.0.0.1:3000/settings/ai")}
              >
                Open AI Settings
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() =>
                  sendRuntimeMessage({ type: "CHECK_STATUS" }, (res) => {
                    if (res?.state) setState(res.state);
                  })
                }
              >
                Re-check AI Status
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. IDLE STATE */}
      {state.status === "idle" && (
        <div className="idle-card">
          <div className="p-2.5 mb-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800">
                {state.aiProvider
                  ? `AI: ${state.aiProvider.toUpperCase()} (${state.aiModel || "active"})`
                  : "AI Ready"}
              </span>
            </div>
            <button
              type="button"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              onClick={() => openTab("http://127.0.0.1:3000/settings/ai")}
            >
              AI settings &rarr;
            </button>
          </div>

          <div className="action-highlight">
            <h2 className="action-title">Ready to Tailor</h2>
            <p className="action-desc">
              Navigate to any job listing tab, then click below to extract requirements, select matching achievements, and generate a tailored PDF.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleTailorActiveTab}
            >
              🚀 Tailor my CV
            </button>
          </div>

          <div className="manual-toggle-row">
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowManualForm(!showManualForm)}
            >
              {showManualForm ? "Hide manual form" : "Or enter job text manually"}
            </button>
          </div>

          {showManualForm && (
            <div className="manual-form">
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={manualJob.title}
                  onChange={(e) => setManualJob({ ...manualJob, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Acme Labs"
                  value={manualJob.company}
                  onChange={(e) => setManualJob({ ...manualJob, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description * (min 100 chars)</label>
                <textarea
                  className="textarea-text"
                  rows={4}
                  placeholder="Paste job posting description here..."
                  value={manualJob.text}
                  onChange={(e) => setManualJob({ ...manualJob, text: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTailorManual}
              >
                Tailor from Pasted Text
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. EXTRACTING STATE */}
      {state.status === "extracting" && (
        <div className="progress-card">
          <div className="spinner"></div>
          <h2 className="progress-title">Reading Job Listing</h2>
          <p className="progress-desc">Extracting structured job data and visible description from current tab...</p>
        </div>
      )}

      {/* 4. TAILORING STATE */}
      {state.status === "tailoring" && (
        <div className="progress-card">
          <div className="spinner"></div>
          <h2 className="progress-title">Tailoring CV with AI</h2>
          <p className="progress-desc">
            Aligning your experience for <strong>{state.job.title}</strong> at <strong>{state.job.company || "Company"}</strong>.
          </p>
          <span className="badge-quiet">Background task active: you can safely close this popup</span>
        </div>
      )}

      {/* 5. GENERATING PDF STATE */}
      {state.status === "generating_pdf" && (
        <div className="progress-card">
          <div className="spinner"></div>
          <h2 className="progress-title">Compiling PDF Document</h2>
          <p className="progress-desc">Formatting text-selectable A4 layout on server...</p>
        </div>
      )}

      {/* 6. READY STATE */}
      {state.status === "ready" && (
        <div className="ready-card">
          <div className="ready-header">
            <span className="success-badge">✓ Tailored CV Ready</span>
            <h2 className="ready-job-title">{state.job.title}</h2>
            <p className="ready-company">{state.job.company || "Target Application"}</p>
          </div>

          {/* View Mode Tabs */}
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-btn ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              📄 CV Document Preview
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "changes" ? "active" : ""}`}
              onClick={() => setActiveTab("changes")}
            >
              🔍 Tailoring Diff ({state.changes?.length || 0})
            </button>
          </div>

          {activeTab === "preview" && (
            <div className="cv-preview-section">
              {/* Template Selector */}
              <div className="template-picker-row">
                <span className="template-picker-label">Layout:</span>
                <div className="template-pills">
                  {[
                    { id: "modern", label: "Modern" },
                    { id: "executive", label: "Executive" },
                    { id: "tech", label: "Tech" },
                    { id: "compact", label: "Compact" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`tmpl-pill ${selectedTemplate === t.id ? "active" : ""}`}
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable CV Preview Paper */}
              <div className={`cv-preview-paper tmpl-${selectedTemplate}`}>
                {/* Header */}
                <div className="cv-preview-header">
                  <div className="cv-name">{state.tailoredCV.contact?.name || "Candidate Name"}</div>
                  <div className="cv-contact-line">
                    {[
                      state.tailoredCV.contact?.email,
                      state.tailoredCV.contact?.phone,
                      state.tailoredCV.contact?.location,
                    ]
                      .filter(Boolean)
                      .join("  •  ")}
                  </div>
                </div>

                {/* Authentic Summary */}
                {state.tailoredCV.summary && (
                  <div className="cv-preview-block">
                    <div className="cv-section-title">
                      {selectedTemplate === "executive"
                        ? "EXECUTIVE SUMMARY"
                        : selectedTemplate === "tech"
                        ? "// SUMMARY"
                        : "PROFESSIONAL SUMMARY"}
                    </div>
                    <p className="cv-summary-text">{state.tailoredCV.summary}</p>
                  </div>
                )}

                {/* Unapproved Suggested Summary Banner */}
                {state.unapprovedSuggestedSummary && (
                  <div className="unapproved-summary-box">
                    <div className="unapproved-tag">💡 AI Proposed Summary (Unapproved)</div>
                    <p className="unapproved-text">&ldquo;{state.unapprovedSuggestedSummary}&rdquo;</p>
                    <div className="unapproved-note">
                      Original authentic summary was preserved in your PDF. To adopt this proposal, click &apos;Edit this CV in Web App&apos;.
                    </div>
                  </div>
                )}

                {/* Tailored Sections */}
                {state.tailoredCV.sections?.map((sec) => (
                  <div key={sec.id} className="cv-preview-block">
                    <div className="cv-section-title">
                      {selectedTemplate === "tech" ? `// ${(sec.title || sec.type).toUpperCase()}` : (sec.title || sec.type).toUpperCase()}
                    </div>
                    {sec.items?.map((item) => (
                      <div key={item.id} className="cv-item">
                        <div className="cv-item-top">
                          <span className="cv-item-title">{item.title}</span>
                          {item.date && <span className="cv-item-date">{item.date}</span>}
                        </div>
                        {item.subtitle && <div className="cv-item-sub">{item.subtitle}</div>}
                        {item.description && <div className="cv-item-desc">{item.description}</div>}
                        {item.bullets && item.bullets.length > 0 && (
                          <ul className="cv-item-bullets">
                            {item.bullets.map((b, bi) => (
                              <li key={bi}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "changes" && (
            <div className="changes-tab-content">
              {state.changes && state.changes.length > 0 ? (
                <div className="changes-box">
                  <span className="changes-label">Derived Differences (Authentic Diff):</span>
                  <ul className="changes-list">
                    {state.changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="changes-empty">Retained all authentic sections and items in original order.</div>
              )}
            </div>
          )}

          <div className="primary-actions-grid">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPdf}
            >
              📥 Download PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePreviewPdf}
            >
              👁 Full PDF Tab
            </button>
          </div>

          <div className="secondary-actions-list">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleEditThisCv}
            >
              ✏️ Edit this CV in Web App
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAttach}
              disabled={isAttaching}
            >
              {isAttaching ? "Attaching..." : "📎 Attach to Application Input"}
            </button>
          </div>

          {attachFeedback && (
            <div className="attach-feedback-box">
              {attachFeedback}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              className="btn-link text-xs"
              onClick={handleReset}
            >
              Tailor for another job listing
            </button>
          </div>
        </div>
      )}

      {/* 7. ERROR STATE */}
      {state.status === "error" && (
        <div className="error-card">
          <div className="alert-error">
            <strong>Error:</strong> {state.message}
          </div>
          <div className="flex gap-2 mt-3">
            {state.retryable && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (state.lastJob) {
                    sendRuntimeMessage({
                      type: "START_TAILORING",
                      job: state.lastJob,
                    });
                  } else {
                    handleTailorActiveTab();
                  }
                }}
              >
                Retry
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Popup />);
}
