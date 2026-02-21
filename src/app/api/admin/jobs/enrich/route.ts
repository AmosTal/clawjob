import { adminDb } from "@/lib/firebase-admin";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  handleError,
} from "@/lib/api-utils";
import {
  getEnrichmentStats,
  getStuckJobs,
  enqueueJobForEnrichment,
  queueAllUnenrichedJobs,
  resetFailedJobs,
} from "@/lib/enrichment/queue";

/**
 * GET /api/admin/jobs/enrich
 *
 * Returns current enrichment queue stats and any stuck jobs.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const [stats, stuck] = await Promise.all([
      getEnrichmentStats(adminDb),
      getStuckJobs(adminDb),
    ]);

    return apiSuccess({
      stats,
      stuck,
    });
  } catch (err) {
    return handleError(err, "GET /api/admin/jobs/enrich");
  }
}

/**
 * POST /api/admin/jobs/enrich
 *
 * Trigger enrichment actions:
 *   { jobId: string }  — enrich a specific job immediately
 *   { all: true }      — queue ALL unenriched jobs
 *   { reset: true }    — reset all "failed" jobs back to "pending"
 */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    // Option A: Enrich a specific job
    if (body.jobId && typeof body.jobId === "string") {
      const jobDoc = await adminDb.collection("jobs").doc(body.jobId).get();
      if (!jobDoc.exists) {
        return apiError("Job not found", "NOT_FOUND", 404);
      }

      await enqueueJobForEnrichment(body.jobId, adminDb);
      const stats = await getEnrichmentStats(adminDb);

      return apiSuccess({
        action: "enqueue_single",
        jobId: body.jobId,
        stats,
      });
    }

    // Option B: Queue all unenriched jobs
    if (body.all === true) {
      const queued = await queueAllUnenrichedJobs(adminDb);
      const stats = await getEnrichmentStats(adminDb);

      return apiSuccess({
        action: "enqueue_all",
        queued,
        stats,
      });
    }

    // Option C: Reset failed jobs back to pending
    if (body.reset === true) {
      const resetCount = await resetFailedJobs(adminDb);
      const stats = await getEnrichmentStats(adminDb);

      return apiSuccess({
        action: "reset_failed",
        reset: resetCount,
        stats,
      });
    }

    return apiError(
      "Invalid request body. Provide { jobId }, { all: true }, or { reset: true }",
      "VALIDATION_ERROR",
      400
    );
  } catch (err) {
    return handleError(err, "POST /api/admin/jobs/enrich");
  }
}
