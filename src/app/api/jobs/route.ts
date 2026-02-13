import { NextResponse } from "next/server";
import { getJobs } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const startAfter = searchParams.get("startAfter") ?? undefined;

  try {
    const jobs = await getJobs(limit, startAfter);
    return NextResponse.json(jobs);
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
