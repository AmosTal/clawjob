import { adminAuth } from "./firebase-admin";

export async function verifyAuth(
  request: Request
): Promise<{ uid: string; email: string } | null> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return null;
  }
}

// ── Cached admin email set (parsed once at module load) ──────────────
let _adminEmails: Set<string> | null = null;

function getAdminEmails(): Set<string> {
  if (!_adminEmails) {
    _adminEmails = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    );
  }
  return _adminEmails;
}

export function isAdmin(email: string): boolean {
  return getAdminEmails().has(email.toLowerCase());
}
