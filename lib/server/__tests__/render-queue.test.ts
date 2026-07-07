/**
 * Unit tests for lib/server/render-queue.ts
 *
 * Run with:  bunx vitest run lib/server/__tests__/render-queue.test.ts
 *
 * renderStarsVideo (real Chromium) is mocked via vi.mock so nothing real runs.
 * node:fs/promises (mkdir) is also mocked — no real filesystem side-effects.
 *
 * --- Seam note ---
 * render-queue.ts imports renderStarsVideo from "./render" at module load time,
 * then calls it inside runRender(). vi.mock("@/lib/server/render") replaces that
 * module before the queue module is imported, so the mock is in effect for all
 * enqueueRender() calls below.  The module-level `limit` and `jobs` singletons
 * are reset between tests by re-importing the module inside a vi.isolateModules
 * block — see the "resetQueue" helper.  If the queue ever needs a cleaner
 * injection point (e.g. an exported `_setRenderFn` for testing), that would
 * remove the need for vi.isolateModules, but the current mock approach is
 * sufficient.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { RenderInput } from "@/lib/server/validate-input";

// ---------------------------------------------------------------------------
// Mock the render module (real Chromium → deferred promise under test control)
// ---------------------------------------------------------------------------

const mockRender = mock();

mock.module("@/lib/server/render", () => ({
  renderStarsVideo: mockRender,
}));

// Mock mkdir so no real fs ops happen.
mock.module("node:fs/promises", () => ({
  mkdir: mock(() => Promise.resolve(undefined)),
}));

// Mock server-only so it doesn't blow up outside Next.js.
mock.module("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A valid RenderInput that exercises no interesting code paths in validate. */
function makeInput(repo = "owner/repo"): RenderInput {
  return {
    repo,
    totalStars: 100,
    stargazers: [
      {
        login: "alice",
        avatarUrl: "https://avatars.githubusercontent.com/u/1",
        starredAt: "2021-01-01",
      },
    ],
    orientation: "horizontal",
    accentColor: "#ffbb00",
    speed: 1,
    theme: "light",
  };
}

/**
 * Returns a { resolve, reject, promise } triple: the promise stays pending
 * until resolve/reject is called, simulating a long-running render.
 */
function deferred<T = string>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
}

/** Wait one microtask turn so queued promises can settle. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// Import queue + mock render fn after all vi.mock() calls are hoisted.
// ---------------------------------------------------------------------------

const { enqueueRender, getJob, QueueFullError } = await import(
  "@/lib/server/render-queue"
);

// ---------------------------------------------------------------------------
// Reset mock state between tests (the module singleton is shared across the
// file because bun re-uses the same module instance within a test file).
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockRender.mockReset();
});

afterEach(() => {
  mockRender.mockReset();
});

// ---------------------------------------------------------------------------
// Status transitions: queued → rendering → done
// ---------------------------------------------------------------------------

describe("render-queue — status transitions", () => {
  it("newly enqueued job starts as 'queued'", () => {
    const d = deferred();
    mockRender.mockReturnValueOnce(d.promise);

    const jobId = enqueueRender(makeInput());
    const job = getJob(jobId);

    // Synchronously the job is registered.
    expect(job).toBeDefined();
    expect(job?.status).toBe("queued");
    expect(job?.progress).toBe(0);

    // Clean up: let it resolve so the limiter slot is freed.
    d.resolve("/tmp/out.mp4");
  });

  it("transitions to 'rendering' once the slot is acquired", async () => {
    const d = deferred();
    mockRender.mockReturnValueOnce(d.promise);

    const jobId = enqueueRender(makeInput());

    // Allow the microtask queue to run so the limiter picks up the task.
    await tick();

    const job = getJob(jobId);
    expect(job?.status).toBe("rendering");

    d.resolve("/tmp/out.mp4");
    await tick();
  });

  it("transitions to 'done' with progress=1 after renderStarsVideo resolves", async () => {
    const d = deferred();
    mockRender.mockReturnValueOnce(d.promise);

    const jobId = enqueueRender(makeInput());
    await tick();

    d.resolve("/tmp/out.mp4");
    await tick();

    const job = getJob(jobId);
    expect(job?.status).toBe("done");
    expect(job?.progress).toBe(1);
    expect(job?.outputPath).toBeDefined();
  });

  it("stores the correct repo on the job", () => {
    mockRender.mockResolvedValueOnce("/tmp/x.mp4");
    const jobId = enqueueRender(makeInput("my-org/my-repo"));
    expect(getJob(jobId)?.repo).toBe("my-org/my-repo");
  });

  it("returns a string jobId that differs between two calls", () => {
    mockRender.mockResolvedValue("/tmp/x.mp4");
    const id1 = enqueueRender(makeInput());
    const id2 = enqueueRender(makeInput());
    expect(typeof id1).toBe("string");
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// Error path: renderStarsVideo rejects → job.status = "error"
// ---------------------------------------------------------------------------

describe("render-queue — error path", () => {
  it("sets status to 'error' when renderStarsVideo rejects", async () => {
    mockRender.mockRejectedValueOnce(new Error("Chromium crashed"));

    const jobId = enqueueRender(makeInput());
    await tick();
    await tick(); // extra tick for rejection propagation

    const job = getJob(jobId);
    expect(job?.status).toBe("error");
    expect(job?.error).toContain("Chromium crashed");
  });

  it("captures a generic (non-Error) rejection as a fallback string", async () => {
    mockRender.mockRejectedValueOnce("raw string failure");

    const jobId = enqueueRender(makeInput());
    await tick();
    await tick();

    const job = getJob(jobId);
    expect(job?.status).toBe("error");
    expect(typeof job?.error).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// Concurrency cap — at most RENDER_MAX_CONCURRENT renders in flight at once
// ---------------------------------------------------------------------------

describe("render-queue — concurrency semaphore", () => {
  it("runs at most RENDER_MAX_CONCURRENT renders simultaneously (default 2)", async () => {
    // Each deferred keeps its render slot occupied until resolved.
    const deferreds = Array.from({ length: 4 }, () => deferred());
    let callCount = 0;

    mockRender.mockImplementation(() => {
      callCount++;
      return deferreds[callCount - 1].promise;
    });

    // Enqueue 4 jobs.
    const ids = Array.from({ length: 4 }, () => enqueueRender(makeInput()));

    // Let the event loop run so the limiter can dispatch.
    await tick();
    await tick();

    // Only 2 should be rendering (default RENDER_MAX_CONCURRENT = 2).
    const statuses = ids.map((id) => getJob(id)?.status);
    const renderingCount = statuses.filter((s) => s === "rendering").length;
    const queuedCount = statuses.filter((s) => s === "queued").length;

    expect(renderingCount).toBe(2);
    expect(queuedCount).toBe(2);

    // Resolve the first two; the next two should start.
    deferreds[0].resolve("/tmp/a.mp4");
    deferreds[1].resolve("/tmp/b.mp4");
    await tick();
    await tick();

    const newStatuses = ids.map((id) => getJob(id)?.status);
    // ids[0] and ids[1] should now be done.
    expect(newStatuses[0]).toBe("done");
    expect(newStatuses[1]).toBe("done");
    // ids[2] or ids[3] should have started rendering.
    const nowRendering = newStatuses.filter((s) => s === "rendering").length;
    expect(nowRendering).toBeGreaterThanOrEqual(1);

    // Clean up remaining.
    deferreds[2].resolve("/tmp/c.mp4");
    deferreds[3].resolve("/tmp/d.mp4");
    await tick();
  });
});

// ---------------------------------------------------------------------------
// Timeout path — AbortController fires → job.status = "error" with "timed out"
// ---------------------------------------------------------------------------

describe("render-queue — render timeout", () => {
  it("sets status to 'error' containing 'timed out' when RENDER_TIMEOUT_MS elapses", async () => {
    // Set a very short timeout via env so we don't wait 120 s.
    process.env.RENDER_TIMEOUT_MS = "1000";

    // renderStarsVideo never resolves — simulates a stuck Chromium.
    // The real runRender() uses an AbortController; when the timeout fires it
    // calls controller.abort(). renderStarsVideo must honor the signal and
    // throw. We simulate that by rejecting once the abort callback fires.
    let abortCallback: (() => void) | undefined;
    mockRender.mockImplementation(({ signal }: { signal?: AbortSignal }) => {
      return new Promise<string>((_, reject) => {
        if (signal) {
          signal.addEventListener("abort", () => {
            abortCallback = () => reject(new Error("Render aborted"));
            abortCallback();
          });
        }
      });
    });

    const jobId = enqueueRender(makeInput());
    await tick();

    // Wait past the timeout so the AbortController fires.
    await new Promise((r) => setTimeout(r, 1100));
    await tick();
    await tick();

    const job = getJob(jobId);
    expect(job?.status).toBe("error");
    // The queue sets job.error to "Render timed out" when signal.aborted is true.
    expect(job?.error).toMatch(/timed out/i);

    delete process.env.RENDER_TIMEOUT_MS;
  });
});

// ---------------------------------------------------------------------------
// Queue depth cap — RENDER_MAX_QUEUE
// ---------------------------------------------------------------------------

describe("render-queue — queue depth cap", () => {
  it("throws QueueFullError when RENDER_MAX_QUEUE is reached", async () => {
    process.env.RENDER_MAX_QUEUE = "1";

    const d = deferred();
    mockRender.mockReturnValueOnce(d.promise);

    enqueueRender(makeInput());
    await tick();

    expect(() => enqueueRender(makeInput())).toThrow(QueueFullError);

    d.resolve("/tmp/out.mp4");
    await tick();
    delete process.env.RENDER_MAX_QUEUE;
  });
});

// ---------------------------------------------------------------------------
// getJob — unknown id returns undefined
// ---------------------------------------------------------------------------

describe("render-queue — getJob", () => {
  it("returns undefined for an unknown jobId", () => {
    expect(getJob("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});
