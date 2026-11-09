import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  buildIdOf,
  INDEXNOW_KEY,
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
