import { NextResponse } from "next/server";
import { getEnrichmentStats } from "@/lib/db";

const startedAt = Date.now();

export async function GET() {
  // Basic health info always returned quickly
  const health: Record<string, unknown> = {
    status: "ok",
    version: process.env.npm_package_version ?? "0.6.3",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  };

  // Enrichment queue stats (best-effort — don't fail health check if DB is down)
  try {
    const enrichment = await getEnrichmentStats();
    health.enrichment = enrichment;
  } catch {
    health.enrichment = { error: "unavailable" };
  }

  return NextResponse.json(health);
}
