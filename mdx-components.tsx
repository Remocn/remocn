import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { type ComponentProps, isValidElement } from "react";
import { BlockPreview } from "@/components/docs/block-preview";
import { CODE_PRE, CodeFrame } from "@/components/docs/blocks/code-frame";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { Note, Warning } from "@/components/docs/callout";
import { CanvasFilterNote } from "@/components/docs/canvas-filter-note";
import { CanvasTransitionNote } from "@/components/docs/canvas-transition-note";
import { ComponentCardGrid } from "@/components/docs/component-card-grid";
import { ComponentExample } from "@/components/docs/component-example";
import { ComponentPreviewMdx } from "@/components/docs/component-preview-mdx";
import { Dependencies } from "@/components/docs/dependencies";
import { GuideVideo } from "@/components/docs/guide-video";
import { IconsGallery } from "@/components/docs/icons-gallery";
import { InstallAll } from "@/components/docs/install-all";
import { InstallBlock } from "@/components/docs/install-block";
import { PropsTable } from "@/components/docs/props-table";
import { ShaderPresets } from "@/components/docs/shader-presets";
import { UiComponentPreview } from "@/components/docs/ui-component-preview";
import { cn } from "@/lib/utils";

/**
 * MDX prose mapping for remocn docs.
 *
 * Fumadocs' `defaultMdxComponents` is the base (heading anchors, the
 * internal-aware `Link`, the overflow-wrapped `Table`). Code fences come from
 * rehype-pretty-code (see `source.config.ts`) and are re-wrapped here in the
 * shared dark `CodeFrame`: language label, Copy, Vesper tokens, no line
 * numbers. Prose typography lives in `app/typeset.css` (`.typeset-docs`).
 */
function Pre({ children, ...props }: ComponentProps<"pre">) {
  const lang =
    typeof props["data-language" as keyof typeof props] === "string"
      ? (props["data-language" as keyof typeof props] as string)
      : undefined;
  const raw =
    isValidElement<{ __raw__?: string }>(children) &&
    typeof children.props.__raw__ === "string"
      ? children.props.__raw__
      : "";
  return (
    <CodeFrame lang={lang} code={raw}>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: horizontally scrollable code must be keyboard-focusable */}
      <pre data-not-typeset tabIndex={0} {...props} className={CODE_PRE}>
        {children}
      </pre>
    </CodeFrame>
  );
}

/** Drops rehype-pretty-code's figure marker so the frame owns the surface. */
function Figure({
  className,
  ...props
}: ComponentProps<"figure"> & { "data-rehype-pretty-code-figure"?: string }) {
  if (!("data-rehype-pretty-code-figure" in props)) {
    return <figure className={className} {...props} />;
  }
  const { "data-rehype-pretty-code-figure": _marker, ...rest } = props;
  return <figure {...rest} className={cn("not-prose", BLOCK_SPACING)} />;
}

/** Markdown tables scroll inside a card (styled in `app/typeset.css`). */
function Table(props: ComponentProps<"table">) {
  return (
    <div className="docs-table">
      <table {...props} />
    </div>
  );
}

function Code({
  __raw__: _raw,
  "data-line-numbers": _lineNumbers,
  ...props
}: ComponentProps<"code"> & {
  __raw__?: string;
  "data-line-numbers"?: string;
}) {
  return <code {...props} />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    pre: Pre,
    figure: Figure,
    code: Code,
    table: Table,

    // Custom doc widgets — registrations only, not reimplemented here.
    ComponentPreview: ComponentPreviewMdx,
    ComponentExample,
    UiComponentPreview,
    BlockPreview,
    InstallBlock,
    InstallAll,
    PropsTable,
    Note,
    Warning,
    CanvasTransitionNote,
    CanvasFilterNote,
    Dependencies,
    ComponentCardGrid,
    IconsGallery,
    GuideVideo,
    ShaderPresets,

    ...components,
  };
}
