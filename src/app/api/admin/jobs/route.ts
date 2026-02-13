import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import type { JobCard } from "@/lib/types";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const docRef = adminDb.collection("jobs").doc();
  const job: JobCard = { ...body, id: docRef.id };
  await docRef.set(job);

  return NextResponse.json(job, { status: 201 });
}
