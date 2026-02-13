import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSavedJobs, saveJob } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedIds = await getSavedJobs(user.uid);
    return NextResponse.json(savedIds);
  } catch (err) {
    console.error("GET /api/saved error:", err);
    return NextResponse.json(
      { error: "Failed to fetch saved jobs" },
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
    const { jobId } = body as { jobId?: string };

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    await saveJob(user.uid, jobId);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/saved error:", err);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}
