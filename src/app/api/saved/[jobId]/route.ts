import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { saveJob, unsaveJob } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    await saveJob(user.uid, jobId);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/saved/[jobId] error:", err);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    await unsaveJob(user.uid, jobId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/saved/[jobId] error:", err);
    return NextResponse.json(
      { error: "Failed to unsave job" },
      { status: 500 }
    );
  }
}
