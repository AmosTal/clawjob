/**
 * Professional headshot sourcing pipeline.
 *
 * Source priority chain:
 *   1. LinkedIn photo (via ProxyCurl — if linkedinPhotoUrl provided)
 *   2. Gravatar (if email known)
 *   3. Generated.Photos API (if GENERATED_PHOTOS_API_KEY set)
 *   4. UI Avatars (always works)
 *
 * Also provides uploadToFirebaseStorage() for permanently hosting images
 * on our own CDN so we don't depend on external services.
 */

import { adminStorage } from "../firebase-admin";
import { logger } from "../logger";
import { validateURL } from "../validation";

/** Allowlisted domains for fetching external images (SSRF protection). */
const ALLOWED_IMAGE_DOMAINS = new Set([
  "media.licdn.com",
  "media-exp1.licdn.com",
  "media-exp2.licdn.com",
  "static.licdn.com",
  "platform-lookaside.fbsbx.com",
  "lh3.googleusercontent.com",
  "pbs.twimg.com",
  "avatars.githubusercontent.com",
  "www.gravatar.com",
  "ui-avatars.com",
  "logo.clearbit.com",
  "storage.googleapis.com",
  "api.generated.photos",
  "images.generated.photos",
  "thispersondoesnotexist.com",
]);

/**
 * Validate a URL is safe to fetch (not an internal/private address).
 * Returns the URL if valid, null otherwise.
 */
function validateImageUrl(url: string): string | null {
  const validated = validateURL(url);
  if (!validated) return null;
  try {
    const parsed = new URL(validated);
    // Block private/internal IPs and localhost
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
      hostname === "metadata.google.internal" ||
      hostname === "169.254.169.254"
    ) {
      logger.warn("Blocked fetch to private/internal URL", { source: "photos", hostname });
      return null;
    }
    return validated;
  } catch {
    return null;
  }
}

const GENERATED_PHOTOS_API_KEY = process.env.GENERATED_PHOTOS_API_KEY ?? "";

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Check if a URL actually resolves to an image via HEAD request.
 */
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Compute MD5 hex digest of a string.
 * Uses Node.js crypto (available in server-side Next.js).
 */
async function md5(input: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("md5").update(input.trim().toLowerCase()).digest("hex");
}

// ── Photo sources ────────────────────────────────────────────────────

async function tryLinkedInPhoto(linkedinPhotoUrl?: string): Promise<string | null> {
  if (!linkedinPhotoUrl) return null;
  // SSRF protection: validate the URL before fetching
  const safeUrl = validateImageUrl(linkedinPhotoUrl);
  if (!safeUrl) {
    logger.warn("LinkedIn photo URL rejected by SSRF validation", { source: "photos" });
    return null;
  }
  const valid = await isValidImageUrl(safeUrl);
  if (valid) {
    logger.debug("Using LinkedIn photo", { source: "photos" });
    return safeUrl;
  }
  logger.debug("LinkedIn photo URL invalid or unreachable", { source: "photos" });
  return null;
}

async function tryGravatar(email?: string): Promise<string | null> {
  if (!email) return null;
  const hash = await md5(email);
  const url = `https://www.gravatar.com/avatar/${hash}?s=300&d=404`;
  const valid = await isValidImageUrl(url);
  if (valid) {
    logger.debug("Using Gravatar photo", { source: "photos", email });
    return url;
  }
  return null;
}

async function tryGeneratedPhotos(
  gender?: "male" | "female" | "neutral",
): Promise<string | null> {
  if (!GENERATED_PHOTOS_API_KEY) return null;

  const params = new URLSearchParams({
    api_key: GENERATED_PHOTOS_API_KEY,
    gender: gender ?? "all",
    age: "adult",
    order_by: "random",
    per_page: "1",
  });

  try {
    const res = await fetch(
      `https://api.generated.photos/api/v1/faces?${params}`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (!res.ok) {
      logger.warn("Generated.Photos API returned non-OK", {
        source: "photos",
        status: res.status,
      });
      return null;
    }

    const data = (await res.json()) as {
      faces?: Array<{ urls?: Array<{ 512?: string }> }>;
    };

    const url = data.faces?.[0]?.urls?.[0]?.["512"];
    if (url) {
      logger.debug("Using Generated.Photos headshot", { source: "photos" });
      return url;
    }
    return null;
  } catch (err) {
    logger.error("Generated.Photos API failed", {
      source: "photos",
      error: String(err),
    });
    return null;
  }
}

function uiAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=random&color=fff`;
}

// ── Main pipeline ────────────────────────────────────────────────────

export async function getPersonPhoto(options: {
  name: string;
  email?: string;
  linkedinPhotoUrl?: string;
  gender?: "male" | "female" | "neutral";
}): Promise<string> {
  const { name, email, linkedinPhotoUrl, gender } = options;

  // 1. LinkedIn photo
  const linkedin = await tryLinkedInPhoto(linkedinPhotoUrl);
  if (linkedin) return linkedin;

  // 2. Gravatar
  const gravatar = await tryGravatar(email);
  if (gravatar) return gravatar;

  // 3. Generated.Photos API
  const generated = await tryGeneratedPhotos(gender);
  if (generated) return generated;

  // 4. UI Avatars (always works)
  logger.debug("Falling back to UI Avatars", { source: "photos", name });
  return uiAvatarUrl(name);
}

// ── Firebase Storage upload ──────────────────────────────────────────

/**
 * Download a remote image and upload it to Firebase Storage for reliable serving.
 * Returns the public download URL from Firebase Storage.
 */
export async function uploadToFirebaseStorage(
  imageUrl: string,
  storagePath: string,
): Promise<string> {
  // SSRF protection: validate the URL before fetching
  const safeUrl = validateImageUrl(imageUrl);
  if (!safeUrl) {
    throw new Error("Image URL rejected by SSRF validation");
  }

  // Download the image
  const res = await fetch(safeUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to download image: ${res.status} ${res.statusText}`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());

  // Upload to Firebase Storage
  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // Make the file publicly accessible and get download URL
  await file.makePublic();
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  logger.info("Uploaded image to Firebase Storage", {
    source: "photos",
    storagePath,
    size: buffer.length,
  });

  return downloadUrl;
}
