import Link from "next/link";
import type { ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { getEntry, loadDocsSource } from "../data";
import { indexCardLink } from "../index-section";
import { Glyph } from "./glyph";

const bar = "shrink-0 rounded-[3px]";

/** Still artwork per part, keyed by the docs page it links to. */
const PARTS: { url: string; label: string; art: ReactNode }[] = [
  {
    url: "/docs/typography/soft-blur-in",
    label: "Blur-in headline",
    art: (
      <span className="flex size-full items-center justify-center gap-[5px] text-[19px] leading-6 font-semibold tracking-[-0.03em] text-[#fafafa]">
        Ship
        <span className="opacity-70 blur-[1.5px]">faster</span>
      </span>
    ),
  },
  {
    url: "/docs/transitions/push-through",
    label: "Push transition",
    art: (
      <span className="relative block size-full">
        <span className="absolute inset-y-0 left-0 flex w-[38%] flex-col justify-center gap-[7px] bg-dark-raised pl-2">
          <span className={cn(bar, "h-1.5 w-10 bg-[#3a3d42]")} />
          <span className={cn(bar, "h-1.5 w-7 bg-[#3a3d42]")} />
        </span>
        <span className="absolute inset-y-0 right-0 left-[38%] flex flex-col justify-center gap-[7px] bg-[#e9eaec] pl-[18px]">
          <span
            className={cn(bar, "h-2 w-[58px] rounded-[4px] bg-[#0e1012]")}
          />
          <span className={cn(bar, "h-1.5 w-10 bg-[#c9cdd0]")} />
          <span className={cn(bar, "h-1.5 w-12 bg-[#c9cdd0]")} />
        </span>
      </span>
    ),
  },
  {
    url: "/docs/shaders/components/shader-mesh-gradient",
    label: "Moving background",
    art: (
      <span className="relative block size-full">
        <span className="absolute -top-10 -left-[30px] size-[130px] rounded-full bg-primary-soft opacity-55 blur-[28px]" />
        <span className="absolute top-10 left-20 size-[120px] rounded-full bg-[#6b7a80] opacity-70 blur-[30px]" />
        <span className="absolute -top-2.5 left-[60px] size-[70px] rounded-full bg-[#fafafa] opacity-18 blur-[20px]" />
      </span>
    ),
  },
  {
    url: "/docs/ui-blocks/terminal-simulator",
    label: "Typing terminal",
    art: (
      <span className="flex size-full flex-col gap-3 p-3 font-mono text-micro leading-[14px]">
        <span className="flex gap-[5px]">
          <span className="size-[7px] rounded-full bg-[#3a3d42]" />
          <span className="size-[7px] rounded-full bg-[#3a3d42]" />
          <span className="size-[7px] rounded-full bg-[#3a3d42]" />
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="text-[#8b979c]">~/launch</span>
          <span className="flex items-center gap-[3px] text-[#fafafa]">
            $ npm run bu
            <span className="h-[13px] w-1.5 rounded-[1px] bg-[#fafafa]" />
          </span>
        </span>
      </span>
    ),
  },
];

/** "The parts every product video needs": four still tiles, each a component page. */
export async function PartTiles() {
  await loadDocsSource();
  return (
    <ul
      className={cn(
        "not-prose grid grid-cols-2 gap-2.5 pt-0.5 md:grid-cols-4 md:gap-3 md:pt-1",
        BLOCK_SPACING,
      )}
    >
      {PARTS.filter((part) => getEntry(part.url)).map((part) => (
        <li key={part.url}>
          <Link
            href={part.url}
            className={cn(
              "flex flex-col gap-2.5 rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)] px-1.5 pt-1.5 pb-3",
              indexCardLink,
            )}
          >
            <span
              aria-hidden="true"
              className="block h-[104px] overflow-hidden rounded-control bg-dark-surface md:h-28 dark:shadow-[inset_0_0_0_1px_var(--color-hairline)]"
            >
              {part.art}
            </span>
            <span className="px-2 text-small leading-5 font-medium text-foreground">
              {part.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Remotion APIs the components use (ink, checked) and the trap they avoid. */
export function ApiChips({
  uses,
  avoids,
  avoidsNote,
}: {
  uses: string[];
  avoids: string;
  avoidsNote: string;
}) {
  return (
    <div
      className={cn(
        "not-prose flex flex-wrap gap-2 pb-4 [:is(p)+&]:mt-3",
        BLOCK_SPACING,
      )}
    >
      {uses.map((api) => (
        <span
          key={api}
          className="flex h-9 items-center gap-2 rounded-[10px] bg-foreground px-3.5 font-mono text-caption leading-4 text-inverse"
        >
          <Glyph
            name="check"
            strokeWidth={2.2}
            className="size-3.5 text-primary-soft dark:text-primary"
          />
          {api}
        </span>
      ))}
      <span className="flex h-9 items-center gap-2 rounded-[10px] bg-secondary px-3.5 text-caption leading-4 text-muted-foreground">
        <Glyph name="cross" strokeWidth={2} className="size-3.5" />
        <code className="font-mono">{avoids}</code>
        {avoidsNote}
      </span>
    </div>
  );
}

/**
 * "The agent skill is the other half": an always-dark band (a raised surface in
 * dark mode) with the skill's four steps and the before/after line.
 */
export function AgentSkillPanel({
  title,
  lead,
  steps,
  from,
  to,
}: {
  title: string;
  lead: string;
  steps: string[];
  from: string;
  to: string;
}) {
  return (
    <section
      data-not-typeset
      aria-label={title}
      className={cn(
        "not-prose flex flex-col gap-5 rounded-panel bg-dark-surface px-5 pt-6 pb-5 md:px-6 md:pt-[26px] md:pb-6 dark:border dark:border-hairline dark:bg-surface",
        BLOCK_SPACING,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lead leading-[26px] font-medium tracking-title text-[#fafafa] dark:text-foreground">
          {title}
        </h3>
        <p className="text-small leading-[22px] text-[#8b979c]">{lead}</p>
      </div>
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex flex-col gap-[18px] rounded-control bg-dark-raised p-3.5 dark:bg-surface-muted"
          >
            <span className="flex size-[26px] items-center justify-center rounded-tile bg-[#2a2d31] text-caption leading-4 font-medium text-[#fafafa] dark:text-foreground">
              {index + 1}
            </span>
            <span className="text-small leading-5 text-[#e4e5e7] dark:text-body">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col items-start gap-3 pt-0.5 md:flex-row md:items-center">
        <span className="text-small leading-5 text-[#c8cdd0]">
          The skill is the difference between
        </span>
        <span className="flex items-center gap-3">
          <span className="flex h-8 shrink-0 items-center rounded-[10px] bg-[#2a2d31] px-3 text-caption leading-4 text-[#8b979c]">
            “{from}”
          </span>
          <Glyph
            name="arrow"
            strokeWidth={2}
            className="size-4 text-primary-soft dark:text-[#8b979c]"
          />
        </span>
        <span className="flex h-8 shrink-0 items-center rounded-[10px] bg-[#fafafa] px-3 text-caption leading-4 font-medium text-[#0e1012] dark:bg-[#f4f4f5]">
          {to}
        </span>
      </div>
    </section>
  );
}
