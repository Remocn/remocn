"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import type { ComponentProps } from "react";
import type { ShikiTransformer } from "shiki";
import { CopyButton } from "@/components/docs/copy-button";
import { cn } from "@/lib/utils";

const transformers: ShikiTransformer[] = [
  {
    pre(node) {
      node.properties.style = undefined;
    },
    code(node) {
      if (this.source.split("\n").length > 1) {
        node.properties["data-line-numbers"] = "";
      }
    },
    line(node) {
      node.properties["data-line"] = "";
    },
  },
];

function Pre({ className, ...props }: ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none has-data-line-numbers:px-0",
        className,
      )}
      {...props}
    />
  );
}

export function CodeBlock({
  code,
  lang = "tsx",
  className,
}: {
  code: string;
  lang?: string;
  className?: string;
}) {
  return (
    <div data-rehype-pretty-code-figure="" className={className}>
      <CopyButton value={code} className="absolute top-3 right-2 z-10" />
      <DynamicCodeBlock
        lang={lang}
        code={code}
        options={{
          themes: {
            light: "github-light-default",
            dark: "vesper",
          },
          transformers,
          components: {
            pre: Pre,
          },
        }}
      />
    </div>
  );
}
