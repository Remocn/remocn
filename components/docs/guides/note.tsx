import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard, ImageIcon, ShieldIcon } from "./guide-ui";

const icons = {
  image: <ImageIcon size={18} />,
  shield: <ShieldIcon size={18} />,
  mute: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </svg>
  ),
};

const tones = {
  /** Grey well, the default side note. */
  muted: {
    box: "bg-surface-muted",
    icon: cn("rounded-[10px]", guideCard),
  },
  /** White card with a grey icon tile. */
  card: {
    box: guideCard,
    icon: "rounded-control-sm bg-surface-muted",
  },
  /** The page's single accent note. */
  accent: {
    box: "bg-primary-wash",
    icon: cn("rounded-[10px]", guideCard),
  },
};

/**
 * Side note with an icon. Children are markdown paragraphs: the first reads
 * as body copy, later ones are quieter follow-ups.
 */
export function GuideNote({
  children,
  title,
  icon = "image",
  tone = "muted",
  className,
}: {
  children: ReactNode;
  title?: string;
  icon?: keyof typeof icons;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "not-prose mt-4 flex flex-col items-start gap-4 rounded-cta py-4 pr-[18px] pl-4 sm:flex-row",
        tones[tone].box,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center text-foreground",
          tones[tone].icon,
        )}
      >
        {icons[icon]}
      </span>
      <div className="flex min-w-0 grow flex-col gap-1.5 text-[15px] leading-[22px] text-body [&_a]:font-medium [&_a]:text-foreground [&_a]:hover:underline [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-caption [&_code]:text-foreground [&>p+p]:text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {title && (
          <span className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </span>
        )}
        {children}
      </div>
    </aside>
  );
}
