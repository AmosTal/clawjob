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
