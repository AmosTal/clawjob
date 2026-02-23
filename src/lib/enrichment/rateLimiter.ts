// Rate limiter using token bucket algorithm for API quota management

export interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerDay?: number;
  retryAfterMs?: number;
}

export class RateLimiter {
  private name: string;
  private config: RateLimitConfig;
  private tokens: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(name: string, config: RateLimitConfig) {
    this.name = name;
    this.config = config;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const waits: number[] = [];

    if (this.config.requestsPerSecond) {
      const wait = this.checkBucket("second", this.config.requestsPerSecond, 1000, now);
      if (wait > 0) waits.push(wait);
    }

    if (this.config.requestsPerMinute) {
      const wait = this.checkBucket("minute", this.config.requestsPerMinute, 60_000, now);
      if (wait > 0) waits.push(wait);
    }

    if (this.config.requestsPerDay) {
      const wait = this.checkBucket("day", this.config.requestsPerDay, 86_400_000, now);
      if (wait > 0) waits.push(wait);
    }

    const maxWait = waits.length > 0 ? Math.max(...waits) : 0;
    if (maxWait > 0) {
      console.log(`[RateLimiter:${this.name}] Throttling for ${maxWait}ms`);
      await delay(maxWait);
    }

    // Consume tokens after waiting
    this.consumeTokens(now + maxWait);
  }

  private checkBucket(key: string, limit: number, windowMs: number, now: number): number {
    const bucket = this.tokens.get(key);

    if (!bucket || now >= bucket.resetAt) {
      // Window expired or first request — no wait needed
      return 0;
    }

    if (bucket.count >= limit) {
      // Bucket exhausted — wait until reset
      return bucket.resetAt - now;
    }

    return 0;
  }

  private consumeTokens(now: number): void {
    if (this.config.requestsPerSecond) {
      this.consumeBucket("second", this.config.requestsPerSecond, 1000, now);
    }
    if (this.config.requestsPerMinute) {
      this.consumeBucket("minute", this.config.requestsPerMinute, 60_000, now);
    }
    if (this.config.requestsPerDay) {
      this.consumeBucket("day", this.config.requestsPerDay, 86_400_000, now);
    }
  }

  private consumeBucket(key: string, limit: number, windowMs: number, now: number): void {
    const bucket = this.tokens.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.tokens.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count++;
    }
  }

  async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    const baseDelay = this.config.retryAfterMs ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await this.throttle();

      try {
        return await fn();
      } catch (error: unknown) {
        const isRateLimit = isRateLimitError(error);
        const isLastAttempt = attempt === maxRetries;

        if (!isRateLimit || isLastAttempt) {
          throw error;
        }

        const delayMs = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[RateLimiter:${this.name}] Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`
        );
        await delay(delayMs);
      }
    }

    // Unreachable, but satisfies TypeScript
    throw new Error(`[RateLimiter:${this.name}] Max retries exceeded`);
  }
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object") {
    if ("status" in error && (error as { status: number }).status === 429) return true;
    if ("statusCode" in error && (error as { statusCode: number }).statusCode === 429) return true;
    if ("response" in error) {
      const resp = (error as { response: { status?: number } }).response;
      if (resp && typeof resp === "object" && resp.status === 429) return true;
    }
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[withExponentialBackoff] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delayMs}ms`
      );
      await delay(delayMs);
    }
  }

  throw new Error("Max retries exceeded");
}

// Pre-configured limiters for each API
export const rateLimiters = {
  proxycurl: new RateLimiter("proxycurl", { requestsPerMinute: 10 }),
  hunter: new RateLimiter("hunter", { requestsPerDay: 25 }),
  jsearch: new RateLimiter("jsearch", { requestsPerSecond: 1 }),
  adzuna: new RateLimiter("adzuna", { requestsPerMinute: 10, requestsPerDay: 250 }),
  generatedPhotos: new RateLimiter("generatedPhotos", { requestsPerDay: 100 }),
};
