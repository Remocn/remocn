import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import {
  defineCollections,
  defineConfig,
  defineDocs,
} from "fumadocs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
import type { ShikiTransformer } from "shiki";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const changelog = defineCollections({
  type: "doc",
  dir: "content/changelog",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    video: z.url().optional(),
    videoPoster: z.url().optional(),
  }),
});

const transformers: ShikiTransformer[] = [
  {
    code(node) {
      if (node.tagName === "code") {
        node.properties.__raw__ = this.source;
        if (this.source.split("\n").length > 1) {
          node.properties["data-line-numbers"] = "";
        }
      }
    },
  },
];

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift();
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            dark: "vesper",
            light: "github-light-default",
          },
          keepBackground: false,
          transformers,
        },
      ]);
      return plugins;
    },
  },
});
