import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSavedJobs } from "@/lib/db";

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
