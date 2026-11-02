import type { SponsorTraffic } from "@/lib/sponsor-traffic";
import { cn } from "@/lib/utils";
import { CARD } from "./card";
import { formatDay, formatNumber, formatWeekday } from "./format";
import { type ChartPoint, VisitorsChart } from "./visitors-chart";

/** A label every 7 days from the start, plus the last day. */
function tickIndices(count: number) {
  const last = count - 1;
  const ticks: number[] = [];
  for (let i = 0; i <= last - 4; i += 7) ticks.push(i);
  if (last > 0) ticks.push(last);
  return ticks;
}

export function VisitorsCard({ traffic }: { traffic: SponsorTraffic }) {
  const { series, range, uniqueVisitors } = traffic;
  const rangeLabel = `${formatDay(range.start)} to ${formatDay(range.end)}`;
  const points: ChartPoint[] = series.map((point) => ({
    label: formatWeekday(point.date),
    visitors: point.visitors,
    valueLabel: `${formatNumber(point.visitors)} ${point.visitors === 1 ? "visitor" : "visitors"}`,
  }));

  return (
    <div
      className={cn(CARD, "flex min-w-0 flex-1 flex-col gap-5 px-6 pt-6 pb-5")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-small text-muted-foreground">Unique visitors</h3>
          <p className="text-[48px]/[48px] tracking-[-0.045em] text-foreground tabular-nums">
            {formatNumber(uniqueVisitors)}
          </p>
        </div>
        <p className="flex h-8 items-center gap-2 rounded-control-sm bg-surface-muted px-3">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-success"
          />
          <span className="text-caption text-body tabular-nums">
            {rangeLabel}
          </span>
        </p>
      </div>
      <VisitorsChart
        points={points}
        summary={`Unique visitors per day, ${rangeLabel}: ${formatNumber(uniqueVisitors)} in total.`}
      />
      <div
        aria-hidden="true"
        className="flex justify-between text-caption text-subtle tabular-nums"
      >
        {tickIndices(series.length).map((i) => (
          <span key={series[i].date}>{formatDay(series[i].date)}</span>
        ))}
      </div>
    </div>
  );
}
