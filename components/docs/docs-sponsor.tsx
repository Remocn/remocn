import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoldSponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";

export const DocsSponsor: React.FC = () => {
  const goldSponsors = getGoldSponsors();

  return (
    <Card size="sm" className="w-full gap-4 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Sponsors</CardTitle>
        <Link
          href="/sponsors"
          className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        >
          Become a sponsor
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {/* <span className="text-xs font-medium text-muted-foreground">Gold</span> */}

        {goldSponsors.length > 0 ? (
          <div className="flex flex-col gap-2">
            {goldSponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.website}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-center gap-3 rounded-2xl surface-card px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {/** biome-ignore lint/performance/noImgElement: sponsor logos are SVGs of arbitrary sizes */}
                <img
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  className={cn(
                    "max-h-6 w-auto shrink-0 object-contain opacity-80 grayscale transition-all duration-300 dark:[filter:grayscale(1)_brightness(0)_invert(1)] ",
                    sponsor.customStyles,
                  )}
                  style={{ transform: `scale(${sponsor.logoScale ?? 1})` }}
                />
                {sponsor.displayName && (
                  <span className="text-xs font-bold text-text transition-colors group-hover:text-foreground">
                    {sponsor.displayName}
                  </span>
                )}
              </a>
            ))}
          </div>
        ) : (
          <span className="rounded-2xl surface-card px-3 py-2.5 text-xs font-medium text-muted-foreground">
            Your logo here
          </span>
        )}
      </CardContent>
    </Card>
  );
};
