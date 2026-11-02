import Image from "next/image";
import type { Sponsor } from "@/config/sponsors";
import { cn } from "@/lib/utils";

/**
 * Per-sponsor size fixes from the design (desktop / mobile). Everything else
 * falls back to the defaults below.
 */
const ICON_SIZE: Record<string, string> = {
  aceternity: "size-[18px] lg:size-5",
};

/**
 * Sponsors with a `row` layout and a display name render as a small icon +
 * the name set in Geist; the rest render their full logo at a fixed height.
 */
export function SponsorLogo({
  sponsor,
  pinned = false,
}: {
  sponsor: Sponsor;
  pinned?: boolean;
}) {
  if (sponsor.layout === "row" && sponsor.displayName) {
    return (
      <span className="flex items-center gap-2">
        <Image
          src={sponsor.logoUrl}
          alt=""
          width={22}
          height={22}
          className={cn(
            "shrink-0 rounded-tag dark:invert",
            ICON_SIZE[sponsor.id] ?? "size-5 lg:size-[22px]",
          )}
        />
        <span className="text-ui font-semibold tracking-[-0.03em] whitespace-nowrap text-foreground lg:text-[18px] lg:leading-[22px]">
          {sponsor.displayName}
        </span>
      </span>
    );
  }

  return (
    <Image
      src={sponsor.logoUrl}
      alt={sponsor.name}
      width={160}
      height={pinned ? 30 : 24}
      className={cn(
        "w-auto max-w-none shrink-0 dark:invert",
        pinned ? "h-[26px] lg:h-[30px]" : "h-[21px] lg:h-6",
      )}
      style={sponsor.logoScale ? { scale: sponsor.logoScale } : undefined}
    />
  );
}
