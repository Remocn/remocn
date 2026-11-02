import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Date (mono on desktop) followed by an optional tag or trailing note. */
export function PostMeta({
  iso,
  date,
  tag,
  trailing,
  className,
}: {
  iso: string;
  date: string;
  tag?: ReactNode;
  /** Pushed to the far end, e.g. "9 beats". */
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-caption text-muted-foreground md:gap-3",
        trailing && "justify-between",
        className,
      )}
    >
      <span className="flex items-center gap-2.5 md:gap-3">
        <time dateTime={iso}>{date}</time>
        {tag && <PostTag>{tag}</PostTag>}
      </span>
      {trailing && <span>{trailing}</span>}
    </div>
  );
}

export function PostTag({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-6 items-center rounded-tag bg-surface-muted px-2 text-caption text-body md:h-[22px]">
      {children}
    </span>
  );
}
