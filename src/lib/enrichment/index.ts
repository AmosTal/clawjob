/**
 * People-data enrichment pipeline.
 *
 * Takes a NormalizedJob (from any scraper adapter) and produces a full JobCard
 * by enriching it with:
 *   1. Company logo (Clearbit)
 *   2. Parsed description (requirements, benefits, teamSize, culture)
 *   3. Hiring manager lookup (ProxyCurl → LinkedIn)
 *   4. HR / recruiter contact (ProxyCurl / Hunter.io)
 *   5. Professional headshots (real photo → Generated.Photos → UI Avatars)
 *
 * Every step is gracefully degraded — missing API keys or network errors
 * produce sensible placeholders instead of failures.
 */

import type { JobCard, ManagerAsset, HRContact } from "../types";
import type { NormalizedJob } from "../scrapers/types";
import { logger } from "../logger";
import { getCompanyLogo } from "./logos";
import { findPersonEmail, findCompanyHREmail } from "./emails";
import { generateHeadshot, preloadHeadshotPool, fallbackAvatar } from "./aiImages";
import { parseJobDescription } from "./parser";
export { generateHeadshot, preloadHeadshotPool } from "./aiImages";
export type { HeadshotResult } from "./aiImages";
export { parseJobDescription } from "./parser";
export type { ParsedJobData } from "./parser";

// ── Environment helpers ──────────────────────────────────────────────

const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY ?? "";

// ── Enrichment-source tracking ───────────────────────────────────────

export type EnrichmentSource =
  | "proxycurl"
  | "hunter"
  | "clearbit"
  | "generated_photos"
  | "thispersondoesnotexist"
  | "ui_avatars"
  | "parsed"
  | "placeholder";

export interface EnrichmentMeta {
  managerSource: EnrichmentSource;
  hrSource: EnrichmentSource;
  managerPhotoSource: EnrichmentSource;
  hrPhotoSource: EnrichmentSource;
  emailSource: EnrichmentSource;
  descriptionParsed: boolean;
}


// ── Photo helpers ────────────────────────────────────────────────────

function uiAvatarUrl(name: string, bg = "4F46E5"): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128`;
}

/**
 * Resolve photo URL with fallback chain:
 *   real photo → AI headshot (Generated.Photos / TPDNE) → UI avatar.
 */
async function resolvePhoto(
  realUrl: string | undefined,
  name: string,
  gender?: "male" | "female",
): Promise<{ url: string; source: EnrichmentSource; isAIGenerated: boolean }> {
  if (realUrl) {
    return { url: realUrl, source: "proxycurl", isAIGenerated: false };
  }
  // AI headshot fallback chain (Generated.Photos → TPDNE → UI Avatars)
  try {
    const headshot = await generateHeadshot({ name, gender });
    return { url: headshot.url, source: headshot.source, isAIGenerated: headshot.isAIGenerated };
  } catch {
    const avatar = fallbackAvatar(name);
    return { url: avatar.url, source: "ui_avatars", isAIGenerated: false };
  }
}

// ── ProxyCurl — LinkedIn people search ───────────────────────────────

interface ProxyCurlPerson {
  linkedin_profile_url?: string;
  profile?: {
    full_name?: string;
    headline?: string;
    profile_pic_url?: string;
    experiences?: Array<{
      company?: string;
      title?: string;
      starts_at?: { year: number };
      ends_at?: { year: number } | null;
    }>;
  };
}

interface ProxyCurlSearchResponse {
  results?: ProxyCurlPerson[];
}

async function searchLinkedIn(
  companyName: string,
  keywordRegex: string,
): Promise<ProxyCurlPerson | null> {
  if (!PROXYCURL_API_KEY) {
    logger.debug("ProxyCurl API key not set, skipping LinkedIn search", {
      source: "enrichment",
    });
    return null;
  }

  const params = new URLSearchParams({
    company_name: companyName,
    keyword_regex: keywordRegex,
    page_size: "1",
  });

  try {
    const res = await fetch(
      `https://nubela.co/proxycurl/api/linkedin/company/employees/search?${params}`,
      {
        headers: { Authorization: `Bearer ${PROXYCURL_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) {
      logger.warn("ProxyCurl search returned non-OK", {
        source: "enrichment",
        status: res.status,
        keyword: keywordRegex,
      });
      return null;
    }

    const data: ProxyCurlSearchResponse = await res.json();
    return data.results?.[0] ?? null;
  } catch (err) {
    logger.error("ProxyCurl search failed", {
      source: "enrichment",
      error: String(err),
      company: companyName,
    });
    return null;
  }
}

// ── Manager enrichment ───────────────────────────────────────────────

async function enrichManager(
  company: string,
): Promise<{ manager: ManagerAsset; meta: Pick<EnrichmentMeta, "managerSource" | "managerPhotoSource"> }> {
  const person = await searchLinkedIn(
    company,
    "engineering manager|engineering lead|vp engineering|cto|head of engineering|director of engineering",
  );

  if (person?.profile) {
    const p = person.profile;
    const name = p.full_name ?? "Hiring Manager";
    const title = p.headline ?? `Engineering Manager at ${company}`;
    const { url: photo, source: photoSource } = await resolvePhoto(
      p.profile_pic_url,
      name,
    );

    logger.info("Enriched manager via ProxyCurl", {
      source: "enrichment",
      company,
      name,
    });

    return {
      manager: {
        name,
        title,
        tagline: `Building the future at ${company}`,
        photo,
      },
      meta: { managerSource: "proxycurl", managerPhotoSource: photoSource },
    };
  }

  // Fallback: placeholder manager with AI headshot
  logger.debug("Using placeholder manager with AI headshot", { source: "enrichment", company });
  const { url: fallbackPhoto, source: fallbackPhotoSource } = await resolvePhoto(
    undefined,
    "Hiring Manager",
  );
  return {
    manager: {
      name: "Hiring Manager",
      title: `Engineering Manager at ${company}`,
      tagline: `Building the future at ${company}`,
      photo: fallbackPhoto,
    },
    meta: { managerSource: "placeholder", managerPhotoSource: fallbackPhotoSource },
  };
}

// ── HR enrichment ────────────────────────────────────────────────────

async function enrichHR(
  company: string,
): Promise<{ hr: HRContact; meta: Pick<EnrichmentMeta, "hrSource" | "hrPhotoSource" | "emailSource"> }> {
  const person = await searchLinkedIn(
    company,
    "recruiter|talent acquisition|people operations|hr manager|head of people",
  );

  let name = `${company} Recruiting`;
  let title = `Talent Acquisition at ${company}`;
  let photoUrl: string | undefined;
  let hrSource: EnrichmentSource = "placeholder";

  if (person?.profile) {
    const p = person.profile;
    name = p.full_name ?? name;
    title = p.headline ?? title;
    photoUrl = p.profile_pic_url;
    hrSource = "proxycurl";

    logger.info("Enriched HR via ProxyCurl", {
      source: "enrichment",
      company,
      name,
    });
  } else {
    logger.debug("Using placeholder HR", { source: "enrichment", company });
  }

  const { url: photo, source: photoSource } = await resolvePhoto(
    photoUrl,
    name,
  );

  // Resolve email — person lookup first, then company HR search
  let email: string | null = null;
  let emailSource: EnrichmentSource = "placeholder";

  if (hrSource === "proxycurl") {
    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    if (firstName && lastName) {
      email = await findPersonEmail(firstName, lastName, company);
      if (email) emailSource = "hunter";
    }
  }

  if (!email) {
    email = await findCompanyHREmail(company);
    emailSource = email.startsWith("careers@") || email.startsWith("recruiting@")
      ? "placeholder"
      : "hunter";
  }

  return {
    hr: { name, title, photo, email },
    meta: { hrSource, hrPhotoSource: photoSource, emailSource },
  };
}

// ── Main pipeline ────────────────────────────────────────────────────

export interface EnrichedJobCard extends JobCard {
  source: string;
  sourceUrl?: string;
  sourceId?: string;
  enrichmentMeta: EnrichmentMeta;
}

export async function enrichJob(rawJob: NormalizedJob): Promise<EnrichedJobCard> {
  logger.info("Starting enrichment", {
    source: "enrichment",
    company: rawJob.company,
    role: rawJob.role,
  });

  // 1. Company logo — multi-source enrichment with fallback chain
  const companyLogo = await getCompanyLogo(rawJob.company, rawJob.companyLogo);

  // 2. Parse description using the comprehensive parser
  const parsed = parseJobDescription(rawJob.description ?? "");

  // 3 & 4. Enrich people in parallel
  const [managerResult, hrResult] = await Promise.all([
    enrichManager(rawJob.company),
    enrichHR(rawJob.company),
  ]);

  const enrichmentMeta: EnrichmentMeta = {
    ...managerResult.meta,
    ...hrResult.meta,
    descriptionParsed:
      parsed.requirements.length > 0 ||
      parsed.benefits.length > 0 ||
      (parsed.culture?.length ?? 0) > 0,
  };

  logger.info("Enrichment complete", {
    source: "enrichment",
    company: rawJob.company,
    managerSource: enrichmentMeta.managerSource,
    hrSource: enrichmentMeta.hrSource,
    emailSource: enrichmentMeta.emailSource,
  });

  return {
    id: "", // assigned by Firestore on write
    company: rawJob.company,
    role: rawJob.role,
    location: rawJob.location,
    salary: rawJob.salary,
    tags: rawJob.tags,
    description: rawJob.description,
    requirements:
      rawJob.requirements && rawJob.requirements.length > 0
        ? rawJob.requirements
        : parsed.requirements,
    benefits:
      rawJob.benefits && rawJob.benefits.length > 0
        ? rawJob.benefits
        : parsed.benefits,
    companyLogo,
    teamSize: parsed.teamSize,
    culture: parsed.culture && parsed.culture.length > 0 ? parsed.culture : undefined,
    manager: managerResult.manager,
    hr: hrResult.hr,
    createdAt: rawJob.createdAt,
    source: rawJob.source ?? rawJob.sourceName ?? "unknown",
    sourceUrl: rawJob.sourceUrl,
    sourceId: rawJob.sourceId,
    enrichmentMeta,
  };
}

/**
 * Batch-enrich multiple jobs with concurrency control.
 * Limits parallel requests to avoid hitting API rate limits.
 */
export async function enrichJobs(
  rawJobs: NormalizedJob[],
  concurrency = 3,
): Promise<EnrichedJobCard[]> {
  const results: EnrichedJobCard[] = [];
  const queue = [...rawJobs];

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      try {
        const enriched = await enrichJob(job);
        results.push(enriched);
      } catch (err) {
        logger.error("Enrichment failed for job, using minimal fallback", {
          source: "enrichment",
          company: job.company,
          role: job.role,
          error: String(err),
        });
        // Produce a minimal card so we never lose a scraped job
        results.push({
          id: "",
          company: job.company,
          role: job.role,
          location: job.location,
          salary: job.salary,
          tags: job.tags,
          description: job.description,
          companyLogo: await getCompanyLogo(job.company, job.companyLogo),
          manager: {
            name: "Hiring Manager",
            title: `Engineering Manager at ${job.company}`,
            tagline: `Building the future at ${job.company}`,
            photo: uiAvatarUrl("HM", "4F46E5"),
          },
          hr: {
            name: `${job.company} Recruiting`,
            title: `Talent Acquisition at ${job.company}`,
            photo: uiAvatarUrl(job.company.slice(0, 2), "10B981"),
            email: `careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          },
          createdAt: job.createdAt,
          source: job.source ?? job.sourceName ?? "unknown",
          sourceUrl: job.sourceUrl,
          sourceId: job.sourceId,
          enrichmentMeta: {
            managerSource: "placeholder",
            hrSource: "placeholder",
            managerPhotoSource: "ui_avatars",
            hrPhotoSource: "ui_avatars",
            emailSource: "placeholder",
            descriptionParsed: false,
          },
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, rawJobs.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
