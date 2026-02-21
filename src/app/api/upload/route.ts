import { adminStorage } from "@/lib/firebase-admin";
import {
  apiSuccess,
  apiError,
  requireAuth,
  handleError,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
} from "@/lib/api-utils";
import { sanitizeFilename } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", "VALIDATION_ERROR", 400);
    }

    // Validate file type
    const ext = file.name.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
    const validType =
      ALLOWED_FILE_TYPES.includes(file.type) ||
      ALLOWED_FILE_EXTENSIONS.includes(ext);

    if (!validType) {
      return apiError(
        "Only PDF, DOC, and DOCX files are allowed",
        "VALIDATION_ERROR",
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError("File must be under 5MB", "VALIDATION_ERROR", 400);
    }

    // Sanitize the filename to prevent path traversal and injection
    const safeFileName = sanitizeFilename(file.name);

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Firebase Storage using Admin SDK
    const storagePath = `resumes/${user.uid}/${Date.now()}_${safeFileName}`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    // Try to make file public for a permanent URL; fall back to signed URL
    let url: string;
    try {
      await fileRef.makePublic();
      url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    } catch {
      const [signedUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      url = signedUrl;
    }

    return apiSuccess({ url, fileName: safeFileName });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);

    // Provide a user-facing message when the storage bucket hasn't been provisioned
    if (errMsg.includes("does not exist") || errMsg.includes("404")) {
      return apiError(
        "Storage service unavailable",
        "SERVICE_UNAVAILABLE",
        503
      );
    }

    return handleError(err, "POST /api/upload");
  }
}
