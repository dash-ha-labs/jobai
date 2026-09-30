import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/app/settings/ai")({
  component: AISettingsComponent,
});

type AIProvider = "openai" | "anthropic" | "glm";

interface ClientAIConfigStatus {
  configured: boolean;
  provider: AIProvider | null;
  model: string | null;
  maskedKey: string | null;
  storageType: string;
  disclosure: string;
  updatedAt: string | null;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  glm: "glm-4-flash",
};

const PROVIDER_NAMES: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  glm: "GLM / Zhipu AI",
};

const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  glm: "https://open.bigmodel.cn/api/paas/v4",
};

function AISettingsComponent() {
  const [config, setConfig] = useState<ClientAIConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODELS.openai);
  const [consentGiven, setConsentGiven] = useState(false);

  // Load existing status on mount
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai/config", {
        headers: { "x-jobai-csrf": "1" },
      });
      if (!res.ok) {
        throw new Error(`Failed to load AI config (HTTP ${res.status})`);
      }
      const data = await res.json();
      setConfig(data.status);
      if (!data.status?.configured) {
        setIsEditing(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load AI configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(DEFAULT_MODELS[newProvider]);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setError("Please check the consent box to proceed.");
      return;
    }
    if (!apiKey.trim()) {
      setError("API key is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jobai-csrf": "1",
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          model: model.trim() || DEFAULT_MODELS[provider],
          test: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to save AI configuration");
      }

      setConfig(data.status);
      setApiKey("");
      setIsEditing(false);
      setSuccess("AI credentials verified and saved successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to save and test AI credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleTestExisting = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jobai-csrf": "1",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Connection test failed");
      }

      setSuccess(data.message || "AI provider connection test succeeded!");
    } catch (err: any) {
      setError(err?.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm("Are you sure you want to remove your configured AI key? AI tailoring and extraction will be disabled until a key is added.")) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/ai/config", {
        method: "DELETE",
        headers: {
          "x-jobai-csrf": "1",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to remove AI configuration");
      }

      setConfig({
        configured: false,
        provider: null,
        model: null,
        maskedKey: null,
        storageType: "local-file-mode-0600",
        disclosure:
          "Stored in restricted local credential file (.jobai-data/credentials.json, mode 0600, parent 0700). Unencrypted at rest (OS keychain not configured for local dev).",
        updatedAt: null,
      });
      setIsEditing(true);
      setApiKey("");
      setSuccess("AI key removed successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to remove key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      variant="fixed"
      title="AI Provider Settings"
      titleAddon={
        <span className="rounded-md bg-[#e3e6eb] px-2 py-0.5 text-xs font-medium text-[#636c7a]">
          BYOK
        </span>
      }
      description="Bring your own API key for OpenAI, Anthropic (Claude), or GLM (Zhipu AI)."
      className="space-y-6"
    >
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <span className="font-semibold">Error:</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <span className="font-semibold">Success:</span>
          <span className="flex-1">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-[#636c7a] text-sm bg-[#ffffff] rounded-2xl border border-[#e3e6eb]">Loading AI settings...</div>
      ) : (
        <>
          {/* Active Configuration View */}
          {config?.configured && !isEditing && (
            <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#191b20] font-heading">Configured Provider</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#636c7a] mt-0.5">
                    Ready for CV tailoring and extraction
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestExisting}
                    disabled={testing}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#e3e6eb] bg-[#f1f3f6] text-[#191b20] hover:bg-[#e3e6eb] transition cursor-pointer disabled:opacity-50"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setProvider(config.provider || "openai");
                      setModel(config.model || DEFAULT_MODELS[config.provider || "openai"]);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] hover:bg-[var(--ui-accent-line)] transition cursor-pointer"
                  >
                    Replace Key
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                  >
                    Remove Key
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-[#f7f8fa] border border-[#e3e6eb] rounded-xl">
                  <dt className="text-[#8b939f] font-medium">Provider</dt>
                  <dd className="mt-1 font-bold text-[#191b20] text-sm">
                    {PROVIDER_NAMES[config.provider || "openai"]}
                  </dd>
                </div>
                <div className="p-3.5 bg-[#f7f8fa] border border-[#e3e6eb] rounded-xl">
                  <dt className="text-[#8b939f] font-medium">Model</dt>
                  <dd className="mt-1 font-mono text-xs font-semibold text-[#191b20]">
                    {config.model}
                  </dd>
                </div>
                <div className="p-3.5 bg-[#f7f8fa] border border-[#e3e6eb] rounded-xl">
                  <dt className="text-[#8b939f] font-medium">API Key</dt>
                  <dd className="mt-1 font-mono text-xs text-[#636c7a]">
                    {config.maskedKey || "••••••••"}
                  </dd>
                </div>
                <div className="p-3.5 bg-[#f7f8fa] border border-[#e3e6eb] rounded-xl">
                  <dt className="text-[#8b939f] font-medium">Endpoint</dt>
                  <dd className="mt-1 text-xs text-[#636c7a] font-mono truncate">
                    {PROVIDER_ENDPOINTS[config.provider || "openai"]}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl bg-[#f7f8fa] p-4 border border-[#f1f3f6] text-xs text-[#636c7a] space-y-1">
                <div className="font-semibold text-[#191b20]">Storage & Privacy Details</div>
                <p>{config.disclosure}</p>
                <p className="text-[#8b939f]">
                  Raw keys are never logged, never returned to the browser, and never exposed to the Chrome extension.
                </p>
              </div>
            </div>
          )}

          {/* Configuration / Replace Form */}
          {isEditing && (
            <form onSubmit={handleSaveAndTest} className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#191b20] font-heading">
                    {config?.configured ? "Replace AI Provider Key" : "Configure AI Provider"}
                  </h2>
                  <p className="text-xs text-[#636c7a] mt-0.5">
                    Select your provider and enter your API credentials
                  </p>
                </div>
                {config?.configured && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-[#636c7a] hover:text-[#191b20] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#636c7a]">
                  Select Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["openai", "anthropic", "glm"] as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        provider === p
                          ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)]/30 ring-2 ring-[var(--ui-accent)]/20"
                          : "border-[#e3e6eb] hover:border-[var(--ui-accent-line)] bg-white"
                      }`}
                    >
                      <div className="font-bold text-xs text-[#191b20]">{PROVIDER_NAMES[p]}</div>
                      <div className="text-[11px] text-[#636c7a] mt-1 font-mono">Default: {DEFAULT_MODELS[p]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="apiKey" className="block text-xs font-bold uppercase tracking-wider text-[#636c7a]">
                    API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-[var(--ui-accent)] hover:underline cursor-pointer font-medium"
                  >
                    {showKey ? "Hide key" : "Show key"}
                  </button>
                </div>
                <input
                  id="apiKey"
                  name="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === "openai"
                      ? "sk-..."
                      : provider === "anthropic"
                      ? "sk-ant-..."
                      : "zhipu / glm api key"
                  }
                  autoComplete="off"
                  spellCheck="false"
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#e3e6eb] rounded-xl focus:outline-hidden focus:border-[var(--ui-accent)] bg-white text-[#191b20]"
                />
                <p className="text-[11px] text-[#8b939f]">
                  Key is sent directly to the local JobAI server and saved with file mode 0600. It is never logged or exposed.
                </p>
              </div>

              {/* Model Input */}
              <div className="space-y-2">
                <label htmlFor="model" className="block text-xs font-bold uppercase tracking-wider text-[#636c7a]">
                  Model ID
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[provider]}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#e3e6eb] rounded-xl focus:outline-hidden focus:border-[var(--ui-accent)] bg-white text-[#191b20]"
                />
                <p className="text-[11px] text-[#8b939f]">
                  Default: <span className="font-mono">{DEFAULT_MODELS[provider]}</span>. You may enter any model supported by your provider account.
                </p>
              </div>

              {/* Security & Data Transfer Disclosure */}
              <div className="rounded-xl bg-[#f7f8fa] border border-[#f1f3f6] p-4 space-y-2 text-xs text-[#3f4753]">
                <div className="font-bold flex items-center gap-1.5 text-[#191b20]">
                  <span>Data Transfer &amp; Storage Disclosure</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#636c7a] leading-relaxed">
                  <li>
                    <strong>Network:</strong> AI requests send your CV text and target job posting directly to {PROVIDER_ENDPOINTS[provider]}.
                  </li>
                  <li>
                    <strong>Local Storage:</strong> Stored on this local server in <span className="font-mono">.jobai-data/credentials.json</span> with restrictive permissions (file mode 0600, parent mode 0700).
                  </li>
                  <li>
                    <strong>Honest Disclosure:</strong> Unencrypted at rest on disk (OS keychain not configured in this local development environment).
                  </li>
                  <li>
                    <strong>Small Charged Request Warning:</strong> Testing your key sends a minimal prompt (&ldquo;Reply with OK&rdquo;) to verify provider connectivity, incurring a tiny token charge.
                  </li>
                </ul>

                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--ui-accent)] focus:ring-[var(--ui-accent)]"
                  />
                  <span className="text-xs font-medium text-[#191b20] select-none">
                    I understand that requests send CV/job text to {PROVIDER_NAMES[provider]} and consent to the minimal verification test call.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {config?.configured && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-[#e3e6eb] bg-[#f1f3f6] text-[#191b20] hover:bg-[#e3e6eb] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !consentGiven || !apiKey.trim()}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#191b20] text-white hover:bg-[#3f4753] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  {saving ? "Verifying & Saving..." : "Save & Test Connection"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </PageLayout>
  );
}
