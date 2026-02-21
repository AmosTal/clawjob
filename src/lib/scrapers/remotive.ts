import type { ScraperAdapter, NormalizedJob } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";
import { logger } from "../logger";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  tags: string[];
  job_type: string;
  salary: string;
  publication_date: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export const remotiveAdapter: ScraperAdapter = {
  name: "Remotive",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    logger.info("Fetching from Remotive", { source: "remotive" });
    try {
      const res = await fetch(
        "https://remotive.com/api/remote-jobs?category=software-dev&limit=100",
        { headers: { "User-Agent": "MyWhisper/1.0 (job-aggregator)" } }
      );
      if (!res.ok) {
        logger.error("Remotive returned non-OK status", {
          source: "remotive",
          status: res.status,
        });
        return [];
      }
      const data: RemotiveResponse = await res.json();
      const jobs = data.jobs ?? [];
      logger.info("Remotive fetch complete", {
        source: "remotive",
        count: jobs.length,
      });

      return jobs
        .filter((j) => j.company_name && j.title)
        .map((j) => ({
          company: j.company_name,
          role: j.title,
          location: "Remote",
          salary: j.salary || undefined,
          tags: (j.tags ?? []).slice(0, 6),
          description: truncate(stripHTML(j.description ?? ""), 2000),
          companyLogo: j.company_logo || clearbitLogo(j.company_name),
          createdAt: j.publication_date || new Date().toISOString(),
          source: "remotive",
          sourceUrl: j.url,
          sourceId: j.id.toString(),
        }));
    } catch (err) {
      logger.error("Remotive fetch failed", {
        source: "remotive",
        error: String(err),
      });
      return [];
    }
  },
};
