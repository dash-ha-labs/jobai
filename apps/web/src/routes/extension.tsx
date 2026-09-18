import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/extension")({
  component: ExtensionComponent,
});

const DOWNLOAD_HREF = "/downloads/jobai-extension.zip";
const CANONICAL_BASE = "http://127.0.0.1:3000";

interface ServerStatus {
  paired: boolean;
  boundOrigin?: string | null;
  serverTokenActive?: boolean;
  hasProfile: boolean;
  aiConfigured: boolean;
  version?: string;
}

function ExtensionComponent() {
  const shouldReduceMotion = useReducedMotion();

  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch status on mount
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/status");
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatus({
        paired: Boolean(data.paired),
        boundOrigin: data.boundOrigin || null,
        serverTokenActive: Boolean(data.serverTokenActive),
        hasProfile: Boolean(data.hasProfile),
        aiConfigured: Boolean(data.aiConfigured),
        version: data.version,
      });
      setStatusError(null);
    } catch (err: any) {
      setStatusError(err?.message || "Failed to check server status");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Action: Generate pairing code
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/pair/code", {
        method: "POST",
        headers: {
          "x-jobai-csrf": "1",
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to generate code (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.code) {
        throw new Error("Server did not return a valid pairing code");
      }
      setPairingCode(data.code);
      setCopiedCode(false);
    } catch (err: any) {
      setCodeError(err?.message || String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy helpers
  const handleCopyCode = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
      setCopiedCode(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText("chrome://extensions");
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch {
      setCopiedAddress(false);
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          JobAI Extension Setup &amp; Pairing
        </h1>
        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
          Connect your Chrome extension to your local JobAI backend at{" "}
          <code className="text-xs bg-slate-100 font-mono px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
            {CANONICAL_BASE}
          </code>{" "}
          to tailor CVs directly on job listing pages.
        </p>
      </div>

      {/* 1. Real Connection Status Overview */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Current Connection Status</h2>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer disabled:opacity-50"
          >
            {loadingStatus ? "Checking..." : "↻ Refresh"}
          </button>
        </div>

        {statusError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
            <strong>Status Check Error:</strong> {statusError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-500 block font-medium">Extension Link</span>
            {status?.boundOrigin ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700" title={`Bound origin: ${status.boundOrigin}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paired ({status.boundOrigin.replace("chrome-extension://", "").slice(0, 8)}...)
              </span>
            ) : status?.paired || status?.serverTokenActive ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Token active (unlinked)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Not paired
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-500 block font-medium">Master CV</span>
            {status?.hasProfile ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Saved &amp; ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> No CV saved yet
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-500 block font-medium">AI Tailoring Engine</span>
            {status?.aiConfigured ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Key configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> OPENAI_API_KEY unset
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Generate Connection Code Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">1. Pair Extension with Connection Code</h2>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            Generate an expiring one-time code to authorize your unpacked Chrome extension.
            No CV is required merely to connect.
          </p>
        </div>

        {codeError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            <strong>Error:</strong> {codeError}
          </div>
        )}

        {!pairingCode ? (
          <div>
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              {isGenerating ? "Generating code..." : status?.paired ? "Generate fresh connection code" : "Generate connection code"}
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Protected by same-origin CSRF verification. Valid for 10 minutes.
            </p>
          </div>
        ) : (
          <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                Active Connection Code
              </span>
              <span className="text-xs text-indigo-600 font-medium">Valid for 10 minutes</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-3xl sm:text-4xl font-mono font-black text-indigo-950 tracking-widest bg-white px-5 py-2.5 rounded-lg border border-indigo-200 shadow-xs select-all">
                {pairingCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                {copiedCode ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed">
              Open the JobAI extension popup from your Chrome toolbar, paste or type this code into the{" "}
              <strong>6-LETTER CODE</strong> field, and click <strong>Pair with Code</strong>.
            </p>

            <div className="pt-2 border-t border-indigo-100 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="text-xs text-indigo-700 hover:text-indigo-950 font-semibold underline cursor-pointer"
              >
                Generate another code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Prerequisite: Save a CV */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">2. Prerequisite for Tailoring: Save a CV</h2>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              The extension tailors your authentic experience to match job listings.
              Pairing connects your browser extension; to generate tailored applications, save and sync your master CV in the editor.
            </p>
          </div>
        </div>

        {status?.hasProfile ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <span>✓ Master CV is saved and synced on this local machine.</span>
            <Link to="/" className="font-semibold underline hover:text-emerald-900">
              Edit Master CV &rarr;
            </Link>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
            <p className="font-semibold">No Master CV saved yet</p>
            <p className="leading-relaxed">
              After pairing, the extension will ask you to save a CV before it can tailor job listings.
              You do not need to enter a new pairing code after saving your CV.
            </p>
            <div className="pt-1">
              <Link
                to="/"
                className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Open CV Editor &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. Chrome Extension Instructions & Reload Guidance */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">3. Load or Reload Extension in Chrome</h2>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            The unpacked extension build lives in the repository at:
          </p>
          <div className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto select-all">
            apps/extension/dist
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>⚠️</span> How to open Chrome Extensions page:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Chrome blocks web pages from automatically opening <code>chrome://</code> URLs for security.
              Copy the address below and open it manually in a new tab:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <code className="bg-white px-3 py-1.5 rounded border border-slate-300 font-mono text-xs text-slate-800 select-all">
                chrome://extensions
              </code>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-medium cursor-pointer transition-colors"
              >
                {copiedAddress ? "✓ Copied!" : "Copy address"}
              </button>
            </div>
          </div>

          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
            <li>
              In Chrome, open <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">chrome://extensions</span>.
            </li>
            <li>
              Ensure <strong>Developer mode</strong> is toggled <strong>ON</strong> (top-right switch).
            </li>
            <li>
              If not loaded yet: click <strong>Load unpacked</strong> and select the directory{" "}
              <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">apps/extension/dist</code>.
            </li>
            <li>
              <strong>After any update:</strong> Click the reload icon{" "}
              <span className="font-bold text-slate-800">↻</span> on the <strong>JobAI - CV Tailor &amp; Importer</strong> card.
            </li>
            <li>
              Pin the JobAI extension via the puzzle-piece icon in the Chrome toolbar.
            </li>
          </ol>
        </div>

        <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>Unpacked directory is primary.</span>
          <a
            href={DOWNLOAD_HREF}
            download
            className="text-slate-500 hover:text-slate-700 underline"
          >
            Optional: Download extension ZIP
          </a>
        </div>
      </div>
    </motion.div>
  );
}