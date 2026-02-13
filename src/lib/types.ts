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
}
