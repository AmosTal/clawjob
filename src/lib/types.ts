export type EnrichmentStatus = "pending" | "enriched" | "failed" | "failed_permanent";

export type JobSource = "jsearch" | "adzuna" | "themuse" | "remotive" |
  "greenhouse" | "lever" | "reed" | "remoteok" | "arbeitnow" | "employer" | "manual";

export interface ManagerAsset {
  name: string;
  title: string;
  tagline: string;
  photo: string;
  video?: string;
  linkedinUrl?: string;
  enrichmentSource?: "linkedin" | "generated" | "placeholder";
  isAIGenerated?: boolean;
}

export interface HRContact {
  name: string;
  title: string;
  photo: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  enrichmentSource?: "linkedin" | "generated" | "placeholder";
  isAIGenerated?: boolean;
}

export interface JobCard {
  id: string;
  company: string;
  role: string;
  location: string;
  salary?: string;
  manager: ManagerAsset;
  hr: HRContact;
  tags: string[];
  description?: string;
  requirements?: string[];
  benefits?: string[];
  companyLogo?: string;
  teamSize?: string;
  culture?: string[];
  employerId?: string;
  createdAt?: string;
  sourceUrl?: string;
  applyUrl?: string;
  sourceName?: string;
  sourceId?: string;
  enrichmentStatus?: EnrichmentStatus;
  enrichedAt?: string;
  postedAt?: string;
}

export interface CVVersion {
  id: string;
  name: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  isDefault: boolean;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  status:
    | "applied"
    | "reviewing"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  message?: string;
  resumeVersionId?: string;
  appliedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  bio?: string;
  resumeURL?: string;
  resumeFileName?: string;
  role?: "seeker" | "employer";
  quickApply?: boolean;
  createdAt: string;
}
