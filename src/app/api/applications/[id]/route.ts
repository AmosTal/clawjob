import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { withdrawApplication } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    if (body.status !== "withdrawn") {
      return NextResponse.json(
        { error: "Only withdrawal is supported" },
        { status: 400 }
      );
    }

    await withdrawApplication(id, user.uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update application";
    const status =
      message === "Application not found"
        ? 404
        : message === "Forbidden"
          ? 403
          : 500;
    console.error("PATCH /api/applications/[id] error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
