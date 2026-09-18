// Verify export structure of shared package
import { loadMasterCV, saveMasterCV, loadDrafts, saveDraft, deleteDraft, loadDraftById } from "@shared/persistence.js";
import type { CV, JobMetadata, CVSection } from "@shared/types.js";

console.log("Export verification passed");
