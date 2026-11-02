import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";

const icons = {
  shield: (
    <>
      <path
        d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z"
        strokeLinejoin="round"
      />
      <path
        d="m8.8 12.2 2.3 2.3 4.4-4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  mute: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      <path d="m16 9 5 6M21 9l-5 6" strokeLinecap="round" />
    </>
  ),
};

const tones = {
  /** The page's single accent: a rule that has no exceptions. */
  accent: {
    box: "bg-primary-wash",
    tile: "bg-surface",
    title: "text-[18px] leading-6 tracking-[-0.01em]",
  },
  /** A quieter aside on a white card. */
  card: {
    box: guideCard,
    tile: "bg-surface-muted",
    title: "text-ui leading-[22px]",
  },
};

/**
 * A titled note with a 44px icon tile. Children: one markdown paragraph,
 * the body under the title.
 */
export function GuideNoteCard({
  title,
  icon,
  tone = "card",
  children,
}: {
  title: string;
  icon: keyof typeof icons;
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "not-prose mt-4 flex flex-col items-start gap-4 rounded-card py-5 pr-6 pl-5 sm:flex-row sm:gap-[18px]",
        tones[tone].box,
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-control-sm text-foreground",
          tones[tone].tile,
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          {icons[icon]}
        </svg>
      </span>
      <div className="flex min-w-0 grow flex-col gap-1">
        <span className={cn("font-medium text-foreground", tones[tone].title)}>
          {title}
        </span>
        <div className="text-[15px] leading-6 text-body [&_p]:m-0">
          {children}
        </div>
      </div>
    </aside>
  );
}
