"use client";

import { createShikiFactory } from "fumadocs-core/highlight/shiki";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock.core";
import type { ComponentProps } from "react";
import type { ShikiTransformer } from "shiki";
import { CODE_PRE, CodeFrame } from "@/components/docs/blocks/code-frame";
import { cn } from "@/lib/utils";

// Only what the snippets use. Fumadocs' default factory loads `shiki` whole,
// which bundles every grammar and theme (300+ chunks, ~30 MB in dev).
const LANGS = {
  tsx: () => import("shiki/langs/tsx.mjs"),
};

const shiki = createShikiFactory({
  async init() {
    const { createBundledHighlighter } = await import("shiki/core");
    const { createJavaScriptRegexEngine } = await import(
      "shiki/engine/javascript"
    );
    const createHighlighter = createBundledHighlighter({
      langs: LANGS,
      themes: {
        vesper: () => import("shiki/themes/vesper.mjs"),
        "github-light-default": () =>
          import("shiki/themes/github-light-default.mjs"),
      },
      engine: () => createJavaScriptRegexEngine(),
    });
    return createHighlighter({ langs: [], themes: [] });
  },
});

const transformers: ShikiTransformer[] = [
  {
    pre(node) {
      node.properties.style = undefined;
    },
    line(node) {
      node.properties["data-line"] = "";
    },
  },
];

function Pre({ className, ...props }: ComponentProps<"pre">) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: horizontally scrollable code must be keyboard-focusable
    <pre tabIndex={0} className={cn(CODE_PRE, className)} {...props} />
  );
}

/** Client-highlighted code (generated snippets) in the shared dark frame. */
export function CodeBlock({
  code,
  lang = "tsx",
  className,
  bodyClassName,
}: {
  code: string;
  lang?: string;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <CodeFrame
      lang={lang}
      code={code}
      className={className}
      bodyClassName={bodyClassName}
    >
      <DynamicCodeBlock
        highlighter={() => shiki.getOrInit()}
        lang={lang}
        code={code}
        options={{
          themes: { light: "github-light-default", dark: "vesper" },
          transformers,
          components: { pre: Pre },
        }}
      />
    </CodeFrame>
  );
}
