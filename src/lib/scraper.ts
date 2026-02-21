import type { JobCard } from "./types";
import type { NormalizedJob } from "./scrapers";
import type { ScrapeResult } from "./scrapers/types";
import { runAllAdapters } from "./scrapers";
import { logger } from "./logger";

// Re-export ScrapeResult so the cron route can still import it from here
export type { ScrapeResult };

// ── Placeholder manager/HR generators ────────────────────────────────
// These produce placeholder data. The enrichment pipeline (src/lib/enrichment/)
// will later replace these with real people data from LinkedIn/Hunter/etc.

function generateManager(company: string): JobCard["manager"] {
  return {
    name: "Hiring Manager",
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

// ── Enrichment hook ──────────────────────────────────────────────────
// Try to import the enrichment pipeline. If it doesn't exist yet, fall back
// to a no-op so the scraper still works without it.

let enrichJob: (job: NormalizedJob) => Promise<NormalizedJob> = async (j) => j;

try {
  // Dynamic require so build doesn't fail if enrichment module isn't created yet
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("./enrichment");
  if (typeof mod.enrichJob === "function") {
    enrichJob = mod.enrichJob;
  }
} catch {
  // enrichment module not available yet — no-op is fine
}

// ── Convert NormalizedJob to Firestore document ──────────────────────

function toJobDocument(job: NormalizedJob): Omit<JobCard, "id"> & {
  source: string;
  sourceName: string;
  sourceUrl?: string;
  sourceId?: string;
  enrichmentStatus?: string;
} {
  return {
    company: job.company,
    role: job.role,
    location: job.location,
    salary: job.salary,
    tags: job.tags,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    companyLogo: job.companyLogo,
    createdAt: job.createdAt || new Date().toISOString(),
    manager: job.manager ?? generateManager(job.company),
    hr: job.hr ?? generateHR(job.company),
    source: job.sourceName ?? job.source ?? "unknown",
    sourceName: job.sourceName ?? job.source ?? "unknown",
    sourceUrl: job.sourceUrl,
    sourceId: job.sourceId,
    enrichmentStatus: job.enrichmentStatus ?? "pending",
  };
}

// ── Main orchestrator ────────────────────────────────────────────────

/**
 * Scrape jobs from all configured external adapters and write new ones to
 * Firestore. Accepts a Firestore instance so it works from both the API
 * route and CLI scripts.
 *
 * Pipeline:
 *   1. Run all adapters in parallel (adapter errors are isolated)
 *   2. Merge results from every source
 *   3. Deduplicate across sources AND against existing Firestore jobs (last 30 days)
 *   4. Enrich each new job (fill in missing manager/HR data)
 *   5. Batch write to Firestore
 *   6. Return stats
 */
export async function scrapeJobs(
  db: FirebaseFirestore.Firestore
): Promise<ScrapeResult> {
  const errors: string[] = [];
  const bySource: Record<string, number> = {};

  // ── 1. Run all adapters ───────────────────────────────────────────
  const adapterResults = await runAllAdapters();

  const allJobs: NormalizedJob[] = [];
  for (const result of adapterResults) {
    allJobs.push(...result.jobs);
    if (result.jobs.length === 0) {
      errors.push(`${result.source}: returned 0 jobs`);
    }
  }
  logger.info("Total fetched from all sources", {
    totalFetched: allJobs.length,
  });

  if (allJobs.length === 0) {
    return { fetched: 0, newJobs: 0, duplicates: 0, errors, bySource };
  }

  // ── 2. Deduplicate against existing Firestore jobs ────────────────
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

  // Also deduplicate within the batch itself (across sources)
  const seenKeys = new Set<string>();
  const uniqueJobs: NormalizedJob[] = [];

  for (const job of allJobs) {
    const key = `${job.company.toLowerCase()}|${job.role.toLowerCase()}|${job.location.toLowerCase()}`;
    if (existingKeys.has(key) || seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    uniqueJobs.push(job);
  }

  const duplicates = allJobs.length - uniqueJobs.length;
  logger.info("Deduplication complete", {
    newJobs: uniqueJobs.length,
    duplicates,
  });

  // ── 3. Enrich each job ────────────────────────────────────────────
  const enriched: NormalizedJob[] = [];
  for (const job of uniqueJobs) {
    try {
      enriched.push(await enrichJob(job));
    } catch (err) {
      logger.warn("Enrichment failed for job, using raw data", {
        company: job.company,
        role: job.role,
        error: String(err),
      });
      enriched.push(job);
    }
  }

  // ── 4. Batch write to Firestore ───────────────────────────────────
  const BATCH_SIZE = 500;
  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = enriched.slice(i, i + BATCH_SIZE);
    for (const job of chunk) {
      const ref = jobsCol.doc();
      batch.set(ref, { ...toJobDocument(job), id: ref.id });
    }
    await batch.commit();
    logger.info("Wrote batch to Firestore", {
      batch: Math.floor(i / BATCH_SIZE) + 1,
      count: chunk.length,
    });
  }

  // Track per-source new job counts
  for (const job of enriched) {
    const src = job.sourceName ?? job.source ?? "unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  return {
    fetched: allJobs.length,
    newJobs: enriched.length,
    duplicates,
    errors,
    bySource,
  };
}
