import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { scrapeJobs } from "@/lib/scraper";

export async function POST(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron/scrape] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron/scrape] Starting scrape...");
    const result = await scrapeJobs(adminDb);
    console.log("[cron/scrape] Scrape complete:", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron/scrape] Scrape failed:", err);
    return NextResponse.json(
      { error: "Scrape failed", details: String(err) },
      { status: 500 }
    );
  }
}
