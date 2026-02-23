import { logger } from "./logger";

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
] as const;

const RECOMMENDED_SERVER_VARS = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "ADMIN_EMAILS",
  "CRON_SECRET",
] as const;

const OPTIONAL_API_VARS: Record<string, string> = {
  RAPIDAPI_KEY: "JSearch scraper will be disabled — no RapidAPI job results",
  ADZUNA_APP_ID: "Adzuna scraper will be disabled — no Adzuna job results",
  ADZUNA_API_KEY: "Adzuna scraper will be disabled — no Adzuna job results",
  REED_API_KEY: "Reed scraper will be disabled — no Reed job results",
  PROXYCURL_API_KEY: "Manager enrichment will use placeholder data instead of LinkedIn profiles",
  HUNTER_API_KEY: "Contact emails will be guessed from domain patterns instead of verified",
  GENERATED_PHOTOS_API_KEY: "AI headshots will be disabled — placeholder avatars used instead",
};

export function validateEnv(): void {
  const missing: string[] = [];
  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const warnings: string[] = [];
  for (const key of RECOMMENDED_SERVER_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (warnings.length > 0) {
    logger.warn("Missing recommended environment variables", {
      vars: warnings,
    });
  }

  for (const [key, message] of Object.entries(OPTIONAL_API_VARS)) {
    if (!process.env[key]) {
      logger.warn(`Optional API key missing: ${key} — ${message}`);
    }
  }
}
