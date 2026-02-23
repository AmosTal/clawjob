/**
 * Intelligent job description parser.
 *
 * Extracts structured data from messy HTML/text job descriptions using
 * regex-based heuristics and section detection. Designed to handle the
 * inconsistency of real-world postings across multiple job boards.
 */

// ── Public interface ────────────────────────────────────────────────

export interface ParsedJobData {
  requirements: string[];
  benefits: string[];
  teamSize?: string;
  culture?: string[];
  salary?: string;
  techStack?: string[];
}

// ── Known tech keywords ─────────────────────────────────────────────

const TECH_KEYWORDS: string[] = [
  // Frontend
  "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Gatsby",
  "Remix", "Astro", "Solid.js", "Preact", "Ember.js", "Backbone.js",
  "jQuery", "HTMX", "Alpine.js", "Lit", "Stencil", "Web Components",
  // Languages
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin",
  "Swift", "Ruby", "PHP", "C#", "C++", "Scala", "Elixir", "Erlang",
  "Haskell", "Clojure", "Dart", "R", "Perl", "Lua", "Zig", "OCaml",
  // Backend frameworks
  "Node.js", "Express", "Fastify", "NestJS", "Deno", "Bun",
  "Django", "Flask", "FastAPI", "Spring Boot", "Spring",
  "Rails", "Laravel", "Gin", "Fiber", "Echo", "Actix", "Axum",
  "ASP.NET", ".NET", "Phoenix",
  // Cloud & infra
  "AWS", "GCP", "Azure", "Vercel", "Netlify", "Cloudflare",
  "Heroku", "DigitalOcean", "Fly.io", "Railway",
  // Containers & orchestration
  "Docker", "Kubernetes", "K8s", "Terraform", "Pulumi", "Ansible",
  "Helm", "ArgoCD", "Nomad", "ECS", "EKS", "GKE", "AKS",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "DynamoDB", "Cassandra", "SQLite", "MariaDB", "CockroachDB",
  "Firestore", "Firebase", "Supabase", "PlanetScale", "Neon",
  "ClickHouse", "TimescaleDB", "Neo4j", "Couchbase",
  // Messaging & streaming
  "Kafka", "RabbitMQ", "SQS", "SNS", "NATS", "Pulsar",
  // APIs & protocols
  "GraphQL", "REST", "gRPC", "tRPC", "WebSocket", "OpenAPI",
  // Data & ML
  "TensorFlow", "PyTorch", "Pandas", "NumPy", "Spark", "Airflow",
  "dbt", "Snowflake", "BigQuery", "Redshift", "Databricks",
  "Jupyter", "scikit-learn", "Hugging Face", "LangChain", "OpenAI",
  // CI/CD & DevOps
  "GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "Travis CI",
  "Buildkite", "Datadog", "Grafana", "Prometheus", "Sentry",
  "New Relic", "PagerDuty", "Splunk",
  // Mobile
  "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Ionic",
  "Expo", "Capacitor",
  // Testing
  "Jest", "Vitest", "Cypress", "Playwright", "Selenium",
  "Mocha", "pytest", "JUnit", "RSpec", "Storybook",
  // Other tools
  "Git", "Linux", "Nginx", "Caddy", "Webpack", "Vite", "esbuild",
  "Tailwind CSS", "Tailwind", "Sass", "CSS-in-JS", "Styled Components",
  "Figma", "Storybook", "Prisma", "Drizzle", "Sequelize",
  "Redux", "Zustand", "MobX", "Jotai", "Recoil", "XState",
  "OAuth", "SAML", "Auth0", "Clerk", "Okta",
  "Stripe", "Twilio", "SendGrid", "Segment",
  "Solidity", "Ethereum", "Web3",
];

// Build a case-insensitive lookup map for O(1) deduplication
const TECH_KEYWORD_LOWER = new Map<string, string>(
  TECH_KEYWORDS.map((kw) => [kw.toLowerCase(), kw]),
);

// Build regex: sort longest-first to avoid partial matches like "Go" matching "Google"
const sortedTech = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);
const TECH_REGEX = new RegExp(
  `\\b(${sortedTech.map(escapeRegex).join("|")})\\b`,
  "gi",
);

// ── Culture signals ─────────────────────────────────────────────────

const CULTURE_SIGNALS: string[] = [
  "remote-first",
  "remote friendly",
  "fully remote",
  "hybrid",
  "on-site",
  "async-first",
  "async communication",
  "work-life balance",
  "work life balance",
  "unlimited PTO",
  "unlimited vacation",
  "flexible hours",
  "flexible schedule",
  "flex time",
  "distributed team",
  "global team",
  "diverse and inclusive",
  "diversity and inclusion",
  "D&I",
  "DEI",
  "inclusive culture",
  "collaborative",
  "fast-paced",
  "fast paced",
  "startup culture",
  "flat hierarchy",
  "no bureaucracy",
  "transparent",
  "radical transparency",
  "open communication",
  "mission-driven",
  "mission driven",
  "impact-driven",
  "purpose-driven",
  "innovative",
  "cutting-edge",
  "cutting edge",
  "mentorship",
  "career growth",
  "professional development",
  "learning culture",
  "continuous learning",
  "autonomy",
  "self-directed",
  "ownership mentality",
  "open-source",
  "open source",
  "pet-friendly",
  "dog-friendly",
  "team-oriented",
  "team oriented",
  "agile",
  "cross-functional",
  "cross functional",
  "data-driven",
  "customer-first",
  "customer obsessed",
  "results-oriented",
  "meritocracy",
  "psychological safety",
  "4-day work week",
  "four-day work week",
  "sabbatical",
  "volunteer time",
];

const CULTURE_REGEXES = CULTURE_SIGNALS.map(
  (signal) => new RegExp(`\\b${escapeRegex(signal)}\\b`, "i"),
);

// ── Section header patterns ─────────────────────────────────────────

const REQUIREMENT_HEADERS =
  /(?:^|\n)\s*#{0,4}\s*(?:requirements?|what\s+you(?:'ll|\s+will)\s+(?:need|bring)|qualifications?|about\s+you|who\s+you\s+are|your\s+(?:background|experience|skills)|must[- ]hav(?:e|es)|minimum\s+qualifications?|what\s+we(?:'re|\s+are)\s+looking\s+for|desired\s+skills?|key\s+skills?)\s*[:：\-—]?\s*\n?/i;

const BENEFIT_HEADERS =
  /(?:^|\n)\s*#{0,4}\s*(?:benefits?|what\s+we\s+offer|perks?|compensation(?:\s+(?:and|&)\s+benefits?)?|why\s+(?:join\s+us|work\s+(?:here|with\s+us))|our\s+(?:offer|perks|benefits)|total\s+rewards?)\s*[:：\-—]?\s*\n?/i;

const TEAM_HEADERS =
  /(?:^|\n)\s*#{0,4}\s*(?:(?:about\s+)?(?:the\s+)?team|team\s+size|who\s+we\s+are|the\s+role|about\s+(?:the\s+)?(?:team|group|org))\s*[:：\-—]?\s*\n?/i;

// ── Salary patterns ─────────────────────────────────────────────────

const SALARY_PATTERNS = [
  // "$120,000 - $180,000" or "$120k-$180k"
  /\$[\d,]+k?\s*[-–—to]+\s*\$[\d,]+k?(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "€80,000 - €120,000"
  /€[\d,]+k?\s*[-–—to]+\s*€[\d,]+k?(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "£60,000 - £90,000"
  /£[\d,]+k?\s*[-–—to]+\s*£[\d,]+k?(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "up to $200,000" or "up to $200k"
  /up\s+to\s+[£€$][\d,]+k?(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "$150,000+" or "$150k+"
  /[£€$][\d,]+k?\+(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "150,000 USD" range pattern
  /[\d,]+k?\s*[-–—to]+\s*[\d,]+k?\s*(?:USD|EUR|GBP)(?:\s*(?:per\s+(?:year|annum)|\/\s*(?:yr|year|annum)|p\.?a\.?|annually))?/gi,
  // "salary: $120,000"
  /salary\s*[:：]\s*[£€$][\d,]+k?/gi,
  // "base pay $X" or "base salary $X"
  /base\s+(?:pay|salary|compensation)\s*[:：]?\s*[£€$][\d,]+k?/gi,
];

// ── Team size patterns ──────────────────────────────────────────────

const TEAM_SIZE_PATTERNS = [
  // "team of 5-10"
  /team\s+of\s+(\d+)\s*[-–—to]+\s*(\d+)/i,
  // "5-10 engineers/developers/people/members"
  /(\d+)\s*[-–—to]+\s*(\d+)\s+(?:people|engineers|developers|members|person|employees)/i,
  // "20+ engineers"
  /(\d+)\+?\s+(?:people|engineers|developers|members|person|employees)/i,
  // "small team" / "large team"
  /\b(small|mid-?sized?|medium|large|growing)\s+team\b/i,
  // "team size: X" or "team size of X"
  /team\s+size\s*[:：of]+\s*(\d+)/i,
];

// ── Helpers ─────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip HTML tags and decode common entities. */
function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

/** Extract bullet points from a text section. */
function extractBullets(section: string): string[] {
  const bullets: string[] = [];
  const lines = section.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Lines starting with bullet markers: •, -, *, >, numbered lists
    const bulletMatch = line.match(
      /^(?:[•●○◦▪▸►\-*>]|\d+[.)]\s)/,
    );
    if (bulletMatch) {
      const content = line.replace(/^(?:[•●○◦▪▸►\-*>]|\d+[.)]\s)\s*/, "").trim();
      if (content.length > 5 && content.length < 500) {
        bullets.push(content);
      }
    }
  }

  return bullets;
}

/**
 * Split text into sections based on header patterns.
 * Returns sections between headers as { header, body } pairs.
 */
function splitSections(text: string): Array<{ header: string; body: string }> {
  // General header pattern: lines that look like headers
  const headerPattern =
    /(?:^|\n)\s*#{1,4}\s+.+|(?:^|\n)\s*(?:[A-Z][A-Za-z\s/&]+)[:：]\s*(?:\n|$)/gm;

  const headers: Array<{ index: number; match: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = headerPattern.exec(text)) !== null) {
    headers.push({ index: match.index, match: match[0].trim() });
  }

  if (headers.length === 0) {
    return [{ header: "", body: text }];
  }

  const sections: Array<{ header: string; body: string }> = [];

  // Add text before first header
  if (headers[0].index > 0) {
    sections.push({
      header: "",
      body: text.slice(0, headers[0].index),
    });
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index + headers[i].match.length;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    sections.push({
      header: headers[i].match.replace(/^#+\s*/, "").replace(/[:：]\s*$/, "").trim(),
      body: text.slice(start, end),
    });
  }

  return sections;
}

function isRequirementHeader(header: string): boolean {
  return REQUIREMENT_HEADERS.test(`\n${header}:\n`);
}

function isBenefitHeader(header: string): boolean {
  return BENEFIT_HEADERS.test(`\n${header}:\n`);
}

function isTeamHeader(header: string): boolean {
  return TEAM_HEADERS.test(`\n${header}:\n`);
}

// ── Main parser ─────────────────────────────────────────────────────

export function parseJobDescription(description: string): ParsedJobData {
  const result: ParsedJobData = {
    requirements: [],
    benefits: [],
  };

  if (!description || description.trim().length === 0) {
    return result;
  }

  // Clean HTML
  const text = stripHtml(description);

  // ── 1. Section-based extraction ───────────────────────────────────

  const sections = splitSections(text);

  for (const section of sections) {

    if (section.header && isRequirementHeader(section.header)) {
      const bullets = extractBullets(section.body);
      if (bullets.length > 0) {
        result.requirements.push(...bullets);
      } else {
        // Fall back to line-by-line if no bullet markers found
        const lines = section.body
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 10 && l.length < 500);
        result.requirements.push(...lines.slice(0, 10));
      }
    }


    if (section.header && isBenefitHeader(section.header)) {
      const bullets = extractBullets(section.body);
      if (bullets.length > 0) {
        result.benefits.push(...bullets);
      } else {
        const lines = section.body
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 10 && l.length < 500);
        result.benefits.push(...lines.slice(0, 10));
      }
    }


    if (section.header && isTeamHeader(section.header)) {
      // Try to extract team size from team section
      for (const pattern of TEAM_SIZE_PATTERNS) {
        const teamMatch = section.body.match(pattern);
        if (teamMatch) {
          if (teamMatch[1] && teamMatch[2]) {
            result.teamSize = `${teamMatch[1]}-${teamMatch[2]}`;
          } else if (teamMatch[1]) {
            result.teamSize = teamMatch[1].includes("+")
              ? teamMatch[1]
              : `${teamMatch[1]}+`;
          } else {
            result.teamSize = teamMatch[0].trim();
          }
          break;
        }
      }
    }
  }

  // ── 2. Fallback: keyword-based extraction if sections didn't yield results

  if (result.requirements.length === 0) {
    result.requirements = extractRequirementsByKeyword(text);
  }

  if (result.benefits.length === 0) {
    result.benefits = extractBenefitsByKeyword(text);
  }

  // ── 3. Salary detection ───────────────────────────────────────────

  for (const pattern of SALARY_PATTERNS) {
    pattern.lastIndex = 0;
    const salaryMatch = text.match(pattern);
    if (salaryMatch) {
      // Take the first (most prominent) salary mention
      result.salary = salaryMatch[0].trim();
      break;
    }
  }

  // ── 4. Tech stack extraction ──────────────────────────────────────

  TECH_REGEX.lastIndex = 0;
  const techFound = new Map<string, string>();
  let techMatch: RegExpExecArray | null;

  while ((techMatch = TECH_REGEX.exec(text)) !== null) {
    const lower = techMatch[1].toLowerCase();
    const canonical = TECH_KEYWORD_LOWER.get(lower);
    if (canonical && !techFound.has(lower)) {
      techFound.set(lower, canonical);
    }
  }

  if (techFound.size > 0) {
    result.techStack = Array.from(techFound.values());
  }

  // ── 5. Culture signals ────────────────────────────────────────────

  const cultureFound = new Set<string>();
  for (let i = 0; i < CULTURE_SIGNALS.length; i++) {
    if (CULTURE_REGEXES[i].test(text)) {
      // Normalize similar signals
      cultureFound.add(CULTURE_SIGNALS[i].toLowerCase());
    }
  }

  if (cultureFound.size > 0) {
    result.culture = Array.from(cultureFound);
  }

  // ── 6. Team size fallback (scan whole text) ───────────────────────

  if (!result.teamSize) {
    for (const pattern of TEAM_SIZE_PATTERNS) {
      const teamMatch = text.match(pattern);
      if (teamMatch) {
        if (teamMatch[1] && teamMatch[2]) {
          result.teamSize = `${teamMatch[1]}-${teamMatch[2]}`;
        } else if (teamMatch[1]) {
          // Check if it's a qualitative descriptor like "small team"
          if (/\d/.test(teamMatch[1])) {
            result.teamSize = `${teamMatch[1]}+`;
          } else {
            result.teamSize = `${teamMatch[1]} team`;
          }
        } else {
          result.teamSize = teamMatch[0].trim();
        }
        break;
      }
    }
  }

  // ── 7. Cap array sizes ────────────────────────────────────────────

  result.requirements = result.requirements.slice(0, 10);
  result.benefits = result.benefits.slice(0, 10);
  if (result.techStack) result.techStack = result.techStack.slice(0, 20);
  if (result.culture) result.culture = result.culture.slice(0, 8);

  return result;
}

// ── Keyword-based fallback extractors ───────────────────────────────

const REQUIREMENT_LINE_PATTERNS = [
  /(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)/i,
  /bachelor'?s?|master'?s?|ph\.?d|degree\s+in/i,
  /proficien(?:t|cy)\s+in/i,
  /experience\s+(?:with|in|using|building)/i,
  /strong\s+(?:knowledge|understanding|background|skills?)/i,
  /familiar(?:ity)?\s+with/i,
  /ability\s+to/i,
  /must\s+have/i,
  /required\s*[:：]/i,
  /proven\s+(?:track\s+record|experience|ability)/i,
  /deep\s+(?:understanding|knowledge|expertise)/i,
  /hands[- ]on\s+experience/i,
  /expertise\s+(?:in|with)/i,
];

function extractRequirementsByKeyword(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && l.length < 500);

  const requirements: string[] = [];
  for (const line of lines) {
    if (requirements.length >= 8) break;
    for (const pattern of REQUIREMENT_LINE_PATTERNS) {
      if (pattern.test(line)) {
        // Remove bullet markers for cleaner output
        const clean = line.replace(/^[•●○◦▪▸►\-*>]\s*/, "").trim();
        requirements.push(clean);
        break;
      }
    }
  }
  return requirements;
}

const BENEFIT_LINE_PATTERNS = [
  /health\s*(?:care|insurance)/i,
  /401\s*\(?k\)?/i,
  /(?:paid\s*)?(?:time\s*off|pto|vacation|leave|holiday)/i,
  /remote|work\s*from\s*home|wfh/i,
  /equity|stock\s*option|rsu/i,
  /flexible\s*(?:hours|schedule|work)/i,
  /parental\s*leave|maternity|paternity/i,
  /learning\s*(?:budget|stipend|allowance)/i,
  /dental|vision|medical/i,
  /gym|wellness|fitness/i,
  /commuter|transit/i,
  /lunch|meals?|snacks?|catering/i,
  /bonus|signing\s*bonus/i,
  /relocation/i,
  /professional\s+development/i,
  /conference|training/i,
  /home\s*office\s*(?:budget|stipend|setup)/i,
  /internet\s*(?:stipend|allowance|reimbursement)/i,
  /mental\s*health/i,
  /life\s*insurance/i,
  /disability\s*insurance/i,
  /tuition\s*(?:reimbursement|assistance)/i,
  /unlimited\s*pto/i,
  /company\s*(?:retreat|offsite|trip)/i,
];

function extractBenefitsByKeyword(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && l.length < 500);

  const benefits: string[] = [];
  for (const line of lines) {
    if (benefits.length >= 8) break;
    for (const pattern of BENEFIT_LINE_PATTERNS) {
      if (pattern.test(line)) {
        const clean = line.replace(/^[•●○◦▪▸►\-*>]\s*/, "").trim();
        benefits.push(clean);
        break;
      }
    }
  }
  return benefits;
}
