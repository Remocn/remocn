import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideButton, LockIcon, PlayIcon } from "../guide-ui";
import { findLink, paragraphs, textOf } from "../mdx-children";

/**
 * "Or use the plugin" aside inside a setup step. Children: two markdown
 * paragraphs (the alternative, then how to start); the first link becomes
 * the button.
 */
export function GuidePluginAside({ children }: { children: ReactNode }) {
  const [lead = [], body = []] = paragraphs(children);
  const link = findLink(children);
  const href = typeof link?.props.href === "string" ? link.props.href : "#";

  return (
    <div className="flex flex-col gap-3 rounded-control bg-surface-muted py-3.5 pr-3.5 pl-4 sm:flex-row sm:items-center sm:gap-3.5">
      <div className="flex grow flex-col gap-1.5 text-small">
        <p className="text-muted-foreground [&_a]:text-inherit [&_strong]:mr-1 [&_strong]:font-medium [&_strong]:text-foreground">
          {lead}
        </p>
        <p className="text-body [&_code]:mx-0.5 [&_code]:inline-flex [&_code]:h-6 [&_code]:items-center [&_code]:rounded-tag [&_code]:bg-surface [&_code]:px-[7px] [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:leading-4 [&_code]:text-foreground [&_code]:shadow-[0_0_0_1px_var(--color-hairline)]">
          {body}
        </p>
      </div>
      <GuideButton href={href} className="h-11 w-full sm:h-9 sm:w-auto">
        {capitalize(textOf(link?.props.children))}
      </GuideButton>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** The empty Remotion Studio tab you see once setup worked. */
export function GuideStudioPreview() {
  return (
    <figure
      aria-label="Remotion Studio open in a browser tab, with an empty video player"
      className={cn(
        "flex flex-col overflow-hidden rounded-control bg-surface shadow-[0_0_0_1px_rgb(14_16_18/10%),0_12px_32px_-12px_rgb(14_16_18/5%)] dark:shadow-[0_0_0_1px_var(--color-divider)]",
      )}
    >
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-hairline px-3.5">
        <span aria-hidden="true" className="hidden shrink-0 gap-1.5 sm:flex">
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-secondary" />
        </span>
        <span className="flex h-7 shrink-0 items-center gap-[7px] rounded-tile bg-surface-muted px-2.5 text-mono text-foreground">
          <span
            className="size-3 rounded-[4px]"
            style={{
              backgroundImage: "linear-gradient(135deg, #4FA3FF, #0B57D0)",
            }}
          />
          Remotion Studio
        </span>
        <span className="flex h-7 min-w-0 grow items-center gap-1.5 rounded-tile bg-surface-muted px-2.5 text-mono text-muted-foreground">
          <LockIcon size={11} className="text-subtle" />
          <span className="truncate">localhost:3000</span>
        </span>
      </div>
      <div
        aria-hidden="true"
        className="flex h-[180px] bg-[#202024] sm:h-[290px]"
      >
        <div className="flex w-[88px] shrink-0 flex-col gap-2 bg-[#18181B] p-3 sm:w-[132px]">
          <span className="text-micro font-medium text-white/60">
            Compositions
          </span>
          <span className="h-[22px] rounded-[5px] bg-white/6" />
          <span className="h-1.5 w-[70px] max-w-full rounded-[3px] bg-white/6" />
        </div>
        <div className="flex grow flex-col">
          <div className="flex grow items-center justify-center px-3">
            <span className="flex aspect-video w-full max-w-[320px] items-center justify-center rounded-[4px] bg-black shadow-[0_0_0_1px_rgb(255_255_255/8%)]">
              <span className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white/70">
                <PlayIcon />
              </span>
            </span>
          </div>
          <div className="flex h-14 shrink-0 flex-col gap-2 bg-[#18181B] px-3 py-2.5">
            <span className="flex items-center gap-2 text-micro text-white/60">
              <PlayIcon size={10} />
              0:00
            </span>
            <span className="h-3.5 rounded-[4px] bg-white/4" />
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Closing row of the last setup step: one line and the way out. */
export function GuideReadyRow({ children }: { children: ReactNode }) {
  const link = findLink(children);
  const href = typeof link?.props.href === "string" ? link.props.href : "#";
  const label = textOf(link?.props.children);
  const lead = textOf(children).replace(label, "").trim();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-small text-muted-foreground">{lead}</p>
      <GuideButton
        href={href}
        variant="ink"
        size="md"
        className="h-11 w-full sm:h-10 sm:w-auto"
      >
        {label}
      </GuideButton>
    </div>
  );
}
