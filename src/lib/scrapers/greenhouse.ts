/**
 * Greenhouse ATS public board scraper.
 * API: https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
 * No API key required — fully public.
 */

import type { NormalizedJob, ScraperAdapter } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";

// ── Greenhouse API response types ────────────────────────────────────

interface GreenhouseLocation {
  name: string;
}

interface GreenhouseDepartment {
  name: string;
}

interface GreenhouseOffice {
  name: string;
}

interface GreenhouseJob {
  id: number;
  title: string;
  location: GreenhouseLocation;
  content: string;
  departments: GreenhouseDepartment[];
  offices: GreenhouseOffice[];
  absolute_url: string;
  updated_at: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

// ── Companies to scrape ──────────────────────────────────────────────

const GREENHOUSE_COMPANIES = [
  "stripe", "airbnb", "figma", "notion", "vercel", "linear",
  "anthropic", "openai", "github", "dropbox", "zoom", "twilio",
  "datadog", "elastic", "hashicorp", "mongodb", "confluent",
  "cloudflare", "fastly", "pagerduty", "sendgrid", "segment",
];

const BASE_URL = "https://boards-api.greenhouse.io/v1/boards";

// ── Engineering role filter ──────────────────────────────────────────

const ENGINEERING_PATTERNS = [
  /engineer/i, /developer/i, /software/i, /sre/i, /devops/i,
  /full[- ]?stack/i, /front[- ]?end/i, /back[- ]?end/i, /platform/i,
  /infrastructure/i, /data scientist/i, /machine learning/i, /ml /i,
  /security engineer/i, /cloud/i, /architect/i, /cto/i, /vp.*eng/i,
];

const ENGINEERING_DEPT_PATTERNS = [
  /engineer/i, /product/i, /technology/i, /development/i, /data/i,
  /infrastructure/i, /platform/i, /security/i,
];

function isEngineeringRole(job: GreenhouseJob): boolean {
  const titleMatch = ENGINEERING_PATTERNS.some((p) => p.test(job.title));
  if (titleMatch) return true;

  const deptMatch = job.departments?.some((d) =>
    ENGINEERING_DEPT_PATTERNS.some((p) => p.test(d.name))
  );
  return !!deptMatch;
}

// ── Tag extraction ───────────────────────────────────────────────────

const TITLE_KEYWORDS = [
  "React", "Node", "Python", "Java", "TypeScript", "JavaScript",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Go", "Rust",
  "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin", "SQL",
  "DevOps", "Full Stack", "Frontend", "Backend", "Senior", "Junior",
  "Lead", "Staff", "Principal", "Remote", "Machine Learning", "AI",
  "iOS", "Android", "Data", "Security", "Infrastructure", "Platform",
];

function extractTags(job: GreenhouseJob): string[] {
  const tags: Set<string> = new Set();

  // Tags from departments
  for (const dept of job.departments ?? []) {
    tags.add(dept.name);
  }

  // Tags from title keywords
  const lower = job.title.toLowerCase();
  for (const kw of TITLE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      tags.add(kw);
    }
  }

  return Array.from(tags);
}

// ── Capitalize company slug ──────────────────────────────────────────

function formatCompanyName(slug: string): string {
  // Handle known multi-word or special-cased names
  const SPECIAL: Record<string, string> = {
    openai: "OpenAI",
    github: "GitHub",
    pagerduty: "PagerDuty",
    sendgrid: "SendGrid",
    hashicorp: "HashiCorp",
    mongodb: "MongoDB",
    cloudflare: "Cloudflare",
    datadog: "Datadog",
    devops: "DevOps",
  };
  return SPECIAL[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

// ── Fetch jobs for a single company board ────────────────────────────

async function fetchCompanyJobs(slug: string): Promise<NormalizedJob[]> {
  const url = `${BASE_URL}/${slug}/jobs?content=true`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    console.error(`[greenhouse] ${slug} failed: ${res.status}`);
    return [];
  }

  const data: GreenhouseResponse = await res.json();
  const jobs = (data.jobs ?? []).filter(isEngineeringRole);

  const companyName = formatCompanyName(slug);

  return jobs.map((job): NormalizedJob => ({
    role: job.title,
    company: companyName,
    companyLogo: clearbitLogo(companyName),
    location: job.location?.name || job.offices?.[0]?.name || "Remote",
    description: truncate(stripHTML(job.content ?? ""), 2000),
    tags: extractTags(job),
    sourceUrl: job.absolute_url,
    sourceId: `greenhouse-${job.id}`,
    sourceName: "greenhouse",
    source: "greenhouse",
    createdAt: job.updated_at ?? new Date().toISOString(),
  }));
}

// ── Adapter export ───────────────────────────────────────────────────

export const greenhouseAdapter: ScraperAdapter = {
  name: "greenhouse",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    const results = await Promise.allSettled(
      GREENHOUSE_COMPANIES.map(fetchCompanyJobs)
    );

    const allJobs: NormalizedJob[] = [];
    for (let i = 0; i < results.length; i++) {
      const outcome = results[i];
      if (outcome.status === "fulfilled") {
        allJobs.push(...outcome.value);
      } else {
        console.error(
          `[greenhouse] ${GREENHOUSE_COMPANIES[i]} error:`,
          outcome.reason
        );
      }
    }

    return allJobs;
  },
};
