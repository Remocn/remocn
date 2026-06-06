/**
 * Unit tests for app/api/stargazers/route.ts
 *
 * Run with:  bunx vitest run app/api/stargazers/__tests__/route.test.ts
 *
 * fetchStargazers is mocked so no real network is hit.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock the data-layer module before importing the route handler.
// ---------------------------------------------------------------------------
vi.mock("@/lib/github-stargazers", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/github-stargazers")>();
  return {
    ...actual,
    fetchStargazers: vi.fn(),
  };
});

import { GET } from "@/app/api/stargazers/route";
import {
  StargazersError,
  fetchStargazers,
} from "@/lib/github-stargazers";

const mockFetchStargazers = vi.mocked(fetchStargazers);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.GITHUB_TOKEN;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal NextRequest-compatible object. */
function makeRequest(repoParam?: string): Request {
  const url = repoParam
    ? `http://localhost/api/stargazers?repo=${encodeURIComponent(repoParam)}`
    : "http://localhost/api/stargazers";
  return new Request(url);
}

const SAMPLE_STARGAZERS = [
  {
    login: "alice",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    starredAt: "2021-01-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// 400 — invalid / missing ?repo=
// ---------------------------------------------------------------------------

describe("GET /api/stargazers — 400 invalid_repo", () => {
  it("returns 400 when ?repo= is missing entirely", async () => {
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_repo");
  });

  it("returns 400 when ?repo= is an empty string", async () => {
    const res = await GET(makeRequest("") as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_repo");
  });

  it("returns 400 when ?repo= is not a valid owner/name", async () => {
    const res = await GET(makeRequest("not-a-valid-repo-string") as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_repo");
  });

  it("returns 400 on bare owner with no slash", async () => {
    const res = await GET(makeRequest("justowner") as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_repo");
  });
});

// ---------------------------------------------------------------------------
// 200 — success shape
// ---------------------------------------------------------------------------

describe("GET /api/stargazers — 200 success", () => {
  it("returns 200 with correct shape on a valid repo", async () => {
    mockFetchStargazers.mockResolvedValueOnce({
      stargazers: SAMPLE_STARGAZERS,
      totalStars: 42,
      truncated: false,
    });

    const res = await GET(makeRequest("vercel/next.js") as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      owner: "vercel",
      repo: "next.js",
      totalStars: 42,
      truncated: false,
      stargazers: SAMPLE_STARGAZERS,
    });
  });

  it("includes all required top-level keys", async () => {
    mockFetchStargazers.mockResolvedValueOnce({
      stargazers: [],
      totalStars: 0,
      truncated: false,
    });

    const res = await GET(makeRequest("facebook/react") as never);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(
      ["owner", "repo", "totalStars", "truncated", "stargazers"].sort(),
    );
  });

  it("accepts a full github.com URL as ?repo=", async () => {
    mockFetchStargazers.mockResolvedValueOnce({
      stargazers: [],
      totalStars: 1,
      truncated: false,
    });

    const res = await GET(
      makeRequest("https://github.com/vercel/next.js") as never,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.owner).toBe("vercel");
    expect(body.repo).toBe("next.js");
  });

  it("totalStars in the response matches what fetchStargazers returned", async () => {
    mockFetchStargazers.mockResolvedValueOnce({
      stargazers: SAMPLE_STARGAZERS,
      totalStars: 9999,
      truncated: true,
    });

    const res = await GET(makeRequest("owner/repo") as never);
    const body = await res.json();
    expect(body.totalStars).toBe(9999);
    expect(body.truncated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

describe("GET /api/stargazers — error code mapping", () => {
  it("maps StargazersError not_found → 404", async () => {
    mockFetchStargazers.mockRejectedValueOnce(
      new StargazersError("not_found", "Repository not found.", 404),
    );

    const res = await GET(makeRequest("owner/missing") as never);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
  });

  it("maps StargazersError rate_limited → 429", async () => {
    mockFetchStargazers.mockRejectedValueOnce(
      new StargazersError("rate_limited", "Rate limit exceeded.", 429),
    );

    const res = await GET(makeRequest("owner/repo") as never);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe("rate_limited");
  });

  it("maps StargazersError fetch_failed → 502", async () => {
    mockFetchStargazers.mockRejectedValueOnce(
      new StargazersError("fetch_failed", "Network error.", 502),
    );

    const res = await GET(makeRequest("owner/repo") as never);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("fetch_failed");
  });

  it("maps AbortError (client cancel) → 499 with empty body", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    mockFetchStargazers.mockRejectedValueOnce(abort);

    const res = await GET(makeRequest("owner/repo") as never);
    expect(res.status).toBe(499);
    // Body must be null/empty — not JSON
    const text = await res.text();
    expect(text).toBe("");
  });

  it("maps an unexpected Error → 502 fetch_failed", async () => {
    mockFetchStargazers.mockRejectedValueOnce(new Error("something broke"));

    const res = await GET(makeRequest("owner/repo") as never);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("fetch_failed");
  });
});

// ---------------------------------------------------------------------------
// Security: GITHUB_TOKEN must never appear in any response body
// ---------------------------------------------------------------------------

describe("GET /api/stargazers — token never leaks", () => {
  it("does not include GITHUB_TOKEN in a 200 response", async () => {
    process.env.GITHUB_TOKEN = "ghp_supersecret_200";

    mockFetchStargazers.mockResolvedValueOnce({
      stargazers: SAMPLE_STARGAZERS,
      totalStars: 1,
      truncated: false,
    });

    const res = await GET(makeRequest("owner/repo") as never);
    const text = await res.text();
    expect(text).not.toContain("ghp_supersecret_200");
  });

  it("does not include GITHUB_TOKEN in a 404 error response", async () => {
    process.env.GITHUB_TOKEN = "ghp_supersecret_404";

    mockFetchStargazers.mockRejectedValueOnce(
      new StargazersError("not_found", "Not found.", 404),
    );

    const res = await GET(makeRequest("owner/missing") as never);
    const text = await res.text();
    expect(text).not.toContain("ghp_supersecret_404");
  });

  it("does not include GITHUB_TOKEN in a 502 error response", async () => {
    process.env.GITHUB_TOKEN = "ghp_supersecret_502";

    mockFetchStargazers.mockRejectedValueOnce(new Error("boom"));

    const res = await GET(makeRequest("owner/repo") as never);
    const text = await res.text();
    expect(text).not.toContain("ghp_supersecret_502");
  });
});
