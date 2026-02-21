import type { Query } from "firebase-admin/firestore";
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
import { logger } from "@/lib/logger";

const jobsCol = adminDb.collection("jobs");

// ── POST — Bulk seed curated jobs ───────────────────────────────────

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    if (!Array.isArray(body.jobs) || body.jobs.length === 0) {
      return apiError(
        "Body must contain a non-empty 'jobs' array",
        "VALIDATION_ERROR",
        400
      );
    }

    if (body.jobs.length > 100) {
      return apiError(
        "Maximum 100 jobs per seed request",
        "VALIDATION_ERROR",
        400
      );
    }

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < body.jobs.length; i++) {
      const raw = body.jobs[i];
      try {
        const role = validateString(raw.role, LIMITS.title);
        const company = validateString(raw.company, LIMITS.company);
        const location = validateString(raw.location, LIMITS.location);

        if (!role || !company || !location) {
          errors.push(`Job[${i}]: missing required field (role, company, or location)`);
          continue;
        }

        const salary = validateString(raw.salary, LIMITS.salary) ?? undefined;
        const description = validateString(raw.description, LIMITS.description) ?? undefined;
        const requirements = validateStringArray(raw.requirements, LIMITS.maxRequirements, LIMITS.requirement);
        const benefits = validateStringArray(raw.benefits, LIMITS.maxBenefits, LIMITS.benefit);
        const tags = validateStringArray(raw.tags, LIMITS.maxTags, LIMITS.tag);
        const culture = validateStringArray(raw.culture, LIMITS.maxCulture, LIMITS.culture);
        const teamSize = validateString(raw.teamSize, LIMITS.teamSize) ?? undefined;
        const companyLogo = validateURL(raw.companyLogo) ?? undefined;

        const manager = raw.manager && typeof raw.manager === "object"
          ? {
              name: sanitizeString(raw.manager.name ?? "").slice(0, LIMITS.name),
              title: sanitizeString(raw.manager.title ?? "").slice(0, LIMITS.title),
              tagline: sanitizeString(raw.manager.tagline ?? "").slice(0, LIMITS.tagline),
              photo: validateURL(raw.manager.photo) ?? "",
            }
          : { name: "", title: "", tagline: "", photo: "" };

        const hr = raw.hr && typeof raw.hr === "object"
          ? {
              name: sanitizeString(raw.hr.name ?? "").slice(0, LIMITS.name),
              title: sanitizeString(raw.hr.title ?? "").slice(0, LIMITS.title),
              photo: validateURL(raw.hr.photo) ?? "",
              email: sanitizeString(raw.hr.email ?? "").slice(0, LIMITS.email),
            }
          : { name: "", title: "", photo: "", email: "" };

        const docRef = jobsCol.doc();
        await docRef.set({
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
          source: sanitizeString(raw.source ?? "manual-seed").slice(0, 100),
          enrichmentStatus: "pending",
          createdAt: new Date().toISOString(),
        });

        created++;
      } catch (jobErr) {
        const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
        errors.push(`Job[${i}]: ${msg}`);
      }
    }

    logger.info("Admin seed jobs", {
      userId: admin.uid,
      email: admin.email,
      created,
      errorCount: errors.length,
      totalSubmitted: body.jobs.length,
    });

    return apiSuccess({ created, errors }, 201);
  } catch (err) {
    return handleError(err, "POST /api/admin/jobs/seed");
  }
}

// ── GET — Job stats for monitoring ──────────────────────────────────

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);

    const allJobsSnap = await jobsCol.select("source", "enrichmentStatus").get();
    const total = allJobsSnap.size;

    const bySource: Record<string, number> = {};
    const byEnrichmentStatus: Record<string, number> = {};

    allJobsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const source = (data.source as string) || "unknown";
      const status = (data.enrichmentStatus as string) || "none";
      bySource[source] = (bySource[source] ?? 0) + 1;
      byEnrichmentStatus[status] = (byEnrichmentStatus[status] ?? 0) + 1;
    });

    logger.info("Admin seed stats viewed", {
      userId: admin.uid,
      email: admin.email,
    });

    return apiSuccess({ total, bySource, byEnrichmentStatus });
  } catch (err) {
    return handleError(err, "GET /api/admin/jobs/seed");
  }
}

// ── DELETE — Clean up stale jobs ────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const source = typeof body.source === "string"
      ? sanitizeString(body.source).slice(0, 100)
      : null;
    const olderThan = typeof body.olderThan === "string"
      ? sanitizeString(body.olderThan)
      : null;

    if (!source && !olderThan) {
      return apiError(
        "Provide 'source' (string) or 'olderThan' (ISO date or number of days)",
        "VALIDATION_ERROR",
        400
      );
    }

    let query: Query = jobsCol;

    if (source) {
      query = query.where("source", "==", source);
    }

    let cutoffDate: string | null = null;
    if (olderThan) {
      // Support both ISO date strings and "N" (number of days)
      const days = Number(olderThan);
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        cutoffDate = cutoff.toISOString();
      } else {
        // Treat as ISO date string
        const parsed = new Date(olderThan);
        if (isNaN(parsed.getTime())) {
          return apiError(
            "Invalid 'olderThan' — provide a number of days or ISO date string",
            "VALIDATION_ERROR",
            400
          );
        }
        cutoffDate = parsed.toISOString();
      }
      query = query.where("createdAt", "<", cutoffDate);
    }

    // Fetch matching docs and delete in batches (Firestore limit: 500 ops per batch)
    const snap = await query.select().get();
    const BATCH_SIZE = 500;

    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = snap.docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    logger.info("Admin seed delete", {
      userId: admin.uid,
      email: admin.email,
      deleted: snap.size,
      source: source ?? undefined,
      olderThan: cutoffDate ?? undefined,
    });

    return apiSuccess({ deleted: snap.size });
  } catch (err) {
    return handleError(err, "DELETE /api/admin/jobs/seed");
  }
}
