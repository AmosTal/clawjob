import { saveJob, unsaveJob } from "@/lib/db";
import { apiSuccess, requireAuth, handleError } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { jobId } = await params;
    await saveJob(user.uid, jobId);
    return apiSuccess({ saved: true }, 201);
  } catch (err) {
    return handleError(err, "POST /api/saved/[jobId]");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { jobId } = await params;
    await unsaveJob(user.uid, jobId);
    return apiSuccess({ unsaved: true });
  } catch (err) {
    return handleError(err, "DELETE /api/saved/[jobId]");
  }
}
