/**
 * Shared types for the multi-source scraper adapter system.
 */

/** A job normalized from any external source. */
export interface NormalizedJob {
  // Core required
  company: string;
  role: string;
  location: string;
  // Optional enrichable
  salary?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  tags: string[];
  companyLogo?: string;
  teamSize?: string;
  culture?: string[];
  // Source tracking
  sourceName?: string; // "jsearch", "adzuna", "themuse", "remotive", "greenhouse", "lever", "reed"
  sourceId: string; // External job ID
  sourceUrl?: string; // Original job posting URL
  applyUrl?: string; // Direct apply URL (may differ from sourceUrl)
  // Enrichment status
  enrichmentStatus?: "pending" | "enriched" | "failed";
  enrichedAt?: string;
  // Manager/HR (filled by enrichment pipeline)
  manager?: {
    name: string;
    title: string;
    tagline: string;
    photo: string;
    video?: string;
    linkedinUrl?: string;
    enrichmentSource?: "linkedin" | "generated" | "placeholder";
  };
  hr?: {
    name: string;
    title: string;
    photo: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    enrichmentSource?: "linkedin" | "generated" | "placeholder";
  };

  // Legacy compat — kept so index.ts AdapterResult still works
  /** @deprecated Use sourceName instead */
  source?: string;
  createdAt?: string;
}

/** Result returned by each adapter's fetch function. */
export interface AdapterResult {
  source: string;
  jobs: NormalizedJob[];
}

/** The interface every scraper adapter must implement. */
export interface ScraperAdapter {
  /** Human-readable source name (e.g. "RemoteOK") */
  name: string;
  /** Env var key that must be set (or "none" for keyless APIs) */
  envKey: string;
  /** Whether this adapter is enabled (env var present) */
  enabled?: () => boolean;
  /** Fetch and normalize jobs from this source */
  fetchJobs(config?: ScraperConfig): Promise<NormalizedJob[]>;
}

export interface ScraperConfig {
  maxJobsPerAdapter?: number; // Default 50
  searchQueries?: string[]; // Default: ["software engineer", "frontend engineer", "backend engineer"]
}

export interface ScrapeResult {
  fetched: number;
  newJobs: number;
  duplicates: number;
  errors: string[];
  bySource: Record<string, number>; // How many new jobs per source
}
