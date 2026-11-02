import type { SVGProps } from "react";
import {
  formatHealthCheckedAt,
  formatHealthPoints,
  REGISTRY_HEALTH_DOCS_URL,
  type RegistryHealth,
} from "@/lib/registry-health";

/** The shadcn/ui double-stroke mark used on the health button and badge. */
export function ShadcnMark({
  strokeWidth = 32,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" {...props}>
      <path
        d="M208 128 128 208M192 40 40 192"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Body of the "Registry health" popover: header, score rows, footer. */
export function RegistryHealthCard({ health }: { health: RegistryHealth }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5 px-3 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-ui font-medium text-foreground">Registry health</p>
          <span className="flex h-6 items-center gap-1.5 rounded-tile bg-foreground px-[9px] text-mono text-background">
            <ShadcnMark strokeWidth={28} className="size-3" />
            shadcn directory
          </span>
        </div>
        <p className="text-small text-muted-foreground">{health.summary}</p>
      </div>

      <dl className="flex flex-col gap-2.5 rounded-cta bg-muted p-4 text-[15px] leading-5">
        {health.checks.map((check) => (
          <div
            key={check.label}
            className="flex items-baseline justify-between"
          >
            <dt className="text-muted-foreground">{check.label}</dt>
            <dd className="flex gap-1 tabular-nums">
              <span className="text-foreground">
                {formatHealthPoints(check.score)}
              </span>
              <span className="text-subtle">/ {check.max}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between px-3 pb-2.5">
        <span className="text-mono text-muted-foreground tabular-nums">
          Checked {formatHealthCheckedAt(health.checkedAt)}
        </span>
        <a
          href={REGISTRY_HEALTH_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="-mx-1.5 flex items-center gap-1 rounded-md px-1.5 text-caption text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          How it's scored
          <span aria-hidden="true" className="text-primary">
            ↗
          </span>
        </a>
      </div>
    </div>
  );
}
