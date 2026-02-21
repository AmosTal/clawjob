import type { ScraperAdapter, NormalizedJob } from "./types";
import { clearbitLogo, formatSalary, stripHTML, truncate } from "./helpers";
import { logger } from "../logger";

interface RemoteOKJob {
  id: string;
  slug: string;
  company: string;
  company_logo: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  date: string;
  url: string;
}

export const remoteOKAdapter: ScraperAdapter = {
  name: "RemoteOK",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    logger.info("Fetching from RemoteOK", { source: "remoteok" });
    try {
      const res = await fetch("https://remoteok.com/api", {
        headers: { "User-Agent": "MyWhisper/1.0 (job-aggregator)" },
      });
      if (!res.ok) {
        logger.error("RemoteOK returned non-OK status", {
          source: "remoteok",
          status: res.status,
        });
        return [];
      }
      const raw: unknown[] = await res.json();
      const jobs = raw.slice(1) as RemoteOKJob[];
      logger.info("RemoteOK fetch complete", {
        source: "remoteok",
        count: jobs.length,
      });

      return jobs
        .filter((j) => j.company && j.position)
        .slice(0, 50)
        .map((j) => ({
          company: j.company,
          role: j.position,
          location: j.location || "Remote",
          salary: formatSalary(j.salary_min, j.salary_max),
          tags: (j.tags ?? []).slice(0, 6),
          description: truncate(stripHTML(j.description ?? ""), 1500),
          companyLogo: j.company_logo || clearbitLogo(j.company),
          createdAt: j.date || new Date().toISOString(),
          sourceName: "remoteok",
          source: "remoteok",
          sourceUrl: j.url,
          sourceId: j.id,
        }));
    } catch (err) {
      logger.error("RemoteOK fetch failed", {
        source: "remoteok",
        error: String(err),
      });
      return [];
    }
  },
};
