import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount
    : undefined;

  initializeApp(
    serviceAccount
      ? { credential: cert(serviceAccount) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "clawjob" }
  );
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
