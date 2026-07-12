import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { BlockPreview } from "@/components/docs/block-preview";
import { Note, Warning } from "@/components/docs/callout";
import { getIconForLanguage } from "@/components/docs/code-icons";
import { ComponentCardGrid } from "@/components/docs/component-card-grid";
import { ComponentExample } from "@/components/docs/component-example";
import { ComponentPreview } from "@/components/docs/component-preview";
import { CopyButton } from "@/components/docs/copy-button";
import { Dependencies } from "@/components/docs/dependencies";
import { IconsGallery } from "@/components/docs/icons-gallery";
import { InstallAll } from "@/components/docs/install-all";
import { InstallBlock } from "@/components/docs/install-block";
import { PropsTable } from "@/components/docs/props-table";
import { UiComponentPreview } from "@/components/docs/ui-component-preview";
import { cn } from "@/lib/utils";

/**
 * MDX prose mapping for remocn docs.
 *
 * Fumadocs' `defaultMdxComponents` is spread as the base — heading anchors +
 * scroll IDs, the internal-aware `Link`, and the overflow-wrapped `Table` stay
 * intact. Code blocks are the exception: `source.config.ts` swaps fumadocs'
 * shiki plugin for rehype-pretty-code (vesper / github-light-default), and the
 * `pre` / `figcaption` / `code` overrides below render the shadcn-style block
 * (line numbers, filename title with language icon, copy button).
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
function Pre({ className, ...props }: ComponentProps<"pre">) {
  return (
    <pre
      data-not-typeset
      className={cn(
        "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none has-data-line-numbers:px-0",
        className,
      )}
      {...props}
    />
  );
}

function Figcaption({
  className,
  children,
  ...props
}: ComponentProps<"figcaption">) {
  const icon =
    "data-language" in props && typeof props["data-language"] === "string"
      ? getIconForLanguage(props["data-language"])
      : null;

  return (
    <figcaption
      className={cn(
        "flex items-center gap-2 text-code-foreground [&_svg]:size-4 [&_svg]:opacity-70",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </figcaption>
  );
}

function Code({
  className,
  __raw__,
  ...props
}: ComponentProps<"code"> & { __raw__?: string }) {
  if (typeof props.children === "string") {
    return <code className={className} {...props} />;
  }

  return (
    <>
      {__raw__ ? (
        <CopyButton value={__raw__} className="absolute top-3 right-2 z-10" />
      ) : null}
      <code className={className} {...props} />
    </>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    pre: Pre,
    figcaption: Figcaption,
    code: Code,

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
