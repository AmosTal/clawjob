import type { ScraperAdapter, NormalizedJob } from "./types";
import { clearbitLogo, stripHTML, truncate } from "./helpers";
import { logger } from "../logger";

const LEVER_COMPANIES = [
  "netflix", "spotify", "square", "coinbase", "robinhood",
  "brex", "plaid", "lattice", "gusto", "rippling", "deel",
  "remote", "mercury", "ramp", "scale", "weights-biases",
  "huggingface", "mistral", "cohere", "stability",
];

interface LeverCategory {
  location?: string;
  team?: string;
  department?: string;
  commitment?: string;
}

interface LeverList {
  text: string;
  content: string;
}

interface LeverPosting {
  id: string;
  text: string;
  categories: LeverCategory;
  description?: string;
  descriptionPlain?: string;
  lists?: LeverList[];
  hostedUrl?: string;
  createdAt: number;
}

const ENGINEERING_KEYWORDS = [
  "engineer", "developer", "software", "sre", "devops",
  "infrastructure", "platform", "backend", "frontend",
  "fullstack", "full-stack", "full stack", "data",
  "machine learning", "ml", "ai", "security",
];

function isEngineeringRole(posting: LeverPosting): boolean {
  const team = (posting.categories.team ?? "").toLowerCase();
  const dept = (posting.categories.department ?? "").toLowerCase();
  const title = posting.text.toLowerCase();

  return [team, dept, title].some((field) =>
    ENGINEERING_KEYWORDS.some((kw) => field.includes(kw))
  );
}

function capitalize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractTagsFromTitle(title: string): string[] {
  const keywords = ["Senior", "Staff", "Principal", "Lead", "Junior", "Intern",
    "Frontend", "Backend", "Fullstack", "Full-Stack", "DevOps", "SRE",
    "Mobile", "iOS", "Android", "Data", "ML", "AI", "Security", "Platform",
    "Infrastructure", "Cloud"];
  return keywords.filter((kw) =>
    title.toLowerCase().includes(kw.toLowerCase())
  );
}

function parseRequirements(lists?: LeverList[]): string[] {
  if (!lists) return [];
  const reqList = lists.find(
    (l) => l.text.toLowerCase().includes("requirement") ||
           l.text.toLowerCase().includes("qualification")
  );
  if (!reqList) return [];
  // Content is HTML with <li> items — extract text from each
  const items = reqList.content.match(/<li>(.*?)<\/li>/gi) ?? [];
  return items.map((li) => stripHTML(li)).filter(Boolean).slice(0, 10);
}

async function fetchCompany(slug: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json&limit=50`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MyWhisper/1.0 (job-aggregator)" },
  });

  if (!res.ok) {
    logger.warn("Lever returned non-OK for company", {
      source: "lever", company: slug, status: res.status,
    });
    return [];
  }

  const postings: LeverPosting[] = await res.json();
  const company = capitalize(slug);

  return postings
    .filter(isEngineeringRole)
    .map((p) => {
      const desc = p.description
        ? truncate(stripHTML(p.description), 2000)
        : truncate(p.descriptionPlain ?? "", 2000);

      const tags = [
        p.categories.team,
        p.categories.department,
        ...extractTagsFromTitle(p.text),
      ].filter((t): t is string => Boolean(t));
      // Deduplicate tags (case-insensitive)
      const seen = new Set<string>();
      const uniqueTags = tags.filter((t) => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return {
        company,
        role: p.text,
        location: p.categories.location || "Remote",
        tags: uniqueTags.slice(0, 6),
        description: desc,
        requirements: parseRequirements(p.lists),
        companyLogo: clearbitLogo(company),
        createdAt: p.createdAt
          ? new Date(p.createdAt).toISOString()
          : new Date().toISOString(),
        sourceName: "lever",
        source: "lever",
        sourceUrl: p.hostedUrl,
        sourceId: p.id,
      } satisfies NormalizedJob;
    });
}

export const leverAdapter: ScraperAdapter = {
  name: "Lever",
  envKey: "none",

  async fetchJobs(): Promise<NormalizedJob[]> {
    logger.info("Fetching from Lever", {
      source: "lever",
      companies: LEVER_COMPANIES.length,
    });

    try {
      const results = await Promise.allSettled(
        LEVER_COMPANIES.map((slug) => fetchCompany(slug))
      );

      const jobs: NormalizedJob[] = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled") {
          jobs.push(...result.value);
        } else {
          logger.warn("Lever company fetch failed", {
            source: "lever",
            company: LEVER_COMPANIES[i],
            error: String(result.reason),
          });
        }
      }

      logger.info("Lever fetch complete", {
        source: "lever",
        count: jobs.length,
      });

      return jobs;
    } catch (err) {
      logger.error("Lever fetch failed", {
        source: "lever",
        error: String(err),
      });
      return [];
    }
  },
};
