import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import { scrapeJobs } from "../src/lib/scraper";

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
} catch { /* .env.local not found, that's fine */ }

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  initializeApp(
    serviceAccountKey
      ? { credential: cert(JSON.parse(serviceAccountKey) as ServiceAccount) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "clawjob" }
  );
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  console.log("=== ClawJob Scraper ===\n");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const result = await scrapeJobs(db);

  console.log("\n=== Results ===");
  console.log(`  Fetched:    ${result.fetched} jobs from APIs`);
  console.log(`  New:        ${result.newJobs} jobs added to Firestore`);
  console.log(`  Duplicates: ${result.duplicates} skipped`);

  if (result.errors.length > 0) {
    console.log(`  Errors:`);
    result.errors.forEach((e) => console.log(`    - ${e}`));
  }

  console.log(`\nFinished at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
