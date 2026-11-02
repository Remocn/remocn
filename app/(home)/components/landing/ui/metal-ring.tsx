import { cn } from "@/lib/utils";

/**
 * The travelling ring for a `border-metal` element: fills its border, so pass
 * the same width as the border (`border` → 1, `border-2` → 2). The host needs
 * `relative` (or any positioning) and a border radius.
 */
export function MetalRing({
  width = 1,
  className,
}: {
  width?: 1 | 2;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "metal-ring",
        width === 2 && "[--metal-width:2px]",
        className,
      )}
    />
  );
}
