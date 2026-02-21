import { getJobsForListing } from "@/lib/db";
import { apiSuccess, handleError, MAX_PAGE_SIZE } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? 20), 1),
      MAX_PAGE_SIZE
    );
    const startAfter = searchParams.get("startAfter") ?? undefined;

    const jobs = await getJobsForListing(limit, startAfter);
    return apiSuccess(jobs, 200, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (err) {
    return handleError(err, "GET /api/jobs");
  }
}
