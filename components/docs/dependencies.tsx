import { cn } from "@/lib/utils";
import { BLOCK_SPACING } from "./blocks/spacing";

/** Packages a component needs beyond Remotion, as quiet mono tags. */
export function Dependencies({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "not-prose flex flex-wrap items-center gap-1.5",
        BLOCK_SPACING,
      )}
    >
      <span className="mr-1 text-caption text-muted-foreground">Requires</span>
      {items.map((item) => (
        <code
          key={item}
          className="flex h-6 items-center rounded-tag bg-surface px-[7px] font-mono text-mono text-foreground shadow-[0_0_0_1px_var(--color-hairline)]"
        >
          {item}
        </code>
      ))}
    </div>
  );
}
