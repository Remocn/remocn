import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { BlockPreview } from "@/components/docs/block-preview";
import { Note, Warning } from "@/components/docs/callout";
import { ComponentCardGrid } from "@/components/docs/component-card-grid";
import { ComponentExample } from "@/components/docs/component-example";
import { ComponentPreview } from "@/components/docs/component-preview";
import { Dependencies } from "@/components/docs/dependencies";
import { IconsGallery } from "@/components/docs/icons-gallery";
import { InstallAll } from "@/components/docs/install-all";
import { InstallBlock } from "@/components/docs/install-block";
import { PropsTable } from "@/components/docs/props-table";
import { UiComponentPreview } from "@/components/docs/ui-component-preview";

/**
 * MDX prose mapping for remocn docs.
 *
 * Fumadocs' `defaultMdxComponents` is spread as the base — its machinery must
 * stay intact: heading anchors + scroll IDs (`Heading`), the Shiki
 * `CodeBlock`/`Pre` wiring that emits the `figure.shiki` markup, the
 * internal-aware `Link`, and the overflow-wrapped `Table`. Reimplementing any
 * of these would break code highlighting, copy buttons, and heading deep-links.
 *
 * Docs typography is owned by shadcn typeset (`app/typeset.css`, applied via
 * the `typeset typeset-docs` container on the docs page): headings, links,
 * code, tables and all vertical rhythm derive from its three rhythm variables
 * on our oklch tokens. `app/globals.css` keeps only functional exceptions —
 * the Shiki surface fix (outranks Shiki's inline styles) and the readable
 * text-measure cap.
 *
 * Custom doc widgets are registered as-is (other lanes own their internals).
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),

    // Custom doc widgets — registrations only, not reimplemented here.
    ComponentPreview,
    ComponentExample,
    UiComponentPreview,
    BlockPreview,
    InstallBlock,
    InstallAll,
    PropsTable,
    Note,
    Warning,
    Dependencies,
    ComponentCardGrid,
    IconsGallery,

    ...components,
  };
}
