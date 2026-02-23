/**
 * AI-generated headshot service.
 *
 * Provides realistic AI-generated headshots as fallback photos for
 * manager/HR profiles when real LinkedIn photos are unavailable.
 *
 * Fallback chain:
 *   1. Generated.Photos API (if GENERATED_PHOTOS_API_KEY is set)
 *   2. thispersondoesnotexist.com (no API key needed, random face)
 *   3. UI Avatars (letter-based avatar, always works)
 */

import { logger } from "../logger";

/** Strip API keys from error messages to prevent leaking secrets in logs. */
function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/api_key=[^&\s]+/gi, "api_key=***");
}

// ── Config ──────────────────────────────────────────────────────────

const GENERATED_PHOTOS_API_KEY = process.env.GENERATED_PHOTOS_API_KEY ?? "";

// ── Types ───────────────────────────────────────────────────────────

export interface HeadshotResult {
  url: string;
  source: "generated_photos" | "thispersondoesnotexist" | "ui_avatars";
  isAIGenerated: boolean;
}

interface GeneratedPhotosResponse {
  faces?: Array<{
    id: number;
    urls: {
      thumb?: string;
      medium?: string;
      large?: string;
    };
    meta?: {
      gender?: string[];
      age?: string[];
    };
  }>;
}

// ── Headshot pool (pre-fetched cache) ───────────────────────────────

let headshotPool: string[] = [];
let poolIndex = 0;

/**
 * Pre-fetch a pool of AI headshots from Generated.Photos to avoid
 * per-job API calls. Cached in memory for reuse across enrichment runs.
 */
export async function preloadHeadshotPool(count = 20): Promise<void> {
  if (!GENERATED_PHOTOS_API_KEY) {
    logger.debug("No Generated.Photos API key, skipping pool preload", {
      source: "aiImages",
    });
    return;
  }

  const params = new URLSearchParams({
    api_key: GENERATED_PHOTOS_API_KEY,
    order_by: "random",
    per_page: String(count),
    age: "adult",
  });

  try {
    const res = await fetch(
      `https://api.generated.photos/api/v1/faces?${params}`,
      { signal: AbortSignal.timeout(15000) },
    );

    if (!res.ok) {
      logger.warn("Generated.Photos pool fetch returned non-OK", {
        source: "aiImages",
        status: res.status,
      });
      return;
    }

    const data: GeneratedPhotosResponse = await res.json();
    const urls = (data.faces ?? [])
      .map((f) => f.urls.medium)
      .filter((u): u is string => !!u);

    if (urls.length > 0) {
      headshotPool = urls;
      poolIndex = 0;
      logger.info(`Preloaded ${urls.length} AI headshots`, {
        source: "aiImages",
      });
    }
  } catch (err) {
    logger.error("Failed to preload headshot pool", {
      source: "aiImages",
      error: sanitizeError(err),
    });
  }
}

/**
 * Pull the next headshot from the pre-fetched pool.
 * Returns null when the pool is empty or exhausted.
 */
function fromPool(): string | null {
  if (headshotPool.length === 0) return null;
  if (poolIndex >= headshotPool.length) {
    // Wrap around so the pool can be reused
    poolIndex = 0;
  }
  return headshotPool[poolIndex++] ?? null;
}

// ── Single-fetch from Generated.Photos API ──────────────────────────

async function fetchFromGeneratedPhotos(
  gender?: "male" | "female",
): Promise<string | null> {
  if (!GENERATED_PHOTOS_API_KEY) return null;

  const params = new URLSearchParams({
    api_key: GENERATED_PHOTOS_API_KEY,
    order_by: "random",
    per_page: "1",
    age: "adult",
  });

  if (gender) {
    params.set("gender", gender);
  }

  try {
    const res = await fetch(
      `https://api.generated.photos/api/v1/faces?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!res.ok) {
      logger.warn("Generated.Photos single fetch non-OK", {
        source: "aiImages",
        status: res.status,
      });
      return null;
    }

    const data: GeneratedPhotosResponse = await res.json();
    return data.faces?.[0]?.urls.medium ?? null;
  } catch (err) {
    logger.error("Generated.Photos single fetch failed", {
      source: "aiImages",
      error: sanitizeError(err),
    });
    return null;
  }
}

// ── thisPersonDoesNotExist fallback ─────────────────────────────────

function thisPersonDoesNotExistUrl(): string {
  // Append a cache-busting param so each call yields a different face
  return `https://thispersondoesnotexist.com/?_=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── UI Avatars fallback ─────────────────────────────────────────────

function uiAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=1e293b&color=fff&bold=true&format=svg`;
}

// ── Main entry point ────────────────────────────────────────────────

/**
 * Generate or retrieve an AI headshot with a 3-tier fallback chain.
 *
 * 1. Pre-fetched pool / Generated.Photos API (if key is set)
 * 2. thispersondoesnotexist.com (random AI face, no API key)
 * 3. UI Avatars letter avatar (always works)
 */
export async function generateHeadshot(options: {
  name: string;
  gender?: "male" | "female";
}): Promise<HeadshotResult> {
  const { name, gender } = options;

  // 1a. Try from the pre-fetched pool first (free, instant)
  const poolUrl = fromPool();
  if (poolUrl) {
    logger.debug("Headshot served from pool", { source: "aiImages", name });
    return { url: poolUrl, source: "generated_photos", isAIGenerated: true };
  }

  // 1b. Try single-fetch from Generated.Photos API
  const apiUrl = await fetchFromGeneratedPhotos(gender);
  if (apiUrl) {
    logger.debug("Headshot from Generated.Photos API", {
      source: "aiImages",
      name,
    });
    return { url: apiUrl, source: "generated_photos", isAIGenerated: true };
  }

  // 2. thispersondoesnotexist.com — random AI face, no key needed
  logger.debug("Falling back to thispersondoesnotexist.com", {
    source: "aiImages",
    name,
  });
  return {
    url: thisPersonDoesNotExistUrl(),
    source: "thispersondoesnotexist",
    isAIGenerated: true,
  };
}

/**
 * Synchronous fallback that always returns a URL (UI Avatars).
 * Use when you need a guaranteed URL without async.
 */
export function fallbackAvatar(name: string): HeadshotResult {
  return {
    url: uiAvatarUrl(name),
    source: "ui_avatars",
    isAIGenerated: false,
  };
}
