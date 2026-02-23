/**
 * Shared utility functions used by ALL scraper adapters.
 */

import type { NormalizedJob } from "./types";

// ── HTML & Text ─────────────────────────────────────────────────────

/** Strip HTML tags, decode common entities, trim, and optionally truncate. */
export function stripHTML(html: string, maxLength?: number): string {
  let text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
  }
  return text;
}

/** Truncate text at a word boundary. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

// ── Salary ──────────────────────────────────────────────────────────

/** Format min/max salary into a human-readable string like "$80k - $120k/yr". */
export function formatSalary(
  min?: number,
  max?: number,
  period?: string
): string | undefined {
  if (min == null && max == null) return undefined;

  const isHourly = period?.toLowerCase() === "hour";
  const suffix = isHourly ? "/hr" : "/yr";
  const fmt = (n: number) => {
    if (isHourly) return `$${n}`;
    return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  };

  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}${suffix}`;
  if (min != null) return `${fmt(min)}+${suffix}`;
  return `Up to ${fmt(max!)}${suffix}`;
}

// ── Company Logos ───────────────────────────────────────────────────

/** Build a Clearbit logo URL from a company name. */
export function clearbitLogo(companyName: string): string {
  const domain = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .concat(".com");
  return `https://logo.clearbit.com/${domain}`;
}

// ── Placeholder People ──────────────────────────────────────────────

/** Generate a placeholder manager for a company (pre-enrichment). */
export function generatePlaceholderManager(
  company: string
): NormalizedJob["manager"] {
  return {
    name: "Hiring Manager",
    title: `Engineering Manager at ${company}`,
    tagline: `Join our growing team at ${company}`,
    photo: `https://ui-avatars.com/api/?name=HM&background=6366f1&color=fff&size=256`,
    enrichmentSource: "placeholder",
  };
}

/** Generate a placeholder HR contact for a company (pre-enrichment). */
export function generatePlaceholderHR(company: string): NormalizedJob["hr"] {
  return {
    name: "HR Team",
    title: `Talent Acquisition at ${company}`,
    photo: `https://ui-avatars.com/api/?name=HR&background=6366f1&color=fff&size=256`,
    email: `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    enrichmentSource: "placeholder",
  };
}

// ── Tag Extraction ──────────────────────────────────────────────────

const TECH_KEYWORDS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Scala",
  "React",
  "Angular",
  "Vue",
  "Next.js",
  "Node.js",
  "Express",
  "Django",
  "Flask",
  "Spring",
  "Rails",
  "Laravel",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "GraphQL",
  "REST",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "Kafka",
  "RabbitMQ",
  "TensorFlow",
  "PyTorch",
  "Machine Learning",
  "AI",
  "DevOps",
  "Figma",
  "Tailwind",
  "CSS",
  "HTML",
  "Git",
  "Linux",
  "Agile",
  "Scrum",
];

/** Extract tech keywords/tags from a block of text. */
export function extractTechTags(text: string): string[] {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
}

// ── Location ────────────────────────────────────────────────────────

/** Normalize location strings (trim, collapse whitespace, unify remote). */
export function normalizeLocation(location: string): string {
  let loc = location.replace(/\s+/g, " ").trim();

  // Unify various remote labels
  const remotePatterns = /^(remote|worldwide|anywhere|work from home|wfh)$/i;
  if (remotePatterns.test(loc)) return "Remote";

  // "Remote - US" → "Remote (US)"
  const remoteRegion = loc.match(/^remote\s*[-–—/]\s*(.+)$/i);
  if (remoteRegion) return `Remote (${remoteRegion[1].trim()})`;

  return loc;
}
