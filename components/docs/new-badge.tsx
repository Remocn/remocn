import { cn } from "@/lib/utils";

/**
 * Pink sidebar tag: "New" on a page, "N new" on a category holding several
 * pages from `NEW_BADGE_PATHS`.
 */
export function NewBadge({
  count = 1,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-tag bg-primary-tint px-1.5 py-0.5 text-micro font-medium text-primary-strong",
        className,
      )}
    >
      {count > 1 ? `${count} new` : "New"}
    </span>
  );
}
