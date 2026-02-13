import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sampleJobs } from "../src/lib/data";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: "clawjob",
  });
}

const db = getFirestore();

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
