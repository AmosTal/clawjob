import type { ScraperAdapter, AdapterResult } from "./types";
import { logger } from "../logger";

// ── Static adapter registry ──────────────────────────────────────────
// Each entry: [module-level import thunk, env var to check (or "none")]
// Adapters whose env key is missing (and isn't "none") are skipped.

interface AdapterEntry {
  load: () => Promise<ScraperAdapter>;
  envKey: string;
}

const ADAPTER_REGISTRY: AdapterEntry[] = [
  // --- Free / keyless APIs ---
  {
    load: async () => (await import("./remoteok")).remoteOKAdapter,
    envKey: "none",
  },
  {
    load: async () => (await import("./arbeitnow")).arbeitnowAdapter,
    envKey: "none",
  },
  // --- APIs requiring keys (adapters created by other team members) ---
  {
    load: async () => (await import("./jSearch")).jSearchAdapter,
    envKey: "RAPIDAPI_KEY",
  },
  {
    load: async () => (await import("./adzuna")).adzunaAdapter,
    envKey: "ADZUNA_APP_ID",
  },
  {
    load: async () => (await import("./theMuse")).theMuseAdapter,
    envKey: "none",
  },
  {
    load: async () => (await import("./remotive")).remotiveAdapter,
    envKey: "none",
  },
  {
    load: async () => (await import("./reed")).reedAdapter,
    envKey: "REED_API_KEY",
  },
  {
    load: async () => (await import("./greenhouse")).greenhouseAdapter,
    envKey: "none",
  },
  {
    load: async () => (await import("./lever")).leverAdapter,
    envKey: "none",
  },
];

/**
 * Dynamically load all available adapters based on environment variables,
 * run them in parallel, and return merged results.
 */
export async function runAllAdapters(): Promise<AdapterResult[]> {
  // 1. Determine which adapters are enabled
  const enabled: Array<{ adapter: ScraperAdapter }> = [];

  for (const entry of ADAPTER_REGISTRY) {
    // Skip if the required env var is not set
    if (entry.envKey !== "none" && !process.env[entry.envKey]) {
      logger.debug("Skipping adapter — env var not set", {
        envKey: entry.envKey,
      });
      continue;
    }

    try {
      const adapter = await entry.load();
      enabled.push({ adapter });
    } catch {
      // Module doesn't exist yet — other team members haven't created it
      logger.debug("Adapter module not found, skipping", {
        envKey: entry.envKey,
      });
    }
  }

  logger.info("Running adapters", {
    count: enabled.length,
    names: enabled.map((e) => e.adapter.name),
  });

  // 2. Run all enabled adapters in parallel
  const settled = await Promise.allSettled(
    enabled.map(async ({ adapter }): Promise<AdapterResult> => {
      const jobs = await adapter.fetchJobs();
      return { source: adapter.name, jobs };
    })
  );

  // 3. Collect results, log failures
  const results: AdapterResult[] = [];
  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const name = enabled[i].adapter.name;
    if (outcome.status === "fulfilled") {
      results.push(outcome.value);
      logger.info("Adapter completed", {
        source: name,
        jobCount: outcome.value.jobs.length,
      });
    } else {
      logger.error("Adapter failed", {
        source: name,
        error: String(outcome.reason),
      });
      results.push({ source: name, jobs: [] });
    }
  }

  return results;
}

export type { ScraperAdapter, AdapterResult, NormalizedJob } from "./types";
