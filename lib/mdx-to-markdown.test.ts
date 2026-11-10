import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  type DocsLookup,
  mdxToMarkdown,
  stripFrontmatter,
} from "./mdx-to-markdown";

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

describe("mdxToMarkdown: words carried in props", () => {
  test("a step keeps its command as a bash block", () => {
    const src = [
      '<Step n={1} title="Start from a Remotion project" command="npx create-video@latest">You need one.</Step>',
    ].join("\n");
    expect(mdxToMarkdown(src, SITE)).toBe(
      [
        "**Start from a Remotion project**",
        "",
        "You need one.",
        "",
        "```bash",
        "npx create-video@latest",
        "```",
      ].join("\n"),
    );
  });

  test("a multi-line command expression survives", () => {
    const src =
      '<Step n={2} title="Init" command={"npx shadcn@latest init\\nnpx shadcn@latest add @remocn/x"}>Run init.</Step>';
    expect(mdxToMarkdown(src, SITE)).toContain(
      "npx shadcn@latest init\nnpx shadcn@latest add @remocn/x",
    );
  });

  test("a self-closing widget with words in its props is kept", () => {
    const src =
      'Intro.\n\n<FileFlow steps={["components.json", "components/remocn/x.tsx"]} />\n\nOutro.';
    expect(mdxToMarkdown(src, SITE)).toBe(
      "Intro.\n\n`components.json` → `components/remocn/x.tsx`\n\nOutro.",
    );
  });

  test("indented sibling widgets become separate paragraphs", () => {
    const src = [
      "<Pillars>",
      '  <Pillar title="One">First.</Pillar>',
      '  <Pillar title="Two">Second.</Pillar>',
      "</Pillars>",
    ].join("\n");
    expect(mdxToMarkdown(src, SITE).trim()).toBe(
      "**One**\n\nFirst.\n\n**Two**\n\nSecond.",
    );
  });
});

describe("mdxToMarkdown: category indexes", () => {
  const pages = {
    "/docs/transitions/whip-pan": {
      title: "Whip Pan",
      description: "Fast pan",
    },
    "/docs/transitions/zoom-blur": {
      title: "Zoom Blur",
      description: "Depth punch",
    },
    "/docs/transitions/glitch-cut": {
      title: "Glitch Cut",
      description: "RGB tear",
    },
  } as const;
  const docs: DocsLookup = {
    entry: (url) =>
      url in pages ? { url, ...pages[url as keyof typeof pages] } : undefined,
    componentEntries: () =>
      Object.entries(pages).map(([url, page]) => ({ url, ...page })),
  };

  test("lists each group's pages and the unlisted rest under More", () => {
    const src = [
      '<CategoryIndex section="/docs/transitions">',
      "",
      '<ComponentGroup items={["whip-pan", "zoom-blur"]}>',
      "",
      "## Camera",
      "",
      "</ComponentGroup>",
      "",
      "</CategoryIndex>",
    ].join("\n");
    expect(mdxToMarkdown(src, SITE, { docs })).toBe(
      [
        "## Camera",
        "",
        "- [Whip Pan](https://remocn.dev/docs/transitions/whip-pan) — Fast pan",
        "- [Zoom Blur](https://remocn.dev/docs/transitions/zoom-blur) — Depth punch",
        "",
        "## More",
        "",
        "- [Glitch Cut](https://remocn.dev/docs/transitions/glitch-cut) — RGB tear",
      ].join("\n"),
    );
  });

  test("a self-closing index is one flat list", () => {
    const out = mdxToMarkdown(
      '<CategoryIndex section="/docs/transitions" />',
      SITE,
      { docs },
    );
    expect(out).not.toContain("## More");
    expect(out.split("\n")).toHaveLength(3);
  });
});

describe("mdxToMarkdown over content/docs", () => {
  // Commands and prompts are what an agent copies from a page. Every one in
  // the MDX must reach the Markdown copy, whichever widget carries it.
  test("every command and prompt prop reaches the Markdown", () => {
    const missing: string[] = [];
    for (const file of new Bun.Glob("content/docs/**/*.mdx").scanSync()) {
      const src = readFileSync(file, "utf8");
      const out = mdxToMarkdown(stripFrontmatter(src), SITE);
      for (const match of src.matchAll(
        /\s(?:command|prompt)=(?:"([^"]+)"|\{"((?:[^"\\]|\\.)+)"\})/g,
      )) {
        const value = (match[1] ?? JSON.parse(`"${match[2]}"`)) as string;
        if (!out.includes(value)) missing.push(`${file}: ${value}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
