import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  buildIdOf,
  fetchWithRetry,
  INDEXNOW_KEY,
  isSitemapIndex,
  KEY_LOCATION,
  MAX_URLS_PER_REQUEST,
  sitemapUrls,
  submissionBodies,
  urlsForChangedFiles,
} from "./indexnow";

describe("urlsForChangedFiles", () => {
  test("maps docs, blog, changelog and home page files to their URLs", () => {
    expect(
      urlsForChangedFiles([
        "content/docs/transitions/zoom-blur.mdx",
        "content/docs/transitions/index.mdx",
        "content/blog/nextjs-launch-video.mdx",
        "content/changelog/2026-07-08-transitions-revamp.mdx",
        "app/(home)/components/landing/sections/hero/prompt-composer.tsx",
        "app/(home)/about/page.tsx",
      ]),
    ).toEqual([
      "https://remocn.dev/",
      "https://remocn.dev/about",
      "https://remocn.dev/blog",
      "https://remocn.dev/blog/nextjs-launch-video",
      "https://remocn.dev/changelog",
      "https://remocn.dev/changelog/video",
      "https://remocn.dev/docs/transitions",
      "https://remocn.dev/docs/transitions/zoom-blur",
    ]);
  });

  test("ignores files that are not a public page", () => {
    expect(
      urlsForChangedFiles([
        "lib/utils.ts",
        "registry/remocn/zoom-blur/zoom-blur.tsx",
        "content/docs/meta.json",
        "app/(home)/blog/[slug]/page.tsx",
      ]),
    ).toEqual([]);
  });
});

describe("submission", () => {
  test("the key file in public/ serves the key", () => {
    expect(readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8")).toBe(
      INDEXNOW_KEY,
    );
    expect(KEY_LOCATION).toBe(`https://remocn.dev/${INDEXNOW_KEY}.txt`);
  });

  test("splits at the per-request limit", () => {
    const urls = Array.from(
      { length: MAX_URLS_PER_REQUEST + 1 },
      (_, i) => `https://remocn.dev/${i}`,
    );
    const bodies = submissionBodies(urls);
    expect(bodies.map((body) => body.urlList.length)).toEqual([
      MAX_URLS_PER_REQUEST,
      1,
    ]);
    expect(bodies[0]).toMatchObject({
      host: "remocn.dev",
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
    });
  });

  test("reads <loc> entries from a sitemap", () => {
    expect(
      sitemapUrls(
        "<urlset><url><loc>https://remocn.dev</loc></url><url><loc>https://remocn.dev/blog</loc></url></urlset>",
      ),
    ).toEqual(["https://remocn.dev", "https://remocn.dev/blog"]);
  });

  test("tells a sitemap index from a sitemap", () => {
    expect(
      isSitemapIndex(
        "<sitemapindex><sitemap><loc>https://remocn.dev/sitemap/blog.xml</loc></sitemap></sitemapindex>",
      ),
    ).toBe(true);
    expect(isSitemapIndex("<urlset></urlset>")).toBe(false);
  });
});

describe("buildIdOf", () => {
  test("finds the build id in the escaped RSC payload", () => {
    expect(
      buildIdOf(
        'self.__next_f.push([1,"0:{\\"P\\":null,\\"b\\":\\"CpSmtBmP7Mx\\",',
      ),
    ).toBe("CpSmtBmP7Mx");
  });

  test("returns null when the page has none", () => {
    expect(buildIdOf("<html></html>")).toBeNull();
  });
});

describe("fetchWithRetry", () => {
  const answers = (...steps: (number | Error)[]) => {
    let calls = 0;
    const fetchImpl = async () => {
      const step = steps[Math.min(calls++, steps.length - 1)];
      if (step instanceof Error) throw step;
      return new Response("", { status: step });
    };
    return { fetchImpl, calls: () => calls };
  };

  test("retries a 502 until the site answers", async () => {
    const fake = answers(502, 502, 200);
    const res = await fetchWithRetry("https://x", {}, { ...fake, delayMs: 0 });
    expect(res.status).toBe(200);
    expect(fake.calls()).toBe(3);
  });

  test("retries a network error", async () => {
    const fake = answers(new Error("ECONNRESET"), 200);
    const res = await fetchWithRetry("https://x", {}, { ...fake, delayMs: 0 });
    expect(res.status).toBe(200);
  });

  test("returns a 4xx at once", async () => {
    const fake = answers(404, 200);
    const res = await fetchWithRetry("https://x", {}, { ...fake, delayMs: 0 });
    expect(res.status).toBe(404);
    expect(fake.calls()).toBe(1);
  });

  test("gives up after the last attempt with the last answer", async () => {
    const fake = answers(502);
    const res = await fetchWithRetry(
      "https://x",
      {},
      { ...fake, attempts: 3, delayMs: 0 },
    );
    expect(res.status).toBe(502);
    expect(fake.calls()).toBe(3);
  });
});
