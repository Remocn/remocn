"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import type { ComponentProps } from "react";
import type { ShikiTransformer } from "shiki";
import { CODE_PRE, CodeFrame } from "@/components/docs/blocks/code-frame";
import { cn } from "@/lib/utils";

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
