/**
 * Professional email discovery using Hunter.io.
 *
 * Strategy:
 *   1. If a person's name is known (e.g. from ProxyCurl), use email-finder
 *   2. If only the company is known, use domain-search to find HR/recruiting emails
 *   3. Fall back to guessed emails like careers@{domain}.com
 *
 * Every function gracefully degrades when HUNTER_API_KEY is missing.
 */

import { logger } from "../logger";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY ?? "";
const HUNTER_BASE = "https://api.hunter.io/v2";
const HUNTER_TIMEOUT_MS = 8_000;
const MIN_CONFIDENCE = 50;

/** Strip API keys from error messages to prevent leaking secrets in logs. */
function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/api_key=[^&\s]+/gi, "api_key=***");
}

// ── Types ────────────────────────────────────────────────────────────

interface HunterEmailFinderResponse {
  data?: {
    email?: string;
    score?: number;
    sources?: Array<{
      domain: string;
      uri: string;
      extracted_on: string;
    }>;
  };
}

interface HunterDomainSearchEmail {
  value: string;
  type: "personal" | "generic";
  confidence: number;
  first_name?: string;
  last_name?: string;
  department?: string;
}

interface HunterDomainSearchResponse {
  data?: {
    domain?: string;
    emails?: HunterDomainSearchEmail[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function companyToDomain(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .concat(".com");
}

/**
 * Build a likely email for a company when no API data is available.
 */
function guessCompanyEmail(
  company: string,
  type: "careers" | "recruiting",
): string {
  const domain = companyToDomain(company);
  return `${type}@${domain}`;
}

// ── Email Finder (person-level) ──────────────────────────────────────

/**
 * Find the professional email of a specific person using Hunter.io email-finder.
 *
 * Returns `null` if the API key is missing, confidence is below threshold,
 * or the request fails.
 */
export async function findPersonEmail(
  firstName: string,
  lastName: string,
  company: string,
): Promise<string | null> {
  if (!HUNTER_API_KEY) {
    logger.debug("Hunter API key not set, skipping person email lookup", {
      source: "enrichment:emails",
    });
    return null;
  }

  const params = new URLSearchParams({
    api_key: HUNTER_API_KEY,
    company,
    first_name: firstName,
    last_name: lastName,
  });

  try {
    const res = await fetch(`${HUNTER_BASE}/email-finder?${params}`, {
      signal: AbortSignal.timeout(HUNTER_TIMEOUT_MS),
    });

    if (!res.ok) {
      logger.warn("Hunter email-finder returned non-OK", {
        source: "enrichment:emails",
        status: res.status,
        company,
      });
      return null;
    }

    const data: HunterEmailFinderResponse = await res.json();

    if (
      data.data?.email &&
      data.data.score !== undefined &&
      data.data.score >= MIN_CONFIDENCE
    ) {
      logger.info("Found person email via Hunter", {
        source: "enrichment:emails",
        email: data.data.email,
        score: data.data.score,
        company,
      });
      return data.data.email;
    }

    logger.debug("Hunter email-finder returned low-confidence or no result", {
      source: "enrichment:emails",
      score: data.data?.score,
      company,
    });
    return null;
  } catch (err) {
    logger.error("Hunter email-finder request failed", {
      source: "enrichment:emails",
      error: sanitizeError(err),
      company,
    });
    return null;
  }
}

// ── Domain Search (company-level HR emails) ──────────────────────────

/**
 * Find an HR or recruiting email for a company using Hunter.io domain-search.
 *
 * Prioritizes:
 *   1. Generic emails in the hr/recruiting department
 *   2. Any generic email (e.g. info@, contact@)
 *   3. Guessed fallback: careers@{domain}.com
 */
export async function findCompanyHREmail(company: string): Promise<string> {
  if (!HUNTER_API_KEY) {
    logger.debug("Hunter API key not set, using guessed HR email", {
      source: "enrichment:emails",
    });
    return guessCompanyEmail(company, "careers");
  }

  const params = new URLSearchParams({
    api_key: HUNTER_API_KEY,
    company,
    limit: "10",
  });

  try {
    const res = await fetch(`${HUNTER_BASE}/domain-search?${params}`, {
      signal: AbortSignal.timeout(HUNTER_TIMEOUT_MS),
    });

    if (!res.ok) {
      logger.warn("Hunter domain-search returned non-OK", {
        source: "enrichment:emails",
        status: res.status,
        company,
      });
      return guessCompanyEmail(company, "careers");
    }

    const data: HunterDomainSearchResponse = await res.json();
    const emails = data.data?.emails ?? [];

    // Priority 1: generic email from hr or recruiting department
    const hrGeneric = emails.find(
      (e) =>
        e.type === "generic" &&
        e.department &&
        /^(hr|human.?resources|recruiting|talent)$/i.test(e.department),
    );
    if (hrGeneric) {
      logger.info("Found HR generic email via Hunter domain-search", {
        source: "enrichment:emails",
        email: hrGeneric.value,
        company,
      });
      return hrGeneric.value;
    }

    // Priority 2: any generic email (e.g. info@, contact@, jobs@)
    const anyGeneric = emails.find((e) => e.type === "generic");
    if (anyGeneric) {
      logger.info("Found generic email via Hunter domain-search", {
        source: "enrichment:emails",
        email: anyGeneric.value,
        company,
      });
      return anyGeneric.value;
    }

    // Priority 3: highest-confidence personal email in hr/recruiting
    const hrPersonal = emails
      .filter(
        (e) =>
          e.department &&
          /^(hr|human.?resources|recruiting|talent)$/i.test(e.department),
      )
      .sort((a, b) => b.confidence - a.confidence);
    if (hrPersonal.length > 0) {
      logger.info("Found HR personal email via Hunter domain-search", {
        source: "enrichment:emails",
        email: hrPersonal[0].value,
        company,
      });
      return hrPersonal[0].value;
    }

    logger.debug("Hunter domain-search returned no suitable emails", {
      source: "enrichment:emails",
      company,
      totalEmails: emails.length,
    });
    return guessCompanyEmail(company, "careers");
  } catch (err) {
    logger.error("Hunter domain-search request failed", {
      source: "enrichment:emails",
      error: sanitizeError(err),
      company,
    });
    return guessCompanyEmail(company, "careers");
  }
}

// ── Re-export the guess helper for use by other modules ──────────────

export { guessCompanyEmail };
