import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import { sampleJobs } from "../src/lib/data";

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
} catch { /* .env.local not found */ }

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

async function clearCollection(collectionPath: string) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`Collection "${collectionPath}" is already empty.`);
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared ${snapshot.size} documents from "${collectionPath}".`);
}

async function seed() {
  console.log("Starting seed...\n");

  console.log("Clearing existing jobs collection...");
  await clearCollection("jobs");

  console.log(`\nSeeding ${sampleJobs.length} jobs...\n`);

  for (let i = 0; i < sampleJobs.length; i++) {
    const job = sampleJobs[i];
    const docRef = db.collection("jobs").doc();
    await docRef.set({ ...job, id: docRef.id });
    console.log(`  [${i + 1}/${sampleJobs.length}] ${job.role} at ${job.company}`);
  }

  console.log(`\nDone! Seeded ${sampleJobs.length} jobs into Firestore.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
