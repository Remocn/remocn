import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BentoClip } from "./bento-clip";

/**
 * One component family in the bento: a small visual on top, the family name
 * and a one-liner at the bottom. The whole tile links to the family's docs.
 */
export function FamilyTile({
  href,
  title,
  description,
  tone = "light",
  visual,
  className,
}: {
  href: string;
  title: string;
  description: string;
  tone?: "light" | "dark";
  visual: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-col gap-7 rounded-panel p-[22px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring md:justify-between md:px-7 md:py-[26px] xl:rounded-shell",
        tone === "light"
          ? "bg-tile hover:bg-[#E9EAEC] dark:hover:bg-[#2A2D31]"
          : "bg-dark-surface hover:bg-[#16181B]",
        className,
      )}
    >
      {visual}
      <div className="flex flex-col gap-1.5">
        <h3
          className={`text-[21px] leading-[26px] tracking-title ${
            tone === "light" ? "text-foreground" : "text-[#FAFAFA]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-small leading-[21px] ${
            tone === "light" ? "text-body-muted" : "text-dark-subtle"
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

const FRAME = "h-[132px] w-full shrink-0 rounded-[14px]";

export function TransitionsVisual() {
  return <BentoClip slot="transitions" className={FRAME} />;
}

export function CaptionsVisual() {
  return <BentoClip slot="captions" className={FRAME} />;
}

export function FiltersVisual() {
  return <BentoClip slot="filters" className={FRAME} />;
}
