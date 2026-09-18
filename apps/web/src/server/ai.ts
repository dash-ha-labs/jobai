import { type CV, type JobHandoffPayload } from "jobai-shared";

export class MissingAICredentialsError extends Error {
  code = "AI_CREDENTIALS_REQUIRED";
  constructor(
    message = "OPENAI_API_KEY is not configured in the server environment. Set OPENAI_API_KEY to enable AI tailoring."
  ) {
    super(message);
    this.name = "MissingAICredentialsError";
  }
}

export function isAIConfigured(): boolean {
  if (customEngine) return true;
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

export interface ModelOutput {
  suggestedSummary?: string;
  selectedSections?: Array<{
    sectionId: string;
    itemIds: string[];
  }>;
  changes?: string[];
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
 * Tailors a CV for a job posting using OpenAI-compatible chat completions.
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new MissingAICredentialsError();
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI API returned status ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const completion = await response.json();
  const rawContent = completion?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("AI API returned empty response.");
  }

  let modelOutput: ModelOutput;
  try {
    modelOutput = JSON.parse(rawContent);
  } catch (err: any) {
    throw new Error(`Failed to parse AI JSON response: ${err?.message || String(err)}`);
  }

  return reconstructFactSafeCV(masterCV, draftId, modelOutput, templateId);
}
