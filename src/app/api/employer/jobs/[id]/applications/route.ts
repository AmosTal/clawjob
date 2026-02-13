import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUser, getJobById, getJobApplications } from "@/lib/db";

async function verifyEmployer(request: Request) {
  const authUser = await verifyAuth(request);
  if (!authUser) return null;
  const profile = await getUser(authUser.uid);
  if (!profile || profile.role !== "employer") return null;
  return { ...authUser, profile };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const employer = await verifyEmployer(request);
  if (!employer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.employerId !== employer.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const applications = await getJobApplications(id);
    return NextResponse.json(applications);
  } catch (err) {
    console.error("GET /api/employer/jobs/[id]/applications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
