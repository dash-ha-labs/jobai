import crypto from "node:crypto";
import { validateJobHandoff, validateCV, type CV } from "jobai-shared";
import {
  loadServerProfile,
  saveServerProfile,
  loadDraftVersion,
  saveDraftVersion,
  listDraftVersions,
  saveJobRecord,
  loadJobRecord,
  loadAICredentials,
  saveAICredentials,
  deleteAICredentials,
  getAICredentialsStatus,
  type StoredDraft,
  type StoredJobRecord,
  type AIProvider,
} from "./storage.js";
import {
  createPairingCode,
  claimPairingCode,
  verifyAuthToken,
  isExtensionPaired,
  getBoundOrigin,
} from "./pairing.js";
import {
  isAIConfigured,
  isAIConfiguredAsync,
  tailorCV,
  testProviderConnection,
  structureCVFromText,
  updateCachedAIStatus,
  DEFAULT_PROVIDER_MODELS,
} from "./ai.js";
import {
  parseDocumentBuffer,
  FileTooLargeError,
  InvalidFileFormatError,
  ScannedPdfError,
  EmptyDocumentError,
} from "./cv-parser.js";
import { generateCVPdf } from "./pdf.js";

// Concurrency lock & rate limiting state
let activeTailorRequests = 0;
const tailorTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_TAILOR_REQUESTS_PER_MINUTE = 15;

async function isAllowedOrigin(origin: string | null, pathname?: string): Promise<boolean> {
  if (!origin) return true; // Direct local/test requests
  if (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    return true;
  }
  if (origin.startsWith("chrome-extension://")) {
    // Extension is NEVER allowed to access credential management endpoints
    if (pathname?.startsWith("/api/ai/")) {
      return false;
    }
    // Pairing endpoints allow any chrome-extension origin to exchange or confirm pairing codes
    if (pathname === "/api/pair" || pathname === "/api/pair/confirm") {
      return true;
    }
    const boundOrigin = await getBoundOrigin();
    if (boundOrigin) {
      // Once paired, protected endpoints only permit the explicitly paired extension origin
      return origin === boundOrigin;
    }
    // Prior to pairing, general extension status check is permitted
    if (pathname === "/api/status") {
      return true;
    }
    return false;
  }
  return false;
}

function getCorsHeaders(origin: string | null, isAllowed = false): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-jobai-csrf",
  };
  if (origin && isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function jsonResponse(
  data: unknown,
  status = 200,
  origin: string | null = null,
  isAllowed = true
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin, isAllowed),
    },
  });
}

function errorResponse(
  message: string,
  status = 400,
  code?: string,
  origin: string | null = null,
  isAllowed = false
): Response {
  return jsonResponse({ error: code || "ERROR", code: code || "ERROR", message }, status, origin, isAllowed);
}

/**
 * Validates request authorization.
 * Extensions MUST provide a valid Bearer token matching the paired extension origin.
 * Same-origin CSRF marker alone is NOT accepted for extensions or cross-origin requests.
 */
async function authenticateRequest(
  request: Request,
  allowSameOrigin = true
): Promise<boolean> {
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  const authHeader = request.headers.get("Authorization") || "";

  // 1. Authenticate with Bearer token
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (await verifyAuthToken(token)) {
      if (origin && origin.startsWith("chrome-extension://")) {
        const boundOrigin = await getBoundOrigin();
        if (boundOrigin && origin !== boundOrigin) {
          return false; // Extension origin mismatch
        }
      }
      return true;
    }
    return false;
  }

  // 2. Extensions are strictly forbidden from bypassing Bearer token with CSRF markers
  if (origin && origin.startsWith("chrome-extension://")) {
    return false;
  }

  // 3. Same-origin website authentication for local browser editor
  if (allowSameOrigin) {
    // Chrome extension origins and external origins can NEVER authenticate via CSRF marker alone
    if (
      origin &&
      (origin.startsWith("chrome-extension://") ||
        (!origin.startsWith("http://127.0.0.1:3000") && !origin.startsWith("http://localhost:3000")))
    ) {
      return false;
    }

    const isSameOriginHost = (val: string | null) =>
      Boolean(!val || val.startsWith("http://127.0.0.1:3000") || val.startsWith("http://localhost:3000"));

    const csrf = request.headers.get("x-jobai-csrf");

    // Mutating methods require x-jobai-csrf: 1 plus same-origin host
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (csrf === "1" && isSameOriginHost(origin) && isSameOriginHost(referer)) {
        return true;
      }
      return false;
    }

    // Safe GET requests from website editor
    if (csrf === "1" && isSameOriginHost(origin) && isSameOriginHost(referer)) {
      return true;
    }

    // Direct browser navigation for PDF (e.g. window.open from website)
    const secFetchSite = request.headers.get("Sec-Fetch-Site");
    if (secFetchSite === "same-origin" || (referer && isSameOriginHost(referer))) {
      return true;
    }
  }

  return false;
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const pathname = url.pathname;

  const allowedOrigin = await isAllowedOrigin(origin, pathname);

  // Validate Origin
  if (origin && !allowedOrigin) {
    return errorResponse("Forbidden: cross-origin request rejected", 403, "FORBIDDEN", origin, false);
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin, allowedOrigin),
    });
  }

  try {
    // 1. GET /api/status
    if (pathname === "/api/status" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      let paired = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        paired = await verifyAuthToken(token);
      } else {
        paired = await isExtensionPaired();
      }
      const boundOrigin = await getBoundOrigin();
      const hasToken = await isExtensionPaired();
      const profile = await loadServerProfile();
      const creds = await loadAICredentials();
      const aiReady = await isAIConfiguredAsync();

      return jsonResponse(
        {
          ok: true,
          paired,
          serverTokenActive: hasToken,
          boundOrigin: boundOrigin || null,
          hasProfile: Boolean(profile),
          aiConfigured: aiReady,
          aiProvider: creds?.provider || null,
          aiModel:
            creds?.model ||
            (process.env.OPENAI_API_KEY ? process.env.OPENAI_MODEL || "gpt-4o-mini" : null),
          version: "1.0.0",
        },
        200,
        origin
      );
    }

    // 2. POST /api/pair/code (Generate one-time code for extension)
    if (pathname === "/api/pair/code" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }
      const pairInfo = await createPairingCode();
      return jsonResponse(pairInfo, 200, origin);
    }

    // 3. POST /api/pair or /api/pair/confirm (Extension claims code to get permanent token)
    if ((pathname === "/api/pair" || pathname === "/api/pair/confirm") && request.method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin, allowedOrigin);
      }
      const result = await claimPairingCode(body.code, origin);
      if (!result.success || !result.token) {
        return errorResponse(result.error || "Pairing failed", 400, "PAIRING_FAILED", origin, allowedOrigin);
      }
      const profile = await loadServerProfile();
      return jsonResponse(
        {
          ok: true,
          token: result.token,
          authToken: result.token,
          hasProfile: Boolean(profile),
          aiConfigured: isAIConfigured(),
        },
        200,
        origin,
        true
      );
    }

    // 4. POST /api/profile (Sync profile from website or extension)
    if (pathname === "/api/profile" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
      }
      const cv: CV = body.cv;
      const saveRes = await saveServerProfile(cv);
      if (!saveRes.success) {
        return errorResponse(saveRes.error || "Failed to save profile", 400, "VALIDATION_ERROR", origin);
      }
      return jsonResponse({ ok: true, success: true, savedAt: new Date().toISOString() }, 200, origin);
    }

    // 5. GET /api/profile (Retrieve synced master CV)
    if (pathname === "/api/profile" && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      const cv = await loadServerProfile();
      return jsonResponse({ ok: true, cv }, 200, origin);
    }

    // 6. POST /api/tailor (Extension-first AI tailoring) and website-only local alias
    if ((pathname === "/api/tailor" || pathname === "/api/cv/tailor") && request.method === "POST") {
      const isWebsiteAlias = pathname === "/api/cv/tailor";
      if (isWebsiteAlias) {
        const requestOrigin = request.headers.get("Origin");
        const urlOrigin = url.origin;
        const allowedWebsiteOrigins = new Set(["http://127.0.0.1:3000", "http://localhost:3000"]);
        if (!requestOrigin || requestOrigin !== urlOrigin || !allowedWebsiteOrigins.has(requestOrigin)) {
          return errorResponse("Website tailoring requires an exact same-origin request", 403, "FORBIDDEN", origin, false);
        }
      }

      // Website alias relies on the same-origin CSRF check. The extension endpoint
      // remains paired-token-only and cannot authenticate with a CSRF marker.
      const isAuth = await authenticateRequest(request, isWebsiteAlias);
      if (!isAuth) {
        return errorResponse("Unauthorized: extension must be paired", 401, "UNAUTHORIZED", origin);
      }

      // Rate limit check
      const now = Date.now();
      while (tailorTimestamps.length > 0 && now - tailorTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
        tailorTimestamps.shift();
      }
      if (tailorTimestamps.length >= MAX_TAILOR_REQUESTS_PER_MINUTE) {
        return errorResponse("Rate limit exceeded. Please try again in 1 minute.", 429, "RATE_LIMITED", origin);
      }

      // Concurrency check
      if (activeTailorRequests > 0) {
        return errorResponse(
          "A tailoring job is currently in progress. Please wait for it to complete.",
          429,
          "CONCURRENCY_LIMIT",
          origin
        );
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
      }

      const rawJob = body.job || body.listing || body;
      const normalizedJob = {
        title: rawJob.title || rawJob.jobTitle,
        company: rawJob.company,
        sourceUrl: rawJob.sourceUrl,
        text: rawJob.text || rawJob.extractedText || rawJob.jobText,
      };

      const jobValidation = validateJobHandoff(normalizedJob);
      if (!jobValidation.valid || !jobValidation.data) {
        return jsonResponse(
          { error: "VALIDATION_ERROR", message: "Job payload failed validation", details: jobValidation.errors },
          400,
          origin
        );
      }

      const profile = await loadServerProfile();
      if (!profile) {
        return errorResponse(
          "Master CV profile is not synced. Open the JobAI web editor and click 'Connect to extension'.",
          400,
          "NO_PROFILE",
          origin
        );
      }

      const aiReady = await isAIConfiguredAsync();
      if (!aiReady) {
        return errorResponse(
          "OPENAI_API_KEY (or configured BYOK provider) is not set on the JobAI server. Configure your key in AI settings (/settings/ai).",
          503,
          "AI_CREDENTIALS_REQUIRED",
          origin
        );
      }

      activeTailorRequests++;
      tailorTimestamps.push(now);

      const draftId = `draft-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const jobId = `job-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const templateId = body.templateId || profile.stylePrefs?.templateId || "modern";

      // Persist durable job in state processing for MV3 restart recovery
      const jobRecord: StoredJobRecord = {
        id: jobId,
        status: "processing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveJobRecord(jobRecord);

      try {
        const { tailoredCV, changes, unapprovedSuggestedSummary } = await tailorCV(profile, jobValidation.data, draftId, templateId);

        // Store draft version without touching profile.json
        const draftRecord: StoredDraft = {
          id: draftId,
          masterId: profile.id,
          jobTitle: jobValidation.data.title,
          company: jobValidation.data.company,
          sourceUrl: jobValidation.data.sourceUrl,
          jobText: jobValidation.data.text,
          templateId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tailoredCV,
          changes,
          unapprovedSuggestedSummary,
        };

        const saveDraftRes = await saveDraftVersion(draftRecord);
        if (!saveDraftRes.success) {
          throw new Error(saveDraftRes.error || "Failed to persist draft");
        }

        const tailorResult = {
          jobId,
          draftId,
          jobTitle: jobValidation.data.title,
          company: jobValidation.data.company,
          sourceUrl: jobValidation.data.sourceUrl,
          templateId,
          tailoredCV,
          changes,
          unapprovedSuggestedSummary,
          createdAt: draftRecord.createdAt,
          pdfUrl: `/api/pdf/${draftId}`,
        };

        jobRecord.status = "completed";
        jobRecord.draftId = draftId;
        jobRecord.updatedAt = new Date().toISOString();
        jobRecord.result = tailorResult;
        await saveJobRecord(jobRecord);

        return jsonResponse(tailorResult, 200, origin, allowedOrigin);
      } catch (err: any) {
        jobRecord.status = "failed";
        jobRecord.error = err?.message || String(err);
        jobRecord.updatedAt = new Date().toISOString();
        await saveJobRecord(jobRecord).catch(() => {});
        throw err;
      } finally {
        activeTailorRequests--;
      }
    }

    // 6b. GET /api/tailor/jobs/:id (Durable server job polling for MV3 restart recovery)
    if (pathname.startsWith("/api/tailor/jobs/") && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin, allowedOrigin);
      }
      const id = pathname.slice("/api/tailor/jobs/".length);
      const job = await loadJobRecord(id);
      if (!job) {
        return errorResponse("Job not found", 404, "NOT_FOUND", origin, allowedOrigin);
      }
      return jsonResponse({ ok: true, job }, 200, origin, allowedOrigin);
    }

    // 7. GET /api/pdf/:id (Download text-selectable PDF)
    if (pathname.startsWith("/api/pdf/") && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }

      const id = pathname.slice("/api/pdf/".length);
      let cvToRender: CV | null = null;
      let templateId: string | undefined;
      let filename = "cv.pdf";

      if (id === "master") {
        cvToRender = await loadServerProfile();
        filename = `cv-${cvToRender?.contact.name?.replace(/\s+/g, "_") || "master"}.pdf`;
      } else {
        const draft = await loadDraftVersion(id);
        if (draft) {
          cvToRender = draft.tailoredCV;
          templateId = draft.templateId;
          const cleanCompany = draft.company ? draft.company.replace(/[^a-zA-Z0-9_-]/g, "_") : "tailored";
          filename = `cv-${cleanCompany}.pdf`;
        }
      }

      if (!cvToRender) {
        return errorResponse("CV draft not found", 404, "NOT_FOUND", origin);
      }

      const pdfBytes = await generateCVPdf(cvToRender, templateId);
      return new Response(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          ...getCorsHeaders(origin),
        },
      });
    }

    // 8. GET /api/drafts
    if (pathname === "/api/drafts" && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      const drafts = await listDraftVersions();
      return jsonResponse({ ok: true, drafts }, 200, origin);
    }

    // 8b. POST /api/drafts (Save or create draft version)
    if (pathname === "/api/drafts" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
      }
      const draftToSave = body.draft || body;
      const saveRes = await saveDraftVersion(draftToSave);
      if (!saveRes.success) {
        return errorResponse(saveRes.error || "Failed to save draft", 400, "VALIDATION_ERROR", origin);
      }
      return jsonResponse({ ok: true, success: true, draftId: draftToSave.id }, 200, origin);
    }

    // 9. GET /api/drafts/:id
    if (pathname.startsWith("/api/drafts/") && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      const id = pathname.slice("/api/drafts/".length);
      const draft = await loadDraftVersion(id);
      if (!draft) {
        return errorResponse("Draft not found", 404, "NOT_FOUND", origin);
      }
      return jsonResponse({ ok: true, draft }, 200, origin);
    }

    // 10. PUT /api/drafts/:id (Update exact draft CV only)
    if (pathname.startsWith("/api/drafts/") && request.method === "PUT") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized", 401, "UNAUTHORIZED", origin);
      }
      const id = pathname.slice("/api/drafts/".length);
      const draft = await loadDraftVersion(id);
      if (!draft) {
        return errorResponse("Draft not found", 404, "NOT_FOUND", origin);
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
      }

      const updatedCV: CV = body.cv;
      const validation = validateCV(updatedCV);
      if (!validation.valid) {
        return errorResponse(`Invalid CV: ${validation.errors.join(", ")}`, 400, "VALIDATION_ERROR", origin);
      }

      draft.tailoredCV = updatedCV;
      draft.updatedAt = new Date().toISOString();
      await saveDraftVersion(draft);

      return jsonResponse({ success: true, draft }, 200, origin);
    }

    // 11. GET /api/ai/config (Retrieve masked status, never raw keys)
    if (pathname === "/api/ai/config" && request.method === "GET") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }
      const status = await getAICredentialsStatus();
      return jsonResponse({ ok: true, status }, 200, origin);
    }

    // 12. POST /api/ai/config (Save BYOK credentials with mode 0600)
    if (pathname === "/api/ai/config" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
      }

      const { provider, apiKey, model, test: shouldTest } = body;
      if (!provider || !["openai", "anthropic", "glm"].includes(provider)) {
        return errorResponse("Invalid provider. Must be openai, anthropic, or glm", 400, "INVALID_PROVIDER", origin);
      }
      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return errorResponse("API key is required", 400, "INVALID_API_KEY", origin);
      }
      const modelId =
        typeof model === "string" && model.trim()
          ? model.trim()
          : DEFAULT_PROVIDER_MODELS[provider as AIProvider];

      if (shouldTest) {
        try {
          await testProviderConnection(provider as AIProvider, apiKey.trim(), modelId);
        } catch (testErr: any) {
          return errorResponse(testErr?.message || "Connection test failed", 400, "CONNECTION_TEST_FAILED", origin);
        }
      }

      const saveRes = await saveAICredentials({
        provider: provider as AIProvider,
        apiKey: apiKey.trim(),
        model: modelId,
      });

      if (!saveRes.success) {
        return errorResponse(saveRes.error || "Failed to save AI credentials", 500, "STORAGE_ERROR", origin);
      }

      updateCachedAIStatus(true);
      const status = await getAICredentialsStatus();
      return jsonResponse({ ok: true, status }, 200, origin);
    }

    // 13. POST /api/ai/test (Test provider connection)
    if (pathname === "/api/ai/test" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      let provider: AIProvider;
      let apiKey: string;
      let model: string;

      if (body.provider && body.apiKey) {
        provider = body.provider;
        apiKey = body.apiKey;
        model = body.model || DEFAULT_PROVIDER_MODELS[provider] || "gpt-4o-mini";
      } else {
        const stored = await loadAICredentials();
        if (!stored) {
          return errorResponse("No AI credentials configured to test", 400, "NOT_CONFIGURED", origin);
        }
        provider = stored.provider;
        apiKey = stored.apiKey;
        model = stored.model;
      }

      try {
        const result = await testProviderConnection(provider, apiKey, model);
        return jsonResponse({ ok: true, message: result.message }, 200, origin);
      } catch (err: any) {
        return errorResponse(err?.message || "Connection test failed", 400, "CONNECTION_TEST_FAILED", origin);
      }
    }

    // 14. DELETE /api/ai/config (Remove credentials)
    if (pathname === "/api/ai/config" && request.method === "DELETE") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }
      const delRes = await deleteAICredentials();
      if (!delRes.success) {
        return errorResponse(delRes.error || "Failed to remove credentials", 500, "STORAGE_ERROR", origin);
      }
      updateCachedAIStatus(false);
      return jsonResponse({ ok: true, message: "AI credentials removed" }, 200, origin);
    }

    // 15. POST /api/cv/extract (CV text & document parsing + AI structuring)
    if (pathname === "/api/cv/extract" && request.method === "POST") {
      const isAuth = await authenticateRequest(request, true);
      if (!isAuth) {
        return errorResponse("Unauthorized: CSRF validation failed", 403, "UNAUTHORIZED", origin);
      }

      let rawText = "";
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body", 400, "BAD_REQUEST", origin);
        }

        if (body.fileBase64 && typeof body.fileBase64 === "string") {
          try {
            const buffer = Buffer.from(body.fileBase64, "base64");
            const parsed = await parseDocumentBuffer(buffer, body.filename || "document.pdf");
            rawText = parsed.text;
          } catch (err: any) {
            if (
              err instanceof FileTooLargeError ||
              err instanceof InvalidFileFormatError ||
              err instanceof ScannedPdfError ||
              err instanceof EmptyDocumentError
            ) {
              return errorResponse(err.message, 400, err.code, origin);
            }
            return errorResponse(err?.message || "Failed to parse document", 400, "PARSE_ERROR", origin);
          }
        } else if (body.text && typeof body.text === "string") {
          rawText = body.text.slice(0, 60000).trim();
          if (!rawText) {
            return errorResponse("Document text is empty", 400, "EMPTY_DOCUMENT", origin);
          }
        } else {
          return errorResponse("Either text or fileBase64 is required", 400, "BAD_REQUEST", origin);
        }
      } else {
        try {
          const arrayBuffer = await request.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const parsed = await parseDocumentBuffer(buffer, "upload.pdf");
          rawText = parsed.text;
        } catch (err: any) {
          if (
            err instanceof FileTooLargeError ||
            err instanceof InvalidFileFormatError ||
            err instanceof ScannedPdfError ||
            err instanceof EmptyDocumentError
          ) {
            return errorResponse(err.message, 400, err.code, origin);
          }
          return errorResponse(err?.message || "Failed to parse document", 400, "PARSE_ERROR", origin);
        }
      }

      const isAiReady = await isAIConfiguredAsync();
      if (!isAiReady) {
        return errorResponse(
          "AI provider is not configured. Please configure your API key in AI settings (/settings/ai) first.",
          503,
          "AI_CREDENTIALS_REQUIRED",
          origin
        );
      }

      try {
        const { structuredCV, notes } = await structureCVFromText(rawText);
        const validation = validateCV(structuredCV);
        if (!validation.valid) {
          return jsonResponse(
            {
              ok: false,
              error: "VALIDATION_ERROR",
              message: "Structured CV failed schema validation",
              details: validation.errors,
            },
            422,
            origin
          );
        }
        return jsonResponse(
          {
            ok: true,
            cv: structuredCV,
            charCount: rawText.length,
            notes,
          },
          200,
          origin
        );
      } catch (aiErr: any) {
        return errorResponse(aiErr?.message || "AI CV structuring failed", 500, "AI_ERROR", origin);
      }
    }

    return errorResponse(`Endpoint ${pathname} not found`, 404, "NOT_FOUND", origin);
  } catch (err: any) {
    return errorResponse(`Internal server error: ${err?.message || String(err)}`, 500, "SERVER_ERROR", origin);
  }
}
