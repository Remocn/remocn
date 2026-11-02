import type { ReactNode } from "react";
import { CopyButton } from "@/components/docs/copy-button";
import { cn } from "@/lib/utils";

/** Scrolling `<pre>` inside a `CodeFrame`: Paper Mono 13/22, no line numbers. */
export const CODE_PRE =
  "min-w-0 overflow-x-auto overscroll-x-contain pt-[18px] pr-5 pb-5 pl-[18px] font-mono text-caption leading-[22px] outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset max-md:pt-4 max-md:pb-[18px] max-md:pr-[18px]";

/**
 * The always-dark code block: language label and Copy in a 44px header, the
 * highlighted body below, and a fade on the right edge where long lines run
 * out of view. Shared by MDX code fences and the generated preview snippet.
 * Token colours come from the Vesper palette (see `app/typeset.css`).
 */
export function CodeFrame({
  lang,
  code,
  children,
  className,
  bodyClassName,
}: {
  lang?: string;
  code: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      data-code-frame=""
      className={cn(
        "not-prose relative flex flex-col overflow-hidden rounded-card border border-transparent bg-dark-surface text-[#fafafa] dark:border-hairline dark:bg-surface-sunken",
        className,
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-dark-border pr-2 pl-[18px] max-md:h-14 max-md:pr-1.5">
        <span className="text-mono text-dark-subtle">{lang ?? "text"}</span>
        <CopyButton
          value={code}
          variant="dark"
          className="max-md:h-11 max-md:px-3.5 max-md:text-caption"
        />
      </div>
      <div className={cn("relative min-h-0 flex-1", bodyClassName)}>
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-linear-to-r from-transparent to-dark-surface max-md:w-12 dark:to-surface-sunken"
        />
      </div>
    </div>
  );
}
