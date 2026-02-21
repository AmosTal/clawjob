import { adminDb } from "@/lib/firebase-admin";
import { getAllJobs } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireAdmin,
  parsePageParams,
  handleError,
} from "@/lib/api-utils";
import {
  validateString,
  validateStringArray,
  validateURL,
  sanitizeString,
  LIMITS,
} from "@/lib/validation";

const ADMIN_CACHE = { "Cache-Control": "private, s-maxage=30" };

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { limit, offset } = parsePageParams(
      new URL(request.url).searchParams
    );

    const result = await getAllJobs(limit, offset);
    return apiSuccess(
      {
        ...result,
        pagination: { total: result.total, limit, offset },
      },
      200,
      ADMIN_CACHE
    );
  } catch (err) {
    return handleError(err, "GET /api/admin/jobs");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    // Validate required fields
    const role = validateString(body.role, LIMITS.title);
    const company = validateString(body.company, LIMITS.company);
    const location = validateString(body.location, LIMITS.location);

    if (!role || !company || !location) {
      return apiError(
        "Missing required fields: role, company, location",
        "VALIDATION_ERROR",
        400
      );
    }

    // Build a sanitized job object — never spread raw body
    const salary = validateString(body.salary, LIMITS.salary) ?? undefined;
    const description = validateString(body.description, LIMITS.description) ?? undefined;
    const requirements = validateStringArray(body.requirements, LIMITS.maxRequirements, LIMITS.requirement);
    const benefits = validateStringArray(body.benefits, LIMITS.maxBenefits, LIMITS.benefit);
    const tags = validateStringArray(body.tags, LIMITS.maxTags, LIMITS.tag);
    const culture = validateStringArray(body.culture, LIMITS.maxCulture, LIMITS.culture);
    const teamSize = validateString(body.teamSize, LIMITS.teamSize) ?? undefined;
    const companyLogo = validateURL(body.companyLogo) ?? undefined;

    const manager = body.manager && typeof body.manager === "object"
      ? {
          name: sanitizeString(body.manager.name ?? "").slice(0, LIMITS.name),
          title: sanitizeString(body.manager.title ?? "").slice(0, LIMITS.title),
          tagline: sanitizeString(body.manager.tagline ?? "").slice(0, LIMITS.tagline),
          photo: validateURL(body.manager.photo) ?? "",
        }
      : { name: "", title: "", tagline: "", photo: "" };

    const hr = body.hr && typeof body.hr === "object"
      ? {
          name: sanitizeString(body.hr.name ?? "").slice(0, LIMITS.name),
          title: sanitizeString(body.hr.title ?? "").slice(0, LIMITS.title),
          photo: validateURL(body.hr.photo) ?? "",
          email: sanitizeString(body.hr.email ?? "").slice(0, LIMITS.email),
        }
      : { name: "", title: "", photo: "", email: "" };

    const docRef = adminDb.collection("jobs").doc();
    const job = {
      id: docRef.id,
      role,
      company,
      location,
      salary,
      description,
      requirements,
      benefits,
      tags,
      manager,
      hr,
      teamSize,
      culture,
      companyLogo,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(job);

    return apiSuccess(job, 201);
  } catch (err) {
    return handleError(err, "POST /api/admin/jobs");
  }
}
