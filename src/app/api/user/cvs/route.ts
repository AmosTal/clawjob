import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getCVVersions, addCVVersion } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cvs = await getCVVersions(user.uid);
    return NextResponse.json(cvs);
  } catch (err) {
    console.error("GET /api/user/cvs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch CV versions" },
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
    const { name, fileName, url } = body as {
      name?: string;
      fileName?: string;
      url?: string;
    };

    if (!name || !fileName || !url) {
      return NextResponse.json(
        { error: "name, fileName, and url are required" },
        { status: 400 }
      );
    }

    const cv = await addCVVersion(user.uid, { name, fileName, url });
    return NextResponse.json(cv, { status: 201 });
  } catch (err) {
    console.error("POST /api/user/cvs error:", err);
    return NextResponse.json(
      { error: "Failed to add CV version" },
      { status: 500 }
    );
  }
}
