import {
  type StructuredData,
  structure,
} from "fumadocs-core/mdx-plugins/remark-structure";
import type { AdvancedIndex } from "fumadocs-core/search/server";
import type { InferPageType } from "fumadocs-core/source";
import remarkMdx from "remark-mdx";
import { stripFrontmatter } from "@/lib/mdx-to-markdown";
import type { source } from "@/source";

type DocPage = InferPageType<typeof source>;

type Node = { type: string; value?: string; children?: Node[] };

/**
 * What MDX does to the tree before any remark plugin sees it: a paragraph
 * holding nothing but JSX (`<SetupCard>…</SetupCard>` on one line) becomes
 * that JSX as a block. Mirrors `remarkMarkAndUnravel` of @mdx-js/mdx, which
 * the package doesn't export. Without it such lines would be indexed as
 * paragraphs, which the compiled page never did.
 */
function unravelJsxParagraphs() {
  const walk = (parent: Node) => {
    if (!parent.children) return;
    parent.children = parent.children.flatMap((node) => {
      if (node.type !== "paragraph" || !node.children) return [node];
      const content = node.children.filter(
        (child) => !(child.type === "text" && child.value?.trim() === ""),
      );
      const onlyJsx =
        content.length > 0 &&
        content.every(
          (child) =>
            child.type === "mdxJsxTextElement" ||
            child.type === "mdxTextExpression",
        );
      if (!onlyJsx) return [node];
      for (const child of content) {
        child.type =
          child.type === "mdxJsxTextElement"
            ? "mdxJsxFlowElement"
            : "mdxFlowExpression";
      }
      return content;
    });
    for (const child of parent.children) walk(child);
  };
  return (tree: Node) => walk(tree);
}

// Keyed by page URL and kept across rebuilds of the index: in dev every MDX
// save re-evaluates the source, and only the saved page has new text.
const cache = new Map<string, { raw: string; data: StructuredData }>();

/**
 * Search entry of a docs page, read from its MDX source instead of the
 * compiled page.
 *
 * The docs collection compiles a page when it is first requested (`dynamic`
 * in source.config.ts). Fumadocs' default index reads `structuredData` off
 * the compiled page, so the first search would compile all ~900 pages and
 * keep them in memory. This runs the same remark-structure pass on the
 * parsed MDX alone and gives the same headings and text.
 */
export async function docsSearchIndex(page: DocPage): Promise<AdvancedIndex> {
  const data = page.data as typeof page.data & {
    getText: (type: "raw") => Promise<string>;
  };
  const raw = await data.getText("raw");
  let entry = cache.get(page.url);
  if (entry?.raw !== raw) {
    entry = {
      raw,
      data: structure(stripFrontmatter(raw), [remarkMdx, unravelJsxParagraphs]),
    };
    cache.set(page.url, entry);
  }
  return {
    id: page.url,
    url: page.url,
    title: data.title,
    description: data.description,
    structuredData: entry.data,
  };
}
