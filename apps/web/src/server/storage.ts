import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  type CV,
  validateCV,
} from "jobai-shared";

function getDataDir(): string {
  if (process.env.JOBAI_DATA_DIR) {
    return path.resolve(process.env.JOBAI_DATA_DIR);
  }
  return path.resolve(process.cwd(), ".jobai-data");
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Atomically writes content to filePath by writing to a temporary file
 * on the same filesystem and renaming it into place.
 */
async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmpPath = path.join(dir, `.tmp-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.rename(tmpPath, filePath);
}

const PROFILE_FILE_NAME = "profile.json";
const PAIRING_FILE_NAME = "pairing.json";

export interface StoredPairingState {
  token: string | null;
  boundOrigin?: string | null;
  pendingCodes: Record<string, { createdAt: number; expiresAt: number }>;
}

export interface StoredDraft {
  id: string;
  masterId: string;
  jobTitle: string;
  company: string;
  sourceUrl: string;
  jobText: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  tailoredCV: CV;
  changes: string[];
  unapprovedSuggestedSummary?: string;
}

export interface StoredJobRecord {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  draftId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    jobId: string;
    draftId: string;
    jobTitle: string;
    company: string;
    sourceUrl: string;
    templateId: string;
    tailoredCV: CV;
    changes: string[];
    unapprovedSuggestedSummary?: string;
    createdAt: string;
    pdfUrl: string;
  };
}

export async function loadServerProfile(): Promise<CV | null> {
  const dataDir = getDataDir();
  const profilePath = path.join(dataDir, PROFILE_FILE_NAME);
  try {
    const raw = await fs.readFile(profilePath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = validateCV(parsed);
    if (!validation.valid) {
      return null;
    }
    return parsed as CV;
  } catch {
    return null;
  }
}

export async function saveServerProfile(cv: CV): Promise<{ success: boolean; error?: string }> {
  const validation = validateCV(cv);
  if (!validation.valid) {
    return { success: false, error: `Invalid CV schema: ${validation.errors.join(", ")}` };
  }

  const dataDir = getDataDir();
  const profilePath = path.join(dataDir, PROFILE_FILE_NAME);

  try {
    await atomicWriteFile(profilePath, JSON.stringify(cv, null, 2));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Failed to write profile: ${err?.message || String(err)}` };
  }
}

export async function loadPairingState(): Promise<StoredPairingState> {
  const dataDir = getDataDir();
  const pairingPath = path.join(dataDir, PAIRING_FILE_NAME);
  try {
    const raw = await fs.readFile(pairingPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      token: typeof parsed.token === "string" ? parsed.token : null,
      boundOrigin: typeof parsed.boundOrigin === "string" ? parsed.boundOrigin : null,
      pendingCodes: typeof parsed.pendingCodes === "object" && parsed.pendingCodes !== null ? parsed.pendingCodes : {},
    };
  } catch {
    return { token: null, boundOrigin: null, pendingCodes: {} };
  }
}

export async function savePairingState(state: StoredPairingState): Promise<void> {
  const dataDir = getDataDir();
  const pairingPath = path.join(dataDir, PAIRING_FILE_NAME);
  await atomicWriteFile(pairingPath, JSON.stringify(state, null, 2));
}

export async function saveDraftVersion(draft: StoredDraft): Promise<{ success: boolean; error?: string }> {
  const validation = validateCV(draft.tailoredCV);
  if (!validation.valid) {
    return { success: false, error: `Invalid tailored CV: ${validation.errors.join(", ")}` };
  }

  const dataDir = getDataDir();
  const draftsDir = path.join(dataDir, "drafts");
  const draftPath = path.join(draftsDir, `${draft.id}.json`);

  try {
    await atomicWriteFile(draftPath, JSON.stringify(draft, null, 2));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Failed to save draft: ${err?.message || String(err)}` };
  }
}

export async function loadDraftVersion(id: string): Promise<StoredDraft | null> {
  // Prevent directory traversal attacks
  const safeId = path.basename(id);
  const dataDir = getDataDir();
  const draftPath = path.join(dataDir, "drafts", `${safeId}.json`);

  try {
    const raw = await fs.readFile(draftPath, "utf8");
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.id || !parsed.tailoredCV) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function listDraftVersions(): Promise<StoredDraft[]> {
  const dataDir = getDataDir();
  const draftsDir = path.join(dataDir, "drafts");
  try {
    const files = await fs.readdir(draftsDir);
    const drafts: StoredDraft[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(draftsDir, file), "utf8");
        const parsed = JSON.parse(raw) as StoredDraft;
        if (parsed && parsed.id) {
          drafts.push(parsed);
        }
      } catch {
        // Skip unreadable files
      }
    }
    return drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function saveJobRecord(job: StoredJobRecord): Promise<void> {
  const dataDir = getDataDir();
  const jobsDir = path.join(dataDir, "jobs");
  const jobPath = path.join(jobsDir, `${job.id}.json`);
  await atomicWriteFile(jobPath, JSON.stringify(job, null, 2));
}

export async function loadJobRecord(id: string): Promise<StoredJobRecord | null> {
  const safeId = path.basename(id);
  const dataDir = getDataDir();
  const jobPath = path.join(dataDir, "jobs", `${safeId}.json`);
  try {
    const raw = await fs.readFile(jobPath, "utf8");
    return JSON.parse(raw) as StoredJobRecord;
  } catch {
    return null;
  }
}
