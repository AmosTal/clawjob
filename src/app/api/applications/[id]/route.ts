import { withdrawApplication } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    if (body.status === "withdrawn") {
      await withdrawApplication(id, user.uid);
      return apiSuccess({ withdrawn: true });
    }

    return apiError("Invalid status update", "VALIDATION_ERROR", 400);
  } catch (err) {
    return handleError(err, "PATCH /api/applications/[id]");
  }
}
