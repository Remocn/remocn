import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Filter chip with a trailing count, shared by every index screen that narrows
 * a grid (category groups, library vibes, icon groups). Pressed = ink fill.
 */
export function FilterChip({
  active,
  count,
  leading,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  active?: boolean;
  count?: number;
  /** Optional glyph tile before the label (the "Aa" of the All chip). */
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[10px] px-3 text-[15px] leading-[18px] outline-none transition-colors duration-150 select-none focus-visible:ring-3 focus-visible:ring-ring",
        active
          ? "bg-foreground text-inverse"
          : "bg-[#f1f1f3] text-foreground hover:bg-secondary dark:bg-secondary dark:hover:bg-[#33363b]",
        leading && "pl-1",
        className,
      )}
      {...props}
    >
      {leading && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[26px] items-center justify-center rounded-[7px] text-mono leading-[14px] font-semibold",
            active ? "bg-background text-foreground" : "bg-surface",
          )}
        >
          {leading}
        </span>
      )}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "text-caption leading-4 tabular-nums",
            active
              ? "text-primary-soft dark:text-primary"
              : "text-subtle dark:text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
