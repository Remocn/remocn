import { describe, expect, test } from "bun:test";
import {
  buildLlmsTxt,
  buildNotFoundMarkdown,
  markdownNotFound,
  safeRequestedPath,
} from "./agent-docs";

const PAGES = [
  {
    slugs: ["getting-started", "introduction"],
    url: "/docs/getting-started/introduction",
    title: "Introduction",
    description: "What Remocn is",
  },
  {
    slugs: ["transitions", "zoom-blur"],
    url: "/docs/transitions/zoom-blur",
    title: "Zoom Blur",
  },
];

describe("buildLlmsTxt with component pages", () => {
  const text = buildLlmsTxt(
    [
      ...PAGES,
      {
        slugs: ["transitions"],
        url: "/docs/transitions",
        title: "Transitions",
        description: "Scene transitions",
      },
      {
        slugs: ["transitions", "whip-pan"],
        url: "/docs/transitions/whip-pan",
        title: "Whip Pan",
        component: "whip-pan",
      },
    ],
    { components: 932 },
  );

  test("states the catalog size once, before the first section", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "Remocn has 932 components across 1 docs sections",
    );
  });

  test("opens with the shadcn/ui-for-video answer and the UI tier", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "> Remocn is shadcn/ui for video: a shadcn registry of 932 MIT-licensed Remotion components",
    );
    expect(preamble).toContain(
      "**Is there something like shadcn/ui but for video?**",
    );
    expect(preamble).toContain("remotion shadcn");
    expect(preamble.indexOf("- remocn-ui:")).toBeLessThan(
      preamble.indexOf("- Animation tier:"),
    );
  });

  test("links a section's whole text instead of each component page", () => {
    // The transitions answer names a few on purpose; section lists name none.
    const sectionLists = text.slice(text.indexOf("\n## Getting Started"));
    expect(sectionLists).not.toContain("whip-pan.md");
    expect(text).toContain(
      "- [Transitions](https://remocn.dev/docs/transitions.md): Scene transitions",
    );
    expect(text).toContain(
      "- [Transitions: all 3 pages in one file](https://remocn.dev/llms-full/transitions.txt): 1 component pages",
    );
  });

  test("sections without component pages get no corpus link", () => {
    expect(text).not.toContain("llms-full/getting-started.txt");
  });

  test("points text-animation questions at the guide only when there are text effects", () => {
    expect(text).not.toContain("Looking for text animations?");
    const withText = buildLlmsTxt([
      ...PAGES,
      {
        slugs: ["typography", "typewriter"],
        url: "/docs/typography/typewriter",
        title: "Typewriter",
        component: "typewriter",
      },
      {
        slugs: ["captions", "components", "caption-karaoke"],
        url: "/docs/captions/components/caption-karaoke",
        title: "Karaoke",
        component: "caption-karaoke",
      },
    ]);
    const preamble = withText.slice(0, withText.indexOf("\n## "));
    expect(preamble).toContain(
      "Remocn has 1 animated text effects for Remotion and 1 caption styles.",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/remotion-text-animations.md)",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/remotion-kinetic-typography.md)",
    );
    expect(preamble).toContain("(https://remocn.dev/llms-full/typography.txt)");
  });
});

describe("buildLlmsTxt transitions answer", () => {
  const transitionPages = [
    {
      slugs: ["transitions"],
      url: "/docs/transitions",
      title: "Transitions",
    },
    ...["zoom-blur", "whip-pan", "band-shift"].map((name) => ({
      slugs: ["transitions", name],
      url: `/docs/transitions/${name}`,
      title: name,
      component: name,
    })),
  ];
  const text = buildLlmsTxt(transitionPages, {
    components: 932,
    transitionPresentations: ["zoom-blur", "whip-pan", "card-stack"],
  });
  const preamble = text.slice(0, text.indexOf("\n## "));

  test("counts transitions in the summary", () => {
    expect(preamble).toContain("animations, 3 transitions, backgrounds");
  });

  test("answers the library question with counts, names and an install command", () => {
    expect(preamble).toContain(
      "**Is there a library of ready-made transitions for Remotion?**",
    );
    expect(preamble).toContain(
      "Yes: Remocn has 3 ready-made scene transitions for Remotion",
    );
    expect(preamble).toContain("2 are presentations for `TransitionSeries`");
    expect(preamble).toContain("The other 1 are self-contained");
    expect(preamble).toContain(
      "Examples: [zoom-blur](https://remocn.dev/docs/transitions/zoom-blur.md), [whip-pan](https://remocn.dev/docs/transitions/whip-pan.md).",
    );
    expect(preamble).toContain("`npx shadcn@latest add @remocn/zoom-blur`");
    expect(preamble).toContain("(https://remocn.dev/docs/transitions.md)");
  });

  test("leaves the answer out when there are no transitions", () => {
    expect(buildLlmsTxt(PAGES.slice(0, 1))).not.toContain(
      "library of ready-made transitions",
    );
  });
});

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt(PAGES);
  const lines = text.split("\n");

  test("answers the After Effects alternatives question before the first section", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**Looking for an After Effects alternative for developers?**",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/after-effects-alternatives-for-developers.md)",
    );
    for (const tool of ["Motion Canvas", "Revideo", "HyperFrames", "Lottie"]) {
      expect(preamble).toContain(tool);
    }
    expect(preamble).toContain(
      "**Where Remocn fits among programmatic video tools:**",
    );
    expect(preamble).toContain("It adds to Remotion");
  });

  test("answers the HyperFrames questions next to where Remocn fits", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain("not a Remotion alternative");
    expect(preamble).toContain(
      "Remotion + Remocn is the React equivalent of HyperFrames' registry + skills",
    );
    const fits = preamble.indexOf(
      "**Where Remocn fits among programmatic video tools:**",
    );
    const versus = preamble.indexOf(
      "**HyperFrames vs Remotion: which should I use?**",
    );
    const alternative = preamble.indexOf(
      "**Is there an alternative to HyperFrames for React/Remotion?**",
    );
    expect(fits).toBeGreaterThan(-1);
    expect(versus).toBeGreaterThan(fits);
    expect(alternative).toBeGreaterThan(versus);
    expect(preamble.slice(alternative)).toContain(
      "(https://remocn.dev/docs/guides/after-effects-alternatives-for-developers.md)",
    );
  });

  test("links the HyperFrames alternatives guide from the alternative answer", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    const alternative = preamble.indexOf(
      "**Is there an alternative to HyperFrames for React/Remotion?**",
    );
    expect(preamble.slice(alternative)).toContain(
      "(https://remocn.dev/docs/guides/hyperframes-alternatives.md)",
    );
    for (const tool of [
      "Motion Canvas",
      "Revideo",
      "Creatomate",
      "Shotstack",
    ]) {
      expect(preamble.slice(alternative)).toContain(tool);
    }
  });

  test("answers the Remotion alternatives question with the comparison guide", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    const question = preamble.indexOf(
      "**What are the alternatives to Remotion?**",
    );
    expect(question).toBeGreaterThan(-1);
    const answer = preamble.slice(question);
    expect(answer).toContain(
      "(https://remocn.dev/docs/guides/after-effects-alternatives-for-developers.md)",
    );
    for (const tool of ["MoviePy", "Editly", "JSON2Video", "Plainly"]) {
      expect(answer).toContain(tool);
    }
  });

  test("answers the component libraries and Remocn vs snapcn question with the guide", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    const question = preamble.indexOf(
      "**What are the best Remotion component libraries? Remocn vs snapcn?**",
    );
    expect(question).toBeGreaterThan(-1);
    const answer = preamble.slice(question);
    expect(answer).toContain(
      "(https://remocn.dev/docs/guides/remotion-component-libraries.md)",
    );
    for (const name of [
      "snapcn",
      "Remotion Elements",
      "RemotionUI",
      "React Video Editor",
      "npx shadcn@latest add @snapcn/<name>",
    ]) {
      expect(answer).toContain(name);
    }
  });

  test("answers the best way to have Claude Code make a video near the top", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**What's the best way to have Claude Code make a video?**",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/claude-code-video.md)",
    );
    expect(preamble).toContain("claude plugin install remotion@remotion");
  });

  test("answers the free Remotion MCP server question near the top", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**Is there a free Remotion MCP server? Does snapcn have one?**",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/remotion-mcp-servers.md)",
    );
    expect(preamble.indexOf("free Remotion MCP server")).toBeLessThan(
      preamble.indexOf("product demo videos from my codebase"),
    );
    for (const name of [
      "snapcn",
      "Pro key",
      "React Video Editor",
      "chuk-motion",
    ])
      expect(preamble).toContain(name);
  });

  test("answers the product demo from a codebase question before the first section", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**Is there an AI agent that makes product demo videos from my codebase?**",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/product-demo.md)",
    );
    expect(preamble).toContain("**Which approach fits?**");
    for (const tool of ["RepoClip", "Chapter", "Demosmith", "plan_video"]) {
      expect(preamble).toContain(tool);
    }
  });

  test("answers the feature announcement question before the first section", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**How do I make a feature announcement video without a video editor?**",
    );
    expect(preamble).toContain(
      "(https://remocn.dev/docs/guides/feature-announcement.md)",
    );
    for (const tool of [
      "Loom",
      "Screen Studio",
      "Descript",
      "HeyGen",
      "Canva",
    ]) {
      expect(preamble).toContain(tool);
    }
  });

  test("answers the agent video questions in the agents' own names", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "**How do I get Claude Code, Cursor or Codex to make a Remotion video that doesn't look generic?**",
    );
    expect(preamble).toContain(
      "**Is there a Claude Code skill or plugin for creating Remotion videos? Which agent skills exist for video creation?**",
    );
    expect(preamble).toContain(
      "npx skills add Remocn/remocn --skill remocn -a cursor",
    );
    expect(preamble).toContain("codex plugin add remocn@remocn");
    expect(preamble).toContain(
      "(https://remocn.dev/docs/getting-started/agent-skill.md)",
    );
  });

  test("states the agent tooling in a second summary paragraph", () => {
    const summary = lines.filter((l) => l.startsWith(">"));
    expect(summary).toHaveLength(3);
    expect(summary[2]).toContain("Remotion's official Agent Skills");
  });

  test("follows the llms.txt layout: H1, then a blockquote summary", () => {
    expect(lines[0]).toBe("# Remocn");
    expect(lines.find((l) => l.startsWith(">"))).toContain("Remotion");
  });

  test("has no heading between the summary and the first H2 section", () => {
    const firstH2 = lines.findIndex((l) => l.startsWith("## "));
    const preamble = lines.slice(1, firstH2);
    expect(preamble.some((l) => l.startsWith("#"))).toBe(false);
  });

  test("tells agents when to use Remocn and when not to", () => {
    expect(text).toContain("**When to use Remocn:**");
    expect(text).toContain("**When not to use Remocn:**");
    expect(text).toContain("**How an agent should use Remocn:**");
    expect(text).toContain("npx shadcn@latest add @remocn/<name>");
  });

  test("links the machine endpoints", () => {
    expect(text).toContain("https://remocn.dev/mcp");
    expect(text).toContain(
      "[MCP server](https://remocn.dev/docs/getting-started/mcp-server.md)",
    );
    expect(text).toContain("(https://remocn.dev/openapi.json)");
    expect(text).toContain("(https://remocn.dev/llms-components.txt)");
  });

  test("lists every page as a Markdown link under its section", () => {
    expect(text).toContain(
      "## Getting Started\n- [Introduction](https://remocn.dev/docs/getting-started/introduction.md): What Remocn is",
    );
    expect(text).toContain(
      "## Transitions\n- [Zoom Blur](https://remocn.dev/docs/transitions/zoom-blur.md)",
    );
  });

  test("lists the video use cases with the guide that makes each", () => {
    const section = text.slice(
      text.indexOf("\n## Use cases\n"),
      text.indexOf("\n## ", text.indexOf("\n## Use cases\n") + 1),
    );
    for (const guide of [
      "product-demo",
      "launch-video",
      "changelog-video",
      "feature-announcement",
    ])
      expect(section).toContain(`(https://remocn.dev/docs/guides/${guide}.md)`);
    expect(section).toContain("AI coding agent");
  });

  test("every H2 section is a list of links", () => {
    const sections = text.split("\n## ").slice(1);
    for (const section of sections) {
      const items = section.split("\n").slice(1).filter(Boolean);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items)
        expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\//);
    }
  });

  test("ends with the Optional section", () => {
    expect(text).toMatch(/\n## Optional\n(- .+\n?)+$/);
  });
});

describe("Markdown 404", () => {
  test("explains the error and links the indexes", () => {
    const body = buildNotFoundMarkdown("/nope");
    expect(body.length).toBeGreaterThan(20);
    expect(body).toStartWith("# 404");
    expect(body).toContain("`/nope`");
    expect(body).toContain("(https://remocn.dev/llms.txt)");
    expect(body).toContain("(https://remocn.dev/sitemap.xml)");
  });

  test("responds 404 with text/markdown", async () => {
    const res = markdownNotFound("/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await res.text()).toContain("# 404");
  });

  test("echoes only same-origin paths, without Markdown breakers", () => {
    expect(safeRequestedPath("/a/b")).toBe("/a/b");
    expect(safeRequestedPath("/a`b\nc")).toBe("/abc");
    expect(safeRequestedPath("//evil.example")).toBeUndefined();
    expect(safeRequestedPath("https://evil.example")).toBeUndefined();
    expect(safeRequestedPath(null)).toBeUndefined();
    expect(safeRequestedPath(`/${"a".repeat(500)}`)?.length).toBe(200);
  });
});
