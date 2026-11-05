import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideCopyButton } from "./guide-copy-button";
import { DownloadIcon, GuideButton, guideCard } from "./guide-ui";
import { findLink, textOf } from "./mdx-children";

/**
 * "Get the file": the one sentence that renders the video, with a copy
 * button. Children: the follow-up line (markdown).
 */
export function GuideRenderCard({
  prompt,
  children,
}: {
  prompt: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col gap-4 rounded-card py-[18px] pr-[18px] pl-5 sm:flex-row sm:items-center sm:gap-[18px]",
        guideCard,
      )}
    >
      <div className="flex grow items-start gap-[18px] sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-control-sm bg-surface-muted text-foreground">
          <DownloadIcon size={20} />
        </span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <p className="flex flex-col text-ui leading-[22px] sm:flex-row sm:gap-1.5">
            <span className="text-muted-foreground">Ask your agent:</span>
            <span className="font-medium text-foreground">“{prompt}”</span>
          </p>
          <div className="text-small text-muted-foreground [&_code]:mx-0.5 [&_code]:font-mono [&_code]:text-mono [&_code]:text-foreground [&_p]:m-0">
            {children}
          </div>
        </div>
      </div>
      <GuideCopyButton
        value={prompt}
        variant="secondary"
        className="w-full sm:w-auto"
      />
    </div>
  );
}

/**
 * Grey callout with a button to a related page. Children: one markdown
 * paragraph; its link becomes the button and reads as plain text inline.
 */
export function GuideCallout({ children }: { children: ReactNode }) {
  const link = findLink(children);
  const href = typeof link?.props.href === "string" ? link.props.href : "#";

  return (
    <div className="not-prose mt-4 flex flex-col gap-3 rounded-cta bg-surface-muted py-3.5 pr-3.5 pl-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="grow text-[15px] leading-[22px] text-body [&_a]:text-inherit [&_a]:underline-offset-4 [&_a]:hover:underline [&_p]:m-0">
        {children}
      </div>
      <GuideButton href={href} className="w-full sm:w-auto">
        {textOf(link?.props.children)}
      </GuideButton>
    </div>
  );
}
