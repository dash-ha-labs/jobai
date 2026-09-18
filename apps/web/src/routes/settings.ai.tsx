import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings/ai")({
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
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Provider Settings</h1>
        <p className="text-sm text-slate-600 mt-1">
          Bring your own API key (BYOK) for OpenAI, Anthropic (Claude), or GLM (Zhipu AI).
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <span className="font-semibold">Error:</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
          <span className="font-semibold">Success:</span>
          <span className="flex-1">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading AI settings...</div>
      ) : (
        <>
          {/* Active Configuration View */}
          {config?.configured && !isEditing && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">Configured Provider</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ready for CV tailoring and extraction
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestExisting}
                    disabled={testing}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Replace Key
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Remove Key
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Provider</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {PROVIDER_NAMES[config.provider || "openai"]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Model</dt>
                  <dd className="mt-1 font-mono text-xs bg-slate-50 px-2 py-1 rounded inline-block text-slate-700 border border-slate-200">
                    {config.model}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">API Key</dt>
                  <dd className="mt-1 font-mono text-xs text-slate-600">
                    {config.maskedKey || "••••••••"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Endpoint</dt>
                  <dd className="mt-1 text-xs text-slate-500 font-mono">
                    {PROVIDER_ENDPOINTS[config.provider || "openai"]}
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Storage & Privacy Details</div>
                <p>{config.disclosure}</p>
                <p className="text-slate-500">
                  Raw keys are never logged, never returned to the browser, and never exposed to the Chrome extension.
                </p>
              </div>
            </div>
          )}

          {/* Configuration / Replace Form */}
          {isEditing && (
            <form onSubmit={handleSaveAndTest} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {config?.configured ? "Replace AI Provider Key" : "Configure AI Provider"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your provider and enter your API credentials
                  </p>
                </div>
                {config?.configured && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["openai", "anthropic", "glm"] as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        provider === p
                          ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-900">{PROVIDER_NAMES[p]}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Default: {DEFAULT_MODELS[p]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="apiKey" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Key is sent directly to the local JobAI server and saved with mode 0600. It is never logged or exposed.
                </p>
              </div>

              {/* Model Input */}
              <div className="space-y-2">
                <label htmlFor="model" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Model ID
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[provider]}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Default: <span className="font-mono">{DEFAULT_MODELS[provider]}</span>. You may enter any supported model ID for your account.
                </p>
              </div>

              {/* Security & Data Transfer Disclosure */}
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-4 space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>Data Transfer & Storage Disclosure</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11.5px] text-amber-800 leading-relaxed">
                  <li>
                    <strong>Network:</strong> AI requests send your CV content and target job posting text directly to the chosen provider endpoint ({PROVIDER_ENDPOINTS[provider]}).
                  </li>
                  <li>
                    <strong>Local Storage:</strong> Stored on this local server in <span className="font-mono">.jobai-data/credentials.json</span> with restrictive permissions (file mode 0600, parent mode 0700).
                  </li>
                  <li>
                    <strong>Honest Disclosure:</strong> Unencrypted at rest on disk (OS keychain not configured in this local development environment).
                  </li>
                  <li>
                    <strong>Small Charged Request Warning:</strong> Testing your key sends a minimal prompt (&ldquo;Reply with OK&rdquo;) to verify provider connectivity, incurring a tiny charge on your account.
                  </li>
                </ul>

                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-amber-950 select-none">
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
                    className="px-4 py-2 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !consentGiven || !apiKey.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  {saving ? "Verifying & Saving..." : "Save & Test"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
