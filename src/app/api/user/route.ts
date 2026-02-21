import { getUser, updateUser, createOrUpdateUser } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";
import {
  validateString,
  validateEnum,
  validateURL,
  LIMITS,
} from "@/lib/validation";

const NO_CACHE = { "Cache-Control": "private, no-cache" };

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const email = validateString(body.email, LIMITS.email) ?? user.email;
    const name = validateString(body.displayName ?? body.name, LIMITS.name) ?? "";
    const photoURL = validateURL(body.photoURL) ?? undefined;

    await createOrUpdateUser(user.uid, { email, name, photoURL });
    return apiSuccess({ ok: true });
  } catch (err) {
    return handleError(err, "POST /api/user");
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const profile = await getUser(user.uid);
    if (!profile) {
      return apiError("User not found", "NOT_FOUND", 404);
    }
    return apiSuccess(profile, 200, NO_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/user");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const updates: Record<string, string | boolean> = {};

    if (body.name !== undefined) {
      const name = validateString(body.name, LIMITS.name);
      if (name !== null) updates.name = name;
    }
    if (body.bio !== undefined) {
      const bio = validateString(body.bio, LIMITS.bio);
      if (bio !== null) updates.bio = bio;
    }
    if (body.resumeURL !== undefined) {
      const url = validateURL(body.resumeURL);
      if (url !== null) updates.resumeURL = url;
      else updates.resumeURL = ""; // Allow clearing
    }
    if (body.resumeFileName !== undefined) {
      const fn = validateString(body.resumeFileName, LIMITS.fileName);
      if (fn !== null) updates.resumeFileName = fn;
    }
    if (body.role !== undefined) {
      const role = validateEnum(body.role, ["seeker", "employer"] as const);
      if (role) updates.role = role;
    }
    if (typeof body.quickApply === "boolean") {
      updates.quickApply = body.quickApply;
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", "VALIDATION_ERROR", 400);
    }

    await updateUser(user.uid, updates);
    const profile = await getUser(user.uid);
    return apiSuccess(profile);
  } catch (err) {
    return handleError(err, "PATCH /api/user");
  }
}
