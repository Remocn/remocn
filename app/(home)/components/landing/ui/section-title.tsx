import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Two-tone section heading: the first line in ink, the continuation in a
 * muted grey, both at the h2 size (56/58, -0.045em).
 */
export function SectionTitle({
  title,
  continuation,
  align = "left",
  as: Tag = "h2",
  className,
  continuationClassName,
}: {
  title: ReactNode;
  continuation?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  continuationClassName?: string;
}) {
  return (
    <Tag
      className={cn(
        // `text-[40px]/[42px]` sets line-height directly (not via
        // --tw-leading), so `md:text-h2` can take it over at desktop.
        "flex flex-col text-[40px]/[42px] tracking-heading text-balance text-foreground md:text-h2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <span data-reveal="text">{title}</span>
      {continuation && (
        <span
          data-reveal="text"
          className={cn(
            "text-title-muted [--reveal-i:1]",
            continuationClassName,
          )}
        >
          {continuation}
        </span>
      )}
    </Tag>
  );
}
