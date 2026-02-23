/**
 * JSearch API adapter via RapidAPI.
 * Aggregates jobs from Google Jobs, Indeed, LinkedIn Jobs, Glassdoor.
 */

import type { NormalizedJob, ScraperAdapter } from "./types";
import { clearbitLogo, formatSalary, stripHTML, truncate } from "./helpers";

const BASE_URL = "https://jsearch.p.rapidapi.com/search";

const QUERIES = [
  "software engineer",
  "frontend engineer",
  "backend engineer",
  "full stack engineer",
];

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  employer_website?: string;
  job_description: string;
  job_required_skills?: string[];
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_apply_link?: string;
  job_posted_at_datetime_utc?: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}

interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

async function fetchQuery(query: string): Promise<JSearchJob[]> {
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: "month",
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    console.error(`[jsearch] Query "${query}" failed: ${res.status}`);
    return [];
  }

  const json: JSearchResponse = await res.json();
  return json.data ?? [];
}

function buildLocation(job: JSearchJob): string {
  if (job.job_is_remote) return "Remote";
  const parts = [job.job_city, job.job_state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
}

function mapJob(job: JSearchJob): NormalizedJob {
  return {
    company: job.employer_name,
    role: job.job_title,
    location: buildLocation(job),
    salary: formatSalary(job.job_min_salary, job.job_max_salary),
    tags: (job.job_required_skills ?? []).slice(0, 6),
    description: job.job_description
      ? truncate(stripHTML(job.job_description), 2000)
      : undefined,
    requirements: job.job_highlights?.Qualifications,
    benefits: job.job_highlights?.Benefits,
    companyLogo: job.employer_logo || clearbitLogo(job.employer_name),
    createdAt:
      job.job_posted_at_datetime_utc ?? new Date().toISOString(),
    sourceName: "jsearch",
    source: "jsearch",
    sourceUrl: job.job_apply_link,
    sourceId: job.job_id,
  };
}

export const jSearchAdapter: ScraperAdapter = {
  name: "jsearch",
  envKey: "RAPIDAPI_KEY",

  async fetchJobs(): Promise<NormalizedJob[]> {
    const results = await Promise.allSettled(QUERIES.map(fetchQuery));

    const jobs: JSearchJob[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        jobs.push(...result.value);
      }
    }

    // Deduplicate by job_id
    const seen = new Set<string>();
    const unique: JSearchJob[] = [];
    for (const job of jobs) {
      if (!seen.has(job.job_id)) {
        seen.add(job.job_id);
        unique.push(job);
      }
    }

    return unique.map(mapJob);
  },
};
