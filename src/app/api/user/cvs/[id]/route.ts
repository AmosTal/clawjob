import { deleteCVVersion, setDefaultCV, updateCVVersion } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";
import { validateString, LIMITS } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    await deleteCVVersion(user.uid, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleError(err, "DELETE /api/user/cvs/[id]");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    if (body.isDefault === true) {
      await setDefaultCV(user.uid, id);
    }

    const sanitizedName = validateString(body.name, LIMITS.cvName);
    if (sanitizedName) {
      await updateCVVersion(user.uid, id, { name: sanitizedName });
    }

    if (body.isDefault !== true && !sanitizedName) {
      return apiError("No valid update fields", "VALIDATION_ERROR", 400);
    }

    return apiSuccess({ updated: true });
  } catch (err) {
    return handleError(err, "PATCH /api/user/cvs/[id]");
  }
}
