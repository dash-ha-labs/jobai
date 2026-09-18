import { chat } from "@tanstack/ai";
import { createOpenaiChatCompletions } from "@tanstack/ai-openai";
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import { createAnthropicChat } from "@tanstack/ai-anthropic";
import { type CV, type JobHandoffPayload, validateCV } from "jobai-shared";
import {
  loadAICredentials,
  type AIProvider,
} from "./storage.js";

export class MissingAICredentialsError extends Error {
  code = "AI_CREDENTIALS_REQUIRED";
  constructor(
    message = "AI credentials not configured. Set OPENAI_API_KEY in environment or configure OpenAI, Anthropic, or GLM in AI settings (/settings/ai) to enable tailoring."
  ) {
    super(message);
    this.name = "MissingAICredentialsError";
  }
}

export const OFFICIAL_PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  glm: "https://open.bigmodel.cn/api/paas/v4",
};

export const DEFAULT_PROVIDER_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  glm: "glm-4-flash",
};

let cachedCredentialsConfigured: boolean | null = null;

export function updateCachedAIStatus(configured: boolean | null): void {
  cachedCredentialsConfigured = configured;
}

export function isAIConfigured(): boolean {
  if (customEngine) return true;
  if (cachedCredentialsConfigured !== null) return cachedCredentialsConfigured;
  const key = process.env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export async function isAIConfiguredAsync(): Promise<boolean> {
  if (customEngine) return true;
  const creds = await loadAICredentials();
  cachedCredentialsConfigured = Boolean(creds);
  if (cachedCredentialsConfigured) return true;
  const key = process.env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export interface TailoringResult {
  tailoredCV: CV;
  changes: string[];
  unapprovedSuggestedSummary?: string;
}

export class MalformedModelOutputError extends Error {
  code = "MALFORMED_AI_OUTPUT";
  constructor(message: string) {
    super(message);
    this.name = "MalformedModelOutputError";
  }
}

export type AIEngine = (
  masterCV: CV,
  job: JobHandoffPayload,
  templateId?: string
) => Promise<TailoringResult>;

let customEngine: AIEngine | null = null;

/**
 * Sets a labeled test double for automated tests.
 * NEVER used in production — only for labeled integration test doubles.
 */
export function setTestAIEngine(engine: AIEngine | null): void {
  customEngine = engine;
}

export function resetAIEngine(): void {
  customEngine = null;
}

let testFixtureOverride: ((provider: string, prompt: string) => Promise<string>) | null = null;

export function setTestFixtureOverride(
  fn: ((provider: string, prompt: string) => Promise<string>) | null
): void {
  testFixtureOverride = fn;
}

export interface ModelOutput {
  suggestedSummary?: string;
  selectedSections?: Array<{
    sectionId: string;
    itemIds: string[];
  }>;
  changes?: string[];
}

/**
 * Redacts any sensitive keys from error messages before returning or logging.
 */
export function sanitizeErrorMessage(errorText: string, apiKey?: string): string {
  let sanitized = errorText;
  if (apiKey && apiKey.length > 4) {
    sanitized = sanitized.split(apiKey).join("[REDACTED_KEY]");
  }
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_KEY]");
  sanitized = sanitized.replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]");
  return sanitized.slice(0, 300);
}

/**
 * Creates TanStack AI adapter for the configured provider.
 * Uses official fixed endpoints unless overridden by server environment.
 */
export function createProviderAdapter(
  provider: AIProvider,
  apiKey: string,
  model: string
) {
  if (provider === "openai") {
    const baseURL = (process.env.OPENAI_BASE_URL || OFFICIAL_PROVIDER_ENDPOINTS.openai).replace(/\/+$/, "");
    return createOpenaiChatCompletions(model as any, apiKey, { baseURL });
  }

  if (provider === "anthropic") {
    const baseURL = (process.env.ANTHROPIC_BASE_URL || OFFICIAL_PROVIDER_ENDPOINTS.anthropic).replace(/\/+$/, "");
    return createAnthropicChat(model as any, apiKey, { baseURL });
  }

  if (provider === "glm") {
    const baseURL = (process.env.GLM_BASE_URL || OFFICIAL_PROVIDER_ENDPOINTS.glm).replace(/\/+$/, "");
    return openaiCompatibleText(model, {
      apiKey,
      baseURL,
      name: "glm",
    });
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Executes a minimal test call to verify provider credentials.
 */
export async function testProviderConnection(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<{ ok: boolean; message: string }> {
  if (testFixtureOverride) {
    const fixtureRes = await testFixtureOverride(provider, "test-connection");
    return { ok: true, message: `Connection to ${provider} (${model}) verified via fixture: ${fixtureRes}` };
  }

  try {
    const adapter = createProviderAdapter(provider, apiKey, model);
    const result = await chat({
      adapter: adapter as any,
      messages: [{ role: "user", content: "Reply with the single word OK." }] as any,
      stream: false,
    });

    if (typeof result === "string" && result.length > 0) {
      return { ok: true, message: `Connection to ${provider} (${model}) verified successfully.` };
    }
    return { ok: true, message: `Connection to ${provider} (${model}) verified.` };
  } catch (err: any) {
    const safeErr = sanitizeErrorMessage(err?.message || String(err), apiKey);
    if (safeErr.includes("401") || safeErr.toLowerCase().includes("invalid api key") || safeErr.toLowerCase().includes("unauthorized")) {
      throw new Error(`Authentication failed: Invalid API key for ${provider}. Please verify your key.`);
    }
    if (safeErr.includes("429") || safeErr.toLowerCase().includes("quota")) {
      throw new Error(`Quota exceeded or rate limit reached on ${provider}.`);
    }
    if (safeErr.includes("404") || safeErr.toLowerCase().includes("model_not_found")) {
      throw new Error(`Model "${model}" not found or unsupported on ${provider}.`);
    }
    throw new Error(`Connection test failed: ${safeErr}`);
  }
}

/**
 * Reconstructs a fact-safe tailored CV from master CV and AI model output.
 * Guarantees that only existing item IDs are retained, and all original
 * dates, employers, titles, degrees, and bullets are preserved verbatim.
 * Rejects unknown or duplicate IDs and malformed model outputs.
 * Preserves authentic summary in automatic CV/PDF; suggested summary is labeled unapproved.
 * Change notes are derived exclusively from actual differences between master and tailored CV.
 */
export function reconstructFactSafeCV(
  masterCV: CV,
  draftId: string,
  modelOutput: ModelOutput,
  templateId?: string
): TailoringResult {
  if (!modelOutput || typeof modelOutput !== "object" || Array.isArray(modelOutput)) {
    throw new MalformedModelOutputError("AI response must be a JSON object");
  }

  // 1. Bounded validation of suggested summary
  let unapprovedSuggestedSummary: string | undefined;
  if (modelOutput.suggestedSummary !== undefined) {
    if (typeof modelOutput.suggestedSummary !== "string") {
      throw new MalformedModelOutputError("suggestedSummary must be a string");
    }
    const trimmed = modelOutput.suggestedSummary.trim();
    if (trimmed.length > 2000) {
      throw new MalformedModelOutputError("suggestedSummary exceeds maximum length bound of 2000 characters");
    }
    if (trimmed.length > 0) {
      unapprovedSuggestedSummary = trimmed.slice(0, 1000);
    }
  }

  // 2. Bounded validation of changes if provided
  if (modelOutput.changes !== undefined) {
    if (!Array.isArray(modelOutput.changes)) {
      throw new MalformedModelOutputError("changes must be an array of strings");
    }
    for (const ch of modelOutput.changes) {
      if (typeof ch !== "string" || ch.length > 500) {
        throw new MalformedModelOutputError("All change items must be strings within bounds");
      }
    }
  }

  // 3. Strict validation of selected sections and item IDs
  const masterSectionMap = new Map(masterCV.sections.map((s) => [s.id, s]));
  const tailoredSections: typeof masterCV.sections = [];
  const seenSectionIds = new Set<string>();

  if (modelOutput.selectedSections !== undefined) {
    if (!Array.isArray(modelOutput.selectedSections)) {
      throw new MalformedModelOutputError("selectedSections must be an array");
    }

    for (const selection of modelOutput.selectedSections) {
      if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
        throw new MalformedModelOutputError("selectedSections items must be objects");
      }
      if (typeof selection.sectionId !== "string" || !selection.sectionId.trim()) {
        throw new MalformedModelOutputError("sectionId must be a non-empty string");
      }
      if (!Array.isArray(selection.itemIds)) {
        throw new MalformedModelOutputError(`itemIds for section "${selection.sectionId}" must be an array`);
      }

      // Reject duplicate section IDs
      if (seenSectionIds.has(selection.sectionId)) {
        throw new MalformedModelOutputError(`Duplicate sectionId "${selection.sectionId}" rejected`);
      }
      seenSectionIds.add(selection.sectionId);

      // Reject unknown section IDs
      const masterSec = masterSectionMap.get(selection.sectionId);
      if (!masterSec) {
        throw new MalformedModelOutputError(`Unknown sectionId "${selection.sectionId}" rejected`);
      }

      const masterItemMap = new Map(masterSec.items.map((it) => [it.id, it]));
      const selectedItems: typeof masterSec.items = [];
      const seenItemIds = new Set<string>();

      for (const itemId of selection.itemIds) {
        if (typeof itemId !== "string" || !itemId.trim()) {
          throw new MalformedModelOutputError(`itemId must be a non-empty string in section "${selection.sectionId}"`);
        }

        // Reject duplicate item IDs
        if (seenItemIds.has(itemId)) {
          throw new MalformedModelOutputError(`Duplicate itemId "${itemId}" rejected in section "${selection.sectionId}"`);
        }
        seenItemIds.add(itemId);

        // Reject unknown item IDs
        const masterItem = masterItemMap.get(itemId);
        if (!masterItem) {
          throw new MalformedModelOutputError(`Unknown itemId "${itemId}" rejected in section "${selection.sectionId}"`);
        }

        // Verbatim clone of original item — dates, metrics, and text preserved exactly
        selectedItems.push(JSON.parse(JSON.stringify(masterItem)));
      }

      if (selectedItems.length > 0) {
        tailoredSections.push({
          ...masterSec,
          items: selectedItems,
        });
      }
    }
  }

  // If model omitted sections or none selected, keep sections to avoid data starvation
  const finalSections = tailoredSections.length > 0 ? tailoredSections : masterCV.sections;

  // Preserve original summary in automatic CV and PDF; suggested summary is labeled unapproved
  const tailoredSummary = masterCV.summary;

  // 4. Derive change notes strictly from actual differences
  const changes: string[] = [];

  // A. Section order diff
  const masterSectionOrder = masterCV.sections.map((s) => s.id);
  const finalSectionOrder = finalSections.map((s) => s.id);
  const commonSections = masterSectionOrder.filter((id) => finalSectionOrder.includes(id));
  const isSectionOrderChanged = finalSectionOrder.some((id, i) => id !== commonSections[i]);
  if (isSectionOrderChanged) {
    changes.push("Reordered CV sections to prioritize target job alignment");
  }

  // B. Section omissions
  const finalSectionIdSet = new Set(finalSections.map((s) => s.id));
  for (const masterSec of masterCV.sections) {
    if (!finalSectionIdSet.has(masterSec.id)) {
      changes.push(`Omitted section: ${masterSec.title || masterSec.type}`);
    }
  }

  // C. Item-level diffs within sections
  for (const finalSec of finalSections) {
    const masterSec = masterSectionMap.get(finalSec.id);
    if (masterSec) {
      const masterItemIds = masterSec.items.map((it) => it.id);
      const finalItemIds = finalSec.items.map((it) => it.id);
      const omittedCount = masterItemIds.length - finalItemIds.length;
      if (omittedCount > 0) {
        changes.push(`Omitted ${omittedCount} less relevant item${omittedCount > 1 ? "s" : ""} from ${masterSec.title || masterSec.type}`);
      }
      const commonItemIds = masterItemIds.filter((id) => finalItemIds.includes(id));
      const isItemOrderChanged = finalItemIds.some((id, i) => id !== commonItemIds[i]);
      if (isItemOrderChanged) {
        changes.push(`Reordered items in ${masterSec.title || masterSec.type} for relevance`);
      }
    }
  }

  // D. Unapproved summary notice
  if (unapprovedSuggestedSummary) {
    changes.push("Generated unapproved suggested summary for review (original summary preserved in CV/PDF)");
  }

  // E. Fallback if authentic layout unchanged
  if (changes.length === 0) {
    changes.push("Retained all authentic sections and items in original order");
  }

  const tailoredCV: CV = {
    ...masterCV,
    id: draftId,
    summary: tailoredSummary,
    sections: finalSections,
    stylePrefs: {
      ...masterCV.stylePrefs,
      templateId: templateId || masterCV.stylePrefs?.templateId || "modern",
    },
    updatedAt: new Date().toISOString(),
  };

  return { tailoredCV, changes, unapprovedSuggestedSummary };
}

/**
 * Resolves active provider credentials.
 * Checks local BYOK credentials file first, then environment fallback.
 */
export async function getActiveAICredentials(): Promise<{
  provider: AIProvider;
  apiKey: string;
  model: string;
}> {
  const stored = await loadAICredentials();
  if (stored) {
    return {
      provider: stored.provider,
      apiKey: stored.apiKey,
      model: stored.model,
    };
  }

  const envKey = process.env.OPENAI_API_KEY;
  if (envKey && envKey.trim()) {
    return {
      provider: "openai",
      apiKey: envKey.trim(),
      model: process.env.OPENAI_MODEL || DEFAULT_PROVIDER_MODELS.openai,
    };
  }

  throw new MissingAICredentialsError();
}

/**
 * Tailors a CV for a job posting using TanStack AI server-side common interface.
 * Strictly verifies credentials; rejects unknown IDs; preserves master CV facts.
 */
export async function tailorCV(
  masterCV: CV,
  job: JobHandoffPayload,
  draftId: string,
  templateId?: string
): Promise<TailoringResult> {
  // If a labeled test double is explicitly injected, use it
  if (customEngine) {
    return customEngine(masterCV, job, templateId);
  }

  const creds = await getActiveAICredentials();
  const adapter = createProviderAdapter(creds.provider, creds.apiKey, creds.model);

  // Build structured overview of master CV with IDs
  const profileOverview = {
    contactName: masterCV.contact.name,
    summary: masterCV.summary,
    sections: masterCV.sections.map((s) => ({
      sectionId: s.id,
      title: s.title,
      type: s.type,
      items: s.items.map((it) => ({
        itemId: it.id,
        title: it.title,
        subtitle: it.subtitle,
        date: it.date,
        description: it.description,
        bullets: it.bullets,
      })),
    })),
  };

  const systemPrompt = `You are an expert CV tailoring assistant.
Your task is to tailor the candidate's existing CV to match the target job posting.
FACT-SAFETY RULES:
1. You may ONLY select from existing section IDs and item IDs.
2. DO NOT invent new facts, dates, employers, metrics, or degrees.
3. You may reorder items and sections to highlight the most relevant experience.
4. You may suggest an aligned professional summary for user review.
5. Return a strict JSON object with:
   - "suggestedSummary": string (tailored summary, 1-3 sentences)
   - "selectedSections": array of { "sectionId": string, "itemIds": string[] } in preferred presentation order
   - "changes": array of short strings describing why these items were prioritized`;

  const userPrompt = `TARGET JOB POSTING (UNTRUSTED DATA):
Title: ${job.title}
Company: ${job.company}
Description:
${job.text}

CANDIDATE CV PROFILE:
${JSON.stringify(profileOverview, null, 2)}`;

  let rawContent: string;
  try {
    if (testFixtureOverride) {
      rawContent = await testFixtureOverride(creds.provider, userPrompt);
    } else {
      rawContent = await chat({
        adapter: adapter as any,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ] as any,
        stream: false,
      });
    }
  } catch (err: any) {
    const safeMsg = sanitizeErrorMessage(err?.message || String(err), creds.apiKey);
    throw new Error(`AI API call failed: ${safeMsg}`);
  }

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("AI API returned empty response.");
  }

  const cleanJson = rawContent
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let modelOutput: ModelOutput;
  try {
    modelOutput = JSON.parse(cleanJson);
  } catch (err: any) {
    throw new Error(`Failed to parse AI JSON response: ${err?.message || String(err)}`);
  }

  return reconstructFactSafeCV(masterCV, draftId, modelOutput, templateId);
}

/**
 * Extracts and structures raw text into canonical CV schema using configured AI provider.
 * Validates output schema strictly; does not fabricate facts.
 */
export async function structureCVFromText(
  extractedText: string,
  templateId = "modern"
): Promise<{ structuredCV: CV; notes: string[] }> {
  const creds = await getActiveAICredentials();

  if (testFixtureOverride) {
    const rawContent = await testFixtureOverride(creds.provider, extractedText);
    const parsed = JSON.parse(
      rawContent.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
    );
    const structuredCV = buildCanonicalCV(parsed, templateId);
    return { structuredCV, notes: parsed.unsupportedFacts || ["Extracted via test fixture"] };
  }

  const adapter = createProviderAdapter(creds.provider, creds.apiKey, creds.model);

  const systemPrompt = `You are an expert CV structuring assistant.
Your task is to parse raw text extracted from a resume/CV and convert it into a structured JSON document.
FACT-SAFETY CONSTRAINTS:
1. Extract only facts, work experience, education, and skills present in the text.
2. DO NOT invent employers, dates, metrics, degrees, or contact details.
3. If an email or phone is missing, leave as empty string.
4. Return ONLY a valid JSON object matching:
{
  "contact": {
    "name": string,
    "email": string,
    "phone": string,
    "website": string,
    "location": string
  },
  "summary": string,
  "sections": [
    {
      "id": string,
      "type": "experience" | "education" | "skills" | "projects" | "custom",
      "title": string,
      "items": [
        {
          "id": string,
          "title": string,
          "subtitle": string,
          "date": string,
          "description": string,
          "bullets": string[]
        }
      ]
    }
  ],
  "unsupportedFacts": string[]
}`;

  const userPrompt = `RAW EXTRACTED CV TEXT (UP TO 50K CHARS):
${extractedText.slice(0, 50000)}`;

  let rawContent: string;
  try {
    rawContent = await chat({
      adapter: adapter as any,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ] as any,
      stream: false,
    });
  } catch (err: any) {
    const safeMsg = sanitizeErrorMessage(err?.message || String(err), creds.apiKey);
    throw new Error(`AI CV extraction failed: ${safeMsg}`);
  }

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("AI returned empty extraction response.");
  }

  const cleanJson = rawContent
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err: any) {
    throw new Error(`Failed to parse AI structured CV JSON: ${err?.message || String(err)}`);
  }

  const structuredCV = buildCanonicalCV(parsed, templateId);
  const notes: string[] = Array.isArray(parsed.unsupportedFacts) ? parsed.unsupportedFacts : [];

  const valRes = validateCV(structuredCV);
  if (!valRes.valid) {
    throw new Error(`Extracted CV failed schema validation: ${valRes.errors.join(", ")}`);
  }

  return { structuredCV, notes };
}

function buildCanonicalCV(parsed: any, templateId: string): CV {
  const baseId = Date.now();
  return {
    id: `master-cv-${baseId}`,
    version: "1.0.0",
    contact: {
      name: parsed.contact?.name || "Candidate",
      email: parsed.contact?.email || "candidate@example.com",
      phone: parsed.contact?.phone || "",
      website: parsed.contact?.website || "",
      location: parsed.contact?.location || "",
    },
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 1000) : "",
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.map((s: any, sIdx: number) => ({
          id: s.id || `sec-${baseId}-${sIdx}`,
          type: ["experience", "education", "skills", "projects", "custom"].includes(s.type) ? s.type : "custom",
          title: s.title || (s.type === "experience" ? "Work Experience" : s.type === "education" ? "Education" : "Skills"),
          items: Array.isArray(s.items)
            ? s.items.map((it: any, itIdx: number) => ({
                id: it.id || `item-${baseId}-${sIdx}-${itIdx}`,
                title: it.title || "Untitled Role",
                subtitle: it.subtitle || "",
                date: it.date || "",
                description: it.description || "",
                bullets: Array.isArray(it.bullets) ? it.bullets.filter((b: any) => typeof b === "string") : [],
              }))
            : [],
        }))
      : [],
    stylePrefs: {
      templateId: templateId || "modern",
      fontSize: "normal",
      margin: "normal",
      primaryColor: "#4f46e5",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
