import {
  OPENPANEL_DASHBOARD_URL,
  type TrafficRow,
} from "@/lib/sponsor-traffic";
import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../../../components/landing/ui/landing-button";
import { CARD, CardHeader } from "./card";
import { formatNumber } from "./format";

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Gap between ring segments, in px along the stroke. */
const SEGMENT_GAP = 2;

/** Ring and legend colours, in device order (desktop, mobile, tablet). */
const SWATCHES = [
  { stroke: "stroke-primary", fill: "bg-primary" },
  { stroke: "stroke-foreground", fill: "bg-foreground" },
  { stroke: "stroke-secondary", fill: "bg-secondary" },
];

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function DevicesCard({ devices }: { devices: TrafficRow[] }) {
  const total = devices.reduce((sum, row) => sum + row.sessions, 0) || 1;
  const top = devices[0];
  const dashboardUrl = OPENPANEL_DASHBOARD_URL;
  let offset = 0;
  const segments = devices.map((row, i) => {
    const length = (row.sessions / total) * CIRCUMFERENCE;
    const segment = { ...SWATCHES[i % SWATCHES.length], length, offset };
    offset += length;
    return segment;
  });

  return (
    <div
      className={cn(
        CARD,
        "flex min-w-0 flex-col justify-between gap-4 px-6 pt-5 pb-6",
      )}
    >
      <CardHeader title="Devices" hint="sessions" />
      <div className={cn("flex items-center gap-6", !dashboardUrl && "grow")}>
        <div className="relative size-[136px] shrink-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 136 136"
            className="absolute inset-0 size-full"
          >
            <circle
              cx="68"
              cy="68"
              r={RADIUS}
              fill="none"
              strokeWidth="14"
              className="stroke-surface-muted"
            />
            {segments.map(
              (segment) =>
                segment.length > SEGMENT_GAP && (
                  <circle
                    key={segment.offset}
                    cx="68"
                    cy="68"
                    r={RADIUS}
                    transform="rotate(-90 68 68)"
                    fill="none"
                    strokeWidth="14"
                    strokeDasharray={`${segment.length - SEGMENT_GAP} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-segment.offset}
                    className={segment.stroke}
                  />
                ),
            )}
          </svg>
          {top && (
            <p className="absolute inset-x-0 top-[46px] flex flex-col items-center">
              <span className="text-[26px]/[28px] tracking-[-0.03em] text-foreground">
                {Math.round((top.sessions / total) * 100)}%
              </span>
              <span className="text-caption text-subtle">
                on {top.name.toLowerCase()}
              </span>
            </p>
          )}
        </div>
        <ul className="flex grow flex-col gap-2.5">
          {devices.map((row, i) => (
            <li key={row.name} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-[2px]",
                  SWATCHES[i % SWATCHES.length].fill,
                )}
              />
              <span className="grow text-small text-foreground">
                {capitalize(row.name)}
              </span>
              <span className="text-caption text-body tabular-nums">
                {formatNumber(row.sessions)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {dashboardUrl && (
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            landingButtonVariants({ variant: "secondary" }),
            "h-11 w-full gap-2 rounded-control-sm px-4 text-small md:h-10",
          )}
        >
          Open the live dashboard
          <span aria-hidden="true" className="text-muted-foreground">
            ↗
          </span>
        </a>
      )}
    </div>
  );
}
