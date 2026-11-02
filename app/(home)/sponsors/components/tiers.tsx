import { tiers } from "@/config/sponsors";
import { TierCard } from "./tiers/tier-card";

export function TiersSection() {
  return (
    <section
      id="tiers"
      data-section="sponsors-tiers"
      className="landing-container flex scroll-mt-24 flex-col gap-5 py-[72px] xl:gap-6 xl:pt-6 xl:pb-[120px]"
    >
      <h2 className="text-caption text-muted-foreground">
        Three monthly tiers, billed through Creem
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </div>
    </section>
  );
}
