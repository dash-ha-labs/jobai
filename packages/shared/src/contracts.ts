// Universal contract type definitions for JobAI
// Pure types and interfaces — no runtime server functions or framework dependencies

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
}

export interface AppConfig {
  title: string;
  description: string;
  version: string;
  storageVersion: string;
  privacyNotice: string;
  templates: TemplateMetadata[];
}

export interface SaveResponse {
  success: boolean;
  savedAt?: string;
  error?: string;
}

export interface DraftListResponse {
  drafts: Array<{
    id: string;
    jobTitle: string;
    company: string;
    createdAt: string;
  }>;
}

export interface DraftSaveResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface ServerStatusResponse {
  paired: boolean;
  hasProfile: boolean;
  aiConfigured: boolean;
  version: string;
}

export interface PairingCodeResponse {
  code: string;
  expiresInMs: number;
}

export interface PairRequest {
  code: string;
}

export interface PairResponse {
  token: string;
  hasProfile: boolean;
  aiConfigured: boolean;
}

export interface TailorRequest {
  job: import("./types.js").JobHandoffPayload;
  templateId?: string;
}

export interface TailorResponse {
  jobId: string;
  draftId: string;
  jobTitle: string;
  company: string;
  sourceUrl: string;
  templateId: string;
  tailoredCV: import("./types.js").CV;
  changes: string[];
  unapprovedSuggestedSummary?: string;
  createdAt: string;
  pdfUrl: string;
}

export interface DurableJobResponse {
  ok: boolean;
  job: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    draftId?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
    result?: TailorResponse;
  };
}

export type ExtensionJobState =
  | { status: "awaiting_setup"; reason: "not_paired" | "no_profile" | "no_ai"; message: string }
  | {
      status: "idle";
      hasProfile: boolean;
      aiConfigured: boolean;
      aiProvider?: string | null;
      aiModel?: string | null;
    }
  | { status: "extracting" }
  | { status: "tailoring"; job: import("./types.js").JobHandoffPayload; jobId?: string }
  | { status: "generating_pdf"; draftId: string; job: import("./types.js").JobHandoffPayload; jobId?: string }
  | {
      status: "ready";
      draftId: string;
      job: import("./types.js").JobHandoffPayload;
      tailoredCV: import("./types.js").CV;
      changes: string[];
      unapprovedSuggestedSummary?: string;
      templateId: string;
      pdfBase64: string;
    }
  | {
      status: "error";
      message: string;
      code?: string;
      retryable: boolean;
      lastJob?: import("./types.js").JobHandoffPayload;
    };

