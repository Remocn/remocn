import { ShimmeringText } from "@/components/shimmering-text";
import { cn } from "@/lib/utils";

/**
 * Animated "NEW" tag for docs sidebar menu items. Built on the shimmering-text
 * primitive so the letters sweep between `--color` and `--shimmering-color`.
 * The pill sits on the `--badge-new-bg` accent (an editable token in
 * globals.css); the shimmer runs in dark `--badge-new-fg` tones so the label
 * stays legible on that light background in both themes.
 *
 * Rendered inline after a sidebar item's label (`ms-auto` pushes it to the rail
 * edge — the Fumadocs sidebar link is a flex row). `ShimmeringText` already
 * emits an `sr-only` "NEW" label and marks the animated glyphs `aria-hidden`,
 * so the badge stays accessible without extra wiring.
 */
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
