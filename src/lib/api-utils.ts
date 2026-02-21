import { NextResponse } from "next/server";
import { verifyAuth, isAdmin } from "./auth";
import { getUser } from "./db";
import { logger } from "./logger";

// ── Constants ────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx"];

// ── Standardized response helpers ────────────────────────────────────

export function apiSuccess<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>
): NextResponse {
  const res = NextResponse.json(data, { status });
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.headers.set(key, value);
    }
  }
  return res;
}

export function apiError(
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function apiPaginated<T>(
  data: T[],
  pagination: { total: number; limit: number; offset: number },
  headers?: Record<string, string>
): NextResponse {
  const res = NextResponse.json({ data, pagination });
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.headers.set(key, value);
    }
  }
  return res;
}

export function methodNotAllowed(allowed: string[]): NextResponse {
  return apiError(
    `Method not allowed. Use: ${allowed.join(", ")}`,
    "METHOD_NOT_ALLOWED",
    405
  );
}

// ── Auth helpers ─────────────────────────────────────────────────────

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Verify request has a valid Firebase token. Throws AuthError on failure. */
export async function requireAuth(
  request: Request
): Promise<{ uid: string; email: string }> {
  const user = await verifyAuth(request);
  if (!user) {
    throw new AuthError("Authentication required", "UNAUTHORIZED", 401);
  }
  return user;
}

/** Verify request is from a user with the employer role. */
export async function requireEmployer(
  request: Request
): Promise<{ uid: string; email: string }> {
  const user = await requireAuth(request);
  const profile = await getUser(user.uid);
  if (!profile || profile.role !== "employer") {
    throw new AuthError("Employer access required", "FORBIDDEN", 403);
  }
  return user;
}

/** Verify request is from an admin (by cached email list). */
export async function requireAdmin(
  request: Request
): Promise<{ uid: string; email: string }> {
  const user = await requireAuth(request);
  if (!isAdmin(user.email)) {
    throw new AuthError("Admin access required", "FORBIDDEN", 403);
  }
  return user;
}

// ── Pagination helper ────────────────────────────────────────────────

export function parsePageParams(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  return { limit, offset };
}

// ── Error catcher ────────────────────────────────────────────────────

/** Wraps a route handler to catch AuthError and unknown errors consistently. */
export function handleError(err: unknown, context: string): NextResponse {
  if (err instanceof AuthError) {
    return apiError(err.message, err.code, err.status);
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(`${context} error`, {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  // Map known db-layer error messages to proper HTTP status codes
  if (message === "Job not found" || message === "CV not found" || message === "Application not found") {
    return apiError(message, "NOT_FOUND", 404);
  }
  if (message === "Forbidden") {
    return apiError(message, "FORBIDDEN", 403);
  }
  if (message === "Already applied") {
    return apiError(message, "CONFLICT", 409);
  }
  if (message === "Invalid status transition") {
    return apiError(message, "VALIDATION_ERROR", 400);
  }

  // Never leak internal error details to the client
  return apiError("Internal server error", "INTERNAL_ERROR", 500);
}
