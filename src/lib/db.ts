import { adminDb } from "./firebase-admin";
import type { JobCard, Application, UserProfile } from "./types";

const jobsCol = adminDb.collection("jobs");
const applicationsCol = adminDb.collection("applications");
const usersCol = adminDb.collection("users");
const savedCol = (userId: string) =>
  usersCol.doc(userId).collection("saved");

export async function getJobs(
  limit = 20,
  startAfterId?: string
): Promise<JobCard[]> {
  let query = jobsCol.orderBy("__name__").limit(limit);
  if (startAfterId) {
    const startDoc = await jobsCol.doc(startAfterId).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }
  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as JobCard);
}

export async function getJobById(id: string): Promise<JobCard | null> {
  const doc = await jobsCol.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as JobCard;
}

export async function createApplication(
  userId: string,
  jobId: string,
  message?: string
): Promise<string> {
  const job = await getJobById(jobId);
  if (!job) throw new Error("Job not found");

  const ref = await applicationsCol.add({
    userId,
    jobId,
    jobTitle: job.role,
    company: job.company,
    status: "applied",
    message: message ?? null,
    appliedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getUserApplications(
  userId: string
): Promise<Application[]> {
  const snap = await applicationsCol
    .where("userId", "==", userId)
    .orderBy("appliedAt", "desc")
    .get();
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Application
  );
}

export async function withdrawApplication(
  appId: string,
  userId: string
): Promise<void> {
  const doc = await applicationsCol.doc(appId).get();
  if (!doc.exists) throw new Error("Application not found");
  if (doc.data()?.userId !== userId) throw new Error("Forbidden");
  await applicationsCol.doc(appId).update({ status: "withdrawn" });
}

export async function saveJob(userId: string, jobId: string): Promise<void> {
  await savedCol(userId).doc(jobId).set({ savedAt: new Date().toISOString() });
}

export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  await savedCol(userId).doc(jobId).delete();
}

export async function getSavedJobs(userId: string): Promise<string[]> {
  const snap = await savedCol(userId).get();
  return snap.docs.map((doc) => doc.id);
}

export async function getUserAppliedJobIds(
  userId: string
): Promise<string[]> {
  const snap = await applicationsCol
    .where("userId", "==", userId)
    .select("jobId")
    .get();
  return snap.docs.map((doc) => doc.data().jobId as string);
}

export async function createOrUpdateUser(
  userId: string,
  data: { email: string; name: string; photoURL?: string }
): Promise<void> {
  const ref = usersCol.doc(userId);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.update({ ...data });
  } else {
    await ref.set({ ...data, createdAt: new Date().toISOString() });
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<UserProfile, "name" | "bio" | "resumeURL">>
): Promise<void> {
  await usersCol.doc(userId).update(data);
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  const doc = await usersCol.doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as UserProfile;
}
