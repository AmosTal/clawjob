/**
 * Adzuna Jobs API adapter.
 * Docs: https://developer.adzuna.com/
 * Env: ADZUNA_APP_ID, ADZUNA_API_KEY
 */

import type { NormalizedJob, ScraperAdapter } from "./types";
import { clearbitLogo, formatSalary, stripHTML, truncate } from "./helpers";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  description: string;
  redirect_url: string;
  created: string;
  category: { tag: string; label?: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

const BASE_URL = "https://api.adzuna.com/v1/api/jobs";
const COUNTRY = "us";
const RESULTS_PER_PAGE = 50;
const MAX_PAGES = 2;

/** Extract simple tags from a job title. */
function extractTitleTags(title: string): string[] {
  const keywords = [
    "React", "Node", "Python", "Java", "TypeScript", "JavaScript",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Go", "Rust",
    "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin", "SQL",
    "DevOps", "Full Stack", "Frontend", "Backend", "Senior", "Junior",
    "Lead", "Staff", "Principal", "Remote",
  ];
  const lower = title.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

async function fetchPage(page: number): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(RESULTS_PER_PAGE),
    category: "it-jobs",
    sort_by: "date",
  });

  const url = `${BASE_URL}/${COUNTRY}/search/${page}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[adzuna] page ${page} failed: ${res.status}`);
    return [];
  }
  const data: AdzunaResponse = await res.json();
  return data.results ?? [];
}

function normalize(job: AdzunaJob): NormalizedJob {
  const companyName = job.company?.display_name ?? "Unknown";
  const categoryTag = job.category?.tag ?? "it-jobs";
  const titleTags = extractTitleTags(job.title);
  const tags = [categoryTag, ...titleTags.filter((t) => t !== categoryTag)];

  return {
    role: job.title,
    company: companyName,
    companyLogo: clearbitLogo(companyName),
    location: job.location?.display_name ?? "Unknown",
    salary: formatSalary(job.salary_min, job.salary_max),
    description: truncate(stripHTML(job.description), 2000),
    tags,
    sourceUrl: job.redirect_url,
    sourceId: String(job.id),
    source: "adzuna",
    createdAt: job.created ?? new Date().toISOString(),
  };
}

export const adzunaAdapter: ScraperAdapter = {
  name: "adzuna",
  envKey: "ADZUNA_APP_ID",

  async fetchJobs(): Promise<NormalizedJob[]> {
    const pages = Array.from({ length: MAX_PAGES }, (_, i) => i + 1);
    const results = await Promise.all(pages.map(fetchPage));
    const allJobs = results.flat();
    return allJobs.map(normalize);
  },
};
