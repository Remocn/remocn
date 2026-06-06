/**
 * Unit tests for lib/github-stargazers.ts
 *
 * Run with:  bunx vitest run lib/__tests__/github-stargazers.test.ts
 *
 * All network is mocked — no real GitHub requests are made.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Stargazer,
  StargazersError,
  fetchStargazers,
  parseRepoInput,
} from "@/lib/github-stargazers";

// ---------------------------------------------------------------------------
// parseRepoInput
// ---------------------------------------------------------------------------

describe("parseRepoInput", () => {
  describe("valid inputs", () => {
    it("accepts owner/name", () => {
      expect(parseRepoInput("vercel/next.js")).toEqual({
        owner: "vercel",
        repo: "next.js",
      });
    });

    it("accepts https://github.com/owner/name", () => {
      expect(parseRepoInput("https://github.com/vercel/next.js")).toEqual({
        owner: "vercel",
        repo: "next.js",
      });
    });

    it("accepts http://github.com/owner/name/ (trailing slash)", () => {
      expect(parseRepoInput("http://github.com/vercel/next.js/")).toEqual({
        owner: "vercel",
        repo: "next.js",
      });
    });

    it("accepts github.com/owner/name (no scheme)", () => {
      expect(parseRepoInput("github.com/vercel/next.js")).toEqual({
        owner: "vercel",
        repo: "next.js",
      });
    });

    it("accepts owner/name.git suffix", () => {
      expect(parseRepoInput("vercel/next.js.git")).toEqual({
        owner: "vercel",
        repo: "next.js",
      });
    });

    it("accepts https URL with /tree/main extra path", () => {
      expect(
        parseRepoInput("https://github.com/vercel/next.js/tree/main"),
      ).toEqual({ owner: "vercel", repo: "next.js" });
    });

    it("accepts URL with query string", () => {
      expect(
        parseRepoInput("https://github.com/vercel/next.js?tab=readme"),
      ).toEqual({ owner: "vercel", repo: "next.js" });
    });

    it("accepts single-char owner and repo", () => {
      expect(parseRepoInput("a/b")).toEqual({ owner: "a", repo: "b" });
    });

    it("extracts correct owner and repo values", () => {
      const result = parseRepoInput("facebook/react");
      expect(result?.owner).toBe("facebook");
      expect(result?.repo).toBe("react");
    });

    it("strips .git from https URL variant", () => {
      expect(
        parseRepoInput("https://github.com/facebook/react.git"),
      ).toEqual({ owner: "facebook", repo: "react" });
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty string", () => {
      expect(parseRepoInput("")).toBeNull();
    });

    it("rejects whitespace-only string", () => {
      expect(parseRepoInput("   ")).toBeNull();
    });

    it("rejects bare owner with no repo (\"owner\")", () => {
      expect(parseRepoInput("owner")).toBeNull();
    });

    it("rejects leading-slash with repo only (\"/name\")", () => {
      expect(parseRepoInput("/name")).toBeNull();
    });

    it("rejects input with spaces", () => {
      expect(parseRepoInput("owner name/repo")).toBeNull();
    });

    it("rejects random garbage", () => {
      expect(parseRepoInput("not a repo at all!")).toBeNull();
    });

    it("rejects javascript: scheme", () => {
      expect(parseRepoInput("javascript:alert(1)")).toBeNull();
    });

    it("rejects owner with invalid characters", () => {
      // underscore is not valid in a GitHub owner name
      expect(parseRepoInput("owner_bad/repo")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// fetchStargazers (mocked fetch)
// ---------------------------------------------------------------------------

describe("fetchStargazers", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  /** Build a minimal mock Response object. */
  function mockResponse(
    body: unknown,
    {
      status = 200,
      headers = {},
    }: { status?: number; headers?: Record<string, string> } = {},
  ): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : String(status),
      headers: {
        get: (key: string) => headers[key.toLowerCase()] ?? null,
      },
      json: async () => body,
    } as unknown as Response;
  }

  /** Build a raw stargazer entry as GitHub returns it. */
  function rawEntry(
    login: string,
    starredAt: string,
    avatarUrl = `https://avatars.githubusercontent.com/u/1?login=${login}`,
  ) {
    return {
      starred_at: starredAt,
      user: { login, avatar_url: avatarUrl },
    };
  }

  it("maps starred_at, user.login, and user.avatar_url into a Stargazer", async () => {
    const repoBody = { stargazers_count: 1 };
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });

    expect(result.stargazers).toHaveLength(1);
    expect(result.stargazers[0]).toEqual<Stargazer>({
      login: "alice",
      // avatar URL gets a small `s=` size query appended for fast loading.
      avatarUrl: "https://avatars.githubusercontent.com/u/1?login=alice&s=120",
      starredAt: "2021-01-01T00:00:00Z",
    });
  });

  it("sorts stargazers ascending by starredAt", async () => {
    const repoBody = { stargazers_count: 3 };
    const starBody = [
      rawEntry("charlie", "2023-01-03T00:00:00Z"),
      rawEntry("alice", "2021-01-01T00:00:00Z"),
      rawEntry("bob", "2022-01-02T00:00:00Z"),
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    const logins = result.stargazers.map((s) => s.login);
    expect(logins).toEqual(["alice", "bob", "charlie"]);
  });

  it("returns totalStars from the repo endpoint, not the array length", async () => {
    const repoBody = { stargazers_count: 5000 };
    // Only one page worth of data returned
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    expect(result.totalStars).toBe(5000);
  });

  it("downsamples to ≤60 keyframes keeping first and last", async () => {
    const total = 200;
    const repoBody = { stargazers_count: total };
    // Build 200 entries on a single page
    const starBody = Array.from({ length: total }, (_, i) =>
      rawEntry(`user${i}`, `2021-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`),
    );

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });

    expect(result.stargazers.length).toBeLessThanOrEqual(60);
    // Sorted ascending, so first is user0 and last is user199
    expect(result.stargazers[0].login).toBe("user0");
    expect(result.stargazers[result.stargazers.length - 1].login).toBe(
      "user199",
    );
  });

  it("sets truncated=true when the repo exceeds GitHub's ~400-page listing ceiling", async () => {
    const repoBody = { stargazers_count: 99999 };
    // First page link header signals 500 total pages (> the 400-page ceiling).
    const linkHeader =
      '<https://api.github.com/repos/test/repo/stargazers?page=500>; rel="last"';
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    // Repo fetch + each sampled stargazer page returns the same one-entry body.
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/repos/test/repo") && !String(url).includes("stargazers")) {
        return Promise.resolve(mockResponse(repoBody));
      }
      return Promise.resolve(
        mockResponse(starBody, { headers: { link: linkHeader } }),
      );
    });

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    expect(result.truncated).toBe(true);
  });

  it("sets truncated=false when the repo is within the listing ceiling", async () => {
    const repoBody = { stargazers_count: 3 };
    const linkHeader = null; // only one page
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    expect(result.truncated).toBe(false);
  });

  it("maps 404 response to StargazersError with code 'not_found'", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({}, { status: 404 }));

    await expect(
      fetchStargazers({ owner: "test", repo: "nonexistent" }),
    ).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("maps 403 with x-ratelimit-remaining:0 to code 'rate_limited'", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockResponse(
        { message: "API rate limit exceeded" },
        { status: 403, headers: { "x-ratelimit-remaining": "0" } },
      ),
    );

    await expect(
      fetchStargazers({ owner: "test", repo: "repo" }),
    ).rejects.toMatchObject({ code: "rate_limited", status: 429 });
  });

  it("maps 429 response to code 'rate_limited'", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({}, { status: 429 }));

    await expect(
      fetchStargazers({ owner: "test", repo: "repo" }),
    ).rejects.toMatchObject({ code: "rate_limited", status: 429 });
  });

  it("handles 0-star repo: returns [] and totalStars 0 without throwing", async () => {
    const repoBody = { stargazers_count: 0 };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    expect(result.stargazers).toEqual([]);
    expect(result.totalStars).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("does NOT include the token in returned Stargazer data", async () => {
    process.env.GITHUB_TOKEN = "ghp_supersecrettoken";

    const repoBody = { stargazers_count: 1 };
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("ghp_supersecrettoken");
  });

  it("sends Accept: application/vnd.github.star+json header for stargazers pages", async () => {
    const repoBody = { stargazers_count: 1 };
    const starBody = [rawEntry("alice", "2021-01-01T00:00:00Z")];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));
    global.fetch = fetchMock;

    await fetchStargazers({ owner: "test", repo: "repo" });

    // Second call is the stargazers page fetch
    const [_url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const headers = init?.headers as Record<string, string>;
    expect(headers["Accept"]).toBe("application/vnd.github.star+json");
  });

  it("filters out entries with missing login, avatarUrl, or starredAt", async () => {
    const repoBody = { stargazers_count: 3 };
    const starBody = [
      rawEntry("alice", "2021-01-01T00:00:00Z"),
      { starred_at: "2021-01-02T00:00:00Z", user: null }, // no user
      { starred_at: null, user: { login: "bob", avatar_url: "https://example.com/b.png" } }, // no date
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(repoBody))
      .mockResolvedValueOnce(mockResponse(starBody));

    const result = await fetchStargazers({ owner: "test", repo: "repo" });
    // Only alice should survive the filter
    expect(result.stargazers).toHaveLength(1);
    expect(result.stargazers[0].login).toBe("alice");
  });
});
