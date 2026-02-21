import { createJob, getEmployerJobs } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  requireEmployer,
  handleError,
} from "@/lib/api-utils";
import {
  validateString,
  validateStringArray,
  validateURL,
  sanitizeString,
  LIMITS,
} from "@/lib/validation";

const NO_CACHE = { "Cache-Control": "private, no-cache" };

export async function GET(request: Request) {
  try {
    const employer = await requireEmployer(request);
    const jobs = await getEmployerJobs(employer.uid);
    return apiSuccess(jobs, 200, NO_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/employer/jobs");
  }
}

export async function POST(request: Request) {
  try {
    const employer = await requireEmployer(request);
    const body = await request.json();

    // Validate required fields
    const role = validateString(body.role, LIMITS.title);
    const company = validateString(body.company, LIMITS.company);
    const location = validateString(body.location, LIMITS.location);

    if (!role || !company || !location) {
      return apiError(
        "role, company, and location are required",
        "VALIDATION_ERROR",
        400
      );
    }

    // Validate optional fields
    const salary = validateString(body.salary, LIMITS.salary) ?? undefined;
    const description = validateString(body.description, LIMITS.description) ?? undefined;
    const requirements = validateStringArray(body.requirements, LIMITS.maxRequirements, LIMITS.requirement);
    const benefits = validateStringArray(body.benefits, LIMITS.maxBenefits, LIMITS.benefit);
    const tags = validateStringArray(body.tags, LIMITS.maxTags, LIMITS.tag);
    const culture = validateStringArray(body.culture, LIMITS.maxCulture, LIMITS.culture);
    const teamSize = validateString(body.teamSize, LIMITS.teamSize) ?? undefined;
    const companyLogo = validateURL(body.companyLogo) ?? undefined;

    // Validate nested manager object
    const manager = body.manager && typeof body.manager === "object"
      ? {
          name: sanitizeString(body.manager.name ?? "").slice(0, LIMITS.name),
          title: sanitizeString(body.manager.title ?? "").slice(0, LIMITS.title),
          tagline: sanitizeString(body.manager.tagline ?? "").slice(0, LIMITS.tagline),
          photo: validateURL(body.manager.photo) ?? "",
        }
      : { name: "", title: "", tagline: "", photo: "" };

    // Validate nested hr object
    const hr = body.hr && typeof body.hr === "object"
      ? {
          name: sanitizeString(body.hr.name ?? "").slice(0, LIMITS.name),
          title: sanitizeString(body.hr.title ?? "").slice(0, LIMITS.title),
          photo: validateURL(body.hr.photo) ?? "",
          email: sanitizeString(body.hr.email ?? "").slice(0, LIMITS.email),
        }
      : { name: "", title: "", photo: "", email: "" };

    const id = await createJob(employer.uid, {
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
    });

    return apiSuccess({ id }, 201);
  } catch (err) {
    return handleError(err, "POST /api/employer/jobs");
  }
}
