import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUser, updateJob } from "@/lib/db";

async function verifyEmployer(request: Request) {
  const authUser = await verifyAuth(request);
  if (!authUser) return null;
  const profile = await getUser(authUser.uid);
  if (!profile || profile.role !== "employer") return null;
  return { ...authUser, profile };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const employer = await verifyEmployer(request);
  if (!employer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await updateJob(id, employer.uid, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update job";
    const status =
      message === "Job not found"
        ? 404
        : message === "Forbidden"
          ? 403
          : 500;
    console.error("PATCH /api/employer/jobs/[id] error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
