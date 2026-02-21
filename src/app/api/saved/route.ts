import { getSavedJobs, saveJob } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const savedIds = await getSavedJobs(user.uid);
    return apiSuccess(savedIds, 200, {
      "Cache-Control": "private, no-cache",
    });
  } catch (err) {
    return handleError(err, "GET /api/saved");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { jobId } = body as { jobId?: string };

    if (!jobId) {
      return apiError("jobId is required", "VALIDATION_ERROR", 400);
    }

    await saveJob(user.uid, jobId);
    return apiSuccess({ saved: true }, 201);
  } catch (err) {
    return handleError(err, "POST /api/saved");
  }
}
