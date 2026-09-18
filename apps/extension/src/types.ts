export interface JobPayload {
  title: string;
  company: string;
  sourceUrl: string;
  text: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Local-MVP safety bounds (conservative bounds, not claims of browser limits).
 * Bound source URL to 4,096 code units and final handoff URL to 400,000 code units.
 */
export const MAX_TITLE_LENGTH = 300;
export const MAX_COMPANY_LENGTH = 300;
export const MIN_TEXT_LENGTH = 100;
export const MAX_TEXT_LENGTH = 30000;
export const MAX_SOURCE_URL_LENGTH = 4096;
export const MAX_HANDOFF_URL_LENGTH = 400000;

/**
 * Validates a job payload against team contract bounds:
 * - title: 1..300 chars
 * - company: 0..300 chars, required string field (empty string allowed)
 * - sourceUrl: http/https, no credentials, <= 4096 code units
 * - text: 100..30000 chars (UTF-16 code units)
 */
export function validateJobPayload(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Job payload must be a non-null object.'] };
  }

  const { title, company, sourceUrl, text } = input as Record<string, unknown>;

  if (typeof title !== 'string' || !title.trim()) {
    errors.push('Job title is required.');
  } else if (title.trim().length > MAX_TITLE_LENGTH) {
    errors.push(`Job title must not exceed ${MAX_TITLE_LENGTH} characters.`);
  }

  if (company === undefined || company === null) {
    errors.push('Company field is required (use empty string if unknown).');
  } else if (typeof company !== 'string') {
    errors.push('Company must be a string.');
  } else if (company.trim().length > MAX_COMPANY_LENGTH) {
    errors.push(`Company must not exceed ${MAX_COMPANY_LENGTH} characters.`);
  }

  if (typeof sourceUrl !== 'string' || !sourceUrl.trim()) {
    errors.push('Source URL is required.');
  } else {
    const trimmedUrl = sourceUrl.trim();
    if (trimmedUrl.length > MAX_SOURCE_URL_LENGTH) {
      errors.push(
        `Source URL must not exceed ${MAX_SOURCE_URL_LENGTH.toLocaleString()} characters (received ${trimmedUrl.length.toLocaleString()}).`
      );
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push('Source URL must use http or https protocol.');
      }
      if (parsed.username || parsed.password) {
        errors.push('Source URL must not contain credentials (username or password).');
      }
    } catch {
      errors.push('Source URL is not a valid URL.');
    }
  }

  if (typeof text !== 'string' || text.trim().length < MIN_TEXT_LENGTH) {
    errors.push(`Job description text must be at least ${MIN_TEXT_LENGTH} characters.`);
  } else if (text.length > MAX_TEXT_LENGTH) {
    errors.push(`Job description text must not exceed ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serializes a JobPayload into a target handoff URL with safety bounds checking.
 * Bounded to 400,000 chars with actionable error; never silently truncates.
 */
export function serializeJobHandoffUrl(
  job: JobPayload,
  baseUrl = 'http://127.0.0.1:3000/extension'
): { url?: string; error?: string } {
  const validation = validateJobPayload(job);
  if (!validation.valid) {
    return { error: 'Cannot serialize invalid job payload: ' + validation.errors.join('; ') };
  }

  let jsonStr: string;
  try {
    jsonStr = JSON.stringify(job);
  } catch (err: any) {
    return { error: 'JSON serialization failed: ' + (err?.message || String(err)) };
  }

  let fragment: string;
  try {
    fragment = encodeURIComponent(jsonStr);
  } catch (err: any) {
    return { error: 'URL fragment encoding failed: ' + (err?.message || String(err)) };
  }

  const targetUrl = `${baseUrl}#job=${fragment}`;
  if (targetUrl.length > MAX_HANDOFF_URL_LENGTH) {
    return {
      error: `Target handoff URL length (${targetUrl.length.toLocaleString()} characters) exceeds safety limit of ${MAX_HANDOFF_URL_LENGTH.toLocaleString()} characters. Please shorten the job text before transferring.`,
    };
  }

  return { url: targetUrl };
}

/**
 * Deserializes and validates a JobPayload from a target handoff URL.
 */
export function deserializeJobHandoffUrl(urlString: string): { job?: JobPayload; error?: string } {
  try {
    const hashIndex = urlString.indexOf('#job=');
    if (hashIndex === -1) {
      return { error: 'URL does not contain #job= fragment.' };
    }
    const rawFragment = urlString.slice(hashIndex + 5);
    const jsonStr = decodeURIComponent(rawFragment);
    const parsed = JSON.parse(jsonStr);
    const validation = validateJobPayload(parsed);
    if (!validation.valid) {
      return { error: 'Deserialized payload failed validation: ' + validation.errors.join('; ') };
    }
    return { job: parsed as JobPayload };
  } catch (err: any) {
    return { error: 'Failed to deserialize job handoff URL: ' + (err?.message || String(err)) };
  }
}
