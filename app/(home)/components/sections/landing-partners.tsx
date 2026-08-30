import { getLandingSponsors } from "@/config/sponsors";
import { SectionHeading } from "../section-heading";
import {
  BecomeSponsorCard,
  SponsorCard,
  TIER_LABEL,
  TIER_STYLE,
} from "../sponsor-card";

export function LandingPartners() {
  const promoted = getLandingSponsors();
  if (promoted.length === 0) return null;

  return (
    <section id="partners" className="relative py-14 sm:py-20">
      <div className="section">
        <SectionHeading
          align="center"
          eyebrow="Sponsors"
          title="Backed by the community"
          lead="remocn is free and MIT-licensed. Sponsors keep the registry growing and the renders fast."
          animated={false}
        />

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-6">
          {promoted.map((s) => {
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
          <BecomeSponsorCard
            href="/sponsors"
            className="col-span-2 md:col-span-2"
          />
        </div>
      </div>
    </section>
  );
}
