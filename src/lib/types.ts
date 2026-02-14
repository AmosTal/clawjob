export interface ManagerAsset {
  name: string;
  title: string;
  tagline: string;
  photo: string;
  video?: string;
}

export interface HRContact {
  name: string;
  title: string;
  photo: string;
  email: string;
  phone?: string;
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
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status:
    | "applied"
    | "reviewing"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  message?: string;
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
  dangerousMode?: boolean;
  createdAt: string;
}
