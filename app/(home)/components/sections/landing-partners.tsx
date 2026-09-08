import { getLandingSponsors } from "@/config/sponsors";
import { SectionHeading } from "../section-heading";
import { SponsorGrid } from "../sponsor-grid";

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

        <SponsorGrid
          sponsors={promoted}
          ctaHref="/sponsors"
          className="mx-auto mt-10 max-w-4xl"
        />
      </div>
    </section>
  );
}
