import type { ScraperAdapter, NormalizedJob } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";
import { logger } from "../logger";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  tags: string[];
  job_types: string[];
  location: string;
  remote: boolean;
  url: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

export const arbeitnowAdapter: ScraperAdapter = {
  name: "Arbeitnow",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    logger.info("Fetching from Arbeitnow", { source: "arbeitnow" });
    try {
      const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (!res.ok) {
        logger.error("Arbeitnow returned non-OK status", {
          source: "arbeitnow",
          status: res.status,
        });
        return [];
      }
      const data: ArbeitnowResponse = await res.json();
      const jobs = data.data ?? [];
      logger.info("Arbeitnow fetch complete", {
        source: "arbeitnow",
        count: jobs.length,
      });

      return jobs
        .filter((j) => j.company_name && j.title)
        .slice(0, 50)
        .map((j) => ({
          company: j.company_name,
          role: j.title,
          location: j.remote
            ? `${j.location || "Remote"} (Remote)`
            : j.location || "Unknown",
          tags: (j.tags ?? []).slice(0, 6),
          description: truncate(stripHTML(j.description ?? ""), 1500),
          companyLogo: clearbitLogo(j.company_name),
          createdAt: j.created_at
            ? new Date(j.created_at * 1000).toISOString()
            : new Date().toISOString(),
          sourceName: "arbeitnow",
          source: "arbeitnow",
          sourceUrl: j.url,
          sourceId: j.slug,
        }));
    } catch (err) {
      logger.error("Arbeitnow fetch failed", {
        source: "arbeitnow",
        error: String(err),
      });
      return [];
    }
  },
};
