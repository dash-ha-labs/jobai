import type { ExtensionJobState, JobHandoffPayload } from "jobai-shared";

const SERVER_BASE = "http://127.0.0.1:3000";
const STORAGE_KEY_STATE = "jobai_extension_state";
const STORAGE_KEY_TOKEN = "jobai_auth_token";

// Synchronously register runtime message listener at top-level evaluation
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object" || !message.type) {
    return false;
  }

  if (message.type === "GET_STATE") {
    getState()
      .then((s) => sendResponse({ state: s }))
      .catch((err) => sendResponse({ state: { status: "error", message: String(err), retryable: true } }));
    return true;
  }

  if (message.type === "CHECK_STATUS") {
    checkServerStatus()
      .then((s) => sendResponse({ state: s }))
      .catch((err) => sendResponse({ state: { status: "error", message: String(err), retryable: true } }));
    return true;
  }

  if (message.type === "PAIR") {
    (async () => {
      try {
        const rawCode = typeof message.code === "string" ? message.code : "";
        const code = rawCode.trim().toUpperCase();
        if (!code) {
          sendResponse({ success: false, error: "Pairing code is required." });
          return;
        }
        const res = await fetch(`${SERVER_BASE}/api/pair`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.token) {
          sendResponse({
            success: false,
            error: data.message || `Server pairing failed (HTTP ${res.status}). Verify code is fresh.`,
          });
          return;
        }
        await setToken(data.token);
        const s = await checkServerStatus();
        sendResponse({ success: true, state: s });
      } catch (err: any) {
        sendResponse({
          success: false,
          error: `Network error connecting to JobAI backend at ${SERVER_BASE}: ${err?.message || String(err)}`,
        });
      }
    })();
    return true;
  }

  if (message.type === "START_TAILORING") {
    // Initiate tailoring in background (survives popup closure)
    performTailoring(message.job, message.templateId);
    sendResponse({ started: true });
    return false;
  }

  if (message.type === "RESET_STATE") {
    checkServerStatus()
      .then((s) => sendResponse({ state: s }))
      .catch((err) => sendResponse({ state: { status: "error", message: String(err), retryable: true } }));
    return true;
  }

  if (message.type === "ATTACH_TO_PAGE") {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          sendResponse({ success: false, message: "No active tab found." });
          return;
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: attachPdfInTab,
          args: [message.pdfBase64, message.filename || "tailored-cv.pdf"],
        });

        const res = results?.[0]?.result;
        sendResponse(res || { success: false, message: "Attachment script returned no result." });
      } catch (err: any) {
        sendResponse({ success: false, message: `Attachment failed: ${err?.message || String(err)}` });
      }
    })();
    return true;
  }

  return false;
});

async function getState(): Promise<ExtensionJobState> {
  const data = await chrome.storage.local.get(STORAGE_KEY_STATE);
  if (data && data[STORAGE_KEY_STATE]) {
    return data[STORAGE_KEY_STATE] as ExtensionJobState;
  }
  return {
    status: "awaiting_setup",
    reason: "not_paired",
    message: "Connect to your local JobAI server to tailor CVs.",
  };
}

async function setState(state: ExtensionJobState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_STATE]: state });
}

async function getToken(): Promise<string | null> {
  const data = await chrome.storage.local.get(STORAGE_KEY_TOKEN);
  return data?.[STORAGE_KEY_TOKEN] || null;
}

async function setToken(token: string | null): Promise<void> {
  if (token) {
    await chrome.storage.local.set({ [STORAGE_KEY_TOKEN]: token });
  } else {
    await chrome.storage.local.remove(STORAGE_KEY_TOKEN);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Check server status and initialize state
async function checkServerStatus(): Promise<ExtensionJobState> {
  const token = await getToken();
  if (!token) {
    const s: ExtensionJobState = {
      status: "awaiting_setup",
      reason: "not_paired",
      message: "Extension is not paired with your local JobAI server. Click 'Connect JobAI' to generate a connection code.",
    };
    await setState(s);
    return s;
  }

  try {
    const res = await fetch(`${SERVER_BASE}/api/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        await setToken(null);
        const s: ExtensionJobState = {
          status: "awaiting_setup",
          reason: "not_paired",
          message: "Pairing expired or invalid. Please re-pair with the local server.",
        };
        await setState(s);
        return s;
      }
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (!data.hasProfile) {
      const s: ExtensionJobState = {
        status: "awaiting_setup",
        reason: "no_profile",
        message: "Extension is paired. Save and sync your Master CV in the JobAI editor to enable AI tailoring.",
      };
      await setState(s);
      return s;
    }

    if (!data.aiConfigured) {
      const s: ExtensionJobState = {
        status: "awaiting_setup",
        reason: "no_ai",
        message: "AI provider is not configured. Configure your API key (OpenAI, Anthropic, or GLM) in AI settings.",
      };
      await setState(s);
      return s;
    }

    const currentState = await getState();
    // If a tailoring job was in flight when service worker was suspended, poll for recovery
    if (currentState.status === "tailoring" && (currentState as any).jobId) {
      try {
        const jobId = (currentState as any).jobId;
        const jobRes = await fetch(`${SERVER_BASE}/api/tailor/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          if (jobData.job?.status === "completed" && jobData.job.result) {
            const res = jobData.job.result;
            const pdfRes = await fetch(`${SERVER_BASE}/api/pdf/${res.draftId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (pdfRes.ok) {
              const pdfBuffer = await pdfRes.arrayBuffer();
              const pdfBase64 = arrayBufferToBase64(pdfBuffer);
              const recoveredState: ExtensionJobState = {
                status: "ready",
                draftId: res.draftId,
                job: currentState.job,
                tailoredCV: res.tailoredCV,
                changes: res.changes || [],
                unapprovedSuggestedSummary: res.unapprovedSuggestedSummary,
                templateId: res.templateId || "modern",
                pdfBase64,
              };
              await setState(recoveredState);
              return recoveredState;
            }
          } else if (jobData.job?.status === "failed") {
            const errState: ExtensionJobState = {
              status: "error",
              message: jobData.job.error || "Background tailoring failed",
              retryable: true,
              lastJob: currentState.job,
            };
            await setState(errState);
            return errState;
          }
        }
      } catch {
        // Fall through to normal check
      }
    }

    // Only transition to idle if we were in awaiting_setup or error
    if (currentState.status === "awaiting_setup" || currentState.status === "error") {
      const s: ExtensionJobState = {
        status: "idle",
        hasProfile: true,
        aiConfigured: true,
        aiProvider: data.aiProvider || null,
        aiModel: data.aiModel || null,
      };
      await setState(s);
      return s;
    }
    return currentState;
  } catch (err: any) {
    const s: ExtensionJobState = {
      status: "error",
      message: `Cannot connect to JobAI server at ${SERVER_BASE}: ${err?.message || String(err)}. Ensure 'npm run dev' or 'npm start' is running.`,
      retryable: true,
    };
    await setState(s);
    return s;
  }
}

// Background tailoring procedure
async function performTailoring(job: JobHandoffPayload, templateId?: string): Promise<void> {
  const token = await getToken();
  if (!token) {
    await setState({
      status: "awaiting_setup",
      reason: "not_paired",
      message: "Extension is not paired. Enter the pairing code in setup.",
    });
    return;
  }

  // 1. Set tailoring status
  await setState({ status: "tailoring", job });

  try {
    // 2. Call backend POST /api/tailor
    const tailorRes = await fetch(`${SERVER_BASE}/api/tailor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ job, templateId }),
    });

    if (!tailorRes.ok) {
      const errData = await tailorRes.json().catch(() => ({}));
      if (errData.error === "AI_CREDENTIALS_REQUIRED" || tailorRes.status === 503) {
        await setState({
          status: "awaiting_setup",
          reason: "no_ai",
          message: errData.message || "OPENAI_API_KEY is missing from server environment.",
        });
        return;
      }
      throw new Error(errData.message || `Server error during tailoring (HTTP ${tailorRes.status})`);
    }

    const tailorData = await tailorRes.json();
    const draftId = tailorData.draftId;
    const jobId = tailorData.jobId;

    // 3. Set generating_pdf status
    await setState({ status: "generating_pdf", draftId, job, jobId });

    // 4. Fetch PDF bytes
    const pdfRes = await fetch(`${SERVER_BASE}/api/pdf/${draftId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pdfRes.ok) {
      throw new Error(`Failed to retrieve generated PDF from server (HTTP ${pdfRes.status})`);
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);

    // 5. Set ready status with full persistent state in storage
    await setState({
      status: "ready",
      draftId,
      job,
      tailoredCV: tailorData.tailoredCV,
      changes: tailorData.changes || [],
      unapprovedSuggestedSummary: tailorData.unapprovedSuggestedSummary,
      templateId: tailorData.templateId || "modern",
      pdfBase64,
    });
  } catch (err: any) {
    await setState({
      status: "error",
      message: err?.message || String(err),
      retryable: true,
      lastJob: job,
    });
  }
}

// In-tab script for explicit file attachment
function attachPdfInTab(base64Pdf: string, filename: string): { success: boolean; message: string } {
  const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
  if (fileInputs.length === 0) {
    return {
      success: false,
      message: "No file upload inputs found on this page. Please use the Download button to upload your CV manually.",
    };
  }

  // Find eligible input (not disabled, visible)
  const targetInput = fileInputs.find((input) => !input.disabled) || fileInputs[0];

  try {
    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new File([byteArray], filename, { type: "application/pdf" });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    targetInput.files = dataTransfer.files;

    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    targetInput.dispatchEvent(new Event("change", { bubbles: true }));

    return {
      success: true,
      message: `Attached tailored CV (${filename}) to the upload field.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Could not attach automatically: ${err?.message || String(err)}. Please use 'Download PDF' and select the file manually.`,
    };
  }
}

// Check status when extension loads (catch all rejections safely)
checkServerStatus().catch((err) => {
  console.warn("[JobAI Background] Initial server status check failed:", err);
});
