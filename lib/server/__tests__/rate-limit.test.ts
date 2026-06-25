/**
 * Unit tests for lib/server/rate-limit.ts
 *
 * Run with:  bunx vitest run lib/server/__tests__/rate-limit.test.ts
 *
 * The module reads RENDER_RATE_LIMIT (token-bucket capacity) and
 * RENDER_RATE_WINDOW_MS (the window over which a full bucket refills) from env
 * at call-time, so we override those per-test without re-importing. Refill rate
 * is capacity / windowMs per ms, so one token refills in (windowMs / capacity) ms.
 *
 * The in-memory `buckets` Map is a module-level singleton shared across tests in
 * this file, so we use a fresh IP per test to avoid cross-test interference.
 *
 * Clock: checkRateLimit() uses Date.now(); we swap in vi.useFakeTimers() to
 * advance time and exercise refill.
 *
 * --- Seam note ---
 * No exported reset/inject hook exists; (a) unique IPs per test + (b) fake timers
 * are sufficient. A future `_resetBuckets()` export would remove the unique-IP
 * requirement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so importing the module doesn't blow up outside Next.js.
vi.mock("server-only", () => ({}));

import { checkRateLimit } from "@/lib/server/rate-limit";

// ---------------------------------------------------------------------------
// Reset env and timers between tests
// ---------------------------------------------------------------------------

let ipCounter = 0;
/** Each call returns a fresh IP string that no prior test has used. */
function freshIp(): string {
  return `10.0.0.${++ipCounter}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  // Defaults mirror the module defaults: capacity 5, full refill over 60 s.
  process.env.RENDER_RATE_LIMIT = "5";
  process.env.RENDER_RATE_WINDOW_MS = "60000";
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.RENDER_RATE_LIMIT;
  delete process.env.RENDER_RATE_WINDOW_MS;
});

// ---------------------------------------------------------------------------
// Allow up to capacity
// ---------------------------------------------------------------------------

describe("checkRateLimit — allow up to capacity", () => {
  it("allows the first request for a new IP", () => {
    expect(checkRateLimit(freshIp())).toBe(true);
  });

  it("allows exactly RENDER_RATE_LIMIT=3 requests in a row", () => {
    process.env.RENDER_RATE_LIMIT = "3";
    process.env.RENDER_RATE_WINDOW_MS = "60000";
    const ip = freshIp();
    expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(true);
  });

  it("allows exactly RENDER_RATE_LIMIT=5 requests before blocking", () => {
    process.env.RENDER_RATE_LIMIT = "5";
    process.env.RENDER_RATE_WINDOW_MS = "60000";
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Block once the bucket is empty
// ---------------------------------------------------------------------------

describe("checkRateLimit — block over limit", () => {
  it("blocks the (LIMIT+1)th request", () => {
    process.env.RENDER_RATE_LIMIT = "3";
    process.env.RENDER_RATE_WINDOW_MS = "60000";
    const ip = freshIp();
    checkRateLimit(ip); // 1
    checkRateLimit(ip); // 2
    checkRateLimit(ip); // 3 — exhausted
    expect(checkRateLimit(ip)).toBe(false); // 4 — blocked
  });

  it("continues to block on repeated requests while bucket is empty", () => {
    process.env.RENDER_RATE_LIMIT = "1";
    process.env.RENDER_RATE_WINDOW_MS = "60000";
    const ip = freshIp();
    checkRateLimit(ip); // consume the single token
    expect(checkRateLimit(ip)).toBe(false);
    expect(checkRateLimit(ip)).toBe(false);
  });

  it("does not affect a different IP's bucket", () => {
    process.env.RENDER_RATE_LIMIT = "1";
    process.env.RENDER_RATE_WINDOW_MS = "60000";
    const ipA = freshIp();
    const ipB = freshIp();
    checkRateLimit(ipA); // exhaust A
    expect(checkRateLimit(ipA)).toBe(false); // A blocked
    expect(checkRateLimit(ipB)).toBe(true); // B unaffected
  });
});

// ---------------------------------------------------------------------------
// Token refill over time (refill rate = capacity / windowMs per ms)
// ---------------------------------------------------------------------------

describe("checkRateLimit — token refill", () => {
  it("refills a token after a full window/capacity period", () => {
    process.env.RENDER_RATE_LIMIT = "1";
    process.env.RENDER_RATE_WINDOW_MS = "60000"; // 1 token refills in 60 000 ms

    const ip = freshIp();
    checkRateLimit(ip); // consume the single token
    expect(checkRateLimit(ip)).toBe(false); // blocked

    vi.advanceTimersByTime(60_000); // one full refill period
    expect(checkRateLimit(ip)).toBe(true); // refilled
  });

  it("does not refill beyond capacity", () => {
    process.env.RENDER_RATE_LIMIT = "2";
    process.env.RENDER_RATE_WINDOW_MS = "60000";

    const ip = freshIp();
    checkRateLimit(ip);
    checkRateLimit(ip);
    expect(checkRateLimit(ip)).toBe(false);

    // Advance far past the window — tokens must cap at capacity (2).
    vi.advanceTimersByTime(10 * 60_000);
    expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(false); // 3rd blocked
  });

  it("partial refill restores one token after windowMs/capacity elapses", () => {
    process.env.RENDER_RATE_LIMIT = "1";
    process.env.RENDER_RATE_WINDOW_MS = "30000"; // 1 token refills in 30 000 ms

    const ip = freshIp();
    checkRateLimit(ip); // consume
    expect(checkRateLimit(ip)).toBe(false);

    vi.advanceTimersByTime(30_000); // exactly one token back
    expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(false); // consumed again
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("checkRateLimit — edge cases", () => {
  it("treats different IP strings as independent buckets", () => {
    process.env.RENDER_RATE_LIMIT = "1";
    const ips = [freshIp(), freshIp(), freshIp()];
    for (const ip of ips) {
      expect(checkRateLimit(ip)).toBe(true);
    }
  });

  it("uses the 'unknown' fallback IP without throwing", () => {
    // The route falls back to "unknown" when no IP header is present.
    expect(() => checkRateLimit("unknown")).not.toThrow();
  });
});
