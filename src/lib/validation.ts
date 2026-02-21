// ── Security validation & sanitization helpers ──────────────────────

/**
 * Strip HTML tags and dangerous characters from user input.
 * Prevents stored XSS when values are rendered in the UI.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
}

/**
 * Validate and truncate a string to a maximum length.
 * Returns the sanitized, length-limited string or null if the input is not a string.
 */
export function validateString(
  input: unknown,
  maxLength: number
): string | null {
  if (typeof input !== "string") return null;
  const sanitized = sanitizeString(input);
  return sanitized.slice(0, maxLength);
}

/**
 * Validate a string is one of an allowed set of values.
 */
export function validateEnum<T extends string>(
  input: unknown,
  allowed: T[]
): T | null {
  if (typeof input !== "string") return null;
  return allowed.includes(input as T) ? (input as T) : null;
}

/**
 * Validate a URL string (must be http or https).
 */
export function validateURL(input: unknown, maxLength = 2048): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, maxLength);
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Validate an array of strings, sanitizing each element.
 */
export function validateStringArray(
  input: unknown,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((item) => sanitizeString(item).slice(0, maxItemLength));
}

/**
 * Sanitize a filename for storage.
 * - Strips path traversal components (../, ..\, leading /)
 * - Only keeps the basename
 * - Whitelists safe characters (alphanumeric, dash, underscore, dot, space)
 * - Limits total length
 */
export function sanitizeFilename(filename: string, maxLength = 100): string {
  // Extract basename — strip any directory components
  let basename = filename.replace(/\\/g, "/").split("/").pop() ?? filename;

  // Remove null bytes and control characters
  basename = basename.replace(/[\x00-\x1F\x7F]/g, "");

  // Whitelist: only allow alphanumeric, dash, underscore, dot, space, parens
  basename = basename.replace(/[^a-zA-Z0-9\-_. ()]/g, "_");

  // Prevent hidden files / dot-only names
  basename = basename.replace(/^\.+/, "");

  // Collapse multiple dots/underscores
  basename = basename.replace(/\.{2,}/g, ".").replace(/_{2,}/g, "_");

  // Ensure it's not empty after sanitization
  if (!basename || basename.trim().length === 0) {
    basename = "upload";
  }

  return basename.slice(0, maxLength);
}

// ── Field length limits ─────────────────────────────────────────────

export const LIMITS = {
  name: 100,
  bio: 500,
  email: 254,
  title: 200,
  company: 200,
  location: 200,
  salary: 50,
  description: 5000,
  message: 2000,
  tagline: 300,
  phone: 30,
  teamSize: 50,
  fileName: 100,
  cvName: 100,
  url: 2048,
  tag: 50,
  maxTags: 20,
  maxRequirements: 30,
  maxBenefits: 30,
  maxCulture: 20,
  requirement: 500,
  benefit: 500,
  culture: 200,
} as const;
