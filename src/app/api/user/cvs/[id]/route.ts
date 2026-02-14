import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { deleteCVVersion, setDefaultCV, updateCVVersion } from "@/lib/db";

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
    }

    if (typeof body.name === "string" && body.name.trim()) {
      await updateCVVersion(user.uid, id, { name: body.name.trim() });
    }

    if (body.isDefault !== true && !(typeof body.name === "string" && body.name.trim())) {
      return NextResponse.json(
        { error: "No valid update fields" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update CV";
    const status = message === "CV not found" ? 404 : 500;
    console.error("PATCH /api/user/cvs/[id] error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
