import { adminDb } from "@/lib/firebase-admin";
import { scrapeJobs } from "@/lib/scraper";
import { apiSuccess, apiError, handleError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error("CRON_SECRET not configured", { route: "POST /api/cron/scrape" });
      return apiError(
        "Server misconfiguration",
        "INTERNAL_ERROR",
        500
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    logger.info("Starting scrape", { route: "POST /api/cron/scrape" });
    const result = await scrapeJobs(adminDb);
    logger.info("Scrape complete", { route: "POST /api/cron/scrape", ...result });

    return apiSuccess(result);
  } catch (err) {
    return handleError(err, "POST /api/cron/scrape");
  }
}
