import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/db";

export async function GET(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getUser(user.uid);
    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(profile);
  } catch (err) {
    console.error("GET /api/user error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, bio, resumeURL } = body as {
      name?: string;
      bio?: string;
      resumeURL?: string;
    };

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (resumeURL !== undefined) updates.resumeURL = resumeURL;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    await updateUser(user.uid, updates);

    const profile = await getUser(user.uid);
    return NextResponse.json(profile);
  } catch (err) {
    console.error("PATCH /api/user error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
