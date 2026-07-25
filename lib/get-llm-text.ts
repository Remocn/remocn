import type { InferPageType } from "fumadocs-core/source";
import { mdxToMarkdown, stripFrontmatter } from "@/lib/mdx-to-markdown";
import type { source } from "@/source";

export const SITE_URL = "https://remocn.dev";

type DocPage = InferPageType<typeof source>;

export function formatLength(length: number | "state-driven"): string {
  return length === "state-driven" ? "state-driven" : `${length}f @ 30fps`;
}

export async function getLLMText(page: DocPage): Promise<string> {
  const data = page.data as typeof page.data & {
    getText: (type: "raw" | "processed") => Promise<string>;
  };

  const raw = await data.getText("raw");
  const body = mdxToMarkdown(stripFrontmatter(raw), SITE_URL).trim();

  const facts: string[] = [];
  if (data.component)
    facts.push(
      `- Install: \`npx shadcn@latest add @remocn/${data.component}\``,
    );
  if (data.vibe) facts.push(`- Vibe: ${data.vibe}`);
  if (data.length) facts.push(`- Natural length: ${formatLength(data.length)}`);

  const blocks = [
    `# ${data.title}\nURL: ${SITE_URL}${page.url}`,
    data.description,
    facts.join("\n"),
    body,
  ];

  if (data.useWhen?.length) {
    blocks.push(
      `## Use when\n${data.useWhen.map((line) => `- ${line}`).join("\n")}`,
    );
  }
  if (data.avoidWhen?.length) {
    blocks.push(
      `## Don't use when\n${data.avoidWhen.map((line) => `- ${line}`).join("\n")}`,
    );
  }

  return blocks.filter(Boolean).join("\n\n");
}
