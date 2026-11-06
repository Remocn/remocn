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
};

export const INSTALL_COMMAND = "npx shadcn@latest add @remocn/<name>";

export const MCP_URL = `${SITE_URL}/mcp`;

export const OPENAPI_URL = `${SITE_URL}/openapi.json`;

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
  `- The user wants an animated video of a GitHub repo's stargazers: [${SITE_URL}/stars](${SITE_URL}/stars).`,
  "",
  "**When not to use Remocn:**",
  "",
  "- Editing, trimming or color-grading existing footage. Remocn generates motion graphics in code; it is not a video editor.",
  "- The project cannot run React and Node.js, or the user wants a hosted text-to-video API. Remocn renders inside the user's own Remotion project.",
  "",
  "**How an agent should use Remocn:**",
  "",
  `1. Pick components from [/llms-components.txt](${SITE_URL}/llms-components.txt), or call the MCP server at ${MCP_URL} (Streamable HTTP, no auth; tools \`search_components\`, \`get_component\`, \`plan_video\`, \`preview_component\`).`,
  "2. Read the component's page as Markdown (append `.md` to its docs URL) before writing code against it: props, natural length and a usage example live there.",
  `3. Install with the shadcn CLI: \`${INSTALL_COMMAND}\`. The source lands in the user's project. Raw registry items are JSON at \`${SITE_URL}/r/<name>.json\`.`,
  "4. For a whole video workflow, install the agent skill (`npx skills add Remocn/remocn --yes`) or the Claude Code plugin (`/plugin install remocn --marketplace Remocn/remocn`).",
];

/** Link lists, in llms.txt section format, for the machine endpoints. */
const AGENT_TOOLS = [
  "## Agent tools",
  `- [Component index](${SITE_URL}/llms-components.txt): every installable component with its use / avoid signal, natural length, vibe and dependencies`,
  `- [MCP server](${MCP_URL}): remote, read-only, no auth. Search components, read one, plan a video, preview a component`,
  `- [OpenAPI spec](${OPENAPI_URL}): the HTTP API (registry items, docs search, GitHub stars video renders)`,
  `- [Full docs corpus](${SITE_URL}/llms-full.txt): every docs page as Markdown in one file`,
];

const ABOUT_LINKS = [
  "## Optional",
  `- [About](${SITE_URL}/about): who builds Remocn and how the project is funded`,
  `- [Contact](${SITE_URL}/contact): email, GitHub issues and social profiles`,
  `- [Changelog](${SITE_URL}/changelog): every release, newest first`,
  `- [Privacy & Terms](${SITE_URL}/legal): how the site handles data`,
];

function sectionHeading(key: string): string {
  return key
    ? key.replace(
        /(^|-)([a-z])/g,
        (_, sep, c) => (sep ? " " : "") + c.toUpperCase(),
      )
    : "Overview";
}

/** llms.txt (https://llmstxt.org): H1, summary, guidance, then link lists. */
export function buildLlmsTxt(pages: IndexPage[]): string {
  const lines: string[] = [];

  lines.push("# Remocn");
  lines.push(
    `\n> shadcn registry of production-ready Remotion components — animations, transitions, backgrounds, and full scenes for product demo videos. Install with \`${INSTALL_COMMAND}\`.`,
  );
  lines.push(
    "\nDocs are also available as raw Markdown: append `.md` to any docs URL, or read [/llms-full.txt](" +
      `${SITE_URL}/llms-full.txt) for the full corpus in a single file.`,
  );
  lines.push(
    `\nBuilding a video? Start at [/llms-components.txt](${SITE_URL}/llms-components.txt) — every` +
      " installable component in one table with its use / avoid signal, natural length, vibe and" +
      " dependencies, linking to each component's full page.",
  );
  lines.push(
    "\nPrefer an app to a terminal? [Remocn Studio](https://remocn.studio) is a free, open-source" +
      " macOS app where the user's own coding agent (Claude Code, Codex, GitHub Copilot or Grok)" +
      " builds Remotion videos from Remocn components, with a live preview and export. Its own" +
      " index is at [remocn.studio/llms.txt](https://remocn.studio/llms.txt).",
  );
  lines.push(`\n${WHEN_TO_USE.join("\n")}`);
  lines.push(`\n${AGENT_TOOLS.join("\n")}`);

  // Group pages by their top-level section (first slug segment).
  const sections = new Map<string, IndexPage[]>();
  for (const page of pages) {
    const key = page.slugs[0] ?? "";
    const bucket = sections.get(key) ?? [];
    bucket.push(page);
    sections.set(key, bucket);
  }

  for (const [key, bucket] of sections) {
    lines.push(`\n## ${sectionHeading(key)}`);
    for (const page of bucket) {
      const desc = page.description ? `: ${page.description}` : "";
      lines.push(`- [${page.title}](${SITE_URL}${page.url}.md)${desc}`);
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
