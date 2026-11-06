import type { IndexPage } from "@/lib/agent-docs";
import { source } from "@/source";

/** Every docs page, in source order, as the llms.txt index lists it. */
export function docsIndexPages(): IndexPage[] {
  return source.getPages().map((page) => ({
    slugs: page.slugs,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
  }));
}
