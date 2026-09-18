import { extractText } from "unpdf";
import mammoth from "mammoth";

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CV_TEXT_CHARS = 60000;

export class FileTooLargeError extends Error {
  code = "FILE_TOO_LARGE";
  constructor(message = "File exceeds 5MB limit. Please upload a smaller document.") {
    super(message);
    this.name = "FileTooLargeError";
  }
}

export class InvalidFileFormatError extends Error {
  code = "INVALID_FILE_FORMAT";
  constructor(
    message = "Unsupported file format. Please upload a valid PDF or DOCX file, or use text paste."
  ) {
    super(message);
    this.name = "InvalidFileFormatError";
  }
}

export class ScannedPdfError extends Error {
  code = "SCANNED_PDF_NOT_SUPPORTED";
  constructor(
    message = "Scanned or image-only PDF detected. OCR is not supported. Please copy and paste the text manually into the paste-text input."
  ) {
    super(message);
    this.name = "ScannedPdfError";
  }
}

export class EmptyDocumentError extends Error {
  code = "EMPTY_DOCUMENT";
  constructor(message = "No readable text found in document. Please paste your CV text directly.") {
    super(message);
    this.name = "EmptyDocumentError";
  }
}

export type SupportedFormat = "pdf" | "docx" | "text";

export interface ParsedDocumentResult {
  text: string;
  charCount: number;
  format: SupportedFormat;
}

/**
 * Checks magic bytes to securely identify document format.
 */
export function detectDocumentFormat(buffer: Buffer, filename = ""): SupportedFormat {
  if (buffer.length >= 5 && buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    return "pdf";
  }

  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return "docx";
  }

  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return "text";
  }

  throw new InvalidFileFormatError();
}

/**
 * Parses uploaded buffer in-memory without retaining any file on disk.
 * Enforces 5MB file cap, format validation, and 60,000 char bounds.
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  filename = ""
): Promise<ParsedDocumentResult> {
  if (buffer.length > MAX_CV_FILE_SIZE) {
    throw new FileTooLargeError();
  }

  const format = detectDocumentFormat(buffer, filename);
  let extracted = "";

  if (format === "pdf") {
    try {
      const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const result = await extractText(uint8);
      extracted = (result.text || []).join("\n\n").trim();
    } catch (err: any) {
      if (err instanceof ScannedPdfError) throw err;
      throw new InvalidFileFormatError(`Failed to parse PDF document: ${err?.message || String(err)}`);
    }

    const alphanumericChars = (extracted.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericChars < 20) {
      throw new ScannedPdfError();
    }
  } else if (format === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extracted = (result.value || "").trim();
    } catch (err: any) {
      throw new InvalidFileFormatError(`Failed to parse DOCX document: ${err?.message || String(err)}`);
    }

    const alphanumericChars = (extracted.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphanumericChars < 20) {
      throw new EmptyDocumentError();
    }
  } else {
    extracted = buffer.toString("utf8").trim();
    if (!extracted) {
      throw new EmptyDocumentError();
    }
  }

  // Enforce max 60,000 characters
  const boundedText = extracted.slice(0, MAX_CV_TEXT_CHARS);

  return {
    text: boundedText,
    charCount: boundedText.length,
    format,
  };
}
