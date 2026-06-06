/**
 * Unit tests for lib/server/validate-input.ts
 *
 * Run with:  bunx vitest run lib/server/__tests__/validate-input.test.ts
 *
 * Pure function — no mocks needed; all logic is deterministic.
 */

import { describe, expect, it } from "vitest";
import { parseRenderInput, RenderInputError } from "@/lib/server/validate-input";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid body that passes every rule. */
function validBody(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    repo: "vercel/next.js",
    totalStars: 120_000,
    stargazers: [
      {
        login: "alice",
        avatarUrl: "https://avatars.githubusercontent.com/u/1",
        starredAt: "2021-01-01",
      },
    ],
    orientation: "horizontal",
    ...overrides,
  };
}

function stargazer(overrides?: Record<string, unknown>) {
  return {
    login: "alice",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    starredAt: "2021-01-01",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Happy path — accepts a valid payload and applies defaults
// ---------------------------------------------------------------------------

describe("parseRenderInput — valid payload", () => {
  it("accepts a minimal valid body and returns the parsed input", () => {
    const result = parseRenderInput(validBody());
    expect(result.repo).toBe("vercel/next.js");
    expect(result.totalStars).toBe(120_000);
    expect(result.orientation).toBe("horizontal");
    expect(result.stargazers).toHaveLength(1);
  });

  it("applies default accentColor #ffbb00 when omitted", () => {
    const result = parseRenderInput(validBody());
    expect(result.accentColor).toBe("#ffbb00");
  });

  it("applies default speed 1 when omitted", () => {
    const result = parseRenderInput(validBody());
    expect(result.speed).toBe(1);
  });

  it("applies default theme 'light' when omitted", () => {
    const result = parseRenderInput(validBody());
    expect(result.theme).toBe("light");
  });

  it("accepts orientation 'vertical'", () => {
    const result = parseRenderInput(validBody({ orientation: "vertical" }));
    expect(result.orientation).toBe("vertical");
  });

  it("accepts theme 'dark'", () => {
    const result = parseRenderInput(validBody({ theme: "dark" }));
    expect(result.theme).toBe("dark");
  });

  it("accepts a valid 3-char hex accentColor", () => {
    const result = parseRenderInput(validBody({ accentColor: "#abc" }));
    expect(result.accentColor).toBe("#abc");
  });

  it("accepts a valid 6-char hex accentColor", () => {
    const result = parseRenderInput(validBody({ accentColor: "#ff0000" }));
    expect(result.accentColor).toBe("#ff0000");
  });

  it("accepts an 8-char hex accentColor (with alpha)", () => {
    const result = parseRenderInput(validBody({ accentColor: "#ff0000ff" }));
    expect(result.accentColor).toBe("#ff0000ff");
  });

  it("accepts stargazers array of exactly 60 items", () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      stargazer({ login: `user${i}`, avatarUrl: `https://example.com/u/${i}` }),
    );
    const result = parseRenderInput(validBody({ stargazers: many }));
    expect(result.stargazers).toHaveLength(60);
  });

  it("returns floored totalStars when given a float", () => {
    const result = parseRenderInput(validBody({ totalStars: 99.9 }));
    expect(result.totalStars).toBe(99);
  });
});

// ---------------------------------------------------------------------------
// Clamps — numbers clamped, not rejected
// ---------------------------------------------------------------------------

describe("parseRenderInput — clamping", () => {
  it("clamps totalStars below 0 to 0", () => {
    const result = parseRenderInput(validBody({ totalStars: -100 }));
    expect(result.totalStars).toBe(0);
  });

  it("clamps totalStars above 1e8 to 1e8", () => {
    const result = parseRenderInput(validBody({ totalStars: 999_000_000 }));
    expect(result.totalStars).toBe(100_000_000);
  });

  it("clamps speed below 1 to 1", () => {
    const result = parseRenderInput(validBody({ speed: 0 }));
    expect(result.speed).toBe(1);
  });

  it("clamps speed above 4 to 4", () => {
    const result = parseRenderInput(validBody({ speed: 100 }));
    expect(result.speed).toBe(4);
  });

  it("accepts speed exactly at min bound (1)", () => {
    const result = parseRenderInput(validBody({ speed: 1 }));
    expect(result.speed).toBe(1);
  });

  it("accepts speed exactly at max bound (4)", () => {
    const result = parseRenderInput(validBody({ speed: 4 }));
    expect(result.speed).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Non-object body
// ---------------------------------------------------------------------------

describe("parseRenderInput — non-object body throws", () => {
  it("throws RenderInputError on null", () => {
    expect(() => parseRenderInput(null)).toThrow(RenderInputError);
  });

  it("throws RenderInputError on a string", () => {
    expect(() => parseRenderInput("hello")).toThrow(RenderInputError);
  });

  it("throws RenderInputError on an array", () => {
    expect(() => parseRenderInput([])).toThrow(RenderInputError);
  });

  it("throws RenderInputError on a number", () => {
    expect(() => parseRenderInput(42)).toThrow(RenderInputError);
  });

  it("carries status 400", () => {
    try {
      parseRenderInput(null);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RenderInputError);
      expect((err as RenderInputError).status).toBe(400);
    }
  });
});

// ---------------------------------------------------------------------------
// orientation validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — orientation", () => {
  it("throws on unknown orientation", () => {
    expect(() => parseRenderInput(validBody({ orientation: "diagonal" }))).toThrow(
      RenderInputError,
    );
  });

  it("throws when orientation is missing", () => {
    const body = validBody();
    delete body.orientation;
    expect(() => parseRenderInput(body)).toThrow(RenderInputError);
  });

  it("throws when orientation is null", () => {
    expect(() => parseRenderInput(validBody({ orientation: null }))).toThrow(
      RenderInputError,
    );
  });
});

// ---------------------------------------------------------------------------
// stargazers array validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — stargazers length cap", () => {
  it("throws when stargazers has 61 items", () => {
    const many = Array.from({ length: 61 }, (_, i) =>
      stargazer({ login: `user${i}`, avatarUrl: `https://example.com/u/${i}` }),
    );
    expect(() => parseRenderInput(validBody({ stargazers: many }))).toThrow(
      RenderInputError,
    );
  });

  it("throws when stargazers is not an array", () => {
    expect(() => parseRenderInput(validBody({ stargazers: "nope" }))).toThrow(
      RenderInputError,
    );
  });

  it("throws when stargazers is null", () => {
    expect(() => parseRenderInput(validBody({ stargazers: null }))).toThrow(
      RenderInputError,
    );
  });
});

// ---------------------------------------------------------------------------
// stargazer item shape validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — stargazer item shapes", () => {
  it("throws when a stargazer item is not an object", () => {
    expect(() =>
      parseRenderInput(validBody({ stargazers: ["not-an-object"] })),
    ).toThrow(RenderInputError);
  });

  it("throws when login is missing", () => {
    expect(() =>
      parseRenderInput(validBody({ stargazers: [stargazer({ login: undefined })] })),
    ).toThrow(RenderInputError);
  });

  it("throws when login is empty string", () => {
    expect(() =>
      parseRenderInput(validBody({ stargazers: [stargazer({ login: "" })] })),
    ).toThrow(RenderInputError);
  });

  it("throws when login exceeds 100 chars", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ login: "a".repeat(101) })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws when avatarUrl is missing", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ avatarUrl: undefined })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws when avatarUrl exceeds 512 chars", () => {
    const longUrl = "https://example.com/" + "a".repeat(494);
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ avatarUrl: longUrl })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws when starredAt is missing", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ starredAt: undefined })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws when starredAt exceeds 40 chars", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ starredAt: "x".repeat(41) })] }),
      ),
    ).toThrow(RenderInputError);
  });
});

// ---------------------------------------------------------------------------
// avatarUrl — http(s) enforcement (SSRF surface narrowing)
// ---------------------------------------------------------------------------

describe("parseRenderInput — avatarUrl must be http(s)", () => {
  it("throws on a file:// avatarUrl", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ avatarUrl: "file:///etc/passwd" })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws on a javascript: avatarUrl", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ avatarUrl: "javascript:alert(1)" })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("throws on a relative avatarUrl", () => {
    expect(() =>
      parseRenderInput(
        validBody({ stargazers: [stargazer({ avatarUrl: "/relative/path" })] }),
      ),
    ).toThrow(RenderInputError);
  });

  it("accepts an http:// avatarUrl", () => {
    const result = parseRenderInput(
      validBody({ stargazers: [stargazer({ avatarUrl: "http://example.com/avatar.png" })] }),
    );
    expect(result.stargazers[0].avatarUrl).toBe("http://example.com/avatar.png");
  });

  it("accepts an https:// avatarUrl", () => {
    const result = parseRenderInput(
      validBody({
        stargazers: [stargazer({ avatarUrl: "https://avatars.githubusercontent.com/u/99" })],
      }),
    );
    expect(result.stargazers[0].avatarUrl).toBe(
      "https://avatars.githubusercontent.com/u/99",
    );
  });
});

// ---------------------------------------------------------------------------
// accentColor validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — accentColor", () => {
  it("throws when accentColor is not a hex color", () => {
    expect(() =>
      parseRenderInput(validBody({ accentColor: "red" })),
    ).toThrow(RenderInputError);
  });

  it("throws when accentColor lacks the leading #", () => {
    expect(() =>
      parseRenderInput(validBody({ accentColor: "ffbb00" })),
    ).toThrow(RenderInputError);
  });

  it("throws when accentColor has 2 hex digits (too short)", () => {
    expect(() =>
      parseRenderInput(validBody({ accentColor: "#ff" })),
    ).toThrow(RenderInputError);
  });
});

// ---------------------------------------------------------------------------
// repo validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — repo", () => {
  it("throws when repo is missing", () => {
    const body = validBody();
    delete body.repo;
    expect(() => parseRenderInput(body)).toThrow(RenderInputError);
  });

  it("throws when repo is empty string", () => {
    expect(() => parseRenderInput(validBody({ repo: "" }))).toThrow(RenderInputError);
  });

  it("throws when repo exceeds 200 chars", () => {
    expect(() =>
      parseRenderInput(validBody({ repo: "a".repeat(201) })),
    ).toThrow(RenderInputError);
  });
});

// ---------------------------------------------------------------------------
// totalStars validation
// ---------------------------------------------------------------------------

describe("parseRenderInput — totalStars", () => {
  it("throws when totalStars is not a number", () => {
    expect(() =>
      parseRenderInput(validBody({ totalStars: "not-a-number" })),
    ).toThrow(RenderInputError);
  });

  it("throws when totalStars is Infinity", () => {
    expect(() =>
      parseRenderInput(validBody({ totalStars: Infinity })),
    ).toThrow(RenderInputError);
  });

  it("throws when totalStars is NaN", () => {
    expect(() =>
      parseRenderInput(validBody({ totalStars: NaN })),
    ).toThrow(RenderInputError);
  });
});
