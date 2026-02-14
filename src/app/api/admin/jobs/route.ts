import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { getAllJobs } from "@/lib/db";
import type { JobCard } from "@/lib/types";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const result = await getAllJobs(limit, offset);
  return NextResponse.json(result);
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

  // Basic validation
  const { role, company, location } = body;
  if (!role || !company || !location) {
    return NextResponse.json(
      { error: "Missing required fields: role, company, location" },
      { status: 400 }
    );
  }

  const docRef = adminDb.collection("jobs").doc();
  const job: JobCard = {
    ...body,
    id: docRef.id,
    createdAt: new Date().toISOString()
  };
  await docRef.set(job);

  return NextResponse.json(job, { status: 201 });
}
