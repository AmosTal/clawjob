import { adminDb } from "@/lib/firebase-admin";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  handleError,
} from "@/lib/api-utils";
import {
  validateString,
  validateStringArray,
  validateURL,
  sanitizeString,
  LIMITS,
} from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const docRef = adminDb.collection("jobs").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return apiError("Job not found", "NOT_FOUND", 404);
    }

    // Whitelist and sanitize allowed fields — never pass raw body to Firestore
    const updates: Record<string, unknown> = {};

    if (body.role !== undefined) {
      updates.role = validateString(body.role, LIMITS.title);
    }
    if (body.company !== undefined) {
      updates.company = validateString(body.company, LIMITS.company);
    }
    if (body.location !== undefined) {
      updates.location = validateString(body.location, LIMITS.location);
    }
    if (body.salary !== undefined) {
      updates.salary = validateString(body.salary, LIMITS.salary);
    }
    if (body.description !== undefined) {
      updates.description = validateString(body.description, LIMITS.description);
    }
    if (body.teamSize !== undefined) {
      updates.teamSize = validateString(body.teamSize, LIMITS.teamSize);
    }
    if (body.companyLogo !== undefined) {
      updates.companyLogo = validateURL(body.companyLogo);
    }
    if (body.requirements !== undefined) {
      updates.requirements = validateStringArray(body.requirements, LIMITS.maxRequirements, LIMITS.requirement);
    }
    if (body.benefits !== undefined) {
      updates.benefits = validateStringArray(body.benefits, LIMITS.maxBenefits, LIMITS.benefit);
    }
    if (body.tags !== undefined) {
      updates.tags = validateStringArray(body.tags, LIMITS.maxTags, LIMITS.tag);
    }
    if (body.culture !== undefined) {
      updates.culture = validateStringArray(body.culture, LIMITS.maxCulture, LIMITS.culture);
    }
    if (body.status !== undefined) {
      // Admin can set job status
      const s = validateString(body.status, 20);
      if (s) updates.status = s;
    }
    if (body.manager !== undefined && typeof body.manager === "object") {
      updates.manager = {
        name: sanitizeString(body.manager.name ?? "").slice(0, LIMITS.name),
        title: sanitizeString(body.manager.title ?? "").slice(0, LIMITS.title),
        tagline: sanitizeString(body.manager.tagline ?? "").slice(0, LIMITS.tagline),
        photo: validateURL(body.manager.photo) ?? "",
      };
    }
    if (body.hr !== undefined && typeof body.hr === "object") {
      updates.hr = {
        name: sanitizeString(body.hr.name ?? "").slice(0, LIMITS.name),
        title: sanitizeString(body.hr.title ?? "").slice(0, LIMITS.title),
        photo: validateURL(body.hr.photo) ?? "",
        email: sanitizeString(body.hr.email ?? "").slice(0, LIMITS.email),
      };
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid fields to update", "VALIDATION_ERROR", 400);
    }

    await docRef.update(updates);
    const updated = await docRef.get();
    return apiSuccess({ id, ...updated.data() });
  } catch (err) {
    return handleError(err, "PUT /api/admin/jobs/[id]");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const docRef = adminDb.collection("jobs").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return apiError("Job not found", "NOT_FOUND", 404);
    }

    await docRef.update({ status: "inactive" });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleError(err, "DELETE /api/admin/jobs/[id]");
  }
}
