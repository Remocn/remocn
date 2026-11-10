import type { OneTimeTier } from "@/config/sponsors";
import { LandingButton } from "../../../components/landing/ui/landing-button";

/** Full-width row under the monthly tiers: a single payment of any amount. */
export function OneTimeCard({ tier }: { tier: OneTimeTier }) {
  return (
    <article className="flex min-w-0 flex-col gap-6 rounded-panel bg-card p-6 ring-1 ring-hairline lg:flex-row lg:items-center lg:gap-10 xl:p-8">
      <div className="flex flex-col gap-1 lg:w-[220px] lg:shrink-0">
        <h3 className="text-[20px] leading-[26px] font-medium tracking-title text-foreground">
          {tier.name}
        </h3>
        <p className="text-small text-muted-foreground">{tier.tagline}</p>
      </div>

      <p className="text-[32px] leading-[36px] tracking-heading text-foreground lg:shrink-0">
        Any amount
      </p>

      <ul className="flex grow flex-col gap-3">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="w-3.5 shrink-0 text-[14px] leading-[22px] text-foreground xl:leading-5"
            >
              ✓
            </span>
            <span className="text-[16px] leading-[22px] text-body xl:text-[15px] xl:leading-5">
              {perk}
            </span>
          </li>
        ))}
      </ul>

      <LandingButton
        href={tier.checkoutUrl}
        target="_blank"
        rel="noreferrer"
        variant="secondary"
        size="md"
        arrow={<span className="text-muted-foreground">→</span>}
        className="w-full lg:w-auto"
      >
        Sponsor once
      </LandingButton>
    </article>
  );
}
