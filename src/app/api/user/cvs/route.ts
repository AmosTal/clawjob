import { getCVVersions, addCVVersion } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
} from "@/lib/api-utils";
import { validateString, validateURL, sanitizeFilename, LIMITS } from "@/lib/validation";

const NO_CACHE = { "Cache-Control": "private, no-cache" };

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const cvs = await getCVVersions(user.uid);
    return apiSuccess(cvs, 200, NO_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/user/cvs");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const name = validateString(body.name, LIMITS.cvName);
    const fileName = typeof body.fileName === "string"
      ? sanitizeFilename(body.fileName, LIMITS.fileName)
      : null;
    const url = validateURL(body.url);

    if (!name || !fileName || !url) {
      return apiError(
        "name, fileName, and url are required",
        "VALIDATION_ERROR",
        400
      );
    }

    const cv = await addCVVersion(user.uid, { name, fileName, url });
    return apiSuccess(cv, 201);
  } catch (err) {
    return handleError(err, "POST /api/user/cvs");
  }
}
