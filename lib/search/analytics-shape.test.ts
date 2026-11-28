import { describe, expect, it, test } from "bun:test";
import {
  browserActor,
  classifyAgentClient,
  describeQuery,
  isCrawlerUA,
  loggedQuery,
  topMatchShape,
} from "./analytics-shape";

describe("describeQuery", () => {
  it("describes a query without quoting it", () => {
    expect(describeQuery("  show revenue growing ")).toEqual({
      query_words: 3,
      query_chars: 20,
      query_script: "latin",
    });
  });

  it("tells writing systems apart", () => {
    expect(describeQuery("показать рост выручки").query_script).toBe(
      "cyrillic",
    );
    expect(describeQuery("ロゴのアニメーション").query_script).toBe("cjk");
    expect(describeQuery("переход для logo").query_script).toBe("mixed");
    expect(describeQuery("123").query_script).toBe("other");
  });
});

describe("loggedQuery", () => {
  it("cuts a pasted paragraph down", () => {
    expect(loggedQuery("a".repeat(500))).toHaveLength(200);
  });
});

describe("classifyAgentClient", () => {
  it("groups callers by product", () => {
    expect(classifyAgentClient("Claude-User/1.0")).toBe("claude");
    expect(classifyAgentClient("codex_cli_rs/0.40 (openai)")).toBe("codex");
    expect(classifyAgentClient("ChatGPT-User/1.0")).toBe("chatgpt");
    expect(classifyAgentClient("Cursor/1.4")).toBe("cursor");
    expect(classifyAgentClient("node")).toBe("script");
    expect(classifyAgentClient("")).toBe("unknown");
    expect(classifyAgentClient("SomethingNew/2")).toBe("other");
  });
});

/**
 * User-Agents of `markdown_read` events from 26–27 November 2026, with the
 * client and crawler verdict each should get.
 */
const REAL_UAS: [string, string, boolean][] = [
  [
    "Claude-User (claude-code/2.1.330; +https://support.anthropic.com/)",
    "claude",
    false,
  ],
  [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "chatgpt",
    false,
  ],
  ["GPTBot/1.1 (+https://openai.com/gptbot)", "chatgpt", true],
  ["Mozilla/5.0 (compatible; OAI-SearchBot/1.0)", "chatgpt", true],
  ["GitHubCopilotRuntime-WebFetch", "vscode", false],
  ["opencode/latest/2.4.2/cli", "opencode", false],
  [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OpenCode-User/1.0; +https://opencode.ai",
    "opencode",
    false,
  ],
  [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.7977.167 Safari/537.36 Antigravity/2.35.2",
    "antigravity",
    false,
  ],
  ["GoogleAgent-URLContext", "gemini", false],
  [
    "Mozilla/5.0 (compatible; Google-Agent; +https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent)",
    "gemini",
    false,
  ],
  [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Gemini-Deep-Research; +https://gemini.google/overview/deep-research/) Chrome/135.0.0.0 Safari/537.36",
    "gemini",
    false,
  ],
  [
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.8103.78 Mobile Safari/537.36 (compatible; GoogleOther)",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.8103.78 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "crawler",
    true,
  ],
  ["Google-Extended", "crawler", true],
  ["SkillScan/1.0", "crawler", true],
  ["firecrawl-search/1.0 (+https://www.firecrawl.dev)", "crawler", true],
  ["agentwebmap-bot/0.2 (+https://agentwebmap.com)", "crawler", true],
  [
    "meta-webindexer/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 (compatible; ExaSearchBot/1.0; +https://crawler.exa.ai/)",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 (compatible; ExaUser/1.0; +https://exauser.crawler.exa.ai)",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ShapBot/0.1.0",
    "crawler",
    true,
  ],
  [
    "Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.9711",
    "script",
    false,
  ],
  [
    "Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.22631; zh-CN) PowerShell/7.6.4",
    "script",
    false,
  ],
  ["curl/8.7.1", "script", false],
  ["Go-http-client/2.0", "script", false],
  ["python-requests/2.32.5", "script", false],
  [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "browser",
    false,
  ],
  ["deepseek-harness/0.0.1 (+https://github.com/deepseek-ai)", "other", false],
];

describe("classifyAgentClient on real markdown readers", () => {
  for (const [ua, client, crawler] of REAL_UAS) {
    test(`${ua.slice(0, 60)} → ${client}${crawler ? " (crawler)" : ""}`, () => {
      expect(classifyAgentClient(ua)).toBe(client);
      expect(isCrawlerUA(ua)).toBe(crawler);
    });
  }

  test("names coding agents that send their own product token", () => {
    expect(classifyAgentClient("Cline/3.38.1")).toBe("cline");
    expect(classifyAgentClient("aider/0.86.1")).toBe("aider");
    expect(classifyAgentClient("Zed/0.212.4 (macos; aarch64)")).toBe("zed");
    expect(classifyAgentClient("Mozilla/5.0 authorized-client")).toBe(
      "browser",
    );
  });
});

describe("browserActor", () => {
  it("treats an automated browser as an agent", () => {
    expect(browserActor("Mozilla/5.0 Chrome/140", true)).toBe("agent");
    expect(browserActor("Mozilla/5.0 Claude-Agent/1.0", false)).toBe("agent");
    expect(browserActor("Mozilla/5.0 Chrome/140", false)).toBe("human");
  });
});

describe("topMatchShape", () => {
  it("rounds the score for charts and keeps the verdict", () => {
    expect(topMatchShape({ score: 0.28734, weak: true })).toEqual({
      top_score: 0.29,
      weak: true,
    });
  });
});
