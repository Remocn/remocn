import { describe, expect, test } from "bun:test";
import {
  agentLink,
  mcpAgentSource,
  STATIC_AGENT_SOURCE,
  tagAgentLinks,
} from "@/lib/agent-links";

describe("agentLink", () => {
  test("tags links to HTML pages on the site", () => {
    expect(
      agentLink("https://remocn.dev/docs/typography/ink-underline", "claude"),
    ).toBe(
      "https://remocn.dev/docs/typography/ink-underline?utm_source=claude&utm_medium=agent",
    );
    expect(agentLink("https://remocn.dev/about", STATIC_AGENT_SOURCE)).toBe(
      "https://remocn.dev/about?utm_source=llms&utm_medium=agent",
    );
  });

  test("keeps existing query and hash", () => {
    expect(agentLink("https://remocn.dev/docs/x?c.speed=2#props", "mcp")).toBe(
      "https://remocn.dev/docs/x?c.speed=2&utm_source=mcp&utm_medium=agent#props",
    );
  });

  test("leaves what agents fetch as data untouched", () => {
    for (const href of [
      "https://remocn.dev/docs/typography/ink-underline.md",
      "https://remocn.dev/llms.txt",
      "https://remocn.dev/llms-components.txt",
      "https://remocn.dev/llms-full/transitions.txt",
      "https://remocn.dev/r/fade-in.json",
      "https://remocn.dev/openapi.json",
      "https://remocn.dev/sitemap.xml",
      "https://remocn.dev/mcp",
      "https://remocn.dev/embed/fade-in",
      "https://remocn.dev/api/search",
    ]) {
      expect(agentLink(href, "claude")).toBe(href);
    }
  });

  test("resolves root-relative links against the site", () => {
    expect(agentLink("/docs/x#props", "mcp")).toBe(
      "https://remocn.dev/docs/x?utm_source=mcp&utm_medium=agent#props",
    );
    expect(agentLink("/docs/x.md", "mcp")).toBe("/docs/x.md");
    expect(agentLink("//evil.com/docs", "mcp")).toBe("//evil.com/docs");
  });

  test("leaves other sites and already tagged links alone", () => {
    expect(agentLink("https://github.com/Remocn/remocn", "claude")).toBe(
      "https://github.com/Remocn/remocn",
    );
    expect(agentLink("https://remocn.dev.evil.com/docs", "claude")).toBe(
      "https://remocn.dev.evil.com/docs",
    );
    expect(
      agentLink("https://remocn.dev/docs/x?utm_source=newsletter", "claude"),
    ).toBe("https://remocn.dev/docs/x?utm_source=newsletter");
  });
});

describe("tagAgentLinks", () => {
  test("tags Markdown link targets only", () => {
    const md = [
      "# Ink Underline",
      "URL: https://remocn.dev/docs/typography/ink-underline",
      "- [Marker](https://remocn.dev/docs/typography/marker-highlight) — next",
      "- [Raw](https://remocn.dev/docs/typography/marker-highlight.md)",
      '- [Title](https://remocn.dev/stars "Stars")',
      "- `npx remotion elements use https://remocn.dev/docs/typography/ink-underline`",
    ].join("\n");
    expect(tagAgentLinks(md, "chatgpt")).toBe(
      [
        "# Ink Underline",
        "URL: https://remocn.dev/docs/typography/ink-underline",
        "- [Marker](https://remocn.dev/docs/typography/marker-highlight?utm_source=chatgpt&utm_medium=agent) — next",
        "- [Raw](https://remocn.dev/docs/typography/marker-highlight.md)",
        '- [Title](https://remocn.dev/stars?utm_source=chatgpt&utm_medium=agent "Stars")',
        "- `npx remotion elements use https://remocn.dev/docs/typography/ink-underline`",
      ].join("\n"),
    );
  });

  test("resolves and tags root-relative page links", () => {
    expect(
      tagAgentLinks(
        "Pairs with [Positioning](/docs/captions/positioning) and [raw](/docs/captions/positioning.md).",
        "claude",
      ),
    ).toBe(
      "Pairs with [Positioning](https://remocn.dev/docs/captions/positioning?utm_source=claude&utm_medium=agent) and [raw](/docs/captions/positioning.md).",
    );
  });

  test("skips fenced code", () => {
    const md =
      "```md\n[a](https://remocn.dev/about)\n```\n[a](https://remocn.dev/about)";
    expect(tagAgentLinks(md, "llms")).toBe(
      "```md\n[a](https://remocn.dev/about)\n```\n[a](https://remocn.dev/about?utm_source=llms&utm_medium=agent)",
    );
  });
});

describe("mcpAgentSource", () => {
  test("names the client, or mcp when unknown", () => {
    expect(mcpAgentSource("claude")).toBe("claude");
    expect(mcpAgentSource("other")).toBe("mcp");
    expect(mcpAgentSource("unknown")).toBe("mcp");
  });
});
