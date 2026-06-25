import { ShimmeringText } from "@/components/shimmering-text";
import { cn } from "@/lib/utils";

export function NewBadge({ className }: { className?: string }) {
  return (
    <ShimmeringText
      text="NEW"
      duration={1.2}
      className={cn(
        "ms-auto rounded-full px-1.5 text-[10px] font-semibold uppercase leading-[1.45] tracking-wide",
        "bg-[var(--badge-new-bg)] [--color:var(--badge-new-fg)] [--shimmering-color:color-mix(in_oklch,var(--badge-new-fg),transparent_55%)]",
        className,
      )}
    />
  );
}
