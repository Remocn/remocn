import type { TrafficRow } from "@/lib/sponsor-traffic";
import { cn } from "@/lib/utils";
import { CARD, CardHeader } from "./card";
import { formatNumber } from "./format";

const BAR_TONE = {
  fuchsia: "bg-primary-wash",
  neutral: "bg-surface-muted",
} as const;

/** Ranked rows with a bar sized against the leader, values right-aligned. */
export function BarList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: TrafficRow[];
  tone: keyof typeof BAR_TONE;
}) {
  const max = Math.max(...rows.map((row) => row.sessions), 1);
  return (
    <div className={cn(CARD, "flex min-w-0 flex-col gap-4 px-6 pt-5 pb-6")}>
      <CardHeader title={title} hint="sessions" />
      <ol className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.name}
            className="relative flex h-8 items-center justify-between gap-3 px-2.5"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 left-0 rounded-tile",
                BAR_TONE[tone],
              )}
              style={{ width: `${(row.sessions / max) * 100}%` }}
            />
            <span className="relative truncate text-small text-foreground">
              {row.name}
            </span>
            <span className="relative text-caption text-body tabular-nums">
              {formatNumber(row.sessions)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
