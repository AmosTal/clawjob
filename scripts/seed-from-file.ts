/**
 * seed-from-file.ts — Bulk-import JobCard objects from a JSON file into Firestore.
 *
 * Usage:
 *   npx tsx scripts/seed-from-file.ts <path-to-jobs.json> [--clear]
 *
 * Options:
 *   --clear   Clear the existing jobs collection before importing
 *
 * The JSON file should contain an array of JobCard objects.
 * Each object will be assigned a new Firestore document ID on import.
 */

import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
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

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  initializeApp(
    serviceAccountKey
      ? { credential: cert(JSON.parse(serviceAccountKey) as ServiceAccount) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "clawjob" },
  );
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const args = process.argv.slice(2);
const clearFlag = args.includes("--clear");
const filePath = args.find((a) => !a.startsWith("--"));

if (!filePath) {
  console.error("Usage: npx tsx scripts/seed-from-file.ts <path-to-jobs.json> [--clear]");
  process.exit(1);
}

const resolvedPath = resolve(filePath);
if (!existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

async function clearCollection(collectionPath: string) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`Collection "${collectionPath}" is already empty.`);
    return;
  }
  const batchSize = 500;
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    snapshot.docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`Cleared ${snapshot.size} documents from "${collectionPath}".`);
}

async function seedFromFile() {
  const raw = readFileSync(resolvedPath, "utf-8");
  let jobs: Record<string, unknown>[];

  try {
    jobs = JSON.parse(raw);
  } catch {
    console.error("Failed to parse JSON file. Ensure it contains a valid JSON array.");
    process.exit(1);
  }

  if (!Array.isArray(jobs)) {
    console.error("JSON file must contain an array of job objects.");
    process.exit(1);
  }

  console.log(`Found ${jobs.length} jobs in ${resolvedPath}\n`);

  if (clearFlag) {
    console.log("Clearing existing jobs collection...");
    await clearCollection("jobs");
    console.log();
  }

  const batchSize = 500;
  let imported = 0;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = jobs.slice(i, i + batchSize);

    for (const job of chunk) {
      const docRef = db.collection("jobs").doc();
      batch.set(docRef, { ...job, id: docRef.id });
    }

    await batch.commit();
    imported += chunk.length;
    console.log(`  Imported ${imported}/${jobs.length} jobs...`);
  }

  console.log(`\nDone! Imported ${jobs.length} jobs into Firestore.`);
}

seedFromFile().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
