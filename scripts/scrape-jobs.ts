import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { scrapeJobs } from "../src/lib/scraper";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: "clawjob",
  });
}

const db = getFirestore();

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
