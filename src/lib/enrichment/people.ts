/**
 * LinkedIn profile lookup via ProxyCurl API.
 *
 * ProxyCurl (proxycurl.com) is a legitimate LinkedIn data service.
 * - Employee search: GET https://nubela.co/proxycurl/api/linkedin/company/employees/search
 * - Profile lookup:  GET https://nubela.co/proxycurl/api/v2/linkedin
 * - Env: PROXYCURL_API_KEY
 *
 * Costs ~$0.03/profile — use conservatively with per-company caching.
 */

import { logger } from "../logger";

// ── Public types ─────────────────────────────────────────────────────

export interface LinkedInPerson {
  name: string;
  title: string;
  photo?: string;
  linkedinUrl?: string;
  email?: string;
}

// ── ProxyCurl response shapes ────────────────────────────────────────

interface ProxyCurlProfile {
  full_name?: string;
  headline?: string;
  profile_pic_url?: string;
  emails?: string[];
  experiences?: Array<{
    company?: string;
    title?: string;
    starts_at?: { year: number };
    ends_at?: { year: number } | null;
  }>;
}

interface ProxyCurlPerson {
  linkedin_profile_url?: string;
  profile?: ProxyCurlProfile;
}

interface ProxyCurlSearchResponse {
  results?: ProxyCurlPerson[];
}

// ── Per-company cache ────────────────────────────────────────────────
// Keyed by `${company}::${type}` to avoid duplicate lookups within a
// single enrichment batch. TTL is the lifetime of the process (serverless
// function or dev server), which is appropriate for short-lived Cloud Run
// containers. For longer-lived processes the cache stays small because
// the key space is bounded by unique companies per batch.

const cache = new Map<string, LinkedInPerson | null>();

function cacheKey(company: string, type: "manager" | "hr"): string {
  return `${company.toLowerCase().trim()}::${type}`;
}

// ── Core search helper ───────────────────────────────────────────────

async function searchEmployees(
  companyName: string,
  keywordRegex: string,
): Promise<ProxyCurlPerson | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    company_name: companyName,
    keyword_regex: keywordRegex,
    page_size: "1",
    enrich_profiles: "enrich",
  });

  try {
    const res = await fetch(
      `https://nubela.co/proxycurl/api/linkedin/company/employees/search?${params}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      logger.warn("ProxyCurl search returned non-OK", {
        source: "enrichment.people",
        status: res.status,
        company: companyName,
        keyword: keywordRegex,
      });
      return null;
    }

    const data: ProxyCurlSearchResponse = await res.json();
    return data.results?.[0] ?? null;
  } catch (err) {
    logger.error("ProxyCurl search failed", {
      source: "enrichment.people",
      error: String(err),
      company: companyName,
    });
    return null;
  }
}

function personFromResult(result: ProxyCurlPerson): LinkedInPerson {
  const p = result.profile;
  return {
    name: p?.full_name ?? "Unknown",
    title: p?.headline ?? "",
    photo: p?.profile_pic_url ?? undefined,
    linkedinUrl: result.linkedin_profile_url ?? undefined,
    email: p?.emails?.[0] ?? undefined,
  };
}

// ── Public API ───────────────────────────────────────────────────────

const MANAGER_KEYWORDS =
  "engineering manager|technical lead|vp engineering|director of engineering|cto|head of engineering";

const HR_KEYWORDS =
  "recruiter|talent acquisition|hr|people operations|talent acquisition manager|head of people";

/**
 * Search for a hiring manager at the given company.
 * Returns null if PROXYCURL_API_KEY is not set or the search fails.
 */
export async function findHiringManager(
  company: string,
  _role?: string,
): Promise<LinkedInPerson | null> {
  if (!process.env.PROXYCURL_API_KEY) return null;

  const key = cacheKey(company, "manager");
  if (cache.has(key)) return cache.get(key)!;

  const result = await searchEmployees(company, MANAGER_KEYWORDS);
  const person = result ? personFromResult(result) : null;

  cache.set(key, person);

  if (person) {
    logger.info("Found hiring manager via ProxyCurl", {
      source: "enrichment.people",
      company,
      name: person.name,
    });
  }

  return person;
}

/**
 * Search for an HR / recruiter contact at the given company.
 * Returns null if the API is not available.
 */
export async function findHRContact(
  company: string,
): Promise<LinkedInPerson | null> {
  if (!process.env.PROXYCURL_API_KEY) return null;

  const key = cacheKey(company, "hr");
  if (cache.has(key)) return cache.get(key)!;

  const result = await searchEmployees(company, HR_KEYWORDS);
  const person = result ? personFromResult(result) : null;

  cache.set(key, person);

  if (person) {
    logger.info("Found HR contact via ProxyCurl", {
      source: "enrichment.people",
      company,
      name: person.name,
    });
  }

  return person;
}
