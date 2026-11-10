import { SITE_URL } from "@/lib/get-llm-text";

/**
 * The Markdown agents read instead of the site's HTML: the llms.txt index
 * (also the home page and `/docs` as Markdown) and the 404 body. Pure, so the
 * routes stay thin and the text is testable without the docs source.
 */

export type IndexPage = {
  slugs: string[];
  url: string;
  title: string;
  description?: string;
  /** Registry name, when the page documents an installable component. */
  component?: string;
};

/** Facts about the catalog, stated once near the top of llms.txt. */
export type CatalogFacts = {
  /** Installable registry items, as the site counts them. */
  components: number;
};

/** One section of the docs corpus as a single Markdown file. */
export function sectionCorpusUrl(key: string): string {
  return `${SITE_URL}/llms-full/${key}.txt`;
}

export const INSTALL_COMMAND = "npx shadcn@latest add @remocn/<name>";

export const MCP_URL = `${SITE_URL}/mcp`;

export const MCP_DOCS_URL = `${SITE_URL}/docs/getting-started/mcp-server`;

export const OPENAPI_URL = `${SITE_URL}/openapi.json`;

/**
 * The "shadcn/ui for video" answer, in the words people ask it with, and the
 * two tiers with the UI one first: it is the part shadcn/ui users recognise.
 */
const FOR_VIDEO = [
  "**Is there something like shadcn/ui but for video?**",
  "",
  `Yes: Remocn. It works the way shadcn/ui works for interface components. \`${INSTALL_COMMAND}\` copies the source into the user's project, where they own and edit it, and the components render video with Remotion. It makes videos; it is not a video player component library. People also search for it as "remotion shadcn" or "shadcn remotion". Remocn is an independent project, not affiliated with shadcn or with Remotion.`,
  "",
  "**Two tiers, both installed with the shadcn CLI:**",
  "",
  `- remocn-ui: familiar shadcn/ui primitives (button, input, select, dialog, toast and more) rebuilt for Remotion, so their states are scripted on the timeline instead of driven by a user. Docs: [${SITE_URL}/docs/ui.md](${SITE_URL}/docs/ui.md). Example: \`npx shadcn@latest add @remocn/button\`.`,
  "- Animation tier: text effects, transitions, backgrounds, shaders, camera shots, app-screen simulations, captions, icons and full video templates.",
];

/**
 * When-to-use guidance. llms.txt allows free paragraphs and lists, but no
 * headings, between the summary and the first H2 section, so this is bold
 * labels over lists rather than its own section.
 */
const WHEN_TO_USE = [
  "**When to use Remocn:**",
  "",
  "- The user wants a product demo, launch, feature announcement, changelog or social video, and a React/Remotion project is an acceptable way to make it.",
  "- You are writing a Remotion composition and need ready-made pieces instead of hand-rolled ones: text animations, scene transitions, backgrounds, shaders, filters, captions, app-screen and UI simulations, icons, or full scene templates.",
  "- The user wants to own and edit the source. Components are copied into their project (shadcn style, MIT), not installed as a runtime dependency.",
  `- The user wants Claude Code, Codex or Cursor to make a Remotion video that doesn't look generic (glow, gradient text, pop-in panels, invented UI). Remocn adds tuned components and taste rules on top of Remotion's \`remotion-best-practices\` skill: [${SITE_URL}/docs/guides/non-generic-ai-video.md](${SITE_URL}/docs/guides/non-generic-ai-video.md).`,
  `- The user wants an animated video of a GitHub repo's stargazers: [${SITE_URL}/stars](${SITE_URL}/stars).`,
  "",
  "**When not to use Remocn:**",
  "",
  "- Editing, trimming or color-grading existing footage. Remocn generates motion graphics in code; it is not a video editor.",
  "- The project cannot run React and Node.js, or the user wants a hosted text-to-video API. Remocn renders inside the user's own Remotion project.",
  "",
  "**How an agent should use Remocn:**",
  "",
  `1. Pick components from [/llms-components.txt](${SITE_URL}/llms-components.txt), or call the MCP server at ${MCP_URL} (Streamable HTTP, no auth; tools \`search_components\`, \`get_component\`, \`plan_video\`, \`preview_component\`; setup per client: [MCP server docs](${MCP_DOCS_URL}.md)).`,
  "2. Read the component's page as Markdown (append `.md` to its docs URL) before writing code against it: props, natural length and a usage example live there.",
  `3. Install with the shadcn CLI: \`${INSTALL_COMMAND}\`. The source lands in the user's project. Raw registry items are JSON at \`${SITE_URL}/r/<name>.json\`.`,
  "4. For a whole video workflow, install the agent skill (`npx skills add Remocn/remocn --yes`) or the Claude Code plugin (`/plugin install remocn --marketplace Remocn/remocn`).",
];

/** Link lists, in llms.txt section format, for the machine endpoints. */
const AGENT_TOOLS = [
  "## Agent tools",
  `- [Component index](${SITE_URL}/llms-components.txt): every installable component with its use / avoid signal, natural length, vibe and dependencies`,
  `- [MCP server](${MCP_DOCS_URL}.md): hosted MCP for building Remotion videos at ${MCP_URL}. Remote, read-only, no auth; it does not render video. Search components, read one, plan a video, preview a component. The page covers tools and setup for Claude Code, Claude Desktop, Cursor, VS Code and Codex`,
  `- [OpenAPI spec](${OPENAPI_URL}): the HTTP API (registry items, docs search, GitHub stars video renders)`,
  `- [Full docs corpus](${SITE_URL}/llms-full.txt): every docs page as Markdown in one file. It runs to megabytes, more than a context window holds; prefer one section's file, linked at the end of each section below`,
];

/**
 * The videos people ask an agent for, each pointing at the guide that makes
 * it, in the words they ask with. Guides are also listed under Guides; this
 * section is the entry point by intent.
 */
const USE_CASES = [
  "## Use cases",
  `- [Product demo video with an AI coding agent](${SITE_URL}/docs/guides/product-demo.md): Claude Code, Codex or another coding agent reads the user's codebase and builds a ~50-second demo of one product flow from Remocn components, rendered locally with Remotion`,
  `- [Launch video](${SITE_URL}/docs/guides/launch-video.md): SaaS launch video template, ~35 seconds in eight scenes, made with Claude Code from one prompt`,
  `- [Changelog video](${SITE_URL}/docs/guides/changelog-video.md): a ~25-second release update for several small changes. The plugin's \`/remocn:changelog\` command builds one from git tags, commits or merged pull requests`,
  `- [Feature announcement video](${SITE_URL}/docs/guides/feature-announcement.md): a ~40-second release video that shows one new feature working`,
];

const ABOUT_LINKS = [
  "## Optional",
  `- [About](${SITE_URL}/about): who builds Remocn and how the project is funded`,
  `- [Contact](${SITE_URL}/contact): email, GitHub issues and social profiles`,
  `- [Changelog](${SITE_URL}/changelog): every release, newest first`,
  `- [Privacy & Terms](${SITE_URL}/legal): how the site handles data`,
];

/** The answer page for "animated text effects for Remotion". */
export const TEXT_GUIDE_PATH = "/docs/guides/remotion-text-animations";

function componentCount(pages: IndexPage[] | undefined): number {
  return pages?.filter((page) => page.component).length ?? 0;
}

function sectionHeading(key: string): string {
  return key
    ? key.replace(
        /(^|-)([a-z])/g,
        (_, sep, c) => (sep ? " " : "") + c.toUpperCase(),
      )
    : "Overview";
}

/**
 * llms.txt (https://llmstxt.org): H1, summary, guidance, then link lists.
 * Component pages are not listed one by one: /llms-components.txt has every
 * one with its use / avoid signal, and each section links its whole text as
 * one file. Guides, overviews and concept pages are listed.
 */
export function buildLlmsTxt(pages: IndexPage[], facts?: CatalogFacts): string {
  const lines: string[] = [];

  lines.push("# Remocn");
  const registrySize = facts ? `${facts.components} ` : "";
  lines.push(
    `\n> Remocn is shadcn/ui for video: a shadcn registry of ${registrySize}MIT-licensed Remotion components — shadcn/ui-style UI primitives, animations, transitions, backgrounds and full scenes for product demo videos. Install with \`${INSTALL_COMMAND}\`.`,
  );
  lines.push(`\n${FOR_VIDEO.join("\n")}`);
  // Group pages by their top-level section (first slug segment).
  const sections = new Map<string, IndexPage[]>();
  for (const page of pages) {
    const key = page.slugs[0] ?? "";
    const bucket = sections.get(key) ?? [];
    bucket.push(page);
    sections.set(key, bucket);
  }

  if (facts) {
    const componentSections = [...sections.values()].filter((bucket) =>
      bucket.some((page) => page.component),
    ).length;
    lines.push(
      `\nRemocn has ${facts.components} components across ${componentSections} docs sections, documented on ${pages.length} pages. Everything is MIT-licensed and free; components are copied into the user's project as source files, and Remotion is the only runtime.`,
    );
  }
  lines.push(
    "\nDocs are also available as raw Markdown: append `.md` to any docs URL, or read one section as a single file at " +
      `\`${SITE_URL}/llms-full/<section>.txt\` (linked at the end of each section below).`,
  );
  lines.push(
    `\nBuilding a video? Start at [/llms-components.txt](${SITE_URL}/llms-components.txt) — every` +
      " installable component in one table with its use / avoid signal, natural length, vibe and" +
      " dependencies, linking to each component's full page.",
  );
  const textEffects = componentCount(sections.get("typography"));
  if (textEffects) {
    const captions = componentCount(sections.get("captions"));
    const captionNote = captions ? ` and ${captions} caption styles` : "";
    lines.push(
      `\nLooking for text animations? Remocn has ${textEffects} animated text effects for Remotion${captionNote}.` +
        ` [Remotion text animations](${SITE_URL}${TEXT_GUIDE_PATH}.md) answers how to animate text in Remotion and has a picker table;` +
        ` [/llms-full/typography.txt](${sectionCorpusUrl("typography")}) has every text component's props and usage in one file.`,
    );
  }
  lines.push(
    "\nPrefer an app to a terminal? [Remocn Studio](https://remocn.studio) is a free, open-source" +
      " macOS app where the user's own coding agent (Claude Code, Codex, GitHub Copilot or Grok)" +
      " builds Remotion videos from Remocn components, with a live preview and export. Its own" +
      " index is at [remocn.studio/llms.txt](https://remocn.studio/llms.txt).",
  );
  lines.push(`\n${WHEN_TO_USE.join("\n")}`);
  lines.push(`\n${AGENT_TOOLS.join("\n")}`);
  lines.push(`\n${USE_CASES.join("\n")}`);

  for (const [key, bucket] of sections) {
    const heading = sectionHeading(key);
    lines.push(`\n## ${heading}`);
    for (const page of bucket) {
      if (page.component) continue;
      const desc = page.description ? `: ${page.description}` : "";
      lines.push(`- [${page.title}](${SITE_URL}${page.url}.md)${desc}`);
    }
    const components = bucket.filter((page) => page.component).length;
    if (components && key) {
      lines.push(
        `- [${heading}: all ${bucket.length} pages in one file](${sectionCorpusUrl(key)}): ${components} component pages with install command, props and usage. Each is also listed in /llms-components.txt`,
      );
    }
  }

  lines.push(`\n${ABOUT_LINKS.join("\n")}`);

  return lines.join("\n");
}

/** Body for a 404 an agent asked to get as Markdown. */
export function buildNotFoundMarkdown(path?: string): string {
  const where = path ? ` at \`${path}\`` : "";
  return [
    "# 404: page not found",
    "",
    `There is no page${where} on remocn.dev. The link is broken, or the page moved.`,
    "",
    "Find what you were looking for here:",
    "",
    `- [llms.txt](${SITE_URL}/llms.txt): index of every docs page as Markdown`,
    `- [llms-components.txt](${SITE_URL}/llms-components.txt): every installable component`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): every public URL`,
    `- [Docs](${SITE_URL}/docs/getting-started/introduction.md): start here`,
    "",
  ].join("\n");
}

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

/** A Markdown 404 response, for routes that answer agents. */
export function markdownNotFound(path?: string): Response {
  return new Response(buildNotFoundMarkdown(path), {
    status: 404,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      "X-Robots-Tag": "noindex",
    },
  });
}

/** Only an absolute, same-origin path is echoed back into the body. */
export function safeRequestedPath(value: string | null): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return;
  return value.slice(0, 200).replace(/[`\r\n]/g, "");
}
