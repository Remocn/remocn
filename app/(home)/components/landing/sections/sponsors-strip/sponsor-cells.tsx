import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { Sponsor } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { MetalRing } from "../../ui/metal-ring";
import { SponsorLogo } from "./sponsor-logo";

export const CELL =
  "flex shrink-0 items-center justify-center outline-none transition-colors hover:bg-foreground/[0.025] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/**
 * The pinned top-tier slot: hairline sides, a Neon-green radial wash rising
 * from the bottom, a blurred glow and a 2px green rule along the bottom edge.
 */
export function PinnedSponsorCell({ sponsor }: { sponsor: Sponsor }) {
  return (
    <Link
      href={sponsor.website}
      target="_blank"
      rel="noreferrer"
      className={cn(
        CELL,
        "relative h-[78px] w-40 overflow-clip border-r border-secondary bg-[radial-gradient(ellipse_70%_90%_at_50%_100%_in_oklab,#00E5993D_0%,#00E59914_45%,#FAFAFA00_100%)] lg:h-24 lg:w-[200px] lg:border-l",
      )}
    >
      <SponsorLogo sponsor={sponsor} pinned />
      <span
        aria-hidden="true"
        className="absolute top-[82px] left-10 h-6 w-[120px] rounded-full bg-neon opacity-50 blur-[14px] max-lg:hidden"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg_in_oklab,#00E59900_0%,#00E599_25%,#00E599_75%,#00E59900_100%)] lg:bottom-px lg:bg-[linear-gradient(180deg_in_oklab,#00E59900_0%,#00E599_25%,#00E599_75%,#00E59900_100%)]"
      />
    </Link>
  );
}

/** "Sponsor" with a heart on the iridescent ring, linking to the sponsors page. */
export function SponsorButton({ className }: { className?: string }) {
  return (
    <Link
      href="/sponsors"
      className={cn(
        "relative flex h-[46px] shrink-0 items-center gap-2 rounded-[13px] border border-metal px-4 text-[14px] leading-[18px] text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
    >
      Sponsor
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-primary"
      />
      <MetalRing />
    </Link>
  );
}
