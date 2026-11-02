import type { Tier } from "@/config/sponsors";
import { LandingButton } from "../../../components/landing/ui/landing-button";
import { MetalRing } from "../../../components/landing/ui/metal-ring";

const LABEL: Record<Tier["id"], string> = {
  builder: "Become a Builder",
  partner: "Become a Partner",
  featured: "Become a Featured sponsor",
};

/** Creem monthly checkout. Grey on light cards, metal-ringed on the dark one. */
export function TierButton({ tier }: { tier: Tier }) {
  const link = {
    href: tier.monthlyUrl,
    target: "_blank",
    rel: "noreferrer",
  };

  if (!tier.highlighted) {
    return (
      <LandingButton
        {...link}
        variant="secondary"
        size="md"
        arrow={<span className="text-muted-foreground">→</span>}
        className="w-full"
      >
        {LABEL[tier.id]}
      </LandingButton>
    );
  }

  return (
    <a
      {...link}
      className="relative flex h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-cta border-2 border-metal text-ui text-foreground shadow-[0_1px_2px_#0000004D,0_8px_20px_-10px_#00000099] outline-none transition-transform duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px"
    >
      {LABEL[tier.id]}
      <span aria-hidden="true" className="text-primary">
        →
      </span>
      <MetalRing width={2} />
    </a>
  );
}
