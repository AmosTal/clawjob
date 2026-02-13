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
    // Only update email and photoURL on subsequent sign-ins.
    // Preserve user-editable fields like name, bio, resumeURL.
    const updates: Record<string, string> = { email: data.email };
    if (data.photoURL) updates.photoURL = data.photoURL;
    await ref.update(updates);
  } else {
    await ref.set({ ...data, createdAt: new Date().toISOString() });
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<UserProfile, "name" | "bio" | "resumeURL" | "role">>
): Promise<void> {
  await usersCol.doc(userId).update(data);
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  const doc = await usersCol.doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as UserProfile;
}

// ── Employer functions ──────────────────────────────────────────────

export async function createJob(
  employerId: string,
  jobData: Omit<JobCard, "id" | "employerId" | "createdAt">
): Promise<string> {
  const ref = await jobsCol.add({
    ...jobData,
    employerId,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getEmployerJobs(
  employerId: string
): Promise<JobCard[]> {
  const snap = await jobsCol
    .where("employerId", "==", employerId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as JobCard
  );
}

export async function updateJob(
  jobId: string,
  employerId: string,
  data: Partial<Omit<JobCard, "id" | "employerId" | "createdAt">>
): Promise<void> {
  const doc = await jobsCol.doc(jobId).get();
  if (!doc.exists) throw new Error("Job not found");
  if (doc.data()?.employerId !== employerId) throw new Error("Forbidden");
  await jobsCol.doc(jobId).update(data);
}

export async function getJobApplications(
  jobId: string
): Promise<Application[]> {
  const snap = await applicationsCol
    .where("jobId", "==", jobId)
    .orderBy("appliedAt", "desc")
    .get();
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Application
  );
}

export async function getEmployerApplicationCount(
  employerId: string
): Promise<{ total: number; today: number }> {
  const jobs = await getEmployerJobs(employerId);
  if (jobs.length === 0) return { total: 0, today: 0 };

  const jobIds = jobs.map((j) => j.id);
  // Firestore 'in' queries support max 30 values
  const chunks: string[][] = [];
  for (let i = 0; i < jobIds.length; i += 30) {
    chunks.push(jobIds.slice(i, i + 30));
  }

  let total = 0;
  let today = 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const chunk of chunks) {
    const snap = await applicationsCol
      .where("jobId", "in", chunk)
      .get();
    total += snap.size;
    snap.docs.forEach((doc) => {
      const appliedAt = doc.data().appliedAt as string;
      if (appliedAt?.startsWith(todayStr)) today++;
    });
  }

  return { total, today };
}

// ── Admin functions ───────────────────────────────────────────────

export async function getAdminStats(): Promise<{
  totalJobs: number;
  totalUsers: number;
  totalApplications: number;
  activeEmployers: number;
}> {
  const [jobsSnap, usersSnap, appsSnap] = await Promise.all([
    jobsCol.select().get(),
    usersCol.select().get(),
    applicationsCol.select().get(),
  ]);

  const employerCount = usersSnap.docs.filter(
    (doc) => doc.data().role === "employer"
  ).length;

  return {
    totalJobs: jobsSnap.size,
    totalUsers: usersSnap.size,
    totalApplications: appsSnap.size,
    activeEmployers: employerCount,
  };
}

export async function getAllUsers(
  limit = 20,
  offset = 0
): Promise<{ users: UserProfile[]; total: number }> {
  const countSnap = await usersCol.select().get();
  const total = countSnap.size;

  const snap = await usersCol
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .get();

  const users = snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as UserProfile
  );

  return { users, total };
}

export async function getAllJobs(
  limit = 20,
  offset = 0
): Promise<{ jobs: JobCard[]; total: number }> {
  const countSnap = await jobsCol.select().get();
  const total = countSnap.size;

  const snap = await jobsCol
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(limit)
    .get();

  const jobs = snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as JobCard
  );

  return { jobs, total };
}

export async function getRecentApplications(
  limit = 10
): Promise<Application[]> {
  const snap = await applicationsCol
    .orderBy("appliedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Application
  );
}

export async function getUserApplicationCount(
  userId: string
): Promise<number> {
  const snap = await applicationsCol
    .where("userId", "==", userId)
    .select()
    .get();
  return snap.size;
}

export async function getJobApplicationCount(jobId: string): Promise<number> {
  const snap = await applicationsCol
    .where("jobId", "==", jobId)
    .select()
    .get();
  return snap.size;
}
