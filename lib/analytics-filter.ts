import { CRAWLER_UA } from "@/lib/search/analytics-shape";

/**
 * Browsers whose page views are not people: automation (`navigator.webdriver`),
 * headless Chrome, crawlers that run JavaScript, and desktop Chrome too old to
 * be a real install. Their events never leave the browser. Server events
 * (registry_install, agent searches, component_fetched, markdown_read) are
 * counted separately and are not filtered here.
 */

export const HEADLESS_UA = /HeadlessChrome|PhantomJS|Chrome-Lighthouse/i;

/**
 * Chrome updates itself, and 109 is the last release for Windows 7 and 8.1,
 * so a desktop Chrome older than that is a pinned crawler build (the CN and SG
 * traffic of November 2026 reported Chrome 99 on Windows 10). Mobile UAs are
 * exempt: an old Android WebView still reports its own Chrome version.
 */
export const MIN_DESKTOP_CHROME = 109;

const MOBILE_UA = /Android|Mobile/i;
const CHROME_VERSION = /Chrome\/(\d+)\./;

export function isAutomatedBrowser(
  userAgent: string,
  webdriver: boolean,
): boolean {
  if (webdriver || HEADLESS_UA.test(userAgent) || CRAWLER_UA.test(userAgent)) {
    return true;
  }
  if (MOBILE_UA.test(userAgent)) return false;
  const chrome = CHROME_VERSION.exec(userAgent);
  return chrome !== null && Number(chrome[1]) < MIN_DESKTOP_CHROME;
}

const regex = (pattern: RegExp) =>
  `new RegExp(${JSON.stringify(pattern.source)}, ${JSON.stringify(pattern.flags)})`;

/**
 * OpenPanel's `filter` option, inlined into the init script as JavaScript: the
 * same rules as `isAutomatedBrowser`, decided once per page load, plus the
 * `/embed/*` exclusion (those pages run inside MCP App iframes in chat hosts
 * and carry the user's props in their URL). Every browser event goes through
 * it, screen views and outgoing links included.
 */
export const OPENPANEL_FILTER = `(function () {
  var ua = navigator.userAgent || "";
  var chrome = ${regex(CHROME_VERSION)}.exec(ua);
  var automated =
    navigator.webdriver === true ||
    ${regex(HEADLESS_UA)}.test(ua) ||
    ${regex(CRAWLER_UA)}.test(ua) ||
    (!${regex(MOBILE_UA)}.test(ua) && chrome !== null && Number(chrome[1]) < ${MIN_DESKTOP_CHROME});
  return function () {
    return !automated && !window.location.pathname.startsWith("/embed/");
  };
})()`;
