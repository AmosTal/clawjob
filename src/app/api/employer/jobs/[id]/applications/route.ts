import { getJobById, getJobApplications, updateApplicationStatus } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireEmployer,
  handleError,
} from "@/lib/api-utils";

const NO_CACHE = { "Cache-Control": "private, no-cache" };

const EMPLOYER_ALLOWED_STATUSES = new Set([
  "reviewing",
  "interview",
  "offer",
  "rejected",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const employer = await requireEmployer(request);
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return apiError("Job not found", "NOT_FOUND", 404);
    }

    if (job.employerId !== employer.uid) {
      return apiError("Forbidden", "FORBIDDEN", 403);
    }

    const applications = await getJobApplications(id);
    return apiSuccess(applications, 200, NO_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/employer/jobs/[id]/applications");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const employer = await requireEmployer(request);
    const { id: jobId } = await params;
    const body = await request.json();
    const { applicationId, status } = body as {
      applicationId?: string;
      status?: string;
    };

    if (!applicationId || !status) {
      return apiError(
        "applicationId and status are required",
        "VALIDATION_ERROR",
        400
      );
    }

    if (!EMPLOYER_ALLOWED_STATUSES.has(status)) {
      return apiError(
        `Invalid status. Allowed: ${[...EMPLOYER_ALLOWED_STATUSES].join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    // Verify this job belongs to the employer before letting updateApplicationStatus run
    const job = await getJobById(jobId);
    if (!job) {
      return apiError("Job not found", "NOT_FOUND", 404);
    }
    if (job.employerId !== employer.uid) {
      return apiError("Forbidden", "FORBIDDEN", 403);
    }

    await updateApplicationStatus(applicationId, status, employer.uid);
    return apiSuccess({ updated: true });
  } catch (err) {
    return handleError(
      err,
      "PATCH /api/employer/jobs/[id]/applications"
    );
  }
}
