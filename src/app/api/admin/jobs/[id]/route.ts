import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const docRef = adminDb.collection("jobs").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await docRef.update(body);
  const updated = await docRef.get();
  return NextResponse.json({ id, ...updated.data() });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(_request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const docRef = adminDb.collection("jobs").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await docRef.update({ status: "inactive" });
  return NextResponse.json({ success: true });
}
