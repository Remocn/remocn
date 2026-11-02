import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideCopyButton } from "./guide-copy-button";
import { guidePanel } from "./guide-ui";
import { findElement, findRaw } from "./mdx-children";

/**
 * A prompt to paste into the agent. Wraps a fenced code block in the MDX
 * (so the markdown export keeps the fence) and re-renders it as the dark
 * prompt panel: `<BLANKS>` become pink chips, `marks` words turn warm
 * orange (the code theme's string colour).
 */
export function GuidePrompt({
  children,
  copyLabel = "Copy prompt",
  marks = [],
  highlight: highlightBlanks = true,
  size = "md",
  wrap = false,
  id,
  className,
}: {
  children: ReactNode;
  copyLabel?: string;
  /** Exact substrings set in orange, e.g. `["In beat 1"]`. */
  marks?: string[];
  /** Set `false` when the `<…>` slots are a template, not blanks to fill. */
  highlight?: boolean;
  /** `lg`: a single short line set large (15px). */
  size?: "md" | "lg";
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  id?: string;
  className?: string;
}) {
  const raw = (findRaw(children) ?? "").replace(/\n$/, "");
  const pre = findElement(children, "pre");
  const language =
    (typeof pre?.props["data-language"] === "string"
      ? pre.props["data-language"]
      : undefined) ?? "text";

  return (
    <figure
      id={id}
      className={cn(
        "not-prose mt-5 flex scroll-mt-24 flex-col overflow-hidden rounded-card",
        guidePanel,
        className,
      )}
    >
      <figcaption className="flex h-11 shrink-0 items-center justify-between border-b border-dark-border pr-2 pl-[18px]">
        <span className="font-mono text-mono text-dark-subtle">{language}</span>
        <GuideCopyButton value={raw} label={copyLabel} />
      </figcaption>
      <pre
        // biome-ignore lint/a11y/noNoninteractiveTabindex: horizontally scrollable prompt must be keyboard-focusable
        tabIndex={0}
        className={cn(
          "overflow-x-auto pr-5 font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          size === "lg"
            ? "pt-[22px] pb-6 pl-[22px] text-[15px] leading-[26px] text-[#fafafa]"
            : "pt-[18px] pb-5 pl-[18px] text-caption leading-[22px] text-[#D9DBDE]",
        )}
      >
        <code className={wrap ? "whitespace-pre-wrap" : "whitespace-pre"}>
          {highlightBlanks || marks.length
            ? highlight(raw, marks, highlightBlanks)
            : raw}
        </code>
      </pre>
    </figure>
  );
}

const BLANK = /(<[A-Z][^<>\n]*>)/;

function highlight(
  source: string,
  marks: string[],
  blanks: boolean,
): ReactNode[] {
  const markRe = marks.length
    ? new RegExp(`(${marks.map(escapeRegExp).join("|")})`)
    : null;
  const parts = blanks ? source.split(BLANK) : [source];
  return parts.flatMap((part, index) => {
    if (index % 2 === 1) {
      return (
        <span
          key={index}
          className="rounded-[5px] bg-primary-tint px-1 py-0.5 text-primary-strong [box-decoration-break:clone]"
        >
          {part}
        </span>
      );
    }
    if (!markRe) return part;
    return part.split(markRe).map((chunk, j) =>
      j % 2 === 1 ? (
        <span key={`${index}-${j}`} className="text-[#FFC799]">
          {chunk}
        </span>
      ) : (
        chunk
      ),
    );
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
