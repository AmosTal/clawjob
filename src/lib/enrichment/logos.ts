/**
 * Company logo enrichment service.
 *
 * Resolves the best available logo for a company name using a priority chain:
 * 1. Clearbit Logo API (free, no key)
 * 2. Brandfetch search (free tier, optional key)
 * 3. Google Favicon (free, no key)
 * 4. UI Avatars fallback (always works)
 */

import { logger } from "../logger";

// ── Environment ─────────────────────────────────────────────────────

const BRANDFETCH_API_KEY = process.env.BRANDFETCH_API_KEY ?? "";

// ── In-memory cache ─────────────────────────────────────────────────

const logoCache = new Map<string, string>();

// ── Well-known domain overrides ─────────────────────────────────────

const DOMAIN_OVERRIDES: Record<string, string> = {
  meta: "meta.com",
  alphabet: "google.com",
  google: "google.com",
  microsoft: "microsoft.com",
  apple: "apple.com",
  amazon: "amazon.com",
  netflix: "netflix.com",
  tesla: "tesla.com",
  spacex: "spacex.com",
  stripe: "stripe.com",
  airbnb: "airbnb.com",
  uber: "uber.com",
  lyft: "lyft.com",
  snap: "snapchat.com",
  snapchat: "snapchat.com",
  "x corp": "x.com",
  twitter: "x.com",
  tiktok: "tiktok.com",
  bytedance: "bytedance.com",
  salesforce: "salesforce.com",
  slack: "slack.com",
  shopify: "shopify.com",
  spotify: "spotify.com",
  coinbase: "coinbase.com",
  robinhood: "robinhood.com",
  databricks: "databricks.com",
  datadog: "datadoghq.com",
  palantir: "palantir.com",
  cloudflare: "cloudflare.com",
  figma: "figma.com",
  notion: "notion.so",
  vercel: "vercel.com",
  twilio: "twilio.com",
  github: "github.com",
  gitlab: "gitlab.com",
  atlassian: "atlassian.com",
  jira: "atlassian.com",
  dropbox: "dropbox.com",
  reddit: "reddit.com",
  discord: "discord.com",
  pinterest: "pinterest.com",
  linkedin: "linkedin.com",
  ibm: "ibm.com",
  oracle: "oracle.com",
  intel: "intel.com",
  nvidia: "nvidia.com",
  amd: "amd.com",
  cisco: "cisco.com",
  vmware: "vmware.com",
  adobe: "adobe.com",
  intuit: "intuit.com",
  square: "squareup.com",
  block: "block.xyz",
  doordash: "doordash.com",
  instacart: "instacart.com",
  plaid: "plaid.com",
  openai: "openai.com",
  anthropic: "anthropic.com",
};

// ── Domain guessing ─────────────────────────────────────────────────

/**
 * Guess a company's primary domain from its name.
 * Uses well-known overrides first, then strips common suffixes and
 * lowercases to produce a best-guess `.com` domain.
 */
export function guessCompanyDomain(name: string): string {
  const normalized = name.trim().toLowerCase();

  // Check overrides (exact match first, then without common suffixes)
  if (DOMAIN_OVERRIDES[normalized]) {
    return DOMAIN_OVERRIDES[normalized];
  }

  // Strip corporate suffixes
  const cleaned = normalized
    .replace(
      /\s*,?\s*(inc\.?|llc\.?|corp\.?|corporation|ltd\.?|limited|co\.?|company|group|holdings|technologies|technology|tech|software|labs?|studios?|solutions|services|systems|enterprises?|international|plc\.?)$/i,
      "",
    )
    .trim();

  if (DOMAIN_OVERRIDES[cleaned]) {
    return DOMAIN_OVERRIDES[cleaned];
  }

  // Convert to domain slug: keep alphanumeric, collapse spaces/hyphens
  const slug = cleaned.replace(/[^a-z0-9]+/g, "");
  return `${slug}.com`;
}

// ── UI Avatars fallback ─────────────────────────────────────────────

function uiAvatarFallback(companyName: string): string {
  const words = companyName.trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : companyName.slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1a1a2e&color=fff&size=128`;
}

// ── Logo source checks ──────────────────────────────────────────────

/**
 * Check if a URL returns a valid image by doing a HEAD request.
 * Returns true if status is 2xx.
 */
async function isImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    // Accept image types or empty content-type (some CDNs omit it)
    return ct === "" || ct.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Try Clearbit Logo API.
 * Free, no key required. Returns a logo PNG if the domain is recognized.
 */
async function tryClearbit(domain: string): Promise<string | null> {
  const url = `https://logo.clearbit.com/${domain}`;
  if (await isImageReachable(url)) {
    return url;
  }
  return null;
}

/**
 * Try Brandfetch search API.
 * Requires BRANDFETCH_API_KEY env variable (free tier available).
 */
async function tryBrandfetch(companyName: string): Promise<string | null> {
  if (!BRANDFETCH_API_KEY) return null;

  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(companyName)}`,
      {
        headers: { Authorization: `Bearer ${BRANDFETCH_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      logger.debug("Brandfetch search returned non-OK", {
        source: "logos",
        status: res.status,
        company: companyName,
      });
      return null;
    }

    const results: Array<{ icon?: string; domain?: string }> = await res.json();
    const first = results?.[0];
    if (first?.icon) return first.icon;
    // If Brandfetch returns a domain but no icon, try Clearbit with that domain
    if (first?.domain) {
      return tryClearbit(first.domain);
    }
    return null;
  } catch (err) {
    logger.debug("Brandfetch search failed", {
      source: "logos",
      error: String(err),
      company: companyName,
    });
    return null;
  }
}

/**
 * Try Google Favicon service.
 * Free, no key required. Returns a small favicon for any domain.
 */
async function tryGoogleFavicon(domain: string): Promise<string | null> {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  if (await isImageReachable(url)) {
    return url;
  }
  return null;
}

// ── Main export ─────────────────────────────────────────────────────

/**
 * Resolve the best logo URL for a company.
 *
 * If `existingLogo` is provided and looks like a real logo (not a
 * UI Avatars or pravatar placeholder), it is returned immediately.
 *
 * Otherwise walks the priority chain:
 * 1. Clearbit (guessed domain)
 * 2. Brandfetch (search by name)
 * 3. Google Favicon (guessed domain)
 * 4. UI Avatars (deterministic initials)
 */
export async function getCompanyLogo(
  companyName: string,
  existingLogo?: string,
): Promise<string> {
  // If existing logo looks real, keep it
  if (
    existingLogo &&
    !existingLogo.includes("ui-avatars.com") &&
    !existingLogo.includes("pravatar.cc")
  ) {
    return existingLogo;
  }

  // Cache lookup
  const cacheKey = companyName.trim().toLowerCase();
  const cached = logoCache.get(cacheKey);
  if (cached) return cached;

  const domain = guessCompanyDomain(companyName);

  // 1. Clearbit
  const clearbit = await tryClearbit(domain);
  if (clearbit) {
    logger.debug("Logo resolved via Clearbit", { source: "logos", company: companyName, domain });
    logoCache.set(cacheKey, clearbit);
    return clearbit;
  }

  // 2. Brandfetch
  const brandfetch = await tryBrandfetch(companyName);
  if (brandfetch) {
    logger.debug("Logo resolved via Brandfetch", { source: "logos", company: companyName });
    logoCache.set(cacheKey, brandfetch);
    return brandfetch;
  }

  // 3. Google Favicon
  const favicon = await tryGoogleFavicon(domain);
  if (favicon) {
    logger.debug("Logo resolved via Google Favicon", { source: "logos", company: companyName, domain });
    logoCache.set(cacheKey, favicon);
    return favicon;
  }

  // 4. UI Avatars fallback
  logger.debug("Logo falling back to UI Avatars", { source: "logos", company: companyName });
  const fallback = uiAvatarFallback(companyName);
  logoCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Clear the in-memory logo cache. Useful for testing or forced refresh.
 */
export function clearLogoCache(): void {
  logoCache.clear();
}
