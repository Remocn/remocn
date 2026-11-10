/**
 * IndexNow (https://www.indexnow.org): tell Bing, Yandex, Naver, Seznam and
 * the other participating engines which URLs changed, instead of waiting for
 * a recrawl. Bing's index feeds ChatGPT search and Copilot, so a page edited
 * here reaches AI answers sooner. The key is public by design: the engines
 * check it at KEY_LOCATION to confirm the host owns the submission.
 */

export const SITE_HOST = "remocn.dev";
const SITE_URL = `https://${SITE_HOST}`;

export const INDEXNOW_KEY = "7a075132af7cd50bca9fa007c1b92d23";
export const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow takes at most 10,000 URLs per request. */
export const MAX_URLS_PER_REQUEST = 10_000;

/**
 * Public URLs whose content a change to these repo files alters. Deleted
 * pages are included on purpose: IndexNow is also how an engine learns that a
 * URL now answers 404. Files that map to no page are ignored.
 */
export function urlsForChangedFiles(paths: string[]): string[] {
  const urls = new Set<string>();
  for (const path of paths) {
    for (const url of urlsFor(path)) urls.add(`${SITE_URL}${url}`);
  }
  return [...urls].sort();
}

function urlsFor(path: string): string[] {
  const doc = /^content\/docs\/(.+)\.mdx$/.exec(path);
  if (doc) {
    const slug = doc[1].replace(/(^|\/)index$/, "");
    return [slug ? `/docs/${slug}` : "/docs"];
  }
  const post = /^content\/blog\/([^/]+)\.mdx$/.exec(path);
  if (post) return [`/blog/${post[1]}`, "/blog"];
  if (/^content\/changelog\/[^/]+\.mdx$/.test(path)) {
    return ["/changelog", "/changelog/video"];
  }
  if (
    path === "app/(home)/page.tsx" ||
    path.startsWith("app/(home)/components/landing/")
  ) {
    return ["/"];
  }
  const page = /^app\/\(home\)\/([a-z-]+)\/page\.tsx$/.exec(path);
  if (page) return [`/${page[1]}`];
  return [];
}

/** The <loc> entries of a sitemap.xml. */
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

/** Request bodies for the IndexNow API, split at the per-request limit. */
export function submissionBodies(urls: string[]) {
  const bodies = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    bodies.push({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls.slice(i, i + MAX_URLS_PER_REQUEST),
    });
  }
  return bodies;
}

/**
 * The Next build id in a page's RSC payload (`"b":"<id>"`). It changes with
 * every build, so a new value means the new deploy is live.
 */
export function buildIdOf(html: string): string | null {
  return /\\?"b\\?":\\?"([A-Za-z0-9_-]+)/.exec(html)?.[1] ?? null;
}
