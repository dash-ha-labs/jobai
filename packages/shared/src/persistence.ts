// Browser-local persistence with structured error handling
// Isolates localStorage from Node SSR environments (no ReferenceErrors)
// Master CV and drafts stored under separate keys

import { CV, JobMetadata, isValidCV, isValidJobMetadata } from "./types.js";

export const STORAGE_KEY_MASTER = "jobai_cv_master";
export const STORAGE_KEY_DRAFTS = "jobai_cv_drafts";

export interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__jobai_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Master CV operations
export function loadMasterCV(): PersistenceResult<CV | null> {
  if (!isStorageAvailable()) {
    return { success: false, data: null, error: "localStorage is unavailable in this environment" };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_MASTER);
    if (!raw) {
      return { success: true, data: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { success: false, data: null, error: "Master CV storage is corrupted (invalid JSON)" };
    }

    if (!isValidCV(parsed)) {
      return { success: false, data: null, error: "Master CV failed schema validation" };
    }

    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: null, error: `Failed to read master CV: ${message}` };
  }
}

export function saveMasterCV(cv: CV): PersistenceResult<boolean> {
  if (!isStorageAvailable()) {
    return { success: false, data: false, error: "localStorage is unavailable in this environment" };
  }

  if (!isValidCV(cv)) {
    return { success: false, data: false, error: "Cannot save invalid CV: failed schema validation" };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_MASTER, JSON.stringify(cv));
    return { success: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: false, error: `Failed to save master CV: ${message}` };
  }
}

export function deleteMasterCV(): PersistenceResult<boolean> {
  if (!isStorageAvailable()) {
    return { success: false, data: false, error: "localStorage is unavailable in this environment" };
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY_MASTER);
    return { success: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: false, error: `Failed to delete master CV: ${message}` };
  }
}

// Drafts operations
export function loadDrafts(): PersistenceResult<JobMetadata[]> {
  if (!isStorageAvailable()) {
    return { success: false, data: [], error: "localStorage is unavailable in this environment" };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_DRAFTS);
    if (!raw) {
      return { success: true, data: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { success: false, data: [], error: "Drafts storage is corrupted (invalid JSON)" };
    }

    if (!Array.isArray(parsed)) {
      return { success: false, data: [], error: "Drafts storage is corrupted (expected an array)" };
    }

    const validDrafts: JobMetadata[] = [];
    const corruptedIndices: number[] = [];

    for (let i = 0; i < parsed.length; i++) {
      if (isValidJobMetadata(parsed[i])) {
        validDrafts.push(parsed[i] as JobMetadata);
      } else {
        corruptedIndices.push(i);
      }
    }

    if (corruptedIndices.length > 0) {
      return {
        success: false,
        data: validDrafts,
        error: `Found ${corruptedIndices.length} corrupted draft entry(s) at indices: ${corruptedIndices.join(", ")}`,
      };
    }

    return { success: true, data: validDrafts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: [], error: `Failed to read drafts: ${message}` };
  }
}

export function saveDraft(draft: JobMetadata): PersistenceResult<boolean> {
  if (!isStorageAvailable()) {
    return { success: false, data: false, error: "localStorage is unavailable in this environment" };
  }

  if (!isValidJobMetadata(draft)) {
    return { success: false, data: false, error: "Cannot save invalid draft: failed schema validation" };
  }

  try {
    const existing = loadDrafts().data ?? [];
    const index = existing.findIndex((d) => d.id === draft.id);
    if (index >= 0) {
      existing[index] = draft;
    } else {
      existing.push(draft);
    }
    window.localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(existing));
    return { success: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: false, error: `Failed to save draft: ${message}` };
  }
}

export function deleteDraft(id: string): PersistenceResult<boolean> {
  if (!isStorageAvailable()) {
    return { success: false, data: false, error: "localStorage is unavailable in this environment" };
  }

  try {
    const existing = loadDrafts().data ?? [];
    const filtered = existing.filter((d) => d.id !== id);
    window.localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(filtered));
    return { success: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, data: false, error: `Failed to delete draft: ${message}` };
  }
}

export function loadDraftById(id: string): PersistenceResult<JobMetadata | null> {
  const result = loadDrafts();
  if (!result.success && !result.data) {
    return { success: false, data: null, error: result.error };
  }
  const match = (result.data ?? []).find((d) => d.id === id);
  return { success: true, data: match ?? null };
}
