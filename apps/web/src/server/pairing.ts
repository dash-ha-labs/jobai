import crypto from "node:crypto";
import { loadPairingState, savePairingState } from "./storage.js";

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a 6-character uppercase alphanumeric one-time pairing code.
 */
export async function createPairingCode(): Promise<{ code: string; expiresInMs: number }> {
  const state = await loadPairingState();
  const now = Date.now();

  // Clean expired codes
  for (const [c, info] of Object.entries(state.pendingCodes)) {
    if (now > info.expiresAt) {
      delete state.pendingCodes[c];
    }
  }

  // Generate 6-char human-friendly code avoiding ambiguous characters
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += charset[crypto.randomInt(0, charset.length)];
  }

  state.pendingCodes[code] = {
    createdAt: now,
    expiresAt: now + CODE_EXPIRY_MS,
  };

  await savePairingState(state);
  return { code, expiresInMs: CODE_EXPIRY_MS };
}

/**
 * Validates and consumes a one-time pairing code, returning the persistent auth token.
 * Binds the exact extension origin (e.g. chrome-extension://<id>) so arbitrary extensions
 * cannot access backend endpoints.
 */
export async function claimPairingCode(
  rawCode: string,
  origin?: string | null
): Promise<{ success: boolean; token?: string; boundOrigin?: string; error?: string }> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    return { success: false, error: "Pairing code is required." };
  }

  const state = await loadPairingState();
  const info = state.pendingCodes[code];

  if (!info) {
    return { success: false, error: "Invalid pairing code. Please generate a fresh code in the web editor." };
  }

  if (Date.now() > info.expiresAt) {
    delete state.pendingCodes[code];
    await savePairingState(state);
    return { success: false, error: "Pairing code has expired. Please generate a fresh code in the web editor." };
  }

  // Consume code immediately
  delete state.pendingCodes[code];

  // If no token exists yet, generate one
  if (!state.token) {
    state.token = crypto.randomBytes(32).toString("hex");
  }

  // Explicitly bind the extension origin if present
  if (origin && origin.startsWith("chrome-extension://")) {
    state.boundOrigin = origin;
  }

  await savePairingState(state);
  return { success: true, token: state.token, boundOrigin: state.boundOrigin || undefined };
}

/**
 * Returns the explicitly paired chrome-extension origin, or null if unbound.
 */
export async function getBoundOrigin(): Promise<string | null> {
  const state = await loadPairingState();
  return state.boundOrigin || null;
}

/**
 * Verifies if an authorization token matches the paired token.
 */
export async function verifyAuthToken(token: string): Promise<boolean> {
  if (!token) return false;
  const state = await loadPairingState();
  if (!state.token) return false;

  try {
    // Constant-time comparison to prevent timing attacks
    const bufA = Buffer.from(token, "utf8");
    const bufB = Buffer.from(state.token, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Checks if the server currently has a paired extension.
 */
export async function isExtensionPaired(): Promise<boolean> {
  const state = await loadPairingState();
  return Boolean(state.token);
}
