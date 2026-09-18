/**
 * Canonical extractor re-export.
 * Safely removes duplicate extractor bypass: all extraction paths route
 * exclusively through the canonical implementation in job.ts.
 */
export {
  canonicalExtractJob as extractJobFromDom,
  type ExtractionResult,
  type JobPayload,
} from "./job.ts";
