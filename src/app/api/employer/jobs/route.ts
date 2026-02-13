import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUser, createJob, getEmployerJobs } from "@/lib/db";

async function verifyEmployer(request: Request) {
  const authUser = await verifyAuth(request);
  if (!authUser) return null;
  const profile = await getUser(authUser.uid);
  if (!profile || profile.role !== "employer") return null;
  return { ...authUser, profile };
}

export async function GET(request: Request) {
  const employer = await verifyEmployer(request);
  if (!employer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await getEmployerJobs(employer.uid);
    return NextResponse.json(jobs);
  } catch (err) {
    console.error("GET /api/employer/jobs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const employer = await verifyEmployer(request);
  if (!employer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, company, location, salary, description, requirements, benefits, tags, manager, hr, teamSize, culture, companyLogo } = body;

    if (!role || !company || !location) {
      return NextResponse.json(
        { error: "role, company, and location are required" },
        { status: 400 }
      );
    }

    const id = await createJob(employer.uid, {
      role,
      company,
      location,
      salary: salary || undefined,
      description: description || undefined,
      requirements: requirements || [],
      benefits: benefits || [],
      tags: tags || [],
      manager: manager || { name: "", title: "", tagline: "", photo: "" },
      hr: hr || { name: "", title: "", photo: "", email: "" },
      teamSize: teamSize || undefined,
      culture: culture || [],
      companyLogo: companyLogo || undefined,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/employer/jobs error:", err);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
