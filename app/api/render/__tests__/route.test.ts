/**
 * Unit tests for app/api/render/route.ts  (POST /api/render)
 *               app/api/render/[jobId]/route.ts  (GET /api/render/[jobId])
 *
 * Run with:  bunx vitest run app/api/render/__tests__/route.test.ts
 *
 * enqueueRender, checkRateLimit, getJob, and ensureCleanupSweep are all mocked
 * so no real renders, rate-buckets, or filesystem ops occur.
 */

import { afterEach, describe, expect, it, mock } from "bun:test";
import type { JobState } from "@/lib/server/render-queue";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the route handlers.
// ---------------------------------------------------------------------------

const mockEnqueue = mock();
const mockGetJob = mock();
const mockCheckRate = mock();

mock.module("server-only", () => ({}));

class MockQueueFullError extends Error {
  constructor() {
    super("Render queue is full");
    this.name = "QueueFullError";
  }
}

mock.module("@/lib/server/render-queue", () => ({
  enqueueRender: mockEnqueue,
  getJob: mockGetJob,
  QueueFullError: MockQueueFullError,
}));

mock.module("@/lib/server/rate-limit", () => ({
  checkRateLimit: mockCheckRate,
}));

mock.module("@/lib/server/cleanup", () => ({
  ensureCleanupSweep: mock(),
}));

// validate-input is NOT mocked: we use the real parser so the route's
// validation path is exercised end-to-end.

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

const { POST } = await import("@/app/api/render/route");
const { GET } = await import("@/app/api/render/[jobId]/route");

afterEach(() => {
  mockEnqueue.mockClear();
  mockGetJob.mockClear();
  mockCheckRate.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal NextRequest-compatible Request for POST /api/render. */
function makePostRequest(
  body: unknown,
  ip = "1.2.3.4",
  extraHeaders?: Record<string, string>,
): Request {
  return new Request("http://localhost/api/render", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** A valid render payload that passes parseRenderInput. */
function validPayload(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    repo: "vercel/next.js",
    totalStars: 50_000,
    stargazers: [
      {
        login: "bob",
        avatarUrl: "https://avatars.githubusercontent.com/u/2",
        starredAt: "2022-06-15",
      },
    ],
    orientation: "horizontal",
    ...overrides,
  };
}

/** Build a GET request for /api/render/[jobId]. */
function makeGetRequest(jobId: string): Request {
  return new Request(`http://localhost/api/render/${jobId}`);
}

/** Resolve params the same way Next.js does for dynamic routes. */
function makeGetParams(jobId: string): { params: Promise<{ jobId: string }> } {
  return { params: Promise.resolve({ jobId }) };
}

// ---------------------------------------------------------------------------
// POST /api/render — 429 rate limited
// ---------------------------------------------------------------------------

describe("POST /api/render — 429 rate limited", () => {
  it("returns 429 with code rate_limited when checkRateLimit returns false", async () => {
    mockCheckRate.mockReturnValue(false);

    const res = await POST(makePostRequest(validPayload()) as never);

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe("rate_limited");
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("does not include any absolute path in a 429 response body", async () => {
    mockCheckRate.mockReturnValue(false);
    const res = await POST(makePostRequest(validPayload()) as never);
    const text = await res.text();
    expect(text).not.toMatch(/\/(Users|home|var|tmp)\//);
  });
});

// ---------------------------------------------------------------------------
// POST /api/render — 400 invalid JSON
// ---------------------------------------------------------------------------

describe("POST /api/render — 400 invalid JSON", () => {
  it("returns 400 with code invalid_json when body is not valid JSON", async () => {
    mockCheckRate.mockReturnValue(true);

    const res = await POST(
      new Request("http://localhost/api/render", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: "{ not valid json !!!",
      }) as never,
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_json");
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/render — 400 invalid input
// ---------------------------------------------------------------------------

describe("POST /api/render — 400 invalid input", () => {
  it("returns 400 with code invalid_input when orientation is wrong", async () => {
    mockCheckRate.mockReturnValue(true);

    const res = await POST(
      makePostRequest(validPayload({ orientation: "diagonal" })) as never,
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_input");
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("returns 400 with code invalid_input when body is a non-object (array)", async () => {
    mockCheckRate.mockReturnValue(true);

    const res = await POST(makePostRequest([1, 2, 3]) as never);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_input");
  });

  it("returns 400 with code invalid_input when stargazers exceeds 60", async () => {
    mockCheckRate.mockReturnValue(true);
    const many = Array.from({ length: 61 }, (_, i) => ({
      login: `user${i}`,
      avatarUrl: `https://example.com/u/${i}`,
      starredAt: "2021-01-01",
    }));

    const res = await POST(
      makePostRequest(validPayload({ stargazers: many })) as never,
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_input");
  });

  it("returns 400 with code invalid_input when repo is missing", async () => {
    mockCheckRate.mockReturnValue(true);
    const payload = validPayload();
    delete payload.repo;

    const res = await POST(makePostRequest(payload) as never);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_input");
  });

  it("does not leak absolute paths in invalid_input error message", async () => {
    mockCheckRate.mockReturnValue(true);
    const res = await POST(
      makePostRequest(validPayload({ orientation: "sideways" })) as never,
    );
    const text = await res.text();
    expect(text).not.toMatch(/\/(Users|home|var|tmp)\//);
  });
});

// ---------------------------------------------------------------------------
// POST /api/render — 202 success
// ---------------------------------------------------------------------------

describe("POST /api/render — 202 success", () => {
  it("returns 202 with { jobId } on a valid request", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("test-job-id-abc");

    const res = await POST(makePostRequest(validPayload()) as never);

    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body).toEqual({ jobId: "test-job-id-abc" });
  });

  it("calls enqueueRender with the parsed input (not raw body)", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("job-xyz");

    await POST(makePostRequest(validPayload({ speed: 10 })) as never); // speed 10 → clamped to 4

    expect(mockEnqueue).toHaveBeenCalledOnce();
    const calledWith = mockEnqueue.mock.calls[0][0];
    expect(calledWith.speed).toBe(4); // clamped
    expect(calledWith.accentColor).toBe("#ffbb00"); // default applied
    expect(calledWith.theme).toBe("light"); // default applied
  });

  it("extracts IP from x-forwarded-for header and passes it to checkRateLimit", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("job-ip-test");

    await POST(makePostRequest(validPayload(), "203.0.113.1") as never);

    expect(mockCheckRate).toHaveBeenCalledWith("203.0.113.1");
  });

  it("uses the LAST hop of a spoofed x-forwarded-for, not the client-controlled first hop", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("job-spoof-test");

    await POST(makePostRequest(validPayload(), "1.1.1.1, 9.9.9.9") as never);

    expect(mockCheckRate).toHaveBeenCalledWith("9.9.9.9");
  });

  it("prefers x-real-ip over x-forwarded-for when both are present", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("job-real-ip-test");

    await POST(
      makePostRequest(validPayload(), "1.1.1.1, 9.9.9.9", {
        "x-real-ip": "2.2.2.2",
      }) as never,
    );

    expect(mockCheckRate).toHaveBeenCalledWith("2.2.2.2");
  });

  it("returns only { jobId } in the 202 body — no extra fields", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("clean-job");

    const res = await POST(makePostRequest(validPayload()) as never);
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["jobId"]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/render — 503 queue full
// ---------------------------------------------------------------------------

describe("POST /api/render — 503 queue full", () => {
  it("returns 503 with code queue_full when enqueueRender throws QueueFullError", async () => {
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockImplementationOnce(() => {
      throw new MockQueueFullError();
    });

    const res = await POST(makePostRequest(validPayload()) as never);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("queue_full");
  });
});

// ---------------------------------------------------------------------------
// GET /api/render/[jobId] — 404 unknown job
// ---------------------------------------------------------------------------

describe("GET /api/render/[jobId] — 404 not found", () => {
  it("returns 404 with code not_found for an unknown jobId", async () => {
    mockGetJob.mockReturnValue(undefined);

    const res = await GET(
      makeGetRequest("unknown-id") as never,
      makeGetParams("unknown-id"),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
  });

  it("does not leak absolute paths in a 404 response", async () => {
    mockGetJob.mockReturnValue(undefined);
    const res = await GET(
      makeGetRequest("ghost") as never,
      makeGetParams("ghost"),
    );
    const text = await res.text();
    expect(text).not.toMatch(/\/(Users|home|var|tmp)\//);
  });
});

// ---------------------------------------------------------------------------
// GET /api/render/[jobId] — status responses
// ---------------------------------------------------------------------------

describe("GET /api/render/[jobId] — status JSON", () => {
  it("returns status=queued and progress=0 for a queued job", async () => {
    const job: JobState = {
      status: "queued",
      progress: 0,
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job1") as never,
      makeGetParams("job1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("queued");
    expect(body.progress).toBe(0);
    expect(body.downloadUrl).toBeUndefined();
    expect(body.error).toBeUndefined();
  });

  it("returns status=rendering and a progress value for a rendering job", async () => {
    const job: JobState = {
      status: "rendering",
      progress: 0.42,
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job2") as never,
      makeGetParams("job2"),
    );

    const body = await res.json();
    expect(body.status).toBe("rendering");
    expect(body.progress).toBe(0.42);
    expect(body.downloadUrl).toBeUndefined();
  });

  it("returns status=done with downloadUrl for a finished job", async () => {
    const job: JobState = {
      status: "done",
      progress: 1,
      outputPath: "/tmp/remocn-renders/some-uuid.mp4",
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job3") as never,
      makeGetParams("job3"),
    );

    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.progress).toBe(1);
    expect(body.downloadUrl).toContain("job3");
    expect(body.downloadUrl).toContain("/api/render/");
  });

  it("does not expose the absolute outputPath in the done response", async () => {
    const job: JobState = {
      status: "done",
      progress: 1,
      outputPath: "/tmp/remocn-renders/secret.mp4",
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job3b") as never,
      makeGetParams("job3b"),
    );
    const text = await res.text();
    expect(text).not.toContain("/tmp/remocn-renders/secret.mp4");
  });

  it("returns status=error with an error message for a failed job", async () => {
    const job: JobState = {
      status: "error",
      progress: 0,
      error: "Chromium crashed",
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job4") as never,
      makeGetParams("job4"),
    );

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.error).toBe("Chromium crashed");
    expect(body.downloadUrl).toBeUndefined();
  });

  it("does not include 'error' key in a non-error job response", async () => {
    const job: JobState = {
      status: "queued",
      progress: 0,
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("job5") as never,
      makeGetParams("job5"),
    );
    const body = await res.json();
    expect("error" in body).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Security: no secrets / absolute paths in any response
// ---------------------------------------------------------------------------

describe("POST + GET — no secrets or paths leak", () => {
  it("does not expose RENDER_WORK_DIR in any success response", async () => {
    process.env.RENDER_WORK_DIR = "/secret/render/dir";
    mockCheckRate.mockReturnValue(true);
    mockEnqueue.mockReturnValue("safe-job");

    const res = await POST(makePostRequest(validPayload()) as never);
    const text = await res.text();
    expect(text).not.toContain("/secret/render/dir");

    delete process.env.RENDER_WORK_DIR;
  });

  it("does not expose RENDER_WORK_DIR in a done job response", async () => {
    process.env.RENDER_WORK_DIR = "/secret/render/dir";
    const job: JobState = {
      status: "done",
      progress: 1,
      outputPath: "/secret/render/dir/job-abc.mp4",
      repo: "owner/repo",
      createdAt: Date.now(),
    };
    mockGetJob.mockReturnValue(job);

    const res = await GET(
      makeGetRequest("jobS") as never,
      makeGetParams("jobS"),
    );
    const text = await res.text();
    expect(text).not.toContain("/secret/render/dir");

    delete process.env.RENDER_WORK_DIR;
  });
});
