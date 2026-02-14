import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export async function POST(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
    const validType =
      ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

    if (!validType) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Firebase Storage using Admin SDK
    const storagePath = `resumes/${user.uid}/${Date.now()}_${file.name}`;
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
      // makePublic may fail if bucket uses uniform access control;
      // fall back to a long-lived signed URL (1 year)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      url = signedUrl;
    }

    return NextResponse.json({ url, fileName: file.name });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/upload error:", errMsg);

    // Provide a clear message when the storage bucket hasn't been provisioned
    if (errMsg.includes("does not exist") || errMsg.includes("404")) {
      return NextResponse.json(
        {
          error:
            "Storage bucket not found. Please enable Firebase Storage in the Firebase Console.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Upload failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
