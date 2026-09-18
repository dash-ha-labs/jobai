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
async function atomicWriteFile(filePath: string, content: string, mode?: number): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmpPath = path.join(dir, `.tmp-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  await fs.writeFile(tmpPath, content, { encoding: "utf8", mode });
  await fs.rename(tmpPath, filePath);
  if (mode !== undefined) {
    try {
      await fs.chmod(filePath, mode);
    } catch {
      // Ignore chmod error if filesystem does not support POSIX modes
    }
  }
}

const PROFILE_FILE_NAME = "profile.json";
const PAIRING_FILE_NAME = "pairing.json";
const CREDENTIALS_FILE_NAME = "credentials.json";

export type AIProvider = "openai" | "anthropic" | "glm";

export interface StoredAICredentials {
  provider: AIProvider;
  apiKey: string;
  model: string;
  updatedAt: string;
}

export interface ClientAIConfigStatus {
  configured: boolean;
  provider: AIProvider | null;
  model: string | null;
  maskedKey: string | null;
  storageType: "local-file-mode-0600";
  disclosure: string;
  updatedAt: string | null;
}

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

export async function loadAICredentials(): Promise<StoredAICredentials | null> {
  const dataDir = getDataDir();
  const credsPath = path.join(dataDir, CREDENTIALS_FILE_NAME);
  try {
    const raw = await fs.readFile(credsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.apiKey === "string" &&
      parsed.apiKey.trim().length > 0 &&
      ["openai", "anthropic", "glm"].includes(parsed.provider) &&
      typeof parsed.model === "string" &&
      parsed.model.trim().length > 0
    ) {
      return parsed as StoredAICredentials;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveAICredentials(creds: {
  provider: AIProvider;
  apiKey: string;
  model: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!["openai", "anthropic", "glm"].includes(creds.provider)) {
    return { success: false, error: "Invalid provider. Supported: openai, anthropic, glm" };
  }
  if (!creds.apiKey || typeof creds.apiKey !== "string" || !creds.apiKey.trim()) {
    return { success: false, error: "API key is required" };
  }
  if (!creds.model || typeof creds.model !== "string" || !creds.model.trim()) {
    return { success: false, error: "Model ID is required" };
  }

  const dataDir = getDataDir();
  await ensureDir(dataDir);
  try {
    await fs.chmod(dataDir, 0o700);
  } catch {
    // Ignore chmod error
  }

  const payload: StoredAICredentials = {
    provider: creds.provider,
    apiKey: creds.apiKey.trim(),
    model: creds.model.trim(),
    updatedAt: new Date().toISOString(),
  };

  const credsPath = path.join(dataDir, CREDENTIALS_FILE_NAME);
  try {
    await atomicWriteFile(credsPath, JSON.stringify(payload, null, 2), 0o600);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Failed to store credentials: ${err?.message || String(err)}` };
  }
}

export async function deleteAICredentials(): Promise<{ success: boolean; error?: string }> {
  const dataDir = getDataDir();
  const credsPath = path.join(dataDir, CREDENTIALS_FILE_NAME);
  try {
    await fs.unlink(credsPath);
    return { success: true };
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return { success: true };
    }
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getAICredentialsStatus(): Promise<ClientAIConfigStatus> {
  const creds = await loadAICredentials();
  if (!creds) {
    return {
      configured: false,
      provider: null,
      model: null,
      maskedKey: null,
      storageType: "local-file-mode-0600",
      disclosure:
        "Stored in restricted local credential file (.jobai-data/credentials.json, mode 0600, parent 0700). Unencrypted at rest (OS keychain not configured for local dev).",
      updatedAt: null,
    };
  }

  const keyLen = creds.apiKey.length;
  const suffix = keyLen > 4 ? creds.apiKey.slice(-4) : creds.apiKey;
  const maskedKey = `••••••••${suffix}`;

  return {
    configured: true,
    provider: creds.provider,
    model: creds.model,
    maskedKey,
    storageType: "local-file-mode-0600",
    disclosure:
      "Stored in restricted local credential file (.jobai-data/credentials.json, mode 0600, parent 0700). Unencrypted at rest (OS keychain not configured for local dev).",
    updatedAt: creds.updatedAt,
  };
}
