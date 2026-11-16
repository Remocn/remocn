import { installCommand } from "@/lib/mcp/search";

const SITE_URL = "https://remocn.dev";

/**
 * The customizer's "Open in" prompt: the install prompt plus the props the
 * reader picked. It links the Markdown page so the agent reads props and
 * usage notes without rendering the site.
 */
export function agentPrompt({
  name,
  code,
  pathname,
}: {
  name: string;
  code: string;
  pathname: string;
}): string {
  return [
    `Add the @remocn/${name} component to my project with the props I picked in the docs.`,
    "",
    `1. Install it: \`${installCommand(name)}\``,
    "2. Use it like this:",
    "",
    "```tsx",
    code,
    "```",
    "",
    `Docs: ${SITE_URL}${pathname}.md`,
  ].join("\n");
}
