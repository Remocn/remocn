import type { InferPageType } from "fumadocs-core/source";
import type { source } from "@/source";

export const SITE_URL = "https://remocn.dev";

type DocPage = InferPageType<typeof source>;

/**
 * Render a single doc page as a self-contained Markdown document for LLMs.
 * Uses the processed Markdown emitted by fumadocs-mdx (`includeProcessedMarkdown`
 * in source.config.ts), prefixed with a title + source URL header.
 */
export async function getLLMText(page: DocPage): Promise<string> {
  const data = page.data as typeof page.data & {
    getText: (type: "raw" | "processed") => Promise<string>;
  };
  const processed = await data.getText("processed");

  return [
    `# ${data.title}`,
    `URL: ${SITE_URL}${page.url}`,
    data.description ? `\n${data.description}` : "",
    "",
    processed,
  ]
    .filter(Boolean)
    .join("\n");
}
