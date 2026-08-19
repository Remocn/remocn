import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type Sponsor, sponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../../../components/section-heading";

type LogoTreatment = "color" | "reveal" | "muted";

function SponsorLogoCard({
  sponsor,
  maxH,
  treatment = "muted",
}: {
  sponsor: Sponsor;
  maxH: string;
  treatment?: LogoTreatment;
}) {
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group surface-card surface-card-interactive flex h-full items-center justify-center gap-3 rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        sponsor.layout === "row" ? "flex-row" : "flex-col",
      )}
    >
      {/** biome-ignore lint/performance/noImgElement: sponsor logos are SVGs of arbitrary sizes */}
      <img
        src={sponsor.logoUrl}
        alt={sponsor.name}
        loading="lazy"
        className={cn(
          maxH,
          "w-auto object-contain dark:[filter:grayscale(1)_brightness(0)_invert(1)]",
          treatment === "color" && "opacity-100",
          treatment === "reveal" &&
            "opacity-70 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:group-hover:[filter:grayscale(1)_brightness(0)_invert(1)]",
          treatment === "muted" &&
            "opacity-70 grayscale transition-opacity duration-300 group-hover:opacity-100",
          sponsor.customStyles,
        )}
        style={{ transform: `scale(${sponsor.logoScale ?? 1})` }}
      />
      {sponsor.displayName && (
        <span className="font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {sponsor.displayName}
        </span>
      )}
    </a>
  );
}

function SponsorGroup({
  label,
  items,
  gridClassName,
  aspectClassName,
  maxH,
  treatment,
}: {
  label: string;
  items: Sponsor[];
  gridClassName: string;
  aspectClassName: string;
  maxH: string;
  treatment?: LogoTreatment;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">
        {label}
      </h3>
      <div className={gridClassName}>
        {items.map((s) => (
          <div key={s.id} className={aspectClassName}>
            <SponsorLogoCard sponsor={s} maxH={maxH} treatment={treatment} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WallOfLove() {
  const legendary = sponsors.filter((s) => s.tier === "legendary");
  const featured = sponsors.filter((s) => s.tier === "featured");
  const partners = sponsors.filter((s) => s.tier === "partner");
  const builders = sponsors.filter((s) => s.tier === "builder");
  const isEmpty = sponsors.length === 0;

  return (
    <section id="wall-of-love" className="relative py-20 sm:py-28">
      <div className="section">
        <SectionHeading
          eyebrow="Wall of love"
          title="The people keeping remocn alive"
          lead="The wonderful people and companies powering their videos with remocn."
          animated={false}
          className="mb-12 sm:mb-16"
        />

        {isEmpty ? (
          <div className="surface-card flex flex-col items-center justify-center gap-6 rounded-3xl px-8 py-20 text-center">
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
          <div className="flex flex-col gap-16">
            <SponsorGroup
              label="Legendary"
              items={legendary}
              gridClassName="grid gap-6 md:grid-cols-2"
              aspectClassName="aspect-[3/1]"
              maxH="max-h-16"
              treatment="color"
            />
            <SponsorGroup
              label="Featured"
              items={featured}
              gridClassName="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              aspectClassName="aspect-[5/2]"
              maxH="max-h-12"
              treatment="color"
            />
            <SponsorGroup
              label="Partners"
              items={partners}
              gridClassName="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              aspectClassName="aspect-[5/2]"
              maxH="max-h-12"
              treatment="reveal"
            />
            <SponsorGroup
              label="Builders"
              items={builders}
              gridClassName="grid gap-4 md:grid-cols-3 lg:grid-cols-4"
              aspectClassName="aspect-[2/1]"
              maxH="max-h-10"
            />
          </div>
        )}
      </div>
    </section>
  );
}
