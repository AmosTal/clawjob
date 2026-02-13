import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUserApplications, createApplication } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apps = await getUserApplications(user.uid);
    return NextResponse.json(apps);
  } catch (err) {
    console.error("GET /api/applications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobId, message } = body as { jobId?: string; message?: string };

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    const appId = await createApplication(user.uid, jobId, message);
    return NextResponse.json({ id: appId }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create application";
    const status = message === "Job not found" ? 404 : 500;
    console.error("POST /api/applications error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
