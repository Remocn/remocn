import { cn } from "@/lib/utils";
import { RemocnMark } from "../ui/remocn-mark";

/**
 * The remocn wordmark at the header/footer sizes: 19px on mobile, 22px from
 * `lg` up (mark 14×15 → 16×17), matching both artboards. Inside the header
 * the `lg` size follows `--hdr-wordmark`.
 */
export function LandingWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-px text-foreground",
        className,
      )}
    >
      <RemocnMark className="h-[15px] w-3.5 lg:h-[calc(var(--hdr-wordmark,22px)*17/22)] lg:w-[calc(var(--hdr-wordmark,22px)*16/22)]" />
      <span className="font-wordmark text-[19px] leading-[19px] font-semibold tracking-[-0.025em] lg:text-[length:var(--hdr-wordmark,22px)] lg:leading-[var(--hdr-wordmark,22px)]">
        emocn
      </span>
    </span>
  );
}
