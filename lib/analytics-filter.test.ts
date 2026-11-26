import { describe, expect, test } from "bun:test";
import { isAutomatedBrowser, OPENPANEL_FILTER } from "@/lib/analytics-filter";

const CHROME_131_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CHROME_109_WIN7 =
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";
const CHROME_99_WIN10 =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";
const HEADLESS =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36";
const GOOGLEBOT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/131.0.6778.69 Safari/537.36";
const BINGBOT =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const OLD_ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 8.1.0; SM-J530F Build/M1AJQ; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.91 Mobile Safari/537.36";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0";
const LIGHTHOUSE =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse";

const CASES: [string, string, boolean, boolean][] = [
  ["current desktop Chrome", CHROME_131_MAC, false, false],
  ["Chrome 109 on Windows 7", CHROME_109_WIN7, false, false],
  ["Safari on iOS", SAFARI_IOS, false, false],
  ["Firefox", FIREFOX, false, false],
  ["old Android WebView", OLD_ANDROID_WEBVIEW, false, false],
  ["navigator.webdriver", CHROME_131_MAC, true, true],
  ["HeadlessChrome", HEADLESS, false, true],
  ["Googlebot", GOOGLEBOT, false, true],
  ["bingbot", BINGBOT, false, true],
  ["Lighthouse", LIGHTHOUSE, false, true],
  ["Chrome 99 on Windows 10", CHROME_99_WIN10, false, true],
];

/** Runs the inlined filter string the way the OpenPanel init script does. */
function runFilter(
  userAgent: string,
  webdriver: boolean,
  pathname = "/docs/x",
) {
  const make = new Function(
    "navigator",
    "window",
    `return ${OPENPANEL_FILTER};`,
  );
  const filter = make(
    { userAgent, webdriver },
    { location: { pathname } },
  ) as () => boolean;
  return filter();
}

describe("isAutomatedBrowser", () => {
  for (const [name, ua, webdriver, automated] of CASES) {
    test(`${name}: ${automated ? "automated" : "a person"}`, () => {
      expect(isAutomatedBrowser(ua, webdriver)).toBe(automated);
    });
  }
});

describe("OPENPANEL_FILTER", () => {
  for (const [name, ua, webdriver, automated] of CASES) {
    test(`${name}: ${automated ? "dropped" : "sent"}`, () => {
      expect(runFilter(ua, webdriver)).toBe(!automated);
    });
  }

  test("drops /embed/ pages for everyone", () => {
    expect(runFilter(CHROME_131_MAC, false, "/embed/fade-in")).toBe(false);
  });
});
