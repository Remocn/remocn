import type { SponsorTraffic } from "@/lib/sponsor-traffic";
import { cn } from "@/lib/utils";
import { CARD, CardHeader } from "./card";
import { areaPath, smoothPath, spread } from "./curve";
import { formatDuration, formatNumber, formatRatio } from "./format";

const SPARK_W = 320;
const SPARK_H = 56;
const SPARK_PAD = 6;

/** Visitors per day, min-to-max fitted into the strip under Pageviews. */
function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = spread(
    values,
    SPARK_W,
    (v) => SPARK_PAD + (1 - (v - min) / span) * (SPARK_H - SPARK_PAD * 2),
  );
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="h-14 w-full shrink-0 text-foreground"
    >
      <defs>
        <linearGradient id="pageviews-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(points, SPARK_H)} fill="url(#pageviews-spark)" />
      <path
        d={smoothPath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(CARD, "flex flex-1 flex-col gap-1 px-5 py-4")}>
      <h3 className="text-small text-muted-foreground">{label}</h3>
      <p className="text-[26px]/[32px] tracking-[-0.03em] text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function StatsColumn({ traffic }: { traffic: SponsorTraffic }) {
  return (
    <div className="flex flex-col gap-3 lg:w-[400px] lg:shrink-0">
      <div className={cn(CARD, "flex flex-col gap-3 overflow-clip px-6 pt-5")}>
        <CardHeader
          title="Pageviews"
          hint={`${formatRatio(traffic.viewsPerSession)} per session`}
        />
        <p className="text-[32px]/[36px] tracking-[-0.04em] text-foreground tabular-nums">
          {formatNumber(traffic.pageviews)}
        </p>
        <Sparkline values={traffic.series.map((point) => point.visitors)} />
      </div>
      <div className="flex grow flex-col justify-between gap-4 rounded-card bg-dark-surface px-6 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-small text-dark-subtle">Registry installs</h3>
          <span className="font-mono text-mono text-primary-soft">
            registry_install
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[40px]/[44px] tracking-[-0.045em] text-[#fafafa] tabular-nums">
            {formatNumber(traffic.registryInstalls)}
          </p>
          <p className="font-mono text-mono text-dark-subtle">
            npx shadcn add @remocn/…
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <SmallStat label="Sessions" value={formatNumber(traffic.sessions)} />
        <SmallStat
          label="Avg session"
          value={formatDuration(traffic.avgSessionDuration)}
        />
      </div>
    </div>
  );
}
