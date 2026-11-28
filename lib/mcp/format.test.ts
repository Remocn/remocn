import { describe, expect, test } from "bun:test";
import { formatRow, withPreviewLink } from "@/lib/mcp/format";
import type { ComponentRecord } from "@/lib/mcp/search";

const RECORD: ComponentRecord = {
  name: "ink-underline",
  title: "Ink Underline",
  description: "A hand-drawn underline.",
  section: "typography",
  docs: "https://remocn.dev/docs/typography/ink-underline.md",
  vibe: "playful",
  length: 30,
  tier: "remocn",
  useWhen: ["Stress one word"],
  avoidWhen: [],
  askedAs: [],
  install: "npx shadcn@latest add @remocn/ink-underline",
};

const PAGE =
  "https://remocn.dev/docs/typography/ink-underline?utm_source=claude&utm_medium=agent";

describe("formatRow", () => {
  test("gives the person a tagged page link and the agent a bare .md link", () => {
    expect(formatRow(RECORD, "claude")).toBe(
      [
        "- `ink-underline` — Ink Underline (typography · playful · 30f · remocn)",
        "  Use: Stress one word",
        "  Docs: https://remocn.dev/docs/typography/ink-underline.md · Install: `npx shadcn@latest add @remocn/ink-underline`",
        `  Preview & customize: ${PAGE}`,
      ].join("\n"),
    );
  });

  test("tags the link with the calling client", () => {
    expect(formatRow(RECORD, "mcp")).toContain(
      "ink-underline?utm_source=mcp&utm_medium=agent",
    );
  });
});

describe("withPreviewLink", () => {
  test("puts the page link under the URL line and leaves that line bare", () => {
    const markdown = [
      "# Ink Underline",
      "URL: https://remocn.dev/docs/typography/ink-underline",
      "",
      "A hand-drawn underline.",
    ].join("\n");
    expect(withPreviewLink(markdown, RECORD, "claude")).toBe(
      [
        "# Ink Underline",
        "URL: https://remocn.dev/docs/typography/ink-underline",
        `Preview & customize: ${PAGE}`,
        "",
        "A hand-drawn underline.",
      ].join("\n"),
    );
  });
});
