import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { deleteCVVersion, setDefaultCV } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteCVVersion(user.uid, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete CV";
    const status = message === "CV not found" ? 404 : 500;
    console.error("DELETE /api/user/cvs/[id] error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.isDefault === true) {
      await setDefaultCV(user.uid, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "No valid update fields" },
      { status: 400 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update CV";
    const status = message === "CV not found" ? 404 : 500;
    console.error("PATCH /api/user/cvs/[id] error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
