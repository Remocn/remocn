import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { activeSponsors, formerSponsors } from "@/config/sponsors";
import { SectionHeading } from "../../../components/section-heading";
import {
  BecomeSponsorCard,
  SponsorCard,
  TIER_LABEL,
  TIER_STYLE,
} from "../../../components/sponsor-card";

export function WallOfLove() {
  const ordered = (
    ["legendary", "featured", "partner", "builder"] as const
  ).flatMap((tier) => activeSponsors.filter((s) => s.tier === tier));
  const isEmpty = ordered.length === 0;

  return (
    <section id="sponsors" className="relative py-12 sm:py-16">
      <div className="section">
        <SectionHeading
          eyebrow="Sponsors"
          title="The people keeping remocn alive"
          lead="The wonderful people and companies powering their videos with remocn."
          animated={false}
          className="mb-8 sm:mb-10"
        />

        {isEmpty ? (
          <div className="surface-card flex flex-col items-center justify-center gap-6 rounded-3xl px-8 py-16 text-center">
            <p className="max-w-md text-pretty text-lg text-foreground">
              Be the first to support remocn. Your logo could live right here.
            </p>
            <Button
              size="lg"
              className="h-11 gap-2 rounded-full px-6 text-sm"
              render={<Link href="#tiers" />}
            >
              Become a sponsor
              <ArrowRight
                data-icon="inline-end"
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {ordered.map((s) => {
              const style = TIER_STYLE[s.tier];
              return (
                <div key={s.id} className={style.span}>
                  <SponsorCard
                    sponsor={s}
                    label={TIER_LABEL[s.tier]}
                    logoArea={style.logoArea}
                    maxH={style.maxH}
                    treatment={style.treatment}
                  />
                </div>
              );
            })}
            <BecomeSponsorCard href="#tiers" className="md:col-span-4" />
          </div>
        )}
      </div>
    </section>
  );
}

export function FormerSponsors() {
  if (formerSponsors.length === 0) return null;

  return (
    <section id="wall-of-love" className="relative py-12 sm:py-16">
      <div className="section">
        <SectionHeading
          eyebrow="Wall of love"
          title="Wall of love"
          lead="Sponsors who backed remocn along the way. Thank you — this project got here with your help."
          animated={false}
          className="mb-8 sm:mb-10"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {formerSponsors.map((s) => (
            <SponsorCard
              key={s.id}
              sponsor={s}
              label="Former"
              logoArea="min-h-14"
              maxH="max-h-8"
              treatment="muted"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
