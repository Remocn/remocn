/**
 * Submit changed URLs to IndexNow (see lib/indexnow.ts).
 *
 *   bun scripts/indexnow.mts --changed <base-sha> <head-sha>   URLs the diff touches
 *   bun scripts/indexnow.mts --all                             every URL in the live sitemap
 *
 * Flags:
 *   --wait-deploy   first wait (up to 40 min) until the live site serves a new
 *                   build, so engines crawl the new content, not the old one
 *   --dry-run       print the URLs, submit nothing
 */
import { execFileSync } from "node:child_process";
import {
  buildIdOf,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  KEY_LOCATION,
  SITE_HOST,
  sitemapUrls,
  submissionBodies,
  urlsForChangedFiles,
} from "../lib/indexnow";

const SITE_URL = `https://${SITE_HOST}`;
const POLL_MS = 30_000;
const WAIT_LIMIT_MS = 40 * 60_000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

/** Build id of the live site; a page outside the CDN-cached docs is enough. */
async function liveBuildId(): Promise<string | null> {
  return buildIdOf(await fetchText(`${SITE_URL}/about?indexnow=${Date.now()}`));
}

async function waitForDeploy(): Promise<void> {
  const before = await liveBuildId();
  console.log(`Live build ${before ?? "unknown"}; waiting for the next one`);
  const deadline = Date.now() + WAIT_LIMIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const now = await liveBuildId().catch(() => null);
    if (now && now !== before) {
      console.log(`New build ${now} is live`);
      return;
    }
  }
  console.warn("No new build after 40 minutes; submitting anyway");
}

function changedFiles(base: string, head: string): string[] {
  return execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", base, head],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);
}

async function main() {
  let urls: string[];
  if (args.includes("--all")) {
    urls = sitemapUrls(await fetchText(`${SITE_URL}/sitemap.xml`));
  } else {
    const at = args.indexOf("--changed");
    const [base, head] = [args[at + 1], args[at + 2]];
    if (at === -1 || !base || !head) {
      console.error("Usage: --changed <base> <head> | --all");
      process.exit(2);
    }
    urls = urlsForChangedFiles(changedFiles(base, head));
  }

  if (urls.length === 0) {
    console.log("No public URLs changed");
    return;
  }
  console.log(`${urls.length} URL(s):\n${urls.join("\n")}`);
  if (dryRun) return;

  if (args.includes("--wait-deploy")) await waitForDeploy();

  const key = (await fetchText(KEY_LOCATION)).trim();
  if (key !== INDEXNOW_KEY) {
    throw new Error(`${KEY_LOCATION} does not serve the IndexNow key`);
  }

  for (const body of submissionBodies(urls)) {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // 200 OK and 202 Accepted both mean the submission was taken.
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`IndexNow: HTTP ${res.status} ${await res.text()}`);
    }
    console.log(`IndexNow: ${res.status} for ${body.urlList.length} URL(s)`);
  }
}

await main();
