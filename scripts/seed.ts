/**
 * seed.ts — Trigger the live scraper to populate Firestore with real job data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires CRON_SECRET in .env.local (or environment).
 * Calls POST /api/cron/scrape to kick off the scraper pipeline.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency)
try {
  const envPath = resolve(__dirname, "..", ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  /* .env.local not found */
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("Error: CRON_SECRET is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

async function seed() {
  console.log(`Triggering scraper at ${BASE_URL}/api/cron/scrape ...\n`);

  const res = await fetch(`${BASE_URL}/api/cron/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Scrape request failed (${res.status}): ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log("Scraper response:", JSON.stringify(data, null, 2));
  console.log("\nDone! Jobs have been seeded from live sources.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
