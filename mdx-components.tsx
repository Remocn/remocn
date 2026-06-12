import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Note, Warning } from "@/components/docs/callout";
import { ComponentCardGrid } from "@/components/docs/component-card-grid";
import { ComponentPreview } from "@/components/docs/component-preview";
import { UiComponentPreview } from "@/components/docs/ui-component-preview";
import { BlockPreview } from "@/components/docs/block-preview";
import { Dependencies } from "@/components/docs/dependencies";
import { InstallBlock } from "@/components/docs/install-block";
import { PropsTable } from "@/components/docs/props-table";

/**
 * MDX prose mapping for remocn docs.
 *
 * Fumadocs' `defaultMdxComponents` is spread as the base — its machinery must
 * stay intact: heading anchors + scroll IDs (`Heading`), the Shiki
 * `CodeBlock`/`Pre` wiring that emits the `figure.shiki` markup, the
 * internal-aware `Link`, and the overflow-wrapped `Table`. Reimplementing any
 * of these would break code highlighting, copy buttons, and heading deep-links.
 *
 * The remocn *visual* restyle that de-templates the default Fumadocs prose is
 * delivered through the token-driven `.prose` rules in `app/globals.css`
 * (headings → display H1 + sans h2–h4, links → `foreground`/`accent` with a
 * focus-visible ring, code/Shiki → `muted` token surface, tables → token
 * hairlines + muted header). That keeps every prose element on our oklch
 * tokens — no default-blue links, no templated heading look — without forking
 * the Fumadocs components here.
 *
 * Custom doc widgets are registered as-is (other lanes own their internals).
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),

    // Custom doc widgets — registrations only, not reimplemented here.
    ComponentPreview,
    UiComponentPreview,
    BlockPreview,
    InstallBlock,
    PropsTable,
    Note,
    Warning,
    Dependencies,
    ComponentCardGrid,

    ...components,
  };
}
