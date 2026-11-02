import type { CSSProperties } from "react";
import type { Tier } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { TierButton } from "./tier-button";

/** Dark Featured card: ink fading into the magenta shader at the bottom. */
const FEATURED_BACKGROUND: CSSProperties = {
  backgroundImage:
    "linear-gradient(in oklab 180deg, #0E1012 0%, #0E1012 70%, #0E1012B3 86%, #0E101240 100%), url(/landing/shader-magenta.png)",
  backgroundPosition: "50%, 50% 100%",
  backgroundSize: "cover",
};

export function TierCard({ tier }: { tier: Tier }) {
  const dark = tier.highlighted;

  return (
    <article
      style={dark ? FEATURED_BACKGROUND : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-panel p-6 xl:gap-7 xl:p-8",
        dark
          ? "overflow-clip bg-dark-surface shadow-[0_1px_2px_#0E10121A,0_12px_24px_-12px_#0E101214]"
          : "bg-card ring-1 ring-hairline",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3
            className={cn(
              "text-[20px] leading-[26px] font-medium tracking-title",
              dark ? "text-white" : "text-foreground",
            )}
          >
            {tier.name}
          </h3>
          <p
            className={cn(
              "text-small",
              dark ? "text-white/72" : "text-muted-foreground",
            )}
          >
            {tier.tagline}
          </p>
        </div>
        {tier.badge && (
          <span className="flex h-[26px] shrink-0 items-center rounded-tile bg-primary px-2.5 text-caption font-medium text-white">
            {tier.badge}
          </span>
        )}
      </div>

      <p className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[52px] leading-[54px] tracking-heading tabular-nums xl:text-[56px] xl:leading-[58px]",
            dark ? "text-white" : "text-foreground",
          )}
        >
          ${tier.price}
        </span>
        <span
          className={cn(
            "text-ui",
            dark ? "text-white/72" : "text-muted-foreground",
          )}
        >
          /mo
        </span>
      </p>

      <hr
        className={cn(
          "h-px shrink-0 border-0",
          dark ? "bg-white/16" : "bg-divider",
        )}
      />

      <ul className="flex grow flex-col gap-3">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "w-3.5 shrink-0 text-[14px] leading-[22px] xl:leading-5",
                dark ? "text-primary-soft" : "text-foreground",
              )}
            >
              ✓
            </span>
            <span
              className={cn(
                "text-[16px] leading-[22px] xl:text-[15px] xl:leading-5",
                dark ? "text-white/88" : "text-body",
              )}
            >
              {perk}
            </span>
          </li>
        ))}
      </ul>

      <TierButton tier={tier} />
    </article>
  );
}
