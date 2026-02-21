import { getUserApplications, createApplication, getUser } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";
import { validateString, LIMITS } from "@/lib/validation";

const NO_CACHE = { "Cache-Control": "private, no-cache" };

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const apps = await getUserApplications(user.uid);
    return apiSuccess(apps, 200, NO_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/applications");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    // Verify user is a seeker
    const profile = await getUser(user.uid);
    if (profile?.role === "employer") {
      return apiError(
        "Employers cannot apply for jobs",
        "FORBIDDEN",
        403
      );
    }

    const body = await request.json();
    const { jobId, message, resumeVersionId } = body as {
      jobId?: string;
      message?: string;
      resumeVersionId?: string;
    };

    if (!jobId || typeof jobId !== "string") {
      return apiError("jobId is required", "VALIDATION_ERROR", 400);
    }

    // Sanitize and limit message length
    const sanitizedMessage = message
      ? validateString(message, LIMITS.message) ?? undefined
      : undefined;

    // Validate resumeVersionId is a string if provided
    const safeResumeVersionId =
      typeof resumeVersionId === "string" ? resumeVersionId.slice(0, 128) : undefined;

    const appId = await createApplication(
      user.uid,
      jobId,
      sanitizedMessage,
      safeResumeVersionId
    );
    return apiSuccess({ id: appId }, 201);
  } catch (err) {
    return handleError(err, "POST /api/applications");
  }
}
