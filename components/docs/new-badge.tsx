import { cn } from "@/lib/utils";

export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "ms-auto rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium leading-[1.45]",
        "text-primary dark:bg-primary/20 dark:text-[color-mix(in_oklab,var(--primary)_55%,white)]",
        className,
      )}
    >
      New
    </span>
  );
}
