import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";
import { PageLayout } from "../../components/PageLayout";

export const Route = createFileRoute("/app/extension")({
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
    >
      <PageLayout
        variant="fixed"
        title="Optional browser extension"
        titleAddon={
          status?.boundOrigin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Paired ({status.boundOrigin.replace("chrome-extension://", "").slice(0, 8)}...)
            </span>
          ) : status?.paired || status?.serverTokenActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f6] border border-[#e3e6eb] px-2.5 py-0.5 text-xs font-medium text-[#636c7a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8b939f]" />
              Token active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3e6eb] border border-[#e3e6eb] px-2.5 py-0.5 text-xs font-medium text-[#636c7a]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Not paired
            </span>
          )
        }
        description={
          <>
            Use the extension to tailor a CV from a job listing in Chrome. JobAI stays on your computer at{" "}
            <code className="text-xs bg-[#f1f3f6] font-mono px-1.5 py-0.5 rounded border border-[#e3e6eb] text-[#191b20]">
              {CANONICAL_BASE}
            </code>{" "}
            to tailor CVs directly on job boards.
          </>
        }
        headerActions={
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="text-xs text-[var(--ui-accent)] hover:underline font-medium cursor-pointer disabled:opacity-50"
          >
            {loadingStatus ? "Checking..." : "↻ Refresh status"}
          </button>
        }
        className="space-y-6"
      >
      {statusError && (
        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
          <strong>Status Check Error:</strong> {statusError}
        </div>
      )}

      {/* Two-Step Configure Layout */}
      <div className="space-y-5">
        {/* Step 1: Pair Extension with Connection Code */}
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 border-b border-[#e3e6eb] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191b20] text-xs font-bold text-white">
                1
              </span>
              <h2 className="text-sm font-semibold text-[#191b20] font-heading">
                Pair Extension with One-Time Code
              </h2>
            </div>
            {/* Small browser/extension motif */}
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ui-accent)] bg-[var(--ui-accent-soft)] px-2 py-0.5 rounded-md border border-[var(--ui-accent-line)]">
              <span>🧩</span> Chrome MV3
            </span>
          </div>

          <p className="text-[#636c7a] text-xs leading-relaxed">
            Create a short-lived code, then paste it into the JobAI extension popup. You only need to pair once.
          </p>

          {codeError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
              <strong>Error:</strong> {codeError}
            </div>
          )}

          {!pairingCode ? (
            <div>
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-[#191b20] hover:bg-[#3f4753] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
              >
                {isGenerating ? "Making your code…" : status?.paired ? "Make a new connection code" : "Make connection code"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Single-line readable code with copy button */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--ui-accent-line)] bg-[var(--ui-accent-soft)] p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-[var(--ui-accent)] shrink-0 uppercase tracking-wider">Code</span>
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-[#191b20] select-all">
                    {pairingCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 bg-[#191b20] hover:bg-[#3f4753] text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                  >
                    {copiedCode ? "✓ Copied!" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="text-xs text-[var(--ui-accent)] hover:underline font-medium px-2 py-1 cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#636c7a] leading-relaxed">
                Open the JobAI puzzle-piece icon in Chrome, paste this code, then choose <strong>Connect browser</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Load Extension in Chrome & Tailor */}
        <div className="rounded-2xl border border-[#e3e6eb] bg-[#ffffff] p-6 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 border-b border-[#e3e6eb] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191b20] text-xs font-bold text-white">
                2
              </span>
              <h2 className="text-sm font-semibold text-[#191b20] font-heading">
                Add JobAI to Chrome
              </h2>
            </div>
            {/* Small browser motif */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#636c7a]">
              <span className="rounded bg-[#f1f3f6] px-1.5 py-0.5 border border-[#e3e6eb]">LinkedIn</span>
              <span className="rounded bg-[#f1f3f6] px-1.5 py-0.5 border border-[#e3e6eb]">Indeed</span>
              <span className="rounded bg-[#f1f3f6] px-1.5 py-0.5 border border-[#e3e6eb]">Ashby</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#636c7a] leading-relaxed">
            <div className="flex items-center justify-between gap-2 p-3 bg-[#f7f8fa] rounded-xl border border-[#f1f3f6]">
              <span className="font-mono text-xs text-[#191b20] select-all">chrome://extensions</span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-3 py-1 bg-white hover:bg-[#f7f8fa] text-[#191b20] border border-[#e3e6eb] rounded-lg text-xs font-medium cursor-pointer transition"
              >
                {copiedAddress ? "✓ Copied!" : "Copy address"}
              </button>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Open <span className="font-mono bg-[#f1f3f6] px-1 rounded border border-[#e3e6eb]">chrome://extensions</span> in a new tab and turn <strong>Developer mode ON</strong>.</li>
              <li>Click <strong>Load unpacked</strong> and select <code className="font-mono bg-[#f1f3f6] px-1 rounded border border-[#e3e6eb]">apps/extension/dist</code>.</li>
              <li>After code updates, click reload <strong>↻</strong> on the JobAI card in extensions.</li>
            </ol>
          </div>

          <div className="pt-2 border-t border-[#e3e6eb] flex items-center justify-between text-xs text-[#8b939f]">
            <span>For local setup: <code className="font-mono">apps/extension/dist</code></span>
            <a href={DOWNLOAD_HREF} download className="text-[var(--ui-accent)] hover:underline">
              Download extension ZIP
            </a>
          </div>
        </div>
      </div>
      </PageLayout>
    </motion.div>
  );
}
