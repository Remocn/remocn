import { cn } from "@/lib/utils";

/**
 * Numbered storyboard beats; the first is lit. With `limit`, the rest
 * collapse into a "+N more beats in the storyboard" row.
 */
export function BeatsList({
  beats,
  limit,
  className,
}: {
  beats: string[];
  limit?: number;
  className?: string;
}) {
  const shown = limit ? beats.slice(0, limit) : beats;
  const more = beats.length - shown.length;

  return (
    <ol className={cn("flex flex-col border-t border-divider", className)}>
      {shown.map((beat, index) => (
        <li
          key={beat}
          className="flex gap-3 border-b border-hairline py-3 last:border-b-0 md:py-2.5"
        >
          <span
            className={cn(
              "w-6 shrink-0 text-caption leading-5 tabular-nums",
              index === 0 ? "text-primary" : "text-subtle",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-[15px] leading-5 md:text-small",
              index === 0 ? "text-foreground" : "text-body",
            )}
          >
            {beat}
          </span>
        </li>
      ))}
      {more > 0 && (
        <li className="flex gap-3 py-3 md:py-2.5">
          <span className="w-6 shrink-0 text-caption leading-5 text-subtle tabular-nums">
            +{more}
          </span>
          <span className="text-[15px] leading-5 text-muted-foreground md:text-small">
            more beats in the storyboard
          </span>
        </li>
      )}
    </ol>
  );
}
