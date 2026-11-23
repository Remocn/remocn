import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import {
  applyMdxPreset,
  defineCollections,
  defineConfig,
  defineDocs,
} from "fumadocs-mdx/config";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import type { ShikiTransformer } from "shiki";
import { z } from "zod";
import { componentMetaSchema } from "./lib/docs-schema";

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

// Code fences: rehype-pretty-code in place of Fumadocs' own highlighter.
const prettyCode: [typeof rehypePrettyCode, RehypePrettyCodeOptions] = [
  rehypePrettyCode,
  {
    theme: {
      dark: "vesper",
      light: "github-light-default",
    },
    keepBackground: false,
    transformers,
  },
];

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // ~900 pages: a page body is compiled when the page is rendered (on
    // request in dev, during prerender in a build) instead of every page
    // being a bundler module. Turbopack compiles all modules of a route up
    // front, lazy imports included, so the bundled modes (`async: true` too)
    // made the first docs request in dev compile the whole collection. The
    // price: a docs page can't `import` or `export`. Its components are
    // registered in components/docs/mdx-page-components.ts.
    dynamic: true,
    // The preset without rehype-toc: the docs read neither its `toc` export
    // nor its `[toc]` heading markers. The export holds each heading as JSX
    // at module level, where a component in a heading
    // (`## The storyboard<GuideCount n={5} />`) has to be an import, and a
    // runtime-compiled page has none.
    mdxOptions: applyMdxPreset({ rehypePlugins: () => [prettyCode] }),
    schema: pageSchema.safeExtend({
      ...componentMetaSchema.shape,
      // Shorter label for the sidebar, breadcrumbs, prev/next and the docs
      // menu in the site header when the page title is too long to sit there.
      navTitle: z.string().optional(),
      // Date of the page's last real content change, for the sitemap's
      // lastmod and the article's dateModified. Only pages whose facts are
      // dated carry it: lib/sitemap.ts explains why dates are never guessed.
      // A "YYYY-MM-DD" string, not a Date: the dynamic collection stores
      // frontmatter as JSON, so a Date would arrive as a string anyway.
      lastModified: z
        .union([z.date(), z.iso.date()])
        .transform((value) =>
          typeof value === "string" ? value : value.toISOString().slice(0, 10),
        )
        .optional(),
    }),
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

export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    video: z.url().optional(),
    videoPoster: z.url().optional(),
  }),
});

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift();
      plugins.push(prettyCode);
      return plugins;
    },
  },
});
