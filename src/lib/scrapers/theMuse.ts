import type { ScraperAdapter, NormalizedJob } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";
import { logger } from "../logger";

/** Shape of a single job from The Muse public API. */
interface MuseJob {
  id: number;
  name: string;
  publication_date: string;
  contents: string;
  company: {
    name: string;
    short_name?: string;
    logo?: string;
    industries?: { name: string }[];
    size?: string;
    perks?: { name: string }[];
  };
  locations: { name: string }[];
  levels: { name: string; short_name: string }[];
  refs: { landing_page: string };
}

interface MuseResponse {
  page: number;
  page_count: number;
  results: MuseJob[];
}

const MUSE_BASE = "https://www.themuse.com/api/public/jobs";
const PAGES_TO_FETCH = 5;

/** Map The Muse company size string to a human-friendly label. */
function mapCompanySize(size?: string): string | undefined {
  if (!size) return undefined;
  const mapping: Record<string, string> = {
    "1-10": "Small startup",
    "11-50": "Small startup",
    "51-200": "Growing company",
    "201-500": "Mid-size",
    "501-1000": "Mid-size",
    "1001-5000": "Large",
    "5001-10000": "Enterprise",
    "10001+": "Enterprise",
  };
  return mapping[size] ?? size;
}

export const theMuseAdapter: ScraperAdapter = {
  name: "TheMuse",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    logger.info("Fetching from The Muse", { source: "themuse" });

    const apiKey = process.env.MUSE_API_KEY;
    const allJobs: NormalizedJob[] = [];

    try {
      for (let page = 0; page < PAGES_TO_FETCH; page++) {
        const params = new URLSearchParams({
          category: "Engineering",
          page: String(page),
        });
        if (apiKey) params.set("api_key", apiKey);

        const res = await fetch(`${MUSE_BASE}?${params}`, {
          headers: { "User-Agent": "MyWhisper/1.0 (job-aggregator)" },
        });

        if (!res.ok) {
          logger.error("The Muse returned non-OK status", {
            source: "themuse",
            status: res.status,
            page,
          });
          break;
        }

        const data: MuseResponse = await res.json();

        for (const j of data.results) {
          if (!j.company?.name || !j.name) continue;

          const locationName = j.locations?.[0]?.name;
          const isRemote =
            !locationName ||
            locationName.toLowerCase().includes("flexible");

          const perks = j.company.perks?.map((p) => p.name) ?? [];
          const industryTag = j.company.industries?.[0]?.name;
          const levelTag = j.levels?.[0]?.short_name;
          const teamSize = mapCompanySize(j.company.size);

          const tags: string[] = [];
          if (industryTag) tags.push(industryTag);
          if (levelTag) tags.push(levelTag);
          if (teamSize) tags.push(teamSize);
          // Cap tags at 6
          if (tags.length < 6 && perks.length > 0) {
            tags.push(...perks.slice(0, 6 - tags.length));
          }

          allJobs.push({
            company: j.company.name,
            role: j.name,
            location: isRemote ? "Remote" : locationName,
            salary: undefined,
            tags,
            description: truncate(stripHTML(j.contents ?? ""), 2000),
            benefits: perks.length > 0 ? perks : undefined,
            companyLogo: j.company.logo || clearbitLogo(j.company.name),
            createdAt: j.publication_date || new Date().toISOString(),
            source: "themuse",
            sourceUrl: j.refs?.landing_page,
            sourceId: String(j.id),
          });
        }

        // Stop if we've reached the last page
        if (page >= data.page_count - 1) break;
      }

      logger.info("The Muse fetch complete", {
        source: "themuse",
        count: allJobs.length,
      });

      return allJobs;
    } catch (err) {
      logger.error("The Muse fetch failed", {
        source: "themuse",
        error: String(err),
      });
      return [];
    }
  },
};
