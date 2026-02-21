import { logger } from "./logger";

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
] as const;

const RECOMMENDED_SERVER_VARS = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "ADMIN_EMAILS",
  "CRON_SECRET",
] as const;

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
}
