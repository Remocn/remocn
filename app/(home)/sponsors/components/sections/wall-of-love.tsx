import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type Sponsor, sponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { FadeUp } from "../../../components/fade-up";
import { SectionHeading } from "../../../components/section-heading";

function SponsorLogoCard({
  sponsor,
  maxH,
}: {
  sponsor: Sponsor;
  maxH: string;
}) {
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className="group surface-card flex h-full items-center justify-center rounded-2xl p-6 transition-colors hover:border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {/** biome-ignore lint/performance/noImgElement: sponsor logos are SVGs of arbitrary sizes */}
      <img
        src={sponsor.logoUrl}
        alt={sponsor.name}
        className={cn(
          maxH,
          // Monochrome + theme-aware; color blooms on hover.
          "w-auto object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:[filter:grayscale(1)_brightness(0)_invert(1)] dark:group-hover:[filter:none]",
          sponsor.customStyles,
        )}
        style={{ transform: `scale(${sponsor.logoScale ?? 1})` }}
      />
    </a>
  );
}

function SponsorGroup({
  label,
  items,
  gridClassName,
  aspectClassName,
  maxH,
}: {
  label: string;
  items: Sponsor[];
  gridClassName: string;
  aspectClassName: string;
  maxH: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="mb-4 font-mono text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className={gridClassName}>
        {items.map((s) => (
          <div key={s.id} className={aspectClassName}>
            <SponsorLogoCard sponsor={s} maxH={maxH} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WallOfLove() {
  const partners = sponsors.filter((s) => s.tier === "partner");
  const builders = sponsors.filter((s) => s.tier === "builder");
  const supporters = sponsors.filter((s) => s.tier === "supporter");
  const isEmpty = sponsors.length === 0;

  return (
    <section id="wall-of-love" className="relative py-20 sm:py-28">
      <div className="section">
        <SectionHeading
          eyebrow="Wall of love"
          title="The people keeping remocn alive"
          lead="The wonderful people and companies powering their videos with remocn."
          className="mb-12 sm:mb-16"
        />

        {isEmpty ? (
          <FadeUp delay={0.1}>
            <div className="surface-card flex flex-col items-center justify-center gap-6 rounded-3xl px-8 py-20 text-center">
              <p className="max-w-md text-balance text-lg text-foreground">
                Be the first to support remocn. Your logo could live right here.
              </p>
              <Button
                size="lg"
                className="h-11 gap-2 rounded-full px-6 text-sm"
                render={<Link href="#tiers" />}
              >
                Become a sponsor
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </FadeUp>
        ) : (
          <FadeUp delay={0.1}>
            <SponsorGroup
              label="Partners"
              items={partners}
              gridClassName="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              aspectClassName="aspect-[3/2]"
              maxH="max-h-20"
            />
            <SponsorGroup
              label="Builders"
              items={builders}
              gridClassName="grid gap-4 md:grid-cols-3 lg:grid-cols-4"
              aspectClassName="aspect-[3/2]"
              maxH="max-h-14"
            />
            <SponsorGroup
              label="Supporters"
              items={supporters}
              gridClassName="grid gap-3 md:grid-cols-4 lg:grid-cols-6"
              aspectClassName="aspect-square"
              maxH="max-h-10"
            />
          </FadeUp>
        )}
      </div>
    </section>
  );
}
