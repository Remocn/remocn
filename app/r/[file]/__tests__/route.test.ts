/**
 * Unit tests for app/r/[file]/route.ts  (GET /r/<name>.json)
 *
 * Run with:  bun test app/r/[file]/__tests__/route.test.ts
 *
 * The OpenPanel server client is mocked at the module boundary so no events
 * leave the process. Reading the built registry artifact is real, so the served
 * payload is checked against the actual build output on disk.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the route handler.
// ---------------------------------------------------------------------------

mock.module("server-only", () => ({}));

const mockTrack = mock(() => Promise.resolve());

mock.module("@openpanel/sdk", () => ({
  OpenPanel: class {
    track = mockTrack;
  },
}));

// `after()` throws outside a real request scope, so it runs the callback inline
// here — the assertions are about which event is emitted, not when.
const nextServer = await import("next/server");
const mockAfter = mock((fn: () => unknown) => {
  void fn();
});

mock.module("next/server", () => ({ ...nextServer, after: mockAfter }));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID = "test-client-id";
process.env.OPENPANEL_CLIENT_SECRET = "test-client-secret";

const { GET } = await import("@/app/r/[file]/route");

beforeEach(() => {
  mockTrack.mockClear();
  mockTrack.mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  mockAfter.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLI_UA = "shadcn/4.11.0";

function makeRequest(file: string, userAgent = CLI_UA): Request {
  return new Request(`http://localhost/r/${file}`, {
    headers: { "user-agent": userAgent },
  });
}

function makeParams(file: string): { params: Promise<{ file: string }> } {
  return { params: Promise.resolve({ file }) };
}

function get(file: string, userAgent = CLI_UA) {
  return GET(makeRequest(file, userAgent), makeParams(file));
}

function artifact(file: string): Promise<string> {
  return readFile(join(process.cwd(), "registry-artifacts", file), "utf8");
}

// ---------------------------------------------------------------------------
// Serving the payload
// ---------------------------------------------------------------------------

describe("GET /r/<name>.json — payload", () => {
  it("returns 200 with JSON identical to the built artifact", async () => {
    const res = await get("blur-in.json");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual(
      JSON.parse(await artifact("blur-in.json")),
    );
  });

  it("serves the registry index", async () => {
    const res = await get("registry.json");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      JSON.parse(await artifact("registry.json")),
    );
  });

  it("is not cacheable, so every install reaches the handler", async () => {
    const res = await get("blur-in.json");

    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

// ---------------------------------------------------------------------------
// Unknown items
// ---------------------------------------------------------------------------

describe("GET /r/<name>.json — unknown item", () => {
  it("returns 404 for a component that does not exist", async () => {
    const res = await get("definitely-not-a-component.json");

    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("not_found");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("returns 404 without reading outside the artifacts directory", async () => {
    const res = await get("../../package.json");

    expect(res.status).toBe(404);
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// registry_install event
// ---------------------------------------------------------------------------

describe("GET /r/<name>.json — registry_install event", () => {
  it("emits registry_install with the component name and user agent", async () => {
    await get("blur-in.json");

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("registry_install", {
      component: "blur-in",
      user_agent: CLI_UA,
    });
  });

  it("does not count the registry index as an install", async () => {
    const res = await get("registry.json");

    expect(res.status).toBe(200);
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("serves crawlers the payload but does not count them", async () => {
    const res = await get(
      "blur-in.json",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      JSON.parse(await artifact("blur-in.json")),
    );
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("delivers the payload even when tracking fails", async () => {
    mockTrack.mockImplementation(() =>
      Promise.reject(new Error("OpenPanel is down")),
    );

    const res = await get("blur-in.json");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      JSON.parse(await artifact("blur-in.json")),
    );
  });
});
