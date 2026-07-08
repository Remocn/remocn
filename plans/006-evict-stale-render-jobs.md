# Plan 006: Evict failed/stale render jobs from the in-memory registry

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- lib/server`
> On any drift, compare the excerpts below against live code; mismatch = STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-port-vitest-tests-to-bun.md
- **Category**: bug
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

The render job registry (`jobs` Map in `lib/server/render-queue.ts`) is cleaned only via two paths, and BOTH are keyed off an `.mp4` file existing on disk. A render that fails before producing its file — bad input at render time, Chromium crash, the 120s timeout — sets `status: "error"` and never writes a file, so its `JobState` entry is never removed. On a long-lived production process this is a monotonic memory leak, and combined with the rate-limit bypass (fixed in Plan 005) it becomes an exhaustion vector.

## Current state

`lib/server/render-queue.ts:49` — `const jobs = new Map<string, JobState>();`. Entries are added in `enqueueRender` (line 66). `JobState` (lines 23-34) includes `createdAt: number` and `status: "queued" | "rendering" | "done" | "error"`.

The ONLY callers of `deleteJob` (verified repo-wide at `361f442`) are both in `lib/server/cleanup.ts`:
- `deleteJobFile(jobId)` (lines ~27-35) — deletes `${jobId}.mp4` then `deleteJob(jobId)`; called by the download route after streaming.
- `sweepOnce()` (lines ~37-63) — `readdir(RENDER_WORK_DIR)`, and for each `.mp4` older than TTL: `rm` + `deleteJob(basename)`.

So: no file ⇒ no eviction. Error-status jobs live forever.

`cleanup.ts` helpers: `ttlMs()` reads `RENDER_FILE_TTL_MS` (default 600_000); the sweep runs every `max(60_000, ttlMs())` ms via a module-guarded `setInterval` installed by `ensureCleanupSweep()`.

`render-queue.ts` exports `listJobs(): ReadonlyMap<string, JobState>` (line 92-94) — added precisely as a "read-only view of the registry for the TTL sweep", currently unused by the sweep. It returns the live Map (read-only typed), so `deleteJob` during iteration is safe (Map supports delete-during-iterate).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Focused tests | `bun test lib/server` | all pass |
| Full suite | `bun run test 2>&1 \| tail -3` | 0 fail |
| Typecheck | `bunx tsc --noEmit` | no new errors |

## Scope

**In scope**:
- `lib/server/cleanup.ts` (extend `sweepOnce`)
- A new test file `lib/server/__tests__/cleanup.test.ts` (bun:test)

**Out of scope**:
- `lib/server/render-queue.ts` — `listJobs`/`deleteJob` already provide everything needed; do not add new exports.
- The download route and its post-stream deletion behavior (Plan covering it may exist separately; do not fix it here).
- Changing TTL defaults or the sweep interval.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Add registry eviction to `sweepOnce`

In `lib/server/cleanup.ts`, import `listJobs` (already exported; `deleteJob` is already imported). After the existing file loop in `sweepOnce`, iterate `listJobs()` and `deleteJob(jobId)` for every entry where `now - job.createdAt > ttl` AND `job.status === "error"`.

Also evict `done` jobs older than TTL whose file no longer exists (covers a swept file whose registry entry lingered because the sweep's `deleteJob` raced): for `status === "done"` entries older than TTL, it is safe to delete unconditionally — their file, if it still exists, is itself older than TTL and the file loop just removed it.

Do NOT evict `queued`/`rendering` entries: with Plan 005's queue cap their count is bounded, and evicting a queued job would orphan its eventual `runRender` write-back (`runRender` re-fetches the job by id and no-ops if missing — see `render-queue.ts:101-102` — so even that would be harmless, but leave live jobs alone).

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 2: Write `lib/server/__tests__/cleanup.test.ts`

bun:test file (import from `"bun:test"`; mock `server-only` via `mock.module("server-only", () => ({}))` — copy the pattern from the Plan-003-ported `lib/server/__tests__/render-queue.test.ts`). Cases:

1. An error-status job older than TTL is removed from the registry after `sweepOnce` runs (drive `sweepOnce` indirectly: exporting it is out of scope — instead trigger via the interval? No: see STOP note below. Preferred: refactor-free approach — test through the real seam: `enqueueRender` a job you force to fail fast, then... this requires time control). PRAGMATIC PATH: export `sweepOnce` from `cleanup.ts` for testability (a named export used only by tests is acceptable here and is the ONE exception to "no new exports" — it lives in cleanup.ts, not render-queue.ts). Then: create an error job by calling `enqueueRender` with a mocked `renderStarsVideo` (mock `./render` module) that rejects; await settle; backdate `createdAt` via the entry from `listJobs()` (entries are live objects — mutating `createdAt` in the test is acceptable); run `await sweepOnce()`; assert `getJob(jobId)` is undefined.
2. An error job YOUNGER than TTL survives the sweep.
3. A `rendering`-status entry is never evicted regardless of age.

**Verify**: `bun test lib/server/__tests__/cleanup.test.ts` → 3 new tests pass.

### Step 3: Full gate

**Verify**: `bun run test 2>&1 | tail -3` → 0 fail. `bun run build` → exit 0.

## Test plan

Covered in Step 2. Model file structure after `lib/server/__tests__/render-queue.test.ts` (post-Plan-003 version).

## Done criteria

- [ ] `sweepOnce` evicts error-status entries older than TTL and done-status entries older than TTL
- [ ] `queued`/`rendering` entries are never evicted (asserted by a test)
- [ ] `bun run test` → 0 fail; no new tsc errors
- [ ] Only `lib/server/cleanup.ts` and the new test file changed
- [ ] `plans/README.md` status row updated

## STOP conditions

- The live `cleanup.ts`/`render-queue.ts` no longer match the excerpts (e.g. someone already added eviction).
- Plan 003 hasn't landed (`lib/server/__tests__/render-queue.test.ts` still imports vitest).
- Testing `sweepOnce` proves impossible without touching `render-queue.ts` internals beyond `listJobs`/`getJob`/`enqueueRender` — report the seam problem instead of restructuring the queue.

## Maintenance notes

- If job state ever moves out of process memory (e.g. the planned @remocn/render-sdk extraction — see RENDER_SDK.md), this sweep logic must move with it; it is the retention half of the bounded-registry invariant (Plan 005's queue cap is the intake half).
- Reviewer: check the eviction predicate ordering — status check before age check costs nothing but reads clearer; and confirm no eviction of live jobs.
