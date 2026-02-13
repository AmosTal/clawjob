/**
 * One-command deploy: stages, commits, pushes, and live-tracks Cloud Build.
 *
 * Usage:
 *   npm run deploy                        → prompts for commit message
 *   npm run deploy -- "fix google signin" → uses provided message
 */

import { execSync, spawnSync } from "child_process";
import { createInterface } from "readline";

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT = "clawjob";
const LIVE_URL = "https://clawjob-yb6z4mnc2q-uc.a.run.app";
const BUILD_URL = `https://console.cloud.google.com/cloud-build/builds?project=${PROJECT}`;
const REPO = "AmosTal/clawjob";

// ── Helpers ───────────────────────────────────────────────────────────────────
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function exec(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
}

function cmdExists(name: string): boolean {
  const check = process.platform === "win32" ? "where" : "which";
  return spawnSync(check, [name], { stdio: "ignore" }).status === 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ── Build monitors ────────────────────────────────────────────────────────────

/** Stream Cloud Build logs via gcloud CLI (best UX). */
async function monitorGcloud(): Promise<boolean | null> {
  log("⏳ Waiting for Cloud Build to register...\n");
  await sleep(8000);

  try {
    const buildId = exec(
      `gcloud builds list --project=${PROJECT} --limit=1 --format="value(id)"`
    );
    if (!buildId) return null;

    log(`📋 Build ${buildId.slice(0, 8)}…\n`);

    // Stream logs — blocks until build finishes
    spawnSync("gcloud", ["builds", "log", "--stream", buildId, `--project=${PROJECT}`], {
      stdio: "inherit",
      shell: true,
    });

    const status = exec(
      `gcloud builds list --project=${PROJECT} --limit=1 --format="value(status)"`
    );
    return status === "SUCCESS";
  } catch {
    return null;
  }
}

/** Poll GitHub check-runs via gh CLI (fallback). */
async function monitorGh(sha: string): Promise<boolean | null> {
  log("⏳ Monitoring build via GitHub checks...\n");

  let frame = 0;
  const t0 = Date.now();
  const TIMEOUT = 10 * 60_000;

  await sleep(5000);

  while (Date.now() - t0 < TIMEOUT) {
    try {
      const raw = exec(
        `gh api repos/${REPO}/commits/${sha}/check-runs --jq ".check_runs"`
      );
      const checks = JSON.parse(raw) as Array<{
        status: string;
        conclusion: string | null;
        name: string;
        html_url: string;
      }>;

      const elapsed = Math.floor((Date.now() - t0) / 1000);
      const spin = SPIN[frame++ % SPIN.length];

      if (checks.length === 0) {
        process.stdout.write(`\r  ${spin} Waiting for build to start... (${elapsed}s)`);
        await sleep(5000);
        continue;
      }

      const build = checks[0];

      if (build.status === "completed") {
        process.stdout.write("\r" + " ".repeat(60) + "\r");
        if (build.conclusion === "success") {
          return true;
        }
        log(`❌ Build ${build.conclusion} (${elapsed}s)`);
        log(`   ${build.html_url}`);
        return false;
      }

      const label =
        build.status === "in_progress" ? "Building" : build.status;
      process.stdout.write(`\r  ${spin} ${label}... (${elapsed}s)  `);
    } catch {
      // gh API hiccup — retry
    }

    await sleep(5000);
  }

  process.stdout.write("\r" + " ".repeat(60) + "\r");
  log("⏰ Timed out waiting for build.");
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log();

  // 1. Ensure we're on main
  const branch = exec("git branch --show-current");
  if (branch !== "main") {
    log(`⚠️  You're on branch "${branch}", not main.`);
    const answer = await ask("  Continue anyway? (y/N) ");
    if (answer.toLowerCase() !== "y") {
      log("Aborted.\n");
      process.exit(0);
    }
  }

  // 2. Check for changes
  const status = exec("git status --porcelain");
  if (!status) {
    log("✓ No changes to deploy.\n");
    process.exit(0);
  }

  // 3. Show diff summary
  const stat = exec("git diff --stat HEAD");
  const untrackedCount = status
    .split("\n")
    .filter((l) => l.startsWith("??")).length;

  log("📦 Changes:\n");
  if (stat) console.log(stat.split("\n").map((l) => "    " + l).join("\n"));
  if (untrackedCount > 0) log(`  + ${untrackedCount} new file(s)`);
  console.log();

  // 4. Commit message
  const msgFromArgs = process.argv.slice(2).join(" ");
  const message = msgFromArgs || (await ask("  Commit message: "));
  if (!message) {
    log("No message provided. Aborted.\n");
    process.exit(1);
  }

  // 5. Stage + commit (add files individually to avoid Windows reserved-name issues)
  log("⏳ Staging all changes...");
  const RESERVED = new Set(["nul", "con", "prn", "aux", "com1", "com2", "com3", "lpt1", "lpt2", "lpt3"]);
  const files = status
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter((f) => f && !RESERVED.has(f.toLowerCase()));
  spawnSync("git", ["add", "--", ...files], { stdio: "pipe" });

  log("⏳ Committing...");
  const commitResult = spawnSync("git", ["commit", "-m", message], {
    stdio: "inherit",
  });
  if (commitResult.status !== 0) {
    log("❌ Commit failed.\n");
    process.exit(1);
  }

  // 6. Push
  log("⏳ Pushing to origin...");
  const pushResult = spawnSync("git", ["push", "origin", branch], {
    stdio: "inherit",
  });
  if (pushResult.status !== 0) {
    log("❌ Push failed.\n");
    process.exit(1);
  }

  const sha = exec("git rev-parse HEAD");
  log(`✅ Pushed ${sha.slice(0, 7)} → Cloud Build triggered\n`);

  // 7. Monitor build
  let success: boolean | null = null;

  if (cmdExists("gcloud")) {
    success = await monitorGcloud();
  }

  if (success === null && cmdExists("gh")) {
    success = await monitorGh(sha);
  }

  // 8. Result
  console.log();
  if (success === true) {
    log("✅ Deploy complete!");
    log(`🌐 Live → ${LIVE_URL}`);
  } else if (success === false) {
    log(`📋 Build details → ${BUILD_URL}`);
  } else {
    log("📋 No gcloud/gh CLI found — watch progress manually:");
    log(`   ${BUILD_URL}`);
    log(`🌐 Will be live → ${LIVE_URL}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(`\n  ❌ ${err.message}\n`);
  process.exit(1);
});
