import { getJobById } from "@/lib/db";
import { apiSuccess, apiError, handleError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) {
      return apiError("Job not found", "NOT_FOUND", 404);
    }
    return apiSuccess(job, 200, {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    });
  } catch (err) {
    return handleError(err, "GET /api/jobs/[id]");
  }
}
