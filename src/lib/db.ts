import { adminDb, adminStorage } from "./firebase-admin";
import type { JobCard, Application, UserProfile, CVVersion } from "./types";

const jobsCol = adminDb.collection("jobs");
const applicationsCol = adminDb.collection("applications");
const usersCol = adminDb.collection("users");
const savedCol = (userId: string) =>
  usersCol.doc(userId).collection("saved");
const cvVersionsCol = (userId: string) =>
  usersCol.doc(userId).collection("cvVersions");

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
  message?: string,
  resumeVersionId?: string
): Promise<string> {
  const job = await getJobById(jobId);
  if (!job) throw new Error("Job not found");

  const data: Record<string, unknown> = {
    userId,
    jobId,
    jobTitle: job.role,
    company: job.company,
    companyLogo: job.companyLogo ?? null,
    status: "applied",
    message: message ?? null,
    appliedAt: new Date().toISOString(),
  };
  if (resumeVersionId) data.resumeVersionId = resumeVersionId;

  const ref = await applicationsCol.add(data);
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
  data: Partial<Pick<UserProfile, "name" | "bio" | "resumeURL" | "resumeFileName" | "role" | "dangerousMode">>
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

// ── CV Version functions ──────────────────────────────────────────

export async function addCVVersion(
  userId: string,
  data: { name: string; fileName: string; url: string }
): Promise<CVVersion> {
  const col = cvVersionsCol(userId);
  const existing = await col.get();
  const isFirst = existing.empty;

  const now = new Date().toISOString();
  const ref = await col.add({
    name: data.name,
    fileName: data.fileName,
    url: data.url,
    uploadedAt: now,
    isDefault: isFirst,
  });

  // Sync legacy profile fields when this is the user's first CV
  if (isFirst) {
    await usersCol.doc(userId).update({
      resumeURL: data.url,
      resumeFileName: data.fileName,
    });
  }

  return {
    id: ref.id,
    name: data.name,
    fileName: data.fileName,
    url: data.url,
    uploadedAt: now,
    isDefault: isFirst,
  };
}

export async function getCVVersions(userId: string): Promise<CVVersion[]> {
  const snap = await cvVersionsCol(userId)
    .orderBy("uploadedAt", "desc")
    .get();
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as CVVersion
  );
}

export async function deleteCVVersion(
  userId: string,
  cvId: string
): Promise<void> {
  const col = cvVersionsCol(userId);
  const doc = await col.doc(cvId).get();
  if (!doc.exists) throw new Error("CV not found");

  const wasDefault = doc.data()?.isDefault === true;
  const fileUrl = doc.data()?.url as string | undefined;

  // Delete the actual file from Firebase Storage
  if (fileUrl) {
    try {
      const bucket = adminStorage.bucket();
      let storagePath: string | null = null;

      // Handle Firebase download URL format
      const fbMatch = fileUrl.match(/\/o\/(.+?)(\?|$)/);
      if (fbMatch) {
        storagePath = decodeURIComponent(fbMatch[1]);
      } else {
        // Handle legacy public URL format
        const prefix = `https://storage.googleapis.com/${bucket.name}/`;
        if (fileUrl.startsWith(prefix)) {
          storagePath = fileUrl.slice(prefix.length);
        }
      }

      if (storagePath) {
        await bucket.file(storagePath).delete();
      }
    } catch {
      // Storage deletion is best-effort; don't block Firestore cleanup
    }
  }

  await col.doc(cvId).delete();

  // If deleted CV was default, set the newest remaining as default and sync profile
  if (wasDefault) {
    const remaining = await col.orderBy("uploadedAt", "desc").limit(1).get();
    if (!remaining.empty) {
      const newDefault = remaining.docs[0];
      const newData = newDefault.data();
      await newDefault.ref.update({ isDefault: true });
      await usersCol.doc(userId).update({
        resumeURL: newData.url,
        resumeFileName: newData.fileName,
      });
    } else {
      // No CVs left — clear profile's legacy fields
      await usersCol.doc(userId).update({
        resumeURL: "",
        resumeFileName: "",
      });
    }
  }
}

export async function updateCVVersion(
  userId: string,
  cvId: string,
  data: { name?: string }
): Promise<void> {
  const col = cvVersionsCol(userId);
  const doc = await col.doc(cvId).get();
  if (!doc.exists) throw new Error("CV not found");

  const updates: Record<string, string> = {};
  if (data.name !== undefined) updates.name = data.name;

  if (Object.keys(updates).length > 0) {
    await col.doc(cvId).update(updates);
  }
}

export async function setDefaultCV(
  userId: string,
  cvId: string
): Promise<void> {
  const col = cvVersionsCol(userId);
  const doc = await col.doc(cvId).get();
  if (!doc.exists) throw new Error("CV not found");

  // Unset all defaults
  const snap = await col.where("isDefault", "==", true).get();
  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
  batch.update(col.doc(cvId), { isDefault: true });

  // Sync user profile's legacy resumeURL/resumeFileName
  const cvData = doc.data()!;
  batch.update(usersCol.doc(userId), {
    resumeURL: cvData.url,
    resumeFileName: cvData.fileName,
  });

  await batch.commit();
}
