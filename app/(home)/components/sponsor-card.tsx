import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Sponsor, SponsorTier } from "@/config/sponsors";
import { cn } from "@/lib/utils";

export type LogoTreatment = "color" | "reveal" | "muted";

export const TIER_LABEL: Record<SponsorTier, string> = {
  legendary: "Legendary",
  featured: "Featured",
  partner: "Partner",
  builder: "Builder",
};

export const TIER_STYLE: Record<
  SponsorTier,
  { span: string; logoArea: string; maxH: string; treatment: LogoTreatment }
> = {
  legendary: {
    span: "col-span-2",
    logoArea: "min-h-24",
    maxH: "max-h-12",
    treatment: "color",
  },
  featured: {
    span: "col-span-2",
    logoArea: "min-h-20",
    maxH: "max-h-10",
    treatment: "color",
  },
  partner: {
    span: "col-span-1",
    logoArea: "min-h-16",
    maxH: "max-h-8",
    treatment: "reveal",
  },
  builder: {
    span: "col-span-1",
    logoArea: "min-h-16",
    maxH: "max-h-8",
    treatment: "muted",
  },
};

export function SponsorCard({
  sponsor,
  label,
  logoArea,
  maxH,
  treatment,
}: {
  sponsor: Sponsor;
  label: string;
  logoArea: string;
  maxH: string;
  treatment: LogoTreatment;
}) {
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className="group surface-card surface-card-interactive flex h-full flex-col rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className={cn("grid flex-1 place-items-center py-2", logoArea)}>
        {/** biome-ignore lint/performance/noImgElement: sponsor logos are SVGs of arbitrary sizes */}
        <img
          src={sponsor.logoUrl}
          alt=""
          loading="lazy"
          className={cn(
            maxH,
            "w-auto max-w-full object-contain dark:[filter:grayscale(1)_brightness(0)_invert(1)]",
            treatment === "color" && "opacity-100",
            treatment === "reveal" &&
              "opacity-70 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0 dark:group-hover:[filter:grayscale(1)_brightness(0)_invert(1)]",
            treatment === "muted" &&
              "opacity-70 grayscale transition-opacity duration-300 group-hover:opacity-100",
            sponsor.customStyles,
          )}
          style={{ transform: `scale(${sponsor.logoScale ?? 1})` }}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
        <span className="truncate text-sm font-medium text-foreground">
          {sponsor.name}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      </div>
    </a>
  );
}

export function BecomeSponsorCard({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border p-4 text-center transition-colors duration-200 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        Your logo here
        <ArrowRight
          className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
      <span className="text-xs text-muted-foreground">
        From $10/mo — pick a tier
      </span>
    </Link>
  );
}
