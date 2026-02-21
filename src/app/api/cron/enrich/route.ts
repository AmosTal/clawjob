import { adminDb } from "@/lib/firebase-admin";
import { enrichJob } from "@/lib/enrichment";
import {
  getNextEnrichmentBatch,
  markJobEnriched,
  markJobEnrichmentFailed,
} from "@/lib/enrichment/queue";
import { apiSuccess, apiError, handleError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/cron/enrich";
const BATCH_SIZE = 10;

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error("CRON_SECRET not configured", { route: ROUTE });
      return apiError("Server misconfiguration", "INTERNAL_ERROR", 500);
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    logger.info("Starting enrichment cron", { route: ROUTE });

    // Get next batch of pending jobs (atomically marks them as "processing")
    const batch = await getNextEnrichmentBatch(adminDb, BATCH_SIZE);

    if (batch.length === 0) {
      logger.info("No pending enrichment jobs", { route: ROUTE });
      return apiSuccess({ processed: 0, enriched: 0, failed: 0, remaining: 0 });
    }

    let enriched = 0;
    let failed = 0;

    // Process each job individually — failures don't block the batch
    for (const { id, data } of batch) {
      try {
        const enrichedJob = await enrichJob(data);

        // Write enriched fields back to the same job doc
        await markJobEnriched(
          id,
          {
            company: enrichedJob.company,
            role: enrichedJob.role,
            location: enrichedJob.location,
            salary: enrichedJob.salary,
            tags: enrichedJob.tags,
            description: enrichedJob.description,
            requirements: enrichedJob.requirements,
            benefits: enrichedJob.benefits,
            companyLogo: enrichedJob.companyLogo,
            teamSize: enrichedJob.teamSize,
            culture: enrichedJob.culture,
            manager: enrichedJob.manager,
            hr: enrichedJob.hr,
          },
          adminDb,
        );

        enriched++;
        logger.info("Job enriched successfully", {
          route: ROUTE,
          jobId: id,
          company: data.company,
          role: data.role,
        });
      } catch (err) {
        failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);

        await markJobEnrichmentFailed(id, errorMessage, adminDb);

        logger.error("Job enrichment failed", {
          route: ROUTE,
          jobId: id,
          company: data.company,
          role: data.role,
          error: errorMessage,
        });
      }
    }

    // Count remaining pending jobs
    const remainingSnap = await adminDb
      .collection("jobs")
      .where("enrichmentStatus", "in", ["pending", "failed"])
      .count()
      .get();

    const stats = {
      processed: batch.length,
      enriched,
      failed,
      remaining: remainingSnap.data().count,
    };

    logger.info("Enrichment cron complete", { route: ROUTE, ...stats });
    return apiSuccess(stats);
  } catch (err) {
    return handleError(err, ROUTE);
  }
}
