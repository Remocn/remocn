import { STUDIO_URL } from "@/config/site";
import { MetalRing } from "../../ui/metal-ring";
import { StudioAppIcon } from "../../ui/remocn-mark";

/** "Remocn Studio is out" announcement capsule above the headline. */
export function StudioPill() {
  return (
    <div className="hero-in inline-flex h-[52px] shrink-0 items-center gap-2.5 rounded-control bg-capsule px-1.5 md:h-11 md:pr-[5px]">
      <StudioAppIcon size={36} radius={10} className="md:hidden" />
      <StudioAppIcon size={32} radius={9} className="hidden md:flex" />
      <p className="flex flex-col text-[14px] leading-[18px] md:flex-row md:gap-2.5 md:text-[15px]">
        <span className="text-foreground">Remocn Studio is out</span>
        <span className="text-muted-foreground">your agent, in an app</span>
      </p>
      <a
        href={STUDIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download Remocn Studio"
        className="relative flex h-10 items-center gap-1.5 rounded-[11px] border border-metal px-3 text-[14px] leading-[18px] text-foreground shadow-[0_2px_10px_#A800B71F] outline-none transition-shadow duration-150 hover:shadow-[0_2px_14px_#A800B740] focus-visible:ring-3 focus-visible:ring-ring md:h-[34px]"
      >
        Download
        <span aria-hidden="true" className="text-primary">
          →
        </span>
        <MetalRing />
      </a>
    </div>
  );
}
