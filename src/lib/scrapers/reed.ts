/**
 * Reed.co.uk Jobs API adapter.
 * Docs: https://www.reed.co.uk/developers/jobseeker
 * Env: REED_API_KEY
 */

import type { NormalizedJob, ScraperAdapter } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";

interface ReedJob {
  jobId: number;
  jobTitle: string;
  employerName: string;
  locationName: string;
  minimumSalary: number | null;
  maximumSalary: number | null;
  jobUrl: string;
  jobDescription: string;
  date: string;
  expirationDate: string;
}

interface ReedSearchResponse {
  results: ReedJob[];
  totalResults: number;
}

const BASE_URL = "https://www.reed.co.uk/api/1.0/search";
const RESULTS_PER_QUERY = 50;
const SEARCH_KEYWORDS = ["software developer", "software engineer"];

/** Format min/max salary into a GBP string. */
function formatSalaryGBP(min?: number | null, max?: number | null): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) =>
    n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

/** Extract tech keywords from title + description. */
function extractTags(title: string, description: string): string[] {
  const keywords = [
    "React", "Node", "Python", "Java", "TypeScript", "JavaScript",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Go", "Rust",
    "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin", "SQL",
    "DevOps", "Full Stack", "Frontend", "Backend", "Senior", "Junior",
    "Lead", "Staff", "Principal", "Remote",
  ];
  const text = `${title} ${description}`.toLowerCase();
  return keywords.filter((kw) => text.includes(kw.toLowerCase()));
}

function authHeader(): string {
  const key = process.env.REED_API_KEY ?? "";
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

async function searchJobs(keywords: string): Promise<ReedJob[]> {
  const params = new URLSearchParams({
    keywords,
    resultsToTake: String(RESULTS_PER_QUERY),
  });

  const url = `${BASE_URL}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    console.error(`[reed] search "${keywords}" failed: ${res.status}`);
    return [];
  }

  const data: ReedSearchResponse = await res.json();
  return data.results ?? [];
}

function normalize(job: ReedJob): NormalizedJob {
  const companyName = job.employerName ?? "Unknown";
  const description = job.jobDescription
    ? truncate(stripHTML(job.jobDescription), 2000)
    : undefined;
  const tags = extractTags(job.jobTitle, job.jobDescription ?? "");

  return {
    role: job.jobTitle,
    company: companyName,
    companyLogo: clearbitLogo(companyName),
    location: job.locationName ?? "United Kingdom",
    salary: formatSalaryGBP(job.minimumSalary, job.maximumSalary),
    description,
    tags,
    sourceUrl: job.jobUrl,
    sourceId: String(job.jobId),
    source: "reed",
    createdAt: job.date ?? new Date().toISOString(),
  };
}

export const reedAdapter: ScraperAdapter = {
  name: "reed",
  envKey: "REED_API_KEY",

  async fetchJobs(): Promise<NormalizedJob[]> {
    const results = await Promise.all(SEARCH_KEYWORDS.map(searchJobs));
    const allJobs = results.flat();

    // Deduplicate by jobId
    const seen = new Set<string>();
    return allJobs
      .filter((job) => {
        const id = String(job.jobId);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map(normalize);
  },
};
