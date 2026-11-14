import { createFromSource } from "fumadocs-core/search/server";
import { docsSearchIndex } from "@/lib/docs-search-index";
import { source } from "@/source";

export const { GET } = createFromSource(source, {
  buildIndex: docsSearchIndex,
});
