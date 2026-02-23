/**
 * Async enrichment job queue backed by Firestore.
 *
 * Flow:
 *   1. Scraper writes jobs with enrichmentStatus = "pending"
 *   2. Cron endpoint (/api/cron/enrich) calls getNextEnrichmentBatch()
 *   3. Enrichment pipeline processes the batch
 *   4. Jobs updated via markJobEnriched() or markJobEnrichmentFailed()
 */

import { type Firestore, FieldValue } from "firebase-admin/firestore";
import type { NormalizedJob } from "../scrapers/types";
import type { JobCard } from "../types";
import { logger } from "../logger";

const JOBS_COLLECTION = "jobs";
const MAX_RETRIES = 3;

// ── Enqueue ─────────────────────────────────────────────────────────

export async function enqueueJobForEnrichment(
  jobId: string,
  db: Firestore,
): Promise<void> {
  await db.collection(JOBS_COLLECTION).doc(jobId).update({
    enrichmentStatus: "pending",
    enrichmentQueuedAt: FieldValue.serverTimestamp(),
    enrichmentRetries: 0,
  });

  logger.debug("Job queued for enrichment", {
    source: "enrichment-queue",
    jobId,
  });
}

// ── Fetch next batch ────────────────────────────────────────────────

export async function getNextEnrichmentBatch(
  db: Firestore,
  batchSize = 10,
): Promise<Array<{ id: string; data: NormalizedJob }>> {
  const jobsRef = db.collection(JOBS_COLLECTION);

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(
      jobsRef
        .where("enrichmentStatus", "==", "pending")
        .orderBy("enrichmentQueuedAt")
        .limit(batchSize),
    );

    if (snapshot.empty) return [];

    const batch: Array<{ id: string; data: NormalizedJob }> = [];

    for (const doc of snapshot.docs) {
      tx.update(doc.ref, {
        enrichmentStatus: "processing",
        enrichmentStartedAt: FieldValue.serverTimestamp(),
      });
      batch.push({ id: doc.id, data: doc.data() as NormalizedJob });
    }

    logger.info("Claimed enrichment batch", {
      source: "enrichment-queue",
      count: batch.length,
    });

    return batch;
  });
}

// ── Mark enriched ───────────────────────────────────────────────────

export async function markJobEnriched(
  jobId: string,
  enrichedData: Partial<JobCard>,
  db: Firestore,
): Promise<void> {
  await db
    .collection(JOBS_COLLECTION)
    .doc(jobId)
    .update({
      ...enrichedData,
      enrichmentStatus: "enriched",
      enrichedAt: FieldValue.serverTimestamp(),
      enrichmentError: FieldValue.delete(),
    });

  logger.info("Job enrichment complete", {
    source: "enrichment-queue",
    jobId,
  });
}

// ── Mark failed ─────────────────────────────────────────────────────

export async function markJobEnrichmentFailed(
  jobId: string,
  error: string,
  db: Firestore,
): Promise<void> {
  const docRef = db.collection(JOBS_COLLECTION).doc(jobId);

  // Use a transaction to atomically read retries and decide final status,
  // avoiding the read-then-write race condition in concurrent workers.
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const retries: number = (doc.data()?.enrichmentRetries ?? 0) + 1;
    const status = retries >= MAX_RETRIES ? "failed_permanent" : "failed";

    tx.update(docRef, {
      enrichmentStatus: status,
      enrichmentError: error,
      enrichmentRetries: retries,
      enrichmentFailedAt: FieldValue.serverTimestamp(),
    });

    logger.warn("Job enrichment failed", {
      source: "enrichment-queue",
      jobId,
      retries,
      permanent: status === "failed_permanent",
      error,
    });
  });
}

// ── Queue all unenriched ─────────────────────────────────────────────

/** Queue all jobs that have no enrichmentStatus (newly seeded). */
export async function queueAllUnenrichedJobs(
  db: Firestore,
): Promise<number> {
  // Firestore doesn't support "field not exists" queries,
  // so we fetch all jobs and filter in memory.
  const snapshot = await db
    .collection(JOBS_COLLECTION)
    .select("enrichmentStatus")
    .get();

  const unenriched = snapshot.docs.filter(
    (doc) => !doc.data().enrichmentStatus,
  );

  if (unenriched.length === 0) return 0;

  // Firestore batches limited to 500 writes
  for (let i = 0; i < unenriched.length; i += 500) {
    const chunk = unenriched.slice(i, i + 500);
    const batch = db.batch();
    for (const doc of chunk) {
      batch.update(doc.ref, {
        enrichmentStatus: "pending",
        enrichmentQueuedAt: FieldValue.serverTimestamp(),
        enrichmentRetries: 0,
      });
    }
    await batch.commit();
  }

  logger.info("Queued all unenriched jobs", {
    source: "enrichment-queue",
    count: unenriched.length,
  });

  return unenriched.length;
}

// ── Reset failed ─────────────────────────────────────────────────────

/** Reset all "failed" jobs back to "pending" for retry. */
export async function resetFailedJobs(db: Firestore): Promise<number> {
  const snapshot = await db
    .collection(JOBS_COLLECTION)
    .where("enrichmentStatus", "==", "failed")
    .select()
    .get();

  if (snapshot.empty) return 0;

  for (let i = 0; i < snapshot.docs.length; i += 500) {
    const chunk = snapshot.docs.slice(i, i + 500);
    const batch = db.batch();
    for (const doc of chunk) {
      batch.update(doc.ref, {
        enrichmentStatus: "pending",
        enrichmentQueuedAt: FieldValue.serverTimestamp(),
        enrichmentRetries: 0,
        enrichmentError: FieldValue.delete(),
      });
    }
    await batch.commit();
  }

  logger.info("Reset failed jobs to pending", {
    source: "enrichment-queue",
    count: snapshot.size,
  });

  return snapshot.size;
}

// ── Stuck jobs ───────────────────────────────────────────────────────

export interface StuckJob {
  id: string;
  company: string;
  role: string;
  enrichmentStatus: string;
}

/** Find jobs stuck in "processing" (likely from a crashed run). */
export async function getStuckJobs(db: Firestore): Promise<StuckJob[]> {
  const snapshot = await db
    .collection(JOBS_COLLECTION)
    .where("enrichmentStatus", "==", "processing")
    .select("company", "role", "enrichmentStatus")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    company: doc.data().company as string,
    role: doc.data().role as string,
    enrichmentStatus: doc.data().enrichmentStatus as string,
  }));
}

// ── Stats ───────────────────────────────────────────────────────────

export interface EnrichmentStats {
  pending: number;
  processing: number;
  enriched: number;
  failed: number;
  failedPermanent: number;
}

export async function getEnrichmentStats(
  db: Firestore,
): Promise<EnrichmentStats> {
  const statuses = [
    "pending",
    "processing",
    "enriched",
    "failed",
    "failed_permanent",
  ] as const;

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const snapshot = await db
        .collection(JOBS_COLLECTION)
        .where("enrichmentStatus", "==", status)
        .count()
        .get();
      return snapshot.data().count;
    }),
  );

  return {
    pending: counts[0],
    processing: counts[1],
    enriched: counts[2],
    failed: counts[3],
    failedPermanent: counts[4],
  };
}
