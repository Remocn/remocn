# Plan 005: Make the render rate limit unspoofable and cap the render queue depth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- app/api/render lib/server`
> On any drift, compare the excerpts below against live code; mismatch = STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-port-vitest-tests-to-bun.md (working tests for these exact files)
- **Category**: security
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`POST /api/render` starts a native Chromium render (CPU-heavy, ~2 concurrent on the box). The per-IP token bucket that protects it is keyed on the FIRST hop of `X-Forwarded-For` — a client-controlled value behind the production proxy (Coolify/Traefik APPENDS the real client IP to whatever XFF the client sent, so the leftmost entry is attacker-chosen). Rotating the header mints a fresh full bucket per request, fully bypassing the limit. Compounding it, the render queue (`p-limit`) has no depth cap, so bypassed requests pile up unboundedly. Together: a cheap DoS on a public endpoint.

## Current state

`app/api/render/route.ts:60-68`:

```ts
/** First hop of x-forwarded-for (the real client behind the proxy), else fallback. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
```

`lib/server/render-queue.ts:48-49`:

```ts
const limit = pLimit(maxConcurrent());
const jobs = new Map<string, JobState>();
```

`lib/server/render-queue.ts:56-79` — `enqueueRender(input)` registers the job and calls `void limit(() => runRender(...))` with no check on how many are already waiting. `p-limit` instances expose `.activeCount` and `.pendingCount`.

Deployment topology: exactly ONE trusting proxy (Traefik via Coolify) in front of the Node process. Traefik sets `X-Real-IP` to the actual peer and appends the peer to `X-Forwarded-For`. Therefore the trustworthy client identity is: `X-Real-IP`, or equivalently the LAST entry of `X-Forwarded-For`.

Env-config conventions in this codebase (`lib/server/rate-limit.ts:20-29`): numeric env vars parsed with `Number(...)`, validated with `Number.isFinite`, floored, with a sane default. Follow that pattern for the new queue-cap variable. `.env.example` documents all `RENDER_*` vars — add the new one there too.

Repo conventions: bun + biome; NEVER add code comments (including JSDoc is also banned for new code — but the file's existing comment style may be left as-is; match surrounding code minimally); English strings only.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Focused tests | `bun test lib/server app/api/render` | all pass |
| Full suite | `bun run test 2>&1 \| tail -3` | 0 fail |
| Typecheck | `bunx tsc --noEmit` | no NEW errors vs your starting baseline |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:
- `app/api/render/route.ts` (the `clientIp` function; the POST handler's queue-full response)
- `lib/server/render-queue.ts` (queue-depth cap)
- `lib/server/__tests__/render-queue.test.ts`, `app/api/render/__tests__/route.test.ts` (extend)
- `.env.example` (document the new env var)

**Out of scope**:
- `lib/server/rate-limit.ts` — the bucket math is correct; the bug is the key, not the bucket.
- Any distributed/redis rate limiting — single-process is a deliberate design (see the module comment in rate-limit.ts).
- `app/api/render/[jobId]/**` routes.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Fix `clientIp` to trust only the proxy-set hop

Rewrite `clientIp` in `app/api/render/route.ts` to, in order:
1. `x-real-ip` header (set by Traefik) if non-empty;
2. else the LAST comma-separated entry of `x-forwarded-for`, trimmed;
3. else `"unknown"`.

Update the function's doc comment to match (this file documents each function — keep that style consistent by editing the existing comment text, not adding new commentary elsewhere).

**Verify**: `bun test app/api/render` → pass (after Step 3's test updates; running now shows which existing assertions encode the old first-hop behavior — update those in Step 3, not the source).

### Step 2: Cap the queue depth

In `lib/server/render-queue.ts`:
- Add a `maxQueueDepth()` env reader following the exact pattern of `maxConcurrent()` (lines 37-40): env var `RENDER_MAX_QUEUE`, default `10`, minimum 1.
- Export a new error class `QueueFullError extends Error` (name it so the route can `instanceof` it).
- At the top of `enqueueRender`, before registering the job: if `limit.activeCount + limit.pendingCount >= maxQueueDepth()`, throw `QueueFullError`.

In `app/api/render/route.ts` POST handler: wrap the `enqueueRender(input)` call; on `QueueFullError` return status 503 with body `{ error: "Render queue is full. Please retry shortly.", code: "queue_full" }` (match the existing error-body shape used for `rate_limited` at lines 27-30).

Add `RENDER_MAX_QUEUE` to `.env.example` alongside the other `RENDER_*` variables, matching their documentation style.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 3: Extend the tests

In `app/api/render/__tests__/route.test.ts` add cases:
- XFF spoof: request with `x-forwarded-for: "1.1.1.1, 9.9.9.9"` and no `x-real-ip` → the rate limiter is called with `"9.9.9.9"` (last hop), not `"1.1.1.1"`.
- `x-real-ip: "2.2.2.2"` present alongside XFF → limiter called with `"2.2.2.2"`.
- `enqueueRender` throwing `QueueFullError` → response is 503 with `code: "queue_full"`.

In `lib/server/__tests__/render-queue.test.ts` add: with `RENDER_MAX_QUEUE=1` (set/restore `process.env` inside the test) and one job occupying the limiter, a second `enqueueRender` throws `QueueFullError`.

Fix any existing assertions that encoded the old first-hop behavior.

**Verify**: `bun test lib/server app/api/render` → all pass, including ≥4 new tests.

## Test plan

Covered in Step 3. Pattern: model after the existing structure of `app/api/render/__tests__/route.test.ts` (module mocks + `makePostRequest(body, ip)` helper — extend the helper to accept headers).

## Done criteria

- [ ] `clientIp` never returns a client-controlled XFF first hop (verified by the spoof test)
- [ ] `enqueueRender` throws `QueueFullError` at the cap; route maps it to 503 `queue_full`
- [ ] `RENDER_MAX_QUEUE` documented in `.env.example`
- [ ] `bun run test` → 0 fail; `bunx tsc --noEmit` → no new errors; `bun run build` → exit 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpted `clientIp` or `enqueueRender` no longer matches the live code.
- `p-limit`'s installed version lacks `.activeCount`/`.pendingCount` (check `node_modules/p-limit/index.d.ts`) — report; do not hand-roll a counter without flagging it.
- Plan 003 has not landed (these test files still import vitest) — land it first or report.

## Maintenance notes

- If the site is ever fronted by MORE than one proxy layer (e.g. a CDN before Traefik), the "last XFF hop" rule must become "Nth-from-last, N = trusted hop count" — revisit `clientIp` at that point.
- The queue cap interacts with Plan 006's job eviction: capped queue keeps the jobs Map bounded on the intake side; eviction bounds it on the retention side. Both are needed.
- Reviewer: confirm the 503 (not 429) choice for queue-full — 429 is per-client, 503 signals server-wide saturation, which is what a full queue is.
