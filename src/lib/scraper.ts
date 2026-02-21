import type { JobCard } from "./types";
import { logger } from "./logger";

// ── Types for external API responses ────────────────────────────────

interface RemoteOKJob {
  id: string;
  slug: string;
  company: string;
  company_logo: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  date: string;
  url: string;
}

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  tags: string[];
  job_types: string[];
  location: string;
  remote: boolean;
  url: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function clearbitLogo(company: string): string {
  const domain = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .concat(".com");
  return `https://logo.clearbit.com/${domain}`;
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function generateManager(company: string): JobCard["manager"] {
  return {
    name: `Hiring Manager`,
    title: `Engineering Manager at ${company}`,
    tagline: `Building the future at ${company}`,
    photo: `https://ui-avatars.com/api/?name=HM&background=4F46E5&color=fff&size=128`,
  };
}

function generateHR(company: string): JobCard["hr"] {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    name: `${company} Recruiting`,
    title: `Talent Acquisition at ${company}`,
    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.slice(0, 2))}&background=10B981&color=fff&size=128`,
    email: `careers@${slug}.com`,
  };
}

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

// ── Fetchers ────────────────────────────────────────────────────────

async function fetchRemoteOK(): Promise<Omit<JobCard, "id">[]> {
  logger.info("Fetching from RemoteOK", { source: "remoteok" });
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "ClawJob/1.0 (job-aggregator)" },
    });
    if (!res.ok) {
      logger.error("RemoteOK returned non-OK status", { source: "remoteok", status: res.status });
      return [];
    }
    const raw: unknown[] = await res.json();
    // First element is a metadata/legal notice object, skip it
    const jobs = raw.slice(1) as RemoteOKJob[];
    logger.info("RemoteOK fetch complete", { source: "remoteok", count: jobs.length });

    return jobs
      .filter((j) => j.company && j.position)
      .slice(0, 50)
      .map((j) => ({
        company: j.company,
        role: j.position,
        location: j.location || "Remote",
        salary: formatSalary(j.salary_min, j.salary_max),
        tags: (j.tags ?? []).slice(0, 6),
        description: truncate(stripHTML(j.description ?? ""), 1500),
        companyLogo: j.company_logo || clearbitLogo(j.company),
        manager: generateManager(j.company),
        hr: generateHR(j.company),
        createdAt: j.date || new Date().toISOString(),
        source: "remoteok",
      }));
  } catch (err) {
    logger.error("RemoteOK fetch failed", { source: "remoteok", error: String(err) });
    return [];
  }
}

async function fetchArbeitnow(): Promise<Omit<JobCard, "id">[]> {
  logger.info("Fetching from Arbeitnow", { source: "arbeitnow" });
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) {
      logger.error("Arbeitnow returned non-OK status", { source: "arbeitnow", status: res.status });
      return [];
    }
    const data: ArbeitnowResponse = await res.json();
    const jobs = data.data ?? [];
    logger.info("Arbeitnow fetch complete", { source: "arbeitnow", count: jobs.length });

    return jobs
      .filter((j) => j.company_name && j.title)
      .slice(0, 50)
      .map((j) => ({
        company: j.company_name,
        role: j.title,
        location: j.remote ? `${j.location || "Remote"} (Remote)` : (j.location || "Unknown"),
        tags: (j.tags ?? []).slice(0, 6),
        description: truncate(stripHTML(j.description ?? ""), 1500),
        companyLogo: clearbitLogo(j.company_name),
        manager: generateManager(j.company_name),
        hr: generateHR(j.company_name),
        createdAt: j.created_at
          ? new Date(j.created_at * 1000).toISOString()
          : new Date().toISOString(),
        source: "arbeitnow",
      }));
  } catch (err) {
    logger.error("Arbeitnow fetch failed", { source: "arbeitnow", error: String(err) });
    return [];
  }
}

// ── Main scraper ────────────────────────────────────────────────────

export interface ScrapeResult {
  fetched: number;
  newJobs: number;
  duplicates: number;
  errors: string[];
}

/**
 * Scrape jobs from external APIs and write new ones to Firestore.
 * Accepts a Firestore instance so it can be used from both the API route
 * (via firebase-admin singleton) and the CLI script.
 */
export async function scrapeJobs(
  db: FirebaseFirestore.Firestore
): Promise<ScrapeResult> {
  const errors: string[] = [];

  // Fetch from all sources in parallel using Promise.allSettled
  // so one source failing never blocks the other
  const results = await Promise.allSettled([
    fetchRemoteOK(),
    fetchArbeitnow(),
  ]);

  const allJobs: Omit<JobCard, "id">[] = [];
  const sourceNames = ["RemoteOK", "Arbeitnow"];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    } else {
      errors.push(`${sourceNames[i]}: ${String(result.reason)}`);
    }
  }
  logger.info("Total fetched from all sources", { totalFetched: allJobs.length });

  if (allJobs.length === 0) {
    return { fetched: 0, newJobs: 0, duplicates: 0, errors };
  }

  // Deduplicate against existing jobs in Firestore.
  // Only check jobs from the last 30 days to avoid loading the entire collection.
  const jobsCol = db.collection("jobs");
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const existingSnap = await jobsCol
    .where("createdAt", ">=", thirtyDaysAgo)
    .select("company", "role", "location")
    .get();
  const existingKeys = new Set(
    existingSnap.docs.map((doc) => {
      const d = doc.data();
      return `${(d.company ?? "").toLowerCase()}|${(d.role ?? "").toLowerCase()}|${(d.location ?? "").toLowerCase()}`;
    })
  );

  // Also deduplicate within the batch itself
  const seenKeys = new Set<string>();
  const newJobs: Omit<JobCard, "id">[] = [];

  for (const job of allJobs) {
    const key = `${job.company.toLowerCase()}|${job.role.toLowerCase()}|${job.location.toLowerCase()}`;
    if (existingKeys.has(key) || seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    newJobs.push(job);
  }

  const duplicates = allJobs.length - newJobs.length;
  logger.info("Deduplication complete", { newJobs: newJobs.length, duplicates });

  // Write new jobs to Firestore in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  for (let i = 0; i < newJobs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = newJobs.slice(i, i + BATCH_SIZE);
    for (const job of chunk) {
      const ref = jobsCol.doc();
      batch.set(ref, { ...job, id: ref.id });
    }
    await batch.commit();
    logger.info("Wrote batch to Firestore", {
      batch: Math.floor(i / BATCH_SIZE) + 1,
      count: chunk.length,
    });
  }

  return {
    fetched: allJobs.length,
    newJobs: newJobs.length,
    duplicates,
    errors,
  };
}
