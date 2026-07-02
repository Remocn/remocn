import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Sponsor, sponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

function SponsorLogoCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className="group surface-card flex items-center justify-center rounded-2xl px-8 py-10 transition-colors hover:border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {/** biome-ignore lint/performance/noImgElement: sponsor logos are SVGs of arbitrary sizes */}
      <img
        src={sponsor.logoUrl}
        alt={sponsor.name}
        className={cn(
          "max-h-10 w-auto object-contain opacity-70 grayscale transition-all duration-300 dark:[filter:grayscale(1)_brightness(0)_invert(1)]",
          sponsor.customStyles,
        )}
        style={{ transform: `scale(${sponsor.logoScale ?? 1})` }}
      />
    </a>
  );
}

export function LandingPartners() {
  const partners = sponsors.filter((s) => s.tier === "partner");

  return (
    <section id="partners" className="relative py-20 sm:py-20">
      <div className="section">
        <SectionHeading
          align="center"
          eyebrow="Sponsors"
          title="Backed by the community"
          lead="remocn is free and MIT-licensed. Sponsors keep the registry growing and the renders fast."
        />

        {partners.length > 0 && (
          <FadeUp delay={0.1}>
            <div
              className={cn(
                "mx-auto mt-12 grid max-w-3xl gap-4 sm:gap-6",
                partners.length === 1
                  ? "max-w-sm grid-cols-1"
                  : "grid-cols-2 lg:grid-cols-3",
              )}
            >
              {partners.map((s) => (
                <SponsorLogoCard key={s.id} sponsor={s} />
              ))}
            </div>
          </FadeUp>
        )}

        <FadeUp delay={0.16}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/sponsors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            >
              Become a sponsor
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
