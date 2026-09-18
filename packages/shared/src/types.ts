// CV Version 1 schema and validator
// Universal types shared between web app and extension

export const CV_VERSION = "1.0.0";

export type CVSectionType = "experience" | "education" | "skills" | "projects" | "custom";

export interface CVSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  bullets?: string[];
}

export interface CVSection {
  id: string;
  type: CVSectionType;
  title: string;
  items: CVSectionItem[];
  customType?: string;
}

export interface CVContact {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  location?: string;
}

export interface CVStylePrefs {
  templateId?: string;
  primaryColor?: string;
  fontSize?: string;
  fontFamily?: string;
  margin?: string;
  paperSize?: "A4" | "Letter";
}

export interface CV {
  id: string;
  version: string;
  contact: CVContact;
  summary?: string;
  sections: CVSection[];
  stylePrefs?: CVStylePrefs;
  createdAt: string;
  updatedAt: string;
}

export interface JobHandoffPayload {
  title: string;
  company: string;
  sourceUrl: string;
  text: string;
}

export interface JobMetadata {
  id: string;
  masterId: string;
  jobTitle: string;
  company: string;
  sourceUrl: string;
  jobText: string;
  createdAt: string;
  proposedCV?: CV;
  changes?: string[];
}

export function validateCV(candidate: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof candidate !== "object" || candidate === null) {
    return { valid: false, errors: ["Candidate CV must be a non-null object"] };
  }

  const cv = candidate as Partial<CV>;

  if (cv.version !== CV_VERSION) {
    errors.push(`Invalid CV version: expected "${CV_VERSION}", got "${cv.version}"`);
  }

  if (typeof cv.id !== "string" || !cv.id.trim()) {
    errors.push("Missing or empty CV id");
  }

  if (typeof cv.contact !== "object" || cv.contact === null) {
    errors.push("Missing contact information");
  } else {
    if (typeof cv.contact.name !== "string" || !cv.contact.name.trim()) {
      errors.push("Missing or empty contact name");
    }
    if (typeof cv.contact.email !== "string" || !cv.contact.email.trim()) {
      errors.push("Missing or empty contact email");
    }
  }

  if (cv.summary !== undefined && typeof cv.summary !== "string") {
    errors.push("Summary must be a string");
  }

  if (!Array.isArray(cv.sections)) {
    errors.push("Sections must be an array");
  } else {
    const validSectionTypes = ["experience", "education", "skills", "projects", "custom"];
    for (let i = 0; i < cv.sections.length; i++) {
      const section = cv.sections[i];
      if (typeof section !== "object" || section === null) {
        errors.push(`Section at index ${i} must be a non-null object`);
        continue;
      }
      if (typeof section.id !== "string" || !section.id.trim()) {
        errors.push(`Section at index ${i} missing id`);
      }
      if (typeof section.type !== "string" || !validSectionTypes.includes(section.type)) {
        errors.push(`Section at index ${i} has invalid type "${section.type}"`);
      }
      if (typeof section.title !== "string" || !section.title.trim()) {
        errors.push(`Section at index ${i} missing title`);
      }
      if (!Array.isArray(section.items)) {
        errors.push(`Section at index ${i} items must be an array`);
      } else {
        for (let j = 0; j < section.items.length; j++) {
          const item = section.items[j];
          if (typeof item !== "object" || item === null) {
            errors.push(`Item at index ${j} in section ${i} must be an object`);
            continue;
          }
          if (typeof item.id !== "string" || !item.id.trim()) {
            errors.push(`Item at index ${j} in section ${i} missing id`);
          }
          if (typeof item.title !== "string" || !item.title.trim()) {
            errors.push(`Item at index ${j} in section ${i} missing title`);
          }
          if (item.bullets !== undefined && !Array.isArray(item.bullets)) {
            errors.push(`Item at index ${j} in section ${i} bullets must be an array of strings`);
          }
        }
      }
    }
  }

  if (cv.stylePrefs !== undefined) {
    if (typeof cv.stylePrefs !== "object" || cv.stylePrefs === null) {
      errors.push("Style preferences must be an object");
    } else if (
      cv.stylePrefs.paperSize !== undefined &&
      cv.stylePrefs.paperSize !== "A4" &&
      cv.stylePrefs.paperSize !== "Letter"
    ) {
      errors.push(`Invalid paperSize: must be "A4" or "Letter" (got "${cv.stylePrefs.paperSize}")`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isValidCV(candidate: unknown): candidate is CV {
  return validateCV(candidate).valid;
}

export function validateJobHandoff(candidate: unknown): { valid: boolean; errors: string[]; data?: JobHandoffPayload } {
  const errors: string[] = [];

  if (typeof candidate !== "object" || candidate === null) {
    return { valid: false, errors: ["Payload must be a non-null JSON object"] };
  }

  const payload = candidate as Record<string, unknown>;

  // Title validation
  if (typeof payload.title !== "string" || !payload.title.trim()) {
    errors.push("Job title is required");
  } else if (payload.title.length > 300) {
    errors.push(`Job title exceeds maximum length of 300 characters (got ${payload.title.length})`);
  }

  // Company validation
  if (typeof payload.company !== "string" || !payload.company.trim()) {
    errors.push("Company name is required");
  } else if (payload.company.length > 300) {
    errors.push(`Company name exceeds maximum length of 300 characters (got ${payload.company.length})`);
  }

  // Source URL validation
  if (typeof payload.sourceUrl !== "string" || !payload.sourceUrl.trim()) {
    errors.push("Source URL is required");
  } else if (payload.sourceUrl.length > 4096) {
    errors.push(`Source URL exceeds maximum length of 4096 characters (got ${payload.sourceUrl.length})`);
  } else {
    try {
      const parsedUrl = new URL(payload.sourceUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        errors.push(`Source URL must use http: or https: protocol (got "${parsedUrl.protocol}")`);
      }
      if (parsedUrl.username || parsedUrl.password) {
        errors.push("Source URL must not contain embedded user credentials");
      }
    } catch {
      errors.push("Source URL is not a valid URL");
    }
  }

  // Text validation: 100..30000 characters
  if (typeof payload.text !== "string") {
    errors.push("Job text is required");
  } else if (payload.text.length < 100) {
    errors.push(`Job text too short: minimum 100 characters required (got ${payload.text.length})`);
  } else if (payload.text.length > 30000) {
    errors.push(`Job text exceeds maximum length of 30,000 characters (got ${payload.text.length})`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: payload.title as string,
      company: payload.company as string,
      sourceUrl: payload.sourceUrl as string,
      text: payload.text as string,
    },
  };
}

export function validateJobMetadata(candidate: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof candidate !== "object" || candidate === null) {
    return { valid: false, errors: ["Job metadata must be a non-null object"] };
  }

  const job = candidate as Partial<JobMetadata>;

  if (typeof job.id !== "string" || !job.id.trim()) errors.push("Missing or empty draft id");
  if (typeof job.masterId !== "string" || !job.masterId.trim()) errors.push("Missing or empty masterId");
  if (typeof job.jobTitle !== "string" || !job.jobTitle.trim()) errors.push("Missing or empty jobTitle");
  if (typeof job.company !== "string" || !job.company.trim()) errors.push("Missing or empty company");
  if (typeof job.sourceUrl !== "string" || !job.sourceUrl.trim()) errors.push("Missing or empty sourceUrl");
  if (typeof job.jobText !== "string" || !job.jobText.trim()) errors.push("Missing or empty jobText");
  if (typeof job.createdAt !== "string" || !job.createdAt.trim()) errors.push("Missing or empty createdAt");

  if (job.proposedCV !== undefined && !isValidCV(job.proposedCV)) {
    errors.push("Proposed CV is invalid against schema");
  }

  if (job.changes !== undefined && !Array.isArray(job.changes)) {
    errors.push("Changes must be an array of strings");
  }

  return { valid: errors.length === 0, errors };
}

export function isValidJobMetadata(candidate: unknown): candidate is JobMetadata {
  return validateJobMetadata(candidate).valid;
}
