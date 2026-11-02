import { activeSponsors, getLandingSponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { SponsorCarousel } from "./sponsors-strip/sponsor-carousel";
import {
  PinnedSponsorCell,
  SponsorButton,
} from "./sponsors-strip/sponsor-cells";

const pinned = activeSponsors.find((sponsor) => sponsor.tier === "legendary");
const rotating = getLandingSponsors().filter(
  (sponsor) => sponsor.id !== pinned?.id,
);
const teamCount = activeSponsors.length;

const MOBILE_CELLS = [
  "w-[150px] border-r border-secondary md:flex-1",
  "w-40 border-r border-secondary md:flex-1",
  "w-[150px] md:flex-1",
];

const DESKTOP_CELLS = Array.from(
  { length: 3 },
  () => "min-w-0 flex-1 overflow-clip",
);

/** Full-bleed hairline that fades out toward both page edges. */
const HAIRLINE =
  "pointer-events-none absolute inset-x-0 h-px bg-[linear-gradient(90deg_in_oklab,#E4E5E700_0%,#E4E5E7_22%,#E4E5E7_78%,#E4E5E700_100%)] max-lg:hidden dark:bg-[linear-gradient(90deg,transparent_0%,var(--color-secondary)_22%,var(--color-secondary)_78%,transparent_100%)]";

function StripLead() {
  return (
    <div className="flex flex-col gap-0.5 lg:w-[180px] lg:shrink-0">
      <p className="text-[15px] leading-5 font-medium text-foreground">
        Sponsored by
      </p>
      <p className="text-caption text-muted-foreground">
        {teamCount} teams keep it free
      </p>
    </div>
  );
}

export function SponsorsStrip() {
  return (
    <section
      data-section="sponsors-strip"
      aria-label="Sponsors"
      className="relative pt-14 lg:py-10"
    >
      <span
        aria-hidden="true"
        data-reveal="draw"
        className={cn(HAIRLINE, "top-10")}
      />
      <span
        aria-hidden="true"
        data-reveal="draw"
        className={cn(HAIRLINE, "top-[135px] [--reveal-i:1]")}
      />

      {/* Mobile / tablet: lead + button, then a swipeable bar of logos. */}
      <div className="lg:hidden">
        <div
          data-reveal
          className="landing-container flex items-center justify-between"
        >
          <StripLead />
          <SponsorButton />
        </div>
        <div
          data-reveal="stagger"
          className="mt-4 flex h-20 overflow-x-auto border-y border-secondary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pinned && <PinnedSponsorCell sponsor={pinned} />}
          <SponsorCarousel sponsors={rotating} cellClassNames={MOBILE_CELLS} />
        </div>
      </div>

      {/* Desktop: one 96px row inside the content column. */}
      <div
        data-reveal="stagger"
        className="landing-container flex h-24 items-center max-lg:hidden"
      >
        <StripLead />
        {pinned && <PinnedSponsorCell sponsor={pinned} />}
        <SponsorCarousel sponsors={rotating} cellClassNames={DESKTOP_CELLS} />
        <div className="ml-4 shrink-0">
          <SponsorButton />
        </div>
      </div>
    </section>
  );
}
