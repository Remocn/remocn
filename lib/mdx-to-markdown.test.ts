import { describe, expect, test } from "bun:test";
import { mdxToMarkdown } from "./mdx-to-markdown";

const SITE = "https://remocn.dev";

describe("mdxToMarkdown", () => {
  test("drops the page's own component imports", () => {
    const src = [
      'import { GuidePrompt } from "@/components/docs/guides/prompt-block";',
      "import {",
      "  GuideNotes,",
      "  GuideMoreLink,",
      '} from "@/components/docs/guides/director-notes";',
      "",
      "Text.",
    ].join("\n");
    expect(mdxToMarkdown(src, SITE).trim()).toBe("Text.");
  });

  test("keeps imports inside code fences", () => {
    const src = [
      "```tsx",
      'import { AbsoluteFill } from "remotion";',
      "```",
    ].join("\n");
    expect(mdxToMarkdown(src, SITE)).toBe(src);
  });

  test("unwraps unknown components and keeps their markdown", () => {
    const src = [
      '<GuideNote title="Keep it short">',
      "",
      "One idea per **beat**.",
      "",
      "</GuideNote>",
    ].join("\n");
    expect(mdxToMarkdown(src, SITE)).toBe(
      "**Keep it short**\n\nOne idea per **beat**.",
    );
  });

  test("drops self-closing unknown components", () => {
    const src = "Before\n\n<GuideCount value={3} />\n\nAfter";
    expect(mdxToMarkdown(src, SITE)).toBe("Before\n\nAfter");
  });

  test("leaves placeholders that are not components alone", () => {
    const src = "Swap <PRODUCT> for your name.";
    expect(mdxToMarkdown(src, SITE)).toBe(src);
  });
});
