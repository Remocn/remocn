import "server-only";

/**
 * Per-IP rate limiter, in-memory. Renders cost real CPU, so this caps how often
 * a single client can kick one off: at most `RENDER_RATE_LIMIT` requests per
 * `RENDER_RATE_WINDOW_MS` window. Implemented as a token bucket (capacity =
 * limit, refilled smoothly across the window) so bursts are bounded without a
 * hard fixed-window edge. Cheap and good enough for a single-process box — not a
 * distributed limiter.
 */

interface Bucket {
  /** Fractional tokens currently available. */
  tokens: number;
  /** Last time (ms) the bucket was refilled. */
  updatedAt: number;
}

/** Max requests per window before throttling (bucket capacity). */
function limit(): number {
  const parsed = Number(process.env.RENDER_RATE_LIMIT);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 5;
}

/** Window over which a full bucket refills. */
function windowMs(): number {
  const parsed = Number(process.env.RENDER_RATE_WINDOW_MS);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 60_000;
}

const buckets = new Map<string, Bucket>();

// Evict idle buckets so the map can't grow unbounded from one-off IPs.
const IDLE_EVICT_MS = 60 * 60 * 1000;

/**
 * Consume one token for `ip`. Returns true if allowed, false if the bucket is
 * empty (caller should respond 429).
 */
export function checkRateLimit(ip: string): boolean {
  const cap = limit();
  // Tokens refilled per ms so a full window restores the whole capacity.
  const ratePerMs = cap / windowMs();
  const now = Date.now();

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: cap, updatedAt: now };
    buckets.set(ip, bucket);
  } else {
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(cap, bucket.tokens + elapsed * ratePerMs);
    bucket.updatedAt = now;
  }

  if (bucket.tokens < 1) {
    return false;
  }

  bucket.tokens -= 1;

  // Opportunistic eviction of long-idle buckets (kept tiny — only on access).
  if (buckets.size > 1000) {
    for (const [key, b] of buckets) {
      if (now - b.updatedAt > IDLE_EVICT_MS) buckets.delete(key);
    }
  }

  return true;
}
